import * as React from 'react';
import { AudioLines, Inbox as InboxIcon, LayoutGrid, RotateCcw } from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { Inbox } from './components/Inbox';
import { Copilot } from './components/Copilot';
import { TranscriptModal } from './components/TranscriptModal';
import { ProjectDetailView } from './components/ui/project-detail-view';
import { ProposalDetailView } from './components/ProposalDetailView';
import { generateProposalImage } from './services/geminiService';
import { WorkspaceProvider, useWorkspace } from './lib/store';
import { cn } from './lib/utils';

type View = 'dashboard' | 'inbox' | 'project' | 'proposal';

function Shell() {
  const { state, dispatch } = useWorkspace();
  const [currentView, setCurrentView] = React.useState<View>('dashboard');
  const [selectedProjectId, setSelectedProjectId] = React.useState<string | null>(null);
  const [selectedProposalId, setSelectedProposalId] = React.useState<string | null>(null);
  const [transcriptOpen, setTranscriptOpen] = React.useState(false);

  React.useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  const selectedProject = state.projects.find(p => p.id === selectedProjectId);
  const selectedProposal = state.proposals.find(p => p.id === selectedProposalId);

  const newLeadCount = state.leads.filter(l => l.status === 'new' && !l.triage).length;

  const openProposal = (proposalId: string) => {
    setSelectedProposalId(proposalId);
    setCurrentView('proposal');
  };

  const resetDemo = () => {
    if (confirm('Reset the demo? This restores the original seed data.')) {
      dispatch({ type: 'RESET' });
      setCurrentView('dashboard');
    }
  };

  const NavTab = ({ view, icon: Icon, label, badge }: { view: View; icon: React.ElementType; label: string; badge?: number }) => (
    <button
      onClick={() => setCurrentView(view)}
      className={cn(
        'flex h-9 items-center gap-2 rounded-full px-3.5 text-sm font-medium transition-colors',
        currentView === view ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground',
      )}
    >
      <Icon className="h-4 w-4" />
      <span className="hidden sm:inline">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
          {badge}
        </span>
      )}
    </button>
  );

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* Global Header */}
      <header className="sticky top-0 z-[60] w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-8">
          <div className="flex items-center gap-6">
            <div className="flex cursor-pointer items-center gap-3 transition-opacity hover:opacity-80" onClick={() => setCurrentView('dashboard')}>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-2xl font-black text-primary-foreground shadow-lg shadow-primary/20">
                N
              </div>
              <div className="flex flex-col -space-y-1">
                <span className="text-xl font-black tracking-tighter">NATIVE</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">AI Consulting</span>
              </div>
            </div>
            <nav className="flex items-center gap-1">
              <NavTab view="dashboard" icon={LayoutGrid} label="Workspace" />
              <NavTab view="inbox" icon={InboxIcon} label="Inbox" badge={newLeadCount} />
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTranscriptOpen(true)}
              className="flex h-9 items-center gap-2 rounded-full px-3.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              title="Turn a meeting transcript into CRM updates"
            >
              <AudioLines className="h-4 w-4" />
              <span className="hidden md:inline">Log Meeting</span>
            </button>
            <Copilot />
            <button
              onClick={resetDemo}
              className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground"
              title="Reset demo data"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 bg-muted/20 dark:bg-background/50">
        {currentView === 'dashboard' && (
          <Dashboard
            onSelectProject={(p) => { setSelectedProjectId(p.id); setCurrentView('project'); }}
            onSelectProposal={(p) => openProposal(p.id)}
            onGoToInbox={() => setCurrentView('inbox')}
          />
        )}
        {currentView === 'inbox' && <Inbox onOpenProposal={openProposal} />}
        {currentView === 'project' && selectedProject && (
          <div className="flex min-h-[calc(100vh-4rem)] items-start justify-center p-4 sm:p-8 md:items-center">
            <ProjectDetailView
              {...selectedProject}
              onBack={() => setCurrentView('dashboard')}
              onUpdate={(project) => dispatch({ type: 'UPDATE_PROJECT', project })}
            />
          </div>
        )}
        {currentView === 'proposal' && selectedProposal && (
          <div className="flex min-h-[calc(100vh-4rem)] items-start justify-center p-4 sm:p-8">
            <ProposalDetailView
              {...selectedProposal}
              onBack={() => setCurrentView('dashboard')}
              onUpdateProposal={(proposal) => dispatch({ type: 'UPDATE_PROPOSAL', proposal })}
              onConvertToProject={(project) => {
                dispatch({ type: 'CREATE_PROJECT', project });
                dispatch({ type: 'ADD_ACTIVITY', entry: { actor: 'user', kind: 'project', message: `Converted won deal into project "${project.title}".` } });
              }}
              onGenerateImage={generateProposalImage}
            />
          </div>
        )}
      </main>

      {transcriptOpen && <TranscriptModal onClose={() => setTranscriptOpen(false)} />}
    </div>
  );
}

const App = () => (
  <WorkspaceProvider>
    <Shell />
  </WorkspaceProvider>
);

export default App;
