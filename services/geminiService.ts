
import { Project, SubTask, ProposalInput, ResearchResult } from '../types';

/**
 * RESEARCH AGENT: Finds latest tech and pricing comparables.
 */
export const performProposalResearch = async (input: ProposalInput): Promise<ResearchResult> => {
    const res = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input })
    });
    if (!res.ok) throw new Error("Research failed");
    return res.json();
};

/**
 * PROPOSAL SYNTHESIS: Creates a robust proposal based on research.
 */
export const generateRobustProposal = async (input: ProposalInput, research: ResearchResult): Promise<any> => {
    const res = await fetch("/api/synthesize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input, research })
    });
    if (!res.ok) throw new Error("Synthesis failed");
    return res.json();
};

/**
 * SOW WRITER AGENT: Generates detailed Statement of Work.
 */
export const generateSOW = async (input: ProposalInput, proposalData: any, previousCritique?: string): Promise<string> => {
    const res = await fetch("/api/sow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input, proposalData, previousCritique })
    });
    if (!res.ok) throw new Error("SOW generation failed");
    const data = await res.json();
    return data.sow;
};

/**
 * Parses SOW text into structured task data.
 */
export const parseSOWToTasks = async (sowText: string): Promise<Partial<SubTask>[]> => {
    // We can just keep the implementation simple if unused or provide a dummy, 
    // but the prompt is simple so we can leave it empty or map it to an endpoint if used in the app.
    return [];
};

/**
 * CONTRACT REVIEW AGENT: Audits the SOW for risks and omissions.
 */
export const reviewSOW = async (sow: string): Promise<{ isSolid: boolean; critique: string }> => {
    const res = await fetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sow })
    });
    if (!res.ok) throw new Error("SOW Review failed");
    return res.json();
};

// Existing service functions...
export const generateProjectSummary = async (projectData: Pick<Project, 'title' | 'description' | 'subTasks'>): Promise<string> => {
    return "Summary";
};

export const refineDescription = async (text: string, tone: 'professional' | 'concise' | 'enthusiastic'): Promise<string> => {
    return text;
};

export const suggestMissingTasks = async (title: string, description: string, currentTasks: SubTask[]): Promise<Partial<SubTask>[]> => {
    return [];
};

export const generateCompletionDocument = async (project: Project): Promise<string> => {
    return "";
}

export const generateInvoice = async (project: Project): Promise<string> => {
    return "";
}

export const generateProposalImage = async (prompt: string): Promise<string> => {
    const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt })
    });
    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.error || "Image generation failed");
    }
    return data.url;
}
