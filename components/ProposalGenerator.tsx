
import * as React from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Badge } from './ui/badge';
import { cn } from '../lib/utils';
import { 
    performProposalResearch, 
    generateRobustProposal, 
    generateSOW, 
    reviewSOW 
} from '../services/geminiService';
import { ProposalInput, ResearchResult, AgentStatus } from '../types';

const Icons = {
    Loader: (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>,
    CheckCircle: (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
    Search: (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>,
    Brain: (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-1.54Z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-1.54Z"/></svg>,
    FileText: (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>,
    ArrowRight: (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
};

export const ProposalGenerator = ({ onClose, onProposalCreated }: { onClose: () => void, onProposalCreated?: (p: any) => void }) => {
    const [input, setInput] = React.useState<ProposalInput>({
        notes: "",
        budget: 15000,
        startDate: new Date().toISOString().split('T')[0],
        estimatedWeeks: 4,
        clientName: "",
        projectTitle: ""
    });

    const [status, setStatus] = React.useState<AgentStatus>({ phase: 'idle', message: "" });
    const [isComplete, setIsComplete] = React.useState(false);

    const handleGenerate = async () => {
        if (!input.projectTitle || !input.clientName) return;

        try {
            // STEP 1: Research
            setStatus({ phase: 'researching', message: "NATIVE Research Agent scans latest tech pricing & comparables..." });
            const resData = await performProposalResearch(input);

            // STEP 2: Synthesis
            setStatus({ phase: 'synthesizing', message: "Synthesizing research into a photorealistic proposal..." });
            const propData = await generateRobustProposal(input, resData);

            // STEP 3: SOW & Review Loop
            setStatus({ phase: 'reviewing', message: "Generating SOW and performing internal contract audit..." });
            let currentSow = await generateSOW(input, propData);
            
            const review = await reviewSOW(currentSow);
            if (!review.isSolid) {
                setStatus({ phase: 'reviewing', message: "Auditor refining SOW..." });
                currentSow = await generateSOW(input, propData, review.critique);
            }

            setStatus({ phase: 'completed', message: "Compiling artifacts..." });
            
            if (onProposalCreated) {
                 const newProposal = {
                     id: Math.random().toString(36).substr(2, 9),
                     title: input.projectTitle,
                     client: input.clientName,
                     status: 'Draft',
                     value: input.budget,
                     dateRange: { start: input.startDate, end: "TBD" },
                     createdAt: new Date().toISOString(),
                     notes: input.notes,
                     description: propData.description || "Proposal ready.",
                     painPoints: propData.painPoints || [],
                     solution: propData.solution || propData,
                     architectureMermaid: propData.mermaid || "graph TD\\n A-->B",
                     aiArchitectureImageUrl: "", 
                     aiArchitectureImagePrompt: propData.imagePrompt || "photorealistic architectural cloud infrastructure diagram",
                     documents: [
                         { id: "doc-1", name: "Proposal_Overview.md", size: "12 KB", type: "other", dateAdded: new Date().toISOString() },
                         { id: "doc-2", name: "Statement_of_Work.md", size: "8 KB", type: "pdf", dateAdded: new Date().toISOString() }
                     ],
                     sowContent: currentSow,
                     signed: false,
                     paid: false,
                 };
                 onProposalCreated(newProposal);
            }
        } catch (error) {
            console.error(error);
            setStatus({ phase: 'idle', message: "An error occurred during generation." });
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
            <Card className="w-full max-w-4xl shadow-2xl border-primary/20">
                <CardHeader className="border-b bg-muted/30">
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle className="text-2xl font-bold text-primary flex items-center gap-2">
                                <Icons.Brain className="h-7 w-7" />
                                NATIVE AI Proposal Engine
                            </CardTitle>
                            <CardDescription>Generate institutional-grade proposals, SOWs, and architectural flipbooks.</CardDescription>
                        </div>
                        <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
                            <span className="sr-only">Close</span>
                            <Icons.ArrowRight className="h-5 w-5 rotate-180" />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-6">
                    {status.phase === 'idle' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold">Client Name</label>
                                    <input 
                                        className="w-full h-10 px-3 rounded-md border border-input bg-background"
                                        placeholder="e.g. Acme Corp"
                                        value={input.clientName}
                                        onChange={e => setInput({...input, clientName: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold">Project Title</label>
                                    <input 
                                        className="w-full h-10 px-3 rounded-md border border-input bg-background"
                                        placeholder="e.g. Cloud Migration Strategy"
                                        value={input.projectTitle}
                                        onChange={e => setInput({...input, projectTitle: e.target.value})}
                                    />
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold">Total Budget ($)</label>
                                    <input 
                                        type="number"
                                        className="w-full h-10 px-3 rounded-md border border-input bg-background"
                                        value={input.budget}
                                        onChange={e => setInput({...input, budget: parseInt(e.target.value) || 0})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold">Start Date</label>
                                    <input 
                                        type="date"
                                        className="w-full h-10 px-3 rounded-md border border-input bg-background"
                                        value={input.startDate}
                                        onChange={e => setInput({...input, startDate: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold">Estimated Weeks</label>
                                    <input 
                                        type="number"
                                        className="w-full h-10 px-3 rounded-md border border-input bg-background"
                                        value={input.estimatedWeeks}
                                        onChange={e => setInput({...input, estimatedWeeks: parseInt(e.target.value) || 0})}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold">Discovery / Pain Points</label>
                                <textarea 
                                    className="w-full min-h-[150px] p-3 rounded-md border border-input bg-background resize-none"
                                    placeholder="Paste raw meeting notes, high-level requirements, or friction points here..."
                                    value={input.notes}
                                    onChange={e => setInput({...input, notes: e.target.value})}
                                />
                            </div>

                            <Button 
                                className="w-full h-12 text-lg font-bold group"
                                onClick={handleGenerate}
                                disabled={!input.projectTitle || !input.clientName || !input.notes}
                            >
                                <Icons.Sparkles className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
                                Synthesize Deep Pitch Deck
                            </Button>
                        </div>
                    )}

                    {status.phase !== 'idle' && (
                        <div className="flex flex-col items-center justify-center py-20 space-y-6 text-center">
                            <div className="relative">
                                <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
                                <Icons.Loader className="h-16 w-16 animate-spin text-primary relative z-10" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-xl font-bold tracking-tight">{status.message}</h3>
                                <div className="flex justify-center gap-1">
                                    {['researching', 'synthesizing', 'reviewing', 'completed'].map(p => (
                                        <div 
                                            key={p} 
                                            className={cn(
                                                "h-1.5 w-12 rounded-full transition-all duration-500",
                                                status.phase === p ? "bg-primary scale-x-110 shadow-sm" : "bg-muted"
                                            )} 
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};
