
import { GoogleGenAI, Type } from "@google/genai";
import { Project, SubTask, ProposalInput, ResearchResult } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

/**
 * RESEARCH AGENT: Finds latest tech and pricing comparables.
 */
export const performProposalResearch = async (input: ProposalInput): Promise<ResearchResult> => {
    const prompt = `
    You are the Senior Research Agent for NATIVE, an AI Consulting Agency. 
    Your task is to conduct deep research for a new project proposal: "${input.projectTitle}" for "${input.clientName}".
    
    Research Requirements:
    1. Latest AI/Technology Trends: Identify specific, modern technologies or frameworks relevant to these requirements: "${input.notes}".
    2. Market Pricing Comparables: Find real-world pricing data or industry standards for similar projects. 
       Aim to find data that helps derive a "mid-range" cost (avoiding low-quality cheap options and overpriced enterprise extremes).
    3. General Context: Provide industry context around these requirements to ensure the proposal is robust.

    Input Constraint: Total Budget is $${input.budget}. Estimated timeline is ${input.estimatedWeeks} weeks starting ${input.startDate}.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
                thinkingConfig: { thinkingBudget: 15000 }
            }
        });

        const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
            ?.filter(chunk => chunk.web)
            ?.map(chunk => ({
                title: chunk.web!.title || "Source",
                uri: chunk.web!.uri
            })) || [];

        return {
            content: response.text || "Research failed to yield details.",
            sources
        };
    } catch (error) {
        console.error("Research Agent Error:", error);
        throw error;
    }
};

/**
 * PROPOSAL SYNTHESIS: Creates a robust proposal based on research.
 */
export const generateRobustProposal = async (input: ProposalInput, research: ResearchResult): Promise<string> => {
    const prompt = `
    You are the Lead Strategist at NATIVE AI Consulting Agency. 
    Synthesize the following information into a high-impact project proposal.
    
    CLIENT: ${input.clientName}
    PROJECT: ${input.projectTitle}
    BUDGET: $${input.budget}
    TIMELINE: ${input.estimatedWeeks} weeks starting ${input.startDate}
    
    REQUIREMENTS/NOTES:
    ${input.notes}
    
    RESEARCH FINDINGS:
    ${research.content}
    
    The proposal should include:
    - Executive Summary
    - Proposed Solution (Specific tech stack from research)
    - Strategic Value Proposition
    - High-level Phasing
    
    Format in professional Markdown for NATIVE Agency.
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt
    });
    return response.text || "";
};

/**
 * SOW WRITER AGENT: Generates detailed Statement of Work.
 */
export const generateSOW = async (input: ProposalInput, proposal: string, previousCritique?: string): Promise<string> => {
    const prompt = `
    You are the SOW Writing Agent for NATIVE AI Consulting Agency.
    Generate a detailed Statement of Work (SOW) based on the project proposal below.
    
    PROPOSAL CONTEXT:
    ${proposal}
    
    CONSTRAINTS:
    - Budget: $${input.budget} (Fixed Bid)
    - Timeline: ${input.estimatedWeeks} weeks
    - Start Date: ${input.startDate}
    
    SOW REQUIREMENTS:
    1. High-Level Project Plan: Define major milestones with specific dates (calculated from start date).
    2. Task Breakdown: For each milestone, list specific tasks.
    3. Client Involvement Checklist: Outline specific requirements/responsibilities from ${input.clientName} for success.
    4. Fixed Bid Price: Total $${input.budget}.
    5. Completion Estimate: Confirm ${input.estimatedWeeks} week duration.
    6. Signature Section: Professional acceptance block.
    
    ${previousCritique ? `REVISION REQUEST FROM AUDITOR:\n${previousCritique}\nAddress these points in this updated version.` : ""}
    
    Format in clean Markdown.
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt
    });
    return response.text || "";
};

/**
 * Parses SOW text into structured task data.
 */
export const parseSOWToTasks = async (sowText: string): Promise<Partial<SubTask>[]> => {
    const prompt = `
    Extract the Project Plan and Task Breakdown from this Statement of Work (SOW) into a structured JSON array of tasks.
    
    SOW CONTENT:
    ${sowText}
    
    Rules for extraction:
    1. Each object must have: task (string), category (string), dueDate (YYYY-MM-DD), and dependsOn (array of task IDs it depends on if applicable).
    2. Order the tasks chronologically.
    3. Use IDs starting from 1 for the extracted set.
    4. Category should reflect the milestone name (e.g., Phase 1, Discovery, Implementation).
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        task: { type: Type.STRING },
                        category: { type: Type.STRING },
                        dueDate: { type: Type.STRING },
                        dependsOn: { type: Type.ARRAY, items: { type: Type.INTEGER } }
                    },
                    required: ["task", "category", "dueDate"]
                }
            }
        }
    });

    try {
        return JSON.parse(response.text || "[]");
    } catch {
        return [];
    }
};

