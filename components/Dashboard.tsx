import * as React from "react";
import {
  Plus, LayoutGrid, ArrowRight, Trash2, DollarSign, Activity as ActivityIcon,
  Briefcase, FileText, Lightbulb, HeartPulse, Loader2, Flame,
} from "lucide-react";
import { Project, Stage, Proposal } from "../types";
import { Button } from "./ui/button";
import { Card, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { cn } from "../lib/utils";
import { ProposalGenerator } from "./ProposalGenerator";
import { useWorkspace, uid } from "../lib/store";
import { BriefingCard, ActivityFeed, HealthBadge, useAnalyzePipeline } from "./Intelligence";

interface DashboardProps {
  onSelectProject: (project: Project) => void;
  onSelectProposal: (proposal: Proposal) => void;
  onGoToInbox: () => void;
}

const MetricCard = ({ icon: Icon, label, value, sub, onClick }: {
  icon: React.ElementType; label: string; value: string; sub: string; onClick?: () => void;
}) => (
  <Card
    className={cn("p-5", onClick && "cursor-pointer transition-colors hover:border-primary/40")}
    onClick={onClick}
  >
    <div className="flex items-center justify-between">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </div>
    <p className="mt-2 text-2xl font-bold">{value}</p>
    <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>
  </Card>
);

export const Dashboard = ({ onSelectProject, onSelectProposal, onGoToInbox }: DashboardProps) => {
  const { state, dispatch } = useWorkspace();
  const { projects, proposals, leads } = state;
  const { analyze, analyzing } = useAnalyzePipeline();

  const [activeTab, setActiveTab] = React.useState<'projects' | 'proposals'>('projects');
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [isProposalOpen, setIsProposalOpen] = React.useState(false);
  const [newProjectTitle, setNewProjectTitle] = React.useState("");
  const [newProjectClient, setNewProjectClient] = React.useState("");
  const [newProjectValue, setNewProjectValue] = React.useState("5000");

  const totalRevenue = projects.filter(p => p.status === 'Paid').reduce((sum, p) => sum + p.value, 0);
  const pendingRevenue = projects.filter(p => p.status === 'Signed' || p.status === 'Completed').reduce((s, p) => s + p.value, 0);
  const openPipeline = proposals.filter(p => p.status !== 'Won' && p.status !== 'Lost').reduce((s, p) => s + p.value, 0);
  const activeProjects = projects.filter(p => p.status !== 'Paid').length;
  const hotLeads = leads.filter(l => l.status !== 'archived' && l.status !== 'converted' && (l.triage?.tier === 'Hot' || !l.triage)).length;

  const handleCreate = () => {
    if (!newProjectTitle || !newProjectClient) return;
    const newProject: Project = {
      id: uid(),
      title: newProjectTitle,
      client: newProjectClient,
      status: 'Kickoff',
      completionPercentage: 0,
      value: parseInt(newProjectValue) || 0,
      breadcrumbs: [{ label: "Client Projects", href: "#" }, { label: newProjectTitle, href: "#" }],
      assignees: [],
      dateRange: { start: new Date().toLocaleDateString(), end: "TBD" },
      tags: [],
      description: "New client project. Click to edit description and use AI to brainstorm tasks.",
      attachments: [],
      subTasks: [],
    };
    dispatch({ type: 'CREATE_PROJECT', project: newProject });
    setIsCreateOpen(false);
    setNewProjectTitle("");
    setNewProjectClient("");
    setNewProjectValue("5000");
  };

  const deleteProject = (projectId: string) => {
    if (confirm("Are you sure you want to delete this project?")) {
      dispatch({ type: 'DELETE_PROJECT', projectId });
    }
  };

  const deleteProposal = (proposalId: string) => {
    if (confirm("Delete this deal?")) {
      dispatch({ type: 'DELETE_PROPOSAL', proposalId });
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight text-foreground">
            <LayoutGrid className="h-8 w-8 text-primary" />
            Mission Control
          </h1>
          <p className="mt-1 text-muted-foreground">Your pipeline, run by an AI that shows its work.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsProposalOpen(true)} className="border-primary/40 text-primary transition-all hover:bg-primary/5 hover:text-primary">
            <FileText className="mr-2 h-4 w-4" />
            AI Proposal Engine
          </Button>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard icon={DollarSign} label="Revenue (Paid)" value={`$${totalRevenue.toLocaleString()}`} sub="Collected this year" />
        <MetricCard icon={Briefcase} label="Open Pipeline" value={`$${(openPipeline + pendingRevenue).toLocaleString()}`} sub="Active deals + signed work" />
        <MetricCard icon={ActivityIcon} label="Active Projects" value={String(activeProjects)} sub="Currently in delivery" />
        <MetricCard icon={Flame} label="Leads Needing Attention" value={String(hotLeads)} sub="Open the inbox → AI triage" onClick={onGoToInbox} />
      </div>

      {/* Briefing + Activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <BriefingCard />

          {/* Tabs */}
          <div className="border-b border-border">
            <div className="flex items-center gap-6">
              {(['projects', 'proposals'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "relative flex items-center gap-2 pb-3 text-sm font-semibold transition-all",
                    activeTab === tab ? "text-primary" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {tab === 'projects' ? 'Active Projects' : 'Sales Pipeline'}
                  <Badge variant="secondary" className="h-4 rounded-sm px-1.5 py-0.5 text-[10px]">
                    {tab === 'projects' ? projects.length : proposals.length}
                  </Badge>
                  {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full bg-primary" />}
                </button>
              ))}
              {activeTab === 'proposals' && (
                <Button
                  variant="ghost" size="sm"
                  className="ml-auto mb-1.5 h-7 text-xs text-primary"
                  onClick={analyze}
                  disabled={analyzing}
                >
                  {analyzing
                    ? <><Loader2 className="mr-1.5 h-3 w-3 animate-spin" /> Scoring deals…</>
                    : <><HeartPulse className="mr-1.5 h-3 w-3" /> Analyze pipeline health</>}
                </Button>
              )}
            </div>
          </div>

          {/* Projects grid */}
          {activeTab === 'projects' && (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 animate-in slide-in-from-bottom-2 duration-500">
              {projects.map(project => (
                <Card key={project.id} className="group flex cursor-pointer flex-col overflow-hidden border-border/60 transition-all duration-200 hover:shadow-md" onClick={() => onSelectProject(project)}>
                  <div className="relative flex-1 p-5">
                    <div className="mb-3 flex items-start justify-between">
                      <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{project.client}</span>
                      <div className="absolute right-3 top-3 z-10 rounded p-1.5 opacity-0 transition-opacity hover:bg-destructive/10 group-hover:opacity-100" onClick={(e) => { e.stopPropagation(); deleteProject(project.id); }}>
                        <Trash2 className="h-4 w-4 text-muted-foreground transition-colors hover:text-destructive" />
                      </div>
                    </div>
                    <CardTitle className="mb-1 pr-6 text-lg leading-snug">{project.title}</CardTitle>
                    <div className="mt-4 flex items-center gap-3 text-sm text-muted-foreground">
                      <Badge variant={project.status === 'Paid' ? 'secondary' : 'default'} className="pointer-events-none rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider">
                        {project.status}
                      </Badge>
                      <span className="flex items-center gap-1.5 border-l border-border pl-3 text-xs font-semibold">
                        <ActivityIcon className="h-3.5 w-3.5" />
                        {project.subTasks.filter(t => t.status === 'Completed').length}/{project.subTasks.length} tasks
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between border-t border-border/60 bg-muted/30 p-4 transition-colors group-hover:bg-muted/50">
                    <span className="text-sm font-semibold text-foreground">${project.value.toLocaleString()}</span>
                    <span className="flex items-center text-xs font-bold text-primary transition-transform duration-300 group-hover:translate-x-1">
                      View Details <ArrowRight className="ml-1 h-3.5 w-3.5" />
                    </span>
                  </div>
                </Card>
              ))}
              <div
                className="flex min-h-[180px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-muted-foreground transition-colors hover:border-primary/50 hover:bg-muted/40 hover:text-primary"
                onClick={() => setIsCreateOpen(true)}
              >
                <Plus className="mb-2 h-10 w-10 opacity-50" />
                <p className="font-medium">Create New Project</p>
              </div>
            </div>
          )}

          {/* Pipeline grid */}
          {activeTab === 'proposals' && (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 animate-in slide-in-from-bottom-2 duration-500">
              {proposals.length === 0 ? (
                <div className="col-span-full rounded-lg border border-dashed bg-muted/10 p-12 text-center text-muted-foreground">
                  <FileText className="mx-auto mb-4 h-12 w-12 opacity-50" />
                  <h3 className="mb-2 text-lg font-semibold text-foreground">No Active Deals</h3>
                  <p className="mx-auto mb-6 max-w-md">Build a stunning AI-generated proposal, or convert a triaged lead from the inbox.</p>
                  <div className="flex justify-center gap-2">
                    <Button onClick={() => setIsProposalOpen(true)}>Create Proposal</Button>
                    <Button variant="outline" onClick={onGoToInbox}>Open Inbox</Button>
                  </div>
                </div>
              ) : (
                proposals.map(proposal => (
                  <Card key={proposal.id} className="group flex cursor-pointer flex-col overflow-hidden border-primary/20 transition-all duration-200 hover:shadow-md" onClick={() => onSelectProposal(proposal)}>
                    <div className="relative flex-1 bg-gradient-to-br from-background to-primary/5 p-5">
                      <div className="mb-3 flex items-start justify-between">
                        <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{proposal.client}</span>
                        <div className="absolute right-3 top-3 z-10 rounded p-1.5 opacity-0 transition-opacity hover:bg-destructive/10 group-hover:opacity-100" onClick={(e) => { e.stopPropagation(); deleteProposal(proposal.id); }}>
                          <Trash2 className="h-4 w-4 text-muted-foreground transition-colors hover:text-destructive" />
                        </div>
                      </div>
                      <CardTitle className="mb-1 pr-6 text-lg leading-snug transition-colors group-hover:text-primary">{proposal.title}</CardTitle>
                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className="bg-background text-[10px] font-bold">{proposal.status}</Badge>
                        {proposal.intel && <HealthBadge intel={proposal.intel} />}
                        {proposal.signed && <Badge variant="secondary" className="bg-green-100 text-[10px] font-bold text-green-800 dark:bg-green-900/30 dark:text-green-400">Signed</Badge>}
                        {proposal.paid && <Badge variant="secondary" className="bg-blue-100 text-[10px] font-bold text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">Paid</Badge>}
                      </div>
                      {proposal.intel && proposal.intel.label !== 'Healthy' && (
                        <p className="mt-3 flex items-start gap-1.5 text-xs leading-snug text-amber-500/90">
                          <Lightbulb className="mt-0.5 h-3 w-3 shrink-0" />
                          {proposal.intel.nextAction}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center justify-between border-t border-primary/10 bg-primary/10 p-4 transition-colors group-hover:bg-primary/20">
                      <span className="text-sm font-bold text-foreground">${proposal.value.toLocaleString()}</span>
                      <span className="flex items-center text-xs font-bold text-primary transition-transform duration-300 group-hover:translate-x-1">
                        Pitch Deck <ArrowRight className="ml-1 h-3.5 w-3.5" />
                      </span>
                    </div>
                  </Card>
                ))
              )}
            </div>
          )}
        </div>

        {/* Right rail */}
        <div className="lg:col-span-1">
          <ActivityFeed />
        </div>
      </div>

      {/* AI Proposal Generator Modal */}
      {isProposalOpen && (
        <ProposalGenerator
          onClose={() => setIsProposalOpen(false)}
          onProposalCreated={(proposal) => {
            dispatch({ type: 'CREATE_PROPOSAL', proposal });
            dispatch({ type: 'ADD_ACTIVITY', entry: { actor: 'ai', kind: 'proposal', message: `Generated full proposal "${proposal.title}" for ${proposal.client} (research → synthesis → SOW → audit).` } });
            setIsProposalOpen(false);
            setActiveTab('proposals');
            onSelectProposal(proposal);
          }}
        />
      )}

      {/* Create Project Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200" onClick={(e) => e.target === e.currentTarget && setIsCreateOpen(false)}>
          <div className="w-full max-w-md overflow-hidden rounded-lg border bg-background shadow-xl animate-in zoom-in-95 duration-200">
            <div className="border-b p-6 pb-4">
              <h3 className="text-lg font-semibold">Start New Project</h3>
            </div>
            <div className="space-y-4 p-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Project Title</label>
                <input className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm" value={newProjectTitle} onChange={e => setNewProjectTitle(e.target.value)} placeholder="e.g. Website Redesign" autoFocus />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Client Name</label>
                <input className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm" value={newProjectClient} onChange={e => setNewProjectClient(e.target.value)} placeholder="e.g. Acme Corp" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Estimated Value ($)</label>
                <input className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm" type="number" value={newProjectValue} onChange={e => setNewProjectValue(e.target.value)} />
              </div>
            </div>
            <div className="flex justify-end gap-2 p-6 pt-0">
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
              <Button onClick={handleCreate}>Create Project</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
