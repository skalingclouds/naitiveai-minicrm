
import * as React from 'react';
import { Dashboard } from './components/Dashboard';
import { ProjectDetailView } from './components/ui/project-detail-view';
import { ProposalDetailView } from './components/ProposalDetailView';
import { generateProposalImage } from './services/geminiService';
import { Project, Proposal } from './types';

function App() {
  const [currentView, setCurrentView] = React.useState<'dashboard' | 'project' | 'proposal'>('dashboard');
  const [selectedProjectId, setSelectedProjectId] = React.useState<string | null>(null);
  const [selectedProposalId, setSelectedProposalId] = React.useState<string | null>(null);
  const [proposals, setProposals] = React.useState<Proposal[]>([]);
  
  // Initial Mock Data
  const [projects, setProjects] = React.useState<Project[]>([
      {
        id: "proj-1",
        title: "Website Redesign for Client X",
        client: "Client X",
        status: "In-Progress",
        completionPercentage: 45,
        value: 12500,
        breadcrumbs: [
          { label: "Client Projects", href: "#" },
          { label: "Website Redesign for Client X", href: "#" },
        ],
        assignees: [
          { name: "Achmad Hakim", avatarUrl: "https://picsum.photos/seed/achmad/150/150" },
          { name: "Samantha Emanuel", avatarUrl: "https://picsum.photos/seed/samantha/150/150" },
        ],
        dateRange: {
          start: "June 3, 2025",
          end: "June 28, 2025",
        },
        tags: [
            { label: "Design", variant: "destructive" },
            { label: "Client Work", variant: "secondary" },
        ],
        description:
          "This task focuses on preparing a high-impact visual presentation that showcases the new website design concept for Client X. The goal is to clearly communicate the updated UI direction, design system, and user flow improvements to the client in a concise and engaging format.",
        attachments: [
          { id: "att-1", name: "ClientX_UI_Redesign.pdf", size: "4.8 Mb", type: "pdf", isUserUploaded: false, dateAdded: "2025-06-03" },
          { id: "att-2", name: "Homepage_Mockup.fig", size: "12.4 Mb", type: "figma", isUserUploaded: false, dateAdded: "2025-06-04" },
        ],
        subTasks: [
          {
            id: 1,
            task: "Schedule initial client meeting",
            category: "Discovery",
            status: "Completed",
            dueDate: "June 3, 2025",
            dependsOn: []
          },
          {
            id: 2,
            task: "Gather business goals and user needs",
            category: "Discovery",
            status: "Completed",
            dueDate: "June 4, 2025",
            dependsOn: [1]
          },
          {
            id: 3,
            task: "Review current website performance",
            category: "Discovery",
            status: "In Progress",
            dueDate: "June 5, 2025",
            dependsOn: []
          },
          {
            id: 4,
            task: "Develop wireframes and prototypes",
            category: "Design",
            status: "Pending",
            dueDate: "June 12, 2025",
            dependsOn: [2, 3]
          },
        ],
      },
      {
          id: "proj-2",
          title: "Mobile App Development",
          client: "TechStart Inc",
          status: "Kickoff",
          completionPercentage: 0,
          value: 25000,
          breadcrumbs: [{ label: "Client Projects", href: "#" }, { label: "Mobile App Development", href: "#" }],
          assignees: [],
          dateRange: { start: "July 1, 2025", end: "Dec 1, 2025" },
          tags: [{ label: "Dev", variant: "default" }],
          description: "End-to-end development of the iOS and Android application.",
          attachments: [],
          subTasks: []
      },
      {
          id: "proj-3",
          title: "Annual SEO Audit",
          client: "RetailGiant",
          status: "Paid",
          completionPercentage: 100,
          value: 4500,
          breadcrumbs: [{ label: "Client Projects", href: "#" }, { label: "Annual SEO Audit", href: "#" }],
          assignees: [],
          dateRange: { start: "Jan 10, 2025", end: "Jan 20, 2025" },
          tags: [{ label: "Marketing", variant: "secondary" }],
          description: "Complete audit of web properties.",
          attachments: [{ id: "inv-1", name: "Invoice_SEO.pdf", size: "10KB", type: "invoice", isUserUploaded: false, dateAdded: "2025-01-20" }],
          subTasks: []
      }
  ]);

  React.useEffect(() => {
    // Optional: Set dark mode by default for better aesthetics
    document.documentElement.classList.add('dark');
  }, []);

  const handleSelectProject = (project: Project) => {
      setSelectedProjectId(project.id);
      setCurrentView('project');
  };

  const handleCreateProject = (project: Project) => {
      setProjects([...projects, project]);
  };

  const handleUpdateProject = (updatedProject: Project) => {
      setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
  };
  
  const handleDeleteProject = (projectId: string) => {
      if (confirm("Are you sure you want to delete this project?")) {
        setProjects(prev => prev.filter(p => p.id !== projectId));
      }
  };

  const selectedProject = projects.find(p => p.id === selectedProjectId);
  const selectedProposal = proposals.find(p => p.id === selectedProposalId);

  const Logo = () => (
    <div className="flex items-center cursor-pointer transition-opacity hover:opacity-80 gap-3" onClick={() => setCurrentView('dashboard')}>
      <div className="h-10 w-10 bg-primary rounded-xl flex items-center justify-center text-primary-foreground font-black text-2xl shadow-lg shadow-primary/20">
        N
      </div>
      <div className="flex flex-col -space-y-1">
        <span className="text-xl font-black tracking-tighter">NATIVE</span>
        <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">AI Consulting</span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Global Header */}
      <header className="sticky top-0 z-[60] w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container flex h-16 items-center px-4 md:px-8 max-w-7xl mx-auto justify-between">
          <Logo />
          <div className="flex items-center gap-4">
            <div className="h-8 w-8 rounded-full bg-muted border flex items-center justify-center text-xs font-medium text-muted-foreground">
                U
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 bg-muted/20 dark:bg-background/50">
        {currentView === 'dashboard' && (
            <Dashboard 
              projects={projects} 
              proposals={proposals}
              onSelectProject={handleSelectProject} 
              onCreateProject={handleCreateProject}
              onDeleteProject={handleDeleteProject}
              onSelectProposal={(p) => { setSelectedProposalId(p.id); setCurrentView('proposal'); }}
              onCreateProposal={(p) => setProposals([...proposals, p])}
              onDeleteProposal={(id) => setProposals(prev => prev.filter(x => x.id !== id))}
            />
        )}
        {currentView === 'project' && selectedProject && (
            <div className="flex items-start md:items-center justify-center p-4 sm:p-8 min-h-[calc(100vh-4rem)]">
               <ProjectDetailView 
                  {...selectedProject} 
                  onBack={() => setCurrentView('dashboard')}
                  onUpdate={handleUpdateProject}
               />
            </div>
        )}
        {currentView === 'proposal' && selectedProposal && (
            <div className="flex items-start justify-center p-4 sm:p-8 min-h-[calc(100vh-4rem)]">
               <ProposalDetailView 
                  {...selectedProposal} 
                  onBack={() => setCurrentView('dashboard')}
                  onUpdateProposal={(updatedProposal) => setProposals(prev => prev.map(p => p.id === updatedProposal.id ? updatedProposal : p))}
                  onConvertToProject={(newProject) => {
                      setProjects([...projects, newProject]);
                      // Delete the won proposal, or keep it as won? Let's keep it but user can delete it in Dashboard.
                  }}
                  onGenerateImage={generateProposalImage}
               />
            </div>
        )}
      </main>
    </div>
  );
}

export default App;