/**
 * CONTRACT REVIEW AGENT: Audits the SOW for risks and omissions.
 */
export const reviewSOW = async (sow: string): Promise<{ isSolid: boolean; critique: string }> => {
    const prompt = `
    You are the Legal & Technical Contract Auditor for NATIVE AI Consulting Agency.
    Critically review the following Statement of Work (SOW). 
    
    Audit for:
    - Ambiguity in deliverables or milestones.
    - Missing client dependencies.
    - Unrealistic timelines given the scope.
    - Lack of clear acceptance criteria.
    - Professionalism and agency branding.

    Return your findings in JSON format.
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    isSolid: { type: Type.BOOLEAN, description: "True if SOW is perfect and requires no changes." },
                    critique: { type: Type.STRING, description: "Detailed list of improvements if isSolid is false." }
                },
                required: ["isSolid", "critique"]
            }
        }
    });

    return JSON.parse(response.text || '{"isSolid": false, "critique": "Error parsing review."}');
};

// Existing service functions...
export const generateProjectSummary = async (projectData: Pick<Project, 'title' | 'description' | 'subTasks'>): Promise<string> => {
    const prompt = `Analyze: ${projectData.title}\nDescription: ${projectData.description}\nTasks: ${projectData.subTasks.map(t => t.task).join(', ')}`;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
    return response.text || "Summary error.";
};

export const refineDescription = async (text: string, tone: 'professional' | 'concise' | 'enthusiastic'): Promise<string> => {
    const prompt = `Rewrite "${text}" to be ${tone}.`;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
    return response.text?.trim() || text;
};

export const suggestMissingTasks = async (title: string, description: string, currentTasks: SubTask[]): Promise<Partial<SubTask>[]> => {
    const currentList = currentTasks.map(t => `- ${t.task} (${t.category})`).join('\n');
    const prompt = `You are a project manager. Based on this project title and description, suggest 3-5 missing tasks.
Project Title: ${title}
Description: ${description}

Current Tasks:
${currentList || 'None yet.'}

Make sure not to duplicate current tasks. Provide a realistic category and due date (YYYY-MM-DD format based on today). Feel free to also specify a dependsOn array with integers if a new task depends on existing task IDs.`;
    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        task: { type: Type.STRING },
                        category: { type: Type.STRING },
                        dueDate: { type: Type.STRING },
                        status: { type: Type.STRING },
                        dependsOn: { type: Type.ARRAY, items: { type: Type.INTEGER } }
                    }
                }
            }
        }
    });
    return JSON.parse(response.text || "[]");
};

export const generateCompletionDocument = async (project: Project): Promise<string> => {
    const prompt = `Generate Completion Cert for ${project.title}`;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
    return response.text || "";
}

export const generateInvoice = async (project: Project): Promise<string> => {
    const prompt = `Generate Invoice for ${project.title}, value $${project.value}`;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
    return response.text || "";
}
