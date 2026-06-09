import * as React from "react";
import { Proposal, Project } from "../types";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Badge } from "./ui/badge";
import { cn } from "../lib/utils";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import mermaid from 'mermaid';
import { normalizeMermaidCode } from '../lib/mermaid';

const Icons = {
  ArrowRight: (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
  ArrowLeft: (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>,
  CheckCircle: (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
  CreditCard: (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>,
  FileSignature: (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M20 19.5c0 .8-.5 1.5-1.5 1.5H5c-1 0-1.5-.7-1.5-1.5V5c0-1 .5-1.5 1.5-1.5h14c1 0 1.5.5 1.5 1.5v14.5z"/><path d="M8 10h8"/><path d="M8 14h6"/><path d="M8 6h8"/></svg>,
  Play: (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polygon points="5 3 19 12 5 21 5 3"/></svg>,
  Brain: (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M9.5 2A2.5 2.5 0 0 0 7 4.5v15a2.5 2.5 0 0 0 4.9 .5h.2a2.5 2.5 0 0 0 4.9-.5v-15A2.5 2.5 0 0 0 14.5 2h-5z"/><path d="M7 4.5V4a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v.5"/><path d="M17 12h2a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2h-2"/><path d="M7 12H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h2"/></svg>,
  Loader: (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>,
};

interface ProposalDetailViewProps extends Proposal {
    sowContent?: string;
    onBack: () => void;
    onUpdateProposal: (proposal: Proposal) => void;
    onConvertToProject: (project: Project) => void;
    onGenerateImage: (prompt: string) => Promise<string>;
}

const renderMarkdownComponents = {
  h1: ({node, ...props}: any) => <h1 className="text-2xl font-bold mt-6 mb-4 text-foreground border-b pb-2 font-sans tracking-tight" {...props} />,
  h2: ({node, ...props}: any) => <h2 className="text-xl font-bold mt-5 mb-3 text-foreground font-sans tracking-tight" {...props} />,
  h3: ({node, ...props}: any) => <h3 className="text-lg font-semibold mt-4 mb-2 text-foreground font-sans tracking-tight" {...props} />,
  p: ({node, ...props}: any) => <p className="my-3 leading-relaxed text-muted-foreground text-sm font-sans" {...props} />,
  ul: ({node, ...props}: any) => <ul className="list-disc list-inside my-3 space-y-1.5 pl-4 text-muted-foreground" {...props} />,
  ol: ({node, ...props}: any) => <ol className="list-decimal list-inside my-3 space-y-1.5 pl-4 text-muted-foreground" {...props} />,
  li: ({node, ...props}: any) => <li className="text-muted-foreground text-sm font-sans mb-1" {...props} />,
  code: ({node, ...props}: any) => <code className="bg-muted px-1.5 py-0.5 rounded font-mono text-xs text-primary border" {...props} />,
  pre: ({node, ...props}: any) => <pre className="bg-muted p-4 rounded-lg my-4 overflow-x-auto font-mono text-xs border" {...props} />,
  blockquote: ({node, ...props}: any) => <blockquote className="border-l-4 border-primary/40 pl-4 italic my-4 text-muted-foreground bg-muted/20 py-1 rounded-r" {...props} />,
  hr: ({node, ...props}: any) => <hr className="my-6 border-muted" {...props} />,
  table: ({node, ...props}: any) => <div className="overflow-x-auto my-4"><table className="min-w-full border-collapse border border-border" {...props} /></div>,
  th: ({node, ...props}: any) => <th className="border border-border p-2 bg-muted text-left font-bold text-sm" {...props} />,
  td: ({node, ...props}: any) => <td className="border border-border p-2 text-left text-sm text-muted-foreground" {...props} />
};

export const ProposalDetailView = (props: ProposalDetailViewProps) => {
    const [activeTab, setActiveTab] = React.useState<'pitch' | 'architecture' | 'sow' | 'sign'>('pitch');
    const [isAvatarPlaying, setIsAvatarPlaying] = React.useState(false);
    const [isGeneratingImage, setIsGeneratingImage] = React.useState(false);

    const handleSign = () => {
        props.onUpdateProposal({ ...props, signed: true, status: 'Won' });
        setActiveTab('sign');
    };

    const handlePay = () => {
        if (!props.signed) return;
        const paidProposal = { ...props, paid: true };
        props.onUpdateProposal(paidProposal);
        
        // Auto convert to project
        setTimeout(() => {
            const newProject: Project = {
                id: Math.random().toString(36).substr(2, 9),
                title: props.title,
                client: props.client,
                status: 'Kickoff',
                completionPercentage: 0,
                value: props.value,
                breadcrumbs: [{ label: "Client Projects", href: "#" }, { label: props.title, href: "#" }],
                assignees: [],
                dateRange: props.dateRange,
                tags: [{ label: "New", variant: "default" }],
                description: props.description,
                attachments: props.documents,
                subTasks: [
                    {
                        id: 1,
                        task: "Project Kickoff Meeting",
                        category: "Phase 1",
                        status: "Pending",
                        dueDate: props.dateRange.start,
                        dependsOn: []
                    }
                ]
            };
            props.onConvertToProject(newProject);
            props.onBack();
        }, 1500);
    };

    const handleGenerateImage = async () => {
        if (!props.aiArchitectureImagePrompt) return;
        setIsGeneratingImage(true);
        try {
            const url = await props.onGenerateImage(props.aiArchitectureImagePrompt);
            props.onUpdateProposal({ ...props, aiArchitectureImageUrl: url });
        } catch (error) {
            console.error("Image generation failed", error);
        } finally {
            setIsGeneratingImage(false);
        }
    };

    return (
        <div className="w-full max-w-6xl mx-auto space-y-6 animate-in slide-in-from-bottom-2 duration-500 pb-20">
            {/* Header & Breadcrumbs */}
            <div className="flex items-center justify-between mb-8">
                <Button variant="ghost" onClick={props.onBack} className="-ml-4 hover:bg-transparent">
                    <Icons.ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Dashboard
                </Button>
                <div className="flex gap-2">
                    <Badge variant={props.signed ? 'secondary' : 'outline'} className={cn(props.signed ? "bg-green-100 text-green-800" : "")}>
                        {props.signed ? 'Client Signed' : 'Pending Signature'}
                    </Badge>
                    <Badge variant={props.paid ? 'secondary' : 'outline'} className={cn(props.paid ? "bg-blue-100 text-blue-800" : "")}>
                         {props.paid ? 'Payment Received' : 'Pending Payment'}
                    </Badge>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8">
                {/* Main Content Area */}
                <div className="space-y-6">
                    <div className="border-b border-border mb-6">
                        <div className="flex gap-6 overflow-x-auto custom-scrollbar">
                            {(['pitch', 'architecture', 'sow', 'sign'] as const).map(tab => (
                                <button 
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={cn(
                                        "pb-3 text-sm font-semibold transition-all relative capitalize whitespace-nowrap",
                                        activeTab === tab ? "text-primary" : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    {tab === 'sign' ? 'Next Steps & Sign' : tab}
                                    {activeTab === tab && (
                                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {activeTab === 'pitch' && (
                        <Card className="border-primary/10 shadow-lg overflow-hidden relative group">
                            {/* AI Avatar Overlay - WoW factor */}
                            <div className="absolute top-4 right-4 z-20">
                                <div className={cn(
                                    "bg-background/80 backdrop-blur-md border rounded-2xl p-2 shadow-2xl transition-all duration-500 cursor-pointer overflow-hidden",
                                    isAvatarPlaying ? "w-64 h-auto" : "w-16 h-16 rounded-full hover:scale-105"
                                )} onClick={() => setIsAvatarPlaying(!isAvatarPlaying)}>
                                    {!isAvatarPlaying ? (
                                        <div className="w-full h-full rounded-full bg-primary/20 flex items-center justify-center text-primary relative">
                                            <div className="absolute inset-0 border-2 border-primary rounded-full animate-ping opacity-20" />
                                            <Icons.Play className="h-6 w-6 ml-1" />
                                        </div>
                                    ) : (
                                        <div className="p-3">
                                            <div className="flex items-center gap-2 mb-2 border-b pb-2">
                                                <div className="w-8 h-8 rounded-full bg-primary/20 flex flex-shrink-0 items-center justify-center text-primary">
                                                    <Icons.Brain className="h-4 w-4" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold leading-none">AI Strategist</span>
                                                    <span className="text-[9px] text-muted-foreground uppercase tracking-widest mt-0.5">Synthesized Audio</span>
                                                </div>
                                            </div>
                                            <p className="text-xs text-muted-foreground italic mb-2 leading-relaxed">
                                                "Hi {props.client}. Based on our discovery, the biggest friction point is {props.painPoints[0] || 'efficiency'}. This proposal outlines exactly how our custom AI infrastructure solves this..."
                                            </p>
                                            <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                                                 <div className="h-full bg-primary w-2/3 animate-pulse" />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <CardContent className="p-0">
                                {/* Hero Section */}
                                <div className="h-48 bg-gradient-to-br from-primary/5 via-primary/10 to-background flex flex-col justify-end p-8 relative overflow-hidden">
                                     <div className="absolute top-0 right-0 p-12 opacity-10">
                                        <Icons.Brain className="w-64 h-64" />
                                     </div>
                                     <Badge className="w-fit mb-4 bg-background text-foreground shadow-sm">Executive Overview</Badge>
                                     <h2 className="text-3xl lg:text-4xl font-bold tracking-tight mb-2 relative z-10">{props.title}</h2>
                                     <p className="text-muted-foreground font-medium relative z-10">Prepared exclusively for {props.client}</p>
                                </div>
                                <div className="p-8 prose prose-sm sm:prose-base dark:prose-invert max-w-none prose-headings:font-bold prose-a:text-primary">
                                    <ReactMarkdown components={renderMarkdownComponents} remarkPlugins={[remarkGfm]}>{(props.solution || "").replace(/\\n/g, "\n")}</ReactMarkdown>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {activeTab === 'architecture' && (
                        <div className="space-y-6">
                            {props.aiArchitectureImageUrl ? (
                                <Card className="overflow-hidden border-primary/20">
                                    <img src={props.aiArchitectureImageUrl} alt="System Architecture" className="w-full h-auto object-cover max-h-[500px]" referrerPolicy="no-referrer" />
                                    <div className="p-4 bg-muted/30 border-t text-sm font-medium text-muted-foreground">
                                        Photorealistic Concept generated via Gemini 3.1 Flash Image based on proposed architecture.
                                    </div>
                                </Card>
                            ) : (
                                <Card className="p-12 text-center bg-muted/20 border-dashed">
                                    <Icons.Brain className="h-12 w-12 mx-auto text-primary opacity-50 mb-4" />
                                    <p className="font-medium text-lg mb-2">Visualize the Infrastructure via Gemini 3.1 Flash Image</p>
                                    <p className="text-muted-foreground mb-6 max-w-md mx-auto">Generate a high-fidelity architecture visualization using Gemini 3.1 Flash Image.</p>
                                    <Button onClick={handleGenerateImage} disabled={isGeneratingImage}>
                                        {isGeneratingImage ? (
                                            <>
                                                <Icons.Loader className="h-4 w-4 mr-2 animate-spin" />
                                                Generating...
                                            </>
                                        ) : (
                                            "Generate Concept Art"
                                        )}
                                    </Button>
                                </Card>
                            )}

                            {props.architectureMermaid && (
                                <Card className="p-6">
                                    <h3 className="text-lg font-bold mb-4 font-mono tracking-tight text-primary uppercase text-sm border-b pb-2">Technical Flow</h3>
                                    <InteractiveMermaid code={props.architectureMermaid} />
                                </Card>
                            )}
                        </div>
                    )}

                    {activeTab === 'sow' && (
                        <Card className="p-8 border-primary/20 shadow-lg bg-background">
                            <div className="prose prose-sm dark:prose-invert max-w-none font-sans prose-headings:font-bold border-l-4 border-primary/40 pl-6 my-4">
                                <ReactMarkdown components={renderMarkdownComponents} remarkPlugins={[remarkGfm]}>{(props.sowContent || "SOW content pending...").replace(/\\n/g, "\n")}</ReactMarkdown>
                            </div>
                        </Card>
                    )}

                    {activeTab === 'sign' && (
                        <Card className="border-primary/20 shadow-xl overflow-hidden relative">
                             {props.signed && props.paid && (
                                <div className="absolute inset-0 bg-green-500/10 z-0 animate-in fade-in flex items-center justify-center">
                                    <div className="absolute animate-ping opacity-20">
                                        <Icons.CheckCircle className="w-[500px] h-[500px] text-green-500" />
                                    </div>
                                </div>
                            )}

                            <CardContent className="p-12 text-center space-y-8 relative z-10">
                                <div>
                                    <h2 className="text-3xl font-bold mb-2">Deal Finalization</h2>
                                    <p className="text-muted-foreground">Let's make it official and begin the work.</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl mx-auto">
                                    <div className={cn("p-6 border rounded-xl flex flex-col items-center justify-center gap-4 transition-all duration-300", 
                                        props.signed ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800" : "bg-muted/30"
                                    )}>
                                        <Icons.FileSignature className={cn("h-10 w-10", props.signed ? "text-green-500" : "text-muted-foreground")} />
                                        <div>
                                            <h4 className="font-bold">Step 1: Sign SOW</h4>
                                        </div>
                                        {!props.signed ? (
                                            <Button className="w-full" onClick={handleSign}>Digitally Sign</Button>
                                        ) : (
                                            <Badge className="bg-green-500 hover:bg-green-600"><Icons.CheckCircle className="h-3 w-3 mr-1" /> Client Signed</Badge>
                                        )}
                                    </div>

                                    <div className={cn("p-6 border rounded-xl flex flex-col items-center justify-center gap-4 transition-all duration-300", 
                                        props.paid ? "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800" : "bg-muted/30"
                                    )}>
                                        <Icons.CreditCard className={cn("h-10 w-10", props.paid ? "text-blue-500" : "text-muted-foreground")} />
                                        <div>
                                            <h4 className="font-bold">Step 2: Deposit</h4>
                                            <p className="text-xs text-muted-foreground">${(props.value * 0.5).toLocaleString()} due now</p>
                                        </div>
                                        {!props.paid ? (
                                            <Button disabled={!props.signed} className="w-full" onClick={handlePay}>Process Payment</Button>
                                        ) : (
                                            <Badge className="bg-blue-500 hover:bg-blue-600"><Icons.CheckCircle className="h-3 w-3 mr-1" /> Paid in Full</Badge>
                                        )}
                                    </div>
                                </div>

                                {props.paid && (
                                    <div className="pt-8">
                                        <p className="text-sm font-semibold text-primary animate-pulse flex items-center justify-center gap-2">
                                            <Icons.Loader className="h-4 w-4 animate-spin" />
                                            Converting to Active Project Workspace...
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    <Card className="bg-muted/30 border-none shadow-none">
                        <CardContent className="p-6">
                            <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground mb-4">Deal Details</h3>
                            <div className="space-y-4">
                                <div>
                                    <div className="text-xs text-muted-foreground mb-1">Budget</div>
                                    <div className="font-bold text-xl">${props.value.toLocaleString()}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-muted-foreground mb-1">Client</div>
                                    <div className="font-semibold">{props.client}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-muted-foreground mb-1">Created</div>
                                    <div className="text-sm">{new Date(props.createdAt).toLocaleDateString()}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-muted-foreground mb-1">Friction Points Target</div>
                                    <ul className="text-sm space-y-1 mt-1 text-muted-foreground list-disc pl-4">
                                        {props.painPoints?.map((p, i) => (
                                            <li key={i}>{p}</li>
                                        ))}
                                        {(!props.painPoints || props.painPoints.length === 0) && (
                                            <li className="italic">Standard implementation</li>
                                        )}
                                    </ul>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

interface InteractiveMermaidProps {
    code: string;
}

const InteractiveMermaid = ({ code }: InteractiveMermaidProps) => {
    const containerRef = React.useRef<HTMLDivElement>(null);
    const [error, setError] = React.useState<string | null>(null);
    const renderId = React.useId().replace(/:/g, "");

    React.useEffect(() => {
        const normalized = normalizeMermaidCode(code);
        if (!containerRef.current || !normalized) return;

        let cancelled = false;

        (async () => {
            try {
                mermaid.initialize({
                    startOnLoad: false,
                    theme: "dark",
                    securityLevel: "loose",
                    fontFamily: "inherit",
                });
                const { svg } = await mermaid.render(`mermaid-${renderId}`, normalized);
                if (!cancelled && containerRef.current) {
                    containerRef.current.innerHTML = svg;
                    setError(null);
                }
            } catch (err) {
                if (!cancelled) {
                    setError(err instanceof Error ? err.message : "Failed to render diagram");
                }
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [code, renderId]);

    if (error) {
        return (
            <div className="w-full overflow-x-auto bg-slate-900/30 p-8 rounded-xl border border-red-500/30">
                <p className="text-sm text-red-400 mb-3 font-medium">Could not render diagram</p>
                <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-mono">{normalizeMermaidCode(code)}</pre>
            </div>
        );
    }

    return (
        <div className="w-full overflow-x-auto bg-slate-900/30 p-8 rounded-xl border border-slate-700/30 flex justify-center">
            <div ref={containerRef} className="min-w-max [&_svg]:max-w-full [&_svg]:h-auto" />
        </div>
    );
};
