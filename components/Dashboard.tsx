
import * as React from "react";
import { Project, Stage, Proposal } from "../types";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Badge } from "./ui/badge";
import { cn } from "../lib/utils";
import { ProposalGenerator } from "./ProposalGenerator";

// Inline Icons for Dashboard
const Icons = {
  Plus: (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  LayoutGrid: (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect width="7" height="7" x="3" y="3" rx="1" /><rect width="7" height="7" x="14" y="3" rx="1" /><rect width="7" height="7" x="14" y="14" rx="1" /><rect width="7" height="7" x="3" y="14" rx="1" /></svg>,
  ArrowRight: (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
  Trash2: (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>,
  DollarSign: (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  Activity: (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>,
  Briefcase: (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect width="20" height="14" x="2" y="7" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>,
  Sparkles: (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="m5 3 1 1"/><path d="m5 21 1-1"/><path d="m21 3-1 1"/><path d="m21 21-1-1"/></svg>,
  FileText: (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>,
};

interface DashboardProps {
    projects: Project[];
    proposals: Proposal[];
    onSelectProject: (project: Project) => void;
    onCreateProject: (project: Project) => void;
    onDeleteProject: (projectId: string) => void;
    onSelectProposal: (proposal: Proposal) => void;
    onCreateProposal: (proposal: Proposal) => void;
    onDeleteProposal: (proposalId: string) => void;
}

const StageProgressBar = ({ status }: { status: Stage }) => {
    const stages: Stage[] = ['Kickoff', 'In-Progress', 'Completed', 'Signed', 'Paid'];
    const currentIndex = stages.indexOf(status);

    return (
        <div className="flex items-center gap-1 w-full mt-3">
            {stages.map((stage, idx) => (
                <div key={stage} className="flex-1 flex flex-col items-center group">
                     <div 
                        className={cn(
                            "h-2 w-full rounded-full transition-all duration-500",
                            idx <= currentIndex 
                                ? "bg-primary" 
                                : "bg-muted"
                        )}
                        title={stage}
                    />
                </div>
            ))}
        </div>
    );
};

export const Dashboard = ({ projects, proposals, onSelectProject, onCreateProject, onDeleteProject, onSelectProposal, onCreateProposal, onDeleteProposal }: DashboardProps) => {
    const [activeTab, setActiveTab] = React.useState<'projects' | 'proposals'>('projects');
    const [isCreateOpen, setIsCreateOpen] = React.useState(false);
    const [isProposalOpen, setIsProposalOpen] = React.useState(false);
    
    const [newProjectTitle, setNewProjectTitle] = React.useState("");
    const [newProjectClient, setNewProjectClient] = React.useState("");
    const [newProjectValue, setNewProjectValue] = React.useState("5000");

    const totalRevenue = projects
        .filter(p => p.status === 'Paid')
        .reduce((sum, p) => sum + p.value, 0);
    
    const pendingRevenue = projects
        .filter(p => p.status === 'Signed' || p.status === 'Completed')
        .reduce((sum, p) => sum + p.value, 0);

    const activeProjects = projects.filter(p => p.status !== 'Paid').length;

    const handleCreate = () => {
        if (!newProjectTitle || !newProjectClient) return;
        
        const newProject: Project = {
            id: Math.random().toString(36).substr(2, 9),
            title: newProjectTitle,
            client: newProjectClient,
            status: 'Kickoff',
            completionPercentage: 0,
            value: parseInt(newProjectValue) || 0,
            breadcrumbs: [{ label: "Client Projects", href: "#" }, { label: newProjectTitle, href: "#" }],
            assignees: [],
            dateRange: { start: new Date().toLocaleDateString(), end: "TBD" },
            tags: [],
            description: "New client project. Click to edit description and use Gemini to brainstorm tasks.",
            attachments: [],
            subTasks: []
        };
        
        onCreateProject(newProject);
        setIsCreateOpen(false);
        setNewProjectTitle("");
        setNewProjectClient("");
        setNewProjectValue("5000");
    };

    return (
        <div className="p-4 sm:p-8 space-y-8 max-w-7xl mx-auto animate-in fade-in duration-500">
            
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
                        <Icons.LayoutGrid className="h-8 w-8 text-primary" />
                        Mission Control
                    </h1>
                    <p className="text-muted-foreground mt-1">Manage your active projects and upcoming deals.</p>
                </div>
                <div className="flex gap-2">
                     <Button variant="outline" onClick={() => setIsProposalOpen(true)} className="border-primary/40 hover:bg-primary/5 transition-all text-primary hover:text-primary">
                        <Icons.Sparkles className="h-4 w-4 mr-2" />
                        AI Proposal Engine
                    </Button>
                     <Button onClick={() => setIsCreateOpen(true)}>
                        <Icons.Plus className="h-4 w-4 mr-2" />
                        New Project
                    </Button>
                </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue (Paid)</CardTitle>
                        <Icons.DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${totalRevenue.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">In completed converted projects</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pipeline (Proposals & Pending)</CardTitle>
                        <Icons.Briefcase className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${(pendingRevenue + proposals.reduce((acc, p) => acc + p.value, 0)).toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">Active quotes and signed contracts</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
                        <Icons.Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{activeProjects}</div>
                        <p className="text-xs text-muted-foreground">Projects currently in progress</p>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs */}
            <div className="border-b border-border">
                <div className="flex gap-6">
                    <button 
                        onClick={() => setActiveTab('projects')}
                        className={cn(
                            "pb-3 text-sm font-semibold transition-all relative",
                            activeTab === 'projects' ? "text-primary" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        Active Projects
                        {activeTab === 'projects' && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />
                        )}
                    </button>
                    <button 
                        onClick={() => setActiveTab('proposals')}
                        className={cn(
                            "pb-3 text-sm font-semibold transition-all relative flex items-center gap-2",
                            activeTab === 'proposals' ? "text-primary" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        Sales Pipeline
                        <Badge variant="secondary" className="px-1.5 py-0.5 text-[10px] h-4 rounded-sm">{proposals.length}</Badge>
                        {activeTab === 'proposals' && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />
                        )}
                    </button>
                </div>
            </div>

            {/* Grid Area */}
            {activeTab === 'projects' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-2 duration-500">
                    {projects.map(project => (
                        <Card key={project.id} className="group hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden flex flex-col border-border/60" onClick={() => onSelectProject(project)}>
                            <div className="p-5 flex-1 relative">
                                <div className="flex justify-between items-start mb-3">
                                    <span className="text-xs font-bold text-muted-foreground tracking-widest uppercase">{project.client}</span>
                                    <div className="absolute right-3 top-3 p-1.5 opacity-0 group-hover:opacity-100 transition-opacity rounded hover:bg-destructive/10 z-10" onClick={(e) => { e.stopPropagation(); onDeleteProject(project.id); }}>
                                        <Icons.Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive transition-colors" />
                                    </div>
                                </div>
                                <CardTitle className="text-lg mb-1 leading-snug pr-6">{project.title}</CardTitle>
                                
                                <div className="flex items-center gap-3 mt-5 text-sm text-muted-foreground">
                                    <Badge variant={project.status === 'Paid' ? 'secondary' : 'default'} className="font-semibold text-[10px] px-2 py-0.5 rounded pointer-events-none fade-in uppercase tracking-wider">
                                        {project.status}
                                    </Badge>
                                    <span className="flex items-center gap-1.5 border-l pl-3 border-border text-xs font-semibold">
                                        <Icons.Activity className="h-3.5 w-3.5" />
                                        {project.subTasks.length} Tasks
                                    </span>
                                </div>
                            </div>
                            <div className="bg-muted/30 p-4 border-t border-border/60 flex items-center justify-between transition-colors group-hover:bg-muted/50">
                                <span className="font-semibold text-sm text-foreground">${project.value.toLocaleString()}</span>
                                <span className="text-xs font-bold text-primary flex items-center group-hover:translate-x-1 transition-transform duration-300">
                                    View Details <Icons.ArrowRight className="h-3.5 w-3.5 ml-1" />
                                </span>
                            </div>
                        </Card>
                    ))}
                    
                    <div 
                        className="border-2 border-dashed rounded-lg flex flex-col items-center justify-center p-8 text-muted-foreground hover:bg-muted/40 hover:text-primary hover:border-primary/50 transition-colors cursor-pointer min-h-[200px]"
                        onClick={() => setIsCreateOpen(true)}
                    >
                        <Icons.Plus className="h-10 w-10 mb-2 opacity-50" />
                        <p className="font-medium">Create New Project</p>
                    </div>
                </div>
            )}

            {activeTab === 'proposals' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-2 duration-500">
                    {proposals.length === 0 ? (
                        <div className="col-span-full border border-dashed rounded-lg p-12 text-center text-muted-foreground bg-muted/10">
                            <Icons.Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <h3 className="text-lg font-semibold text-foreground mb-2">No Active Proposals</h3>
                            <p className="max-w-md mx-auto mb-6">Build a stunning AI-generated proposal to win your next deal.</p>
                            <Button onClick={() => setIsProposalOpen(true)}>Create First Proposal</Button>
                        </div>
                    ) : (
                        proposals.map(proposal => (
                            <Card key={proposal.id} className="group hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden flex flex-col border-primary/20" onClick={() => onSelectProposal(proposal)}>
                                <div className="p-5 flex-1 relative bg-gradient-to-br from-background to-primary/5">
                                    <div className="flex justify-between items-start mb-3">
                                        <span className="text-xs font-bold text-muted-foreground tracking-widest uppercase">{proposal.client}</span>
                                        <div className="absolute right-3 top-3 p-1.5 opacity-0 group-hover:opacity-100 transition-opacity rounded hover:bg-destructive/10 z-10" onClick={(e) => { e.stopPropagation(); onDeleteProposal(proposal.id); }}>
                                            <Icons.Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive transition-colors" />
                                        </div>
                                    </div>
                                    <CardTitle className="text-lg mb-1 leading-snug pr-6 group-hover:text-primary transition-colors">{proposal.title}</CardTitle>
                                    
                                    <div className="mt-4 flex flex-wrap gap-2">
                                        <Badge variant="outline" className="font-bold text-[10px] bg-background">
                                            {proposal.status}
                                        </Badge>
                                        {proposal.signed && <Badge variant="secondary" className="font-bold text-[10px] bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Signed</Badge>}
                                        {proposal.paid && <Badge variant="secondary" className="font-bold text-[10px] bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">Paid & Ready</Badge>}
                                    </div>
                                </div>
                                <div className="bg-primary/10 p-4 border-t border-primary/10 flex items-center justify-between transition-colors group-hover:bg-primary/20">
                                    <span className="font-bold text-sm text-foreground">${proposal.value.toLocaleString()}</span>
                                    <span className="text-xs font-bold text-primary flex items-center group-hover:translate-x-1 transition-transform duration-300">
                                        Pitch Deck <Icons.ArrowRight className="h-3.5 w-3.5 ml-1" />
                                    </span>
                                </div>
                            </Card>
                        ))
                    )}
                </div>
            )}

            {/* AI Proposal Generator Modal */}
            {isProposalOpen && (
                <ProposalGenerator 
                    onClose={() => setIsProposalOpen(false)} 
                    onProposalCreated={(proposal) => {
                        onCreateProposal(proposal);
                        setIsProposalOpen(false);
                        setActiveTab('proposals');
                        onSelectProposal(proposal);
                    }} 
                />
            )}

            {/* Create Project Modal... */}
            {isCreateOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={(e) => e.target === e.currentTarget && setIsCreateOpen(false)}>
                    {/* Modal content unchanged... */}
                    <div className="w-full max-w-md bg-background rounded-lg border shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 pb-4 border-b">
                            <h3 className="text-lg font-semibold">Start New Project</h3>
                        </div>
                        <div className="p-6 space-y-4">
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
}
