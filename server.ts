import express, { Response } from "express";
import path from "path";
import cors from "cors";
import { createServer as createViteServer, loadEnv } from "vite";
import { GoogleGenAI, Type, Modality, FunctionDeclaration } from "@google/genai";
import { normalizeMermaidCode } from "./lib/mermaid";

const env = loadEnv(process.env.NODE_ENV === "production" ? "production" : "development", process.cwd(), "");
const apiKey = process.env.GEMINI_API_KEY || env.GEMINI_API_KEY;

if (!apiKey) {
    console.warn("GEMINI_API_KEY is not set — AI features will fail.");
}

const ai = new GoogleGenAI({ apiKey: apiKey ?? "" });
const app = express();
const PORT = Number(process.env.PORT) || 3010;

const FLASH = "gemini-3.5-flash";
const PRO = "gemini-3.1-pro-preview";
const IMAGE = "gemini-3.1-flash-image-preview";

app.use(cors());
app.use(express.json({ limit: "5mb" }));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const parseJsonResponse = (text: string | undefined, fallback: any = {}) => {
    let t = (text || "").replace(/^```json\n?/, "").replace(/\n?```$/, "").trim();
    try { return JSON.parse(t); } catch { return fallback; }
};

const startSSE = (res: Response) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();
    return (event: Record<string, unknown>) => {
        res.write(`data: ${JSON.stringify(event)}\n\n`);
    };
};

// ---------------------------------------------------------------------------
// 1. RESEARCH (web-grounded)
// ---------------------------------------------------------------------------
app.post("/api/research", async (req, res) => {
    try {
        const { input } = req.body;
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

        const response = await ai.models.generateContent({
            model: PRO,
            contents: prompt,
            config: { tools: [{ googleSearch: {} }] }
        });

        const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
            ?.filter(chunk => chunk.web)
            ?.map(chunk => ({
                title: chunk.web!.title || "Source",
                uri: chunk.web!.uri
            })) || [];

        res.json({ content: response.text || "Research complete.", sources });
    } catch (e: any) {
        console.error("Research error:", e);
        res.status(500).json({ error: e.message });
    }
});

// ---------------------------------------------------------------------------
// 2. SYNTHESIZE PROPOSAL
// ---------------------------------------------------------------------------
app.post("/api/synthesize", async (req, res) => {
    try {
        const { input, research } = req.body;
        const prompt = `
        You are the Lead Strategist at NATIVE AI Consulting Agency. 
        Synthesize the following information into a high-impact project proposal structure.
        
        CLIENT: ${input.clientName}
        PROJECT: ${input.projectTitle}
        BUDGET: $${input.budget}
        TIMELINE: ${input.estimatedWeeks} weeks starting ${input.startDate}
        
        REQUIREMENTS/NOTES:
        ${input.notes}
        
        RESEARCH FINDINGS:
        ${research.content}
        
        The proposal should include:
        - description: A short, punchy executive summary paragraph.
        - painPoints: Array of 3-5 friction points or challenges to solve.
        - solution: The Markdown-formatted Proposal Document (include Executive Summary, Proposed Solution with tech stack, Strategic Value Proposition, High-level Phasing). If incorporating tables, ensure they are written in well-formed standard GFM Markdown table format using single pipes (|) separating cells with proper layout alignment rows (e.g. | Milestone | Phase |).
        - mermaid: A Mermaid.js graph code (graph TD or sequenceDiagram) illustrating the high-level system architecture, workflow, or solution strategy. ONLY OUTPUT THE TEXT OF THE DIAGRAM WITHOUT ANY MARKDOWN BLOCKS (e.g. dont use \`\`\`mermaid or \`\`\`).
        - imagePrompt: A detailed, comma-separated midjourney/imagen style prompt for generating a photorealistic architectural/conceptual hero image. (e.g. "photorealistic cloud infrastructure visualization, glowing neon data streams, modern minimal white background, 8k resolution, volumetric lighting")
        `;

        const response = await ai.models.generateContent({
            model: FLASH,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        description: { type: Type.STRING },
                        painPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
                        solution: { type: Type.STRING },
                        mermaid: { type: Type.STRING },
                        imagePrompt: { type: Type.STRING }
                    },
                    required: ["description", "painPoints", "solution", "mermaid", "imagePrompt"]
                }
            }
        });

        const parsed = parseJsonResponse(response.text);
        if (parsed.mermaid) {
            parsed.mermaid = normalizeMermaidCode(parsed.mermaid);
        }
        res.json(parsed);
    } catch (e: any) {
        console.error("Synthesize error:", e);
        res.status(500).json({ error: e.message });
    }
});

// ---------------------------------------------------------------------------
// 3. SOW WRITER
// ---------------------------------------------------------------------------
app.post("/api/sow", async (req, res) => {
    try {
        const { input, proposalData, previousCritique } = req.body;
        const prompt = `
        You are the SOW Writing Agent for NATIVE AI Consulting Agency.
        Generate a detailed Statement of Work (SOW) based on the project proposal below.
        
        PROPOSAL CONTEXT:
        ${proposalData.solution}
        
        CONSTRAINTS:
        - Budget: $${input.budget} (Fixed Bid)
        - Timeline: ${input.estimatedWeeks} weeks
        - Start Date: ${input.startDate}
        
        SOW REQUIREMENTS:
        1. High-Level Project Plan: Define major milestones with specific dates (calculated from start date). If you use a table, make sure it is a perfectly formatted standard GFM Markdown table.
        2. Task Breakdown: For each milestone, list specific tasks.
        3. Client Involvement Checklist: Outline specific requirements/responsibilities from ${input.clientName} for success.
        4. Fixed Bid Price: Total $${input.budget}.
        5. Completion Estimate: Confirm ${input.estimatedWeeks} week duration.
        6. Signature Section: Professional acceptance block.
        
        ${previousCritique ? "REVISION REQUEST FROM AUDITOR:\n" + previousCritique + "\nAddress these points in this updated version." : ""}
        
        Format in clean Markdown. Ensure any and all tables use standard single pipe (|) cell walls and aligned separator rows. Do not output double pipes (||).
        `;

        const response = await ai.models.generateContent({ model: FLASH, contents: prompt });
        res.json({ sow: response.text || "" });
    } catch (e: any) {
        console.error("SOW error:", e);
        res.status(500).json({ error: e.message });
    }
});

// ---------------------------------------------------------------------------
// 4. REVIEW SOW (now actually receives the SOW)
// ---------------------------------------------------------------------------
app.post("/api/review", async (req, res) => {
    try {
        const { sow } = req.body;
        const prompt = `
        You are the Legal & Technical Contract Auditor for NATIVE AI Consulting Agency.
        Critically review the following Statement of Work (SOW). 
        
        Audit for:
        - Ambiguity in deliverables or milestones.
        - Missing client dependencies.
        - Unrealistic timelines given the scope.
        - Lack of clear acceptance criteria.
        - Professionalism and agency branding.

        --- SOW UNDER REVIEW ---
        ${sow}
        --- END SOW ---

        Return your findings in JSON format.
        `;

        const response = await ai.models.generateContent({
            model: FLASH,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        isSolid: { type: Type.BOOLEAN, description: "True if SOW is solid and requires no changes." },
                        critique: { type: Type.STRING, description: "Detailed list of improvements if isSolid is false." }
                    },
                    required: ["isSolid", "critique"]
                }
            }
        });

        res.json(parseJsonResponse(response.text, { isSolid: true, critique: "" }));
    } catch (e: any) {
        console.error("Review error:", e);
        res.status(500).json({ error: e.message });
    }
});

// ---------------------------------------------------------------------------
// 5. IMAGE GENERATION
// ---------------------------------------------------------------------------
app.post("/api/generate-image", async (req, res) => {
    try {
        const { prompt } = req.body;
        if (!prompt) return res.status(400).json({ error: "Prompt is required" });
        if (!apiKey) return res.status(500).json({ error: "GEMINI_API_KEY is not configured" });

        const imagePrompt = `${prompt}. Create a highly detailed, professional abstract corporate cloud architecture system diagram or conceptual tech design. Highly aesthetic developer blueprint style with thin glowing lines, modern clean dark background.`;

        const response = await ai.models.generateContent({
            model: IMAGE,
            contents: imagePrompt,
            config: {
                responseModalities: [Modality.IMAGE],
                imageConfig: { aspectRatio: "16:9", imageSize: "1K" },
            },
        });

        const candidate = response.candidates?.[0];
        if (candidate?.content?.parts) {
            for (const part of candidate.content.parts) {
                if (part.inlineData?.data) {
                    const mimeType = part.inlineData.mimeType || "image/png";
                    return res.json({ url: `data:${mimeType};base64,${part.inlineData.data}` });
                }
            }
        }
        throw new Error("No image returned");
    } catch (e: any) {
        console.error("Image generation error:", e);
        res.status(500).json({ error: e.message || "Image generation failed" });
    }
});

// ---------------------------------------------------------------------------
// 6. COPILOT AGENT — function-calling loop, streamed over SSE
// ---------------------------------------------------------------------------

const copilotTools: FunctionDeclaration[] = [
    {
        name: "create_task",
        description: "Create a new task on an existing project.",
        parameters: {
            type: Type.OBJECT,
            properties: {
                projectId: { type: Type.STRING, description: "ID of the project from the workspace snapshot" },
                task: { type: Type.STRING, description: "Short task title" },
                category: { type: Type.STRING, description: "e.g. Discovery, Engineering, Delivery" },
                dueDate: { type: Type.STRING, description: "Due date, e.g. 'Jun 14, 2026'" },
            },
            required: ["projectId", "task", "category", "dueDate"],
        },
    },
    {
        name: "update_task_status",
        description: "Change the status of an existing task on a project.",
        parameters: {
            type: Type.OBJECT,
            properties: {
                projectId: { type: Type.STRING },
                taskId: { type: Type.NUMBER, description: "Numeric task ID from the snapshot" },
                status: { type: Type.STRING, enum: ["Pending", "In Progress", "Completed"] },
            },
            required: ["projectId", "taskId", "status"],
        },
    },
    {
        name: "update_project_stage",
        description: "Move a project to a different lifecycle stage.",
        parameters: {
            type: Type.OBJECT,
            properties: {
                projectId: { type: Type.STRING },
                stage: { type: Type.STRING, enum: ["Kickoff", "In-Progress", "Completed", "Signed", "Paid"] },
            },
            required: ["projectId", "stage"],
        },
    },
    {
        name: "update_proposal_status",
        description: "Change the pipeline status of a deal/proposal.",
        parameters: {
            type: Type.OBJECT,
            properties: {
                proposalId: { type: Type.STRING },
                status: { type: Type.STRING, enum: ["Draft", "Sent", "In Review", "Won", "Lost"] },
            },
            required: ["proposalId", "status"],
        },
    },
    {
        name: "create_project",
        description: "Create a brand new client project.",
        parameters: {
            type: Type.OBJECT,
            properties: {
                title: { type: Type.STRING },
                client: { type: Type.STRING },
                value: { type: Type.NUMBER, description: "Project value in USD" },
                description: { type: Type.STRING, description: "1-2 sentence project description" },
            },
            required: ["title", "client", "value", "description"],
        },
    },
    {
        name: "archive_lead",
        description: "Archive an inbound lead that is spam or not worth pursuing.",
        parameters: {
            type: Type.OBJECT,
            properties: { leadId: { type: Type.STRING } },
            required: ["leadId"],
        },
    },
];

app.post("/api/copilot", async (req, res) => {
    const send = startSSE(res);
    try {
        const { messages, snapshot } = req.body as {
            messages: { role: "user" | "assistant"; content: string }[];
            snapshot: unknown;
        };

        const systemInstruction = `
You are the NATIVE Copilot — an AI operator embedded in Naitive Connect, the CRM of NATIVE AI Consulting Agency.
You can both ANSWER questions about the workspace and TAKE ACTIONS using your tools.

The full workspace state is provided below as JSON. Use it to answer read questions directly (deals at risk, revenue, overdue tasks, lead quality, who to follow up with) — do not ask for data you already have.

WORKSPACE SNAPSHOT:
${JSON.stringify(snapshot)}

Rules:
- When the user asks you to do something (create a task, move a deal, archive a lead, etc.), call the appropriate tool with exact IDs from the snapshot. Then confirm what you did in one short sentence.
- When asked to draft an email or message, write it directly in your reply (no tool needed) — personalized, concise, professional, signed "— NATIVE AI Consulting".
- Be decisive and brief. Use markdown. Money formatted like $42,000. Reference entities by name, not ID.
- If asked something genuinely outside the workspace, answer from general knowledge but keep it short.
`;

        const contents: any[] = messages.map(m => ({
            role: m.role === "assistant" ? "model" : "user",
            parts: [{ text: m.content }],
        }));

        const MAX_ROUNDS = 6;
        for (let round = 0; round < MAX_ROUNDS; round++) {
            const stream = await ai.models.generateContentStream({
                model: FLASH,
                contents,
                config: {
                    systemInstruction,
                    tools: [{ functionDeclarations: copilotTools }],
                },
            });

            // Collect the model's parts verbatim — Gemini 3 requires the
            // thoughtSignature on functionCall parts to be echoed back in
            // history, so we must not reconstruct parts by hand.
            const modelParts: any[] = [];
            const functionCalls: { name: string; args: Record<string, unknown> }[] = [];

            for await (const chunk of stream) {
                const parts = chunk.candidates?.[0]?.content?.parts;
                if (!parts) continue;
                for (const part of parts) {
                    if (part.text && !part.thought) send({ type: "text", delta: part.text });
                    if (part.functionCall) {
                        functionCalls.push({
                            name: part.functionCall.name || "",
                            args: (part.functionCall.args as Record<string, unknown>) || {},
                        });
                    }
                    modelParts.push(part);
                }
            }

            if (functionCalls.length === 0) {
                send({ type: "done" });
                return res.end();
            }

            // Append the model's tool-call turn, surface each call to the
            // client as a mutation, and feed back synthetic success results.
            contents.push({ role: "model", parts: modelParts });

            const responseParts: any[] = [];
            for (const fc of functionCalls) {
                const callId = Math.random().toString(36).slice(2, 10);
                send({ type: "tool_call", id: callId, tool: fc.name, args: fc.args });
                send({ type: "mutation", mutation: { type: fc.name, ...fc.args } });
                send({ type: "tool_result", id: callId, result: "applied" });
                responseParts.push({
                    functionResponse: { name: fc.name, response: { success: true, status: "applied to workspace" } },
                });
            }
            contents.push({ role: "user", parts: responseParts });
        }

        send({ type: "text", delta: "\n\n_(Stopped after maximum tool rounds.)_" });
        send({ type: "done" });
        res.end();
    } catch (e: any) {
        console.error("Copilot error:", e);
        send({ type: "error", message: e.message || "Copilot failed" });
        res.end();
    }
});

// ---------------------------------------------------------------------------
// 7. LEAD TRIAGE
// ---------------------------------------------------------------------------
app.post("/api/triage-lead", async (req, res) => {
    try {
        const { lead, context } = req.body;
        const prompt = `
You are the Lead Qualification Agent for NATIVE, an AI consulting agency that builds custom AI solutions
(document processing, AI copilots, voice agents, retrieval systems) for mid-market businesses.

Triage this inbound email:

FROM: ${lead.fromName} <${lead.fromEmail}> (${lead.company})
SUBJECT: ${lead.subject}
RECEIVED: ${lead.receivedAt}

BODY:
${lead.body}

AGENCY CONTEXT (existing clients & deals, for referral detection and pricing calibration):
${JSON.stringify(context ?? {})}

Score the lead 0-100 on fit + intent + urgency + budget signals.
- Hot (70-100): clear pain, budget signals, urgency, decision-maker.
- Warm (40-69): real pain but missing budget/urgency/authority.
- Cold (0-39): vague interest, no authority, or vendor spam pitching US something.

Provide:
- reasoning: 2-3 sentences on why this score (mention specific signals from the email).
- painPoints: the concrete business pains expressed.
- suggestedValue: realistic engagement value in USD for an agency like ours (0 if spam/cold).
- suggestedTitle: a project title we'd pitch (empty string if spam).
- draftReply: a personalized reply email. For Hot/Warm: acknowledge their specific pain with their own numbers/details, briefly establish credibility, propose a concrete next step (e.g. a short call with 2 time options). For spam: empty string. Sign as "— The NATIVE Team".
`;

        const response = await ai.models.generateContent({
            model: FLASH,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        score: { type: Type.NUMBER },
                        tier: { type: Type.STRING, enum: ["Hot", "Warm", "Cold"] },
                        reasoning: { type: Type.STRING },
                        painPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
                        suggestedValue: { type: Type.NUMBER },
                        suggestedTitle: { type: Type.STRING },
                        draftReply: { type: Type.STRING },
                    },
                    required: ["score", "tier", "reasoning", "painPoints", "suggestedValue", "suggestedTitle", "draftReply"],
                },
            },
        });

        const parsed = parseJsonResponse(response.text);
        parsed.triagedAt = new Date().toISOString();
        res.json(parsed);
    } catch (e: any) {
        console.error("Triage error:", e);
        res.status(500).json({ error: e.message });
    }
});

// ---------------------------------------------------------------------------
// 8. DAILY BRIEFING (streamed)
// ---------------------------------------------------------------------------
app.post("/api/briefing", async (req, res) => {
    const send = startSSE(res);
    try {
        const { snapshot } = req.body;
        const prompt = `
You are the Chief of Staff AI for NATIVE AI Consulting Agency. Write today's briefing for the founder
based on the live workspace snapshot below.

WORKSPACE SNAPSHOT:
${JSON.stringify(snapshot)}

Write in tight, confident markdown — max ~180 words total:
1. One-line headline: the single most important thing today.
2. **Pipeline:** 2-3 bullets — deals needing attention, with WHY and the specific next move.
3. **Inbox:** 1-2 bullets — untriaged or hot leads worth acting on now.
4. **Delivery:** 1-2 bullets — project tasks that are overdue, blocked, or due this week.

Use names and dollar amounts. No preamble, no sign-off. Every bullet must end in an action, not an observation.
`;
        const stream = await ai.models.generateContentStream({ model: FLASH, contents: prompt });
        for await (const chunk of stream) {
            if (chunk.text) send({ type: "text", delta: chunk.text });
        }
        send({ type: "done" });
        res.end();
    } catch (e: any) {
        console.error("Briefing error:", e);
        send({ type: "error", message: e.message });
        res.end();
    }
});

// ---------------------------------------------------------------------------
// 9. DEAL INTELLIGENCE (batch health scoring)
// ---------------------------------------------------------------------------
app.post("/api/deal-intel", async (req, res) => {
    try {
        const { deals } = req.body;
        const prompt = `
You are the Revenue Intelligence Agent for NATIVE AI Consulting Agency. Today is ${new Date().toDateString()}.
Analyze each deal below and score its health.

DEALS:
${JSON.stringify(deals)}

For each deal consider: days since creation vs status, momentum signals in the notes,
decision-maker engagement, whether it is signed/paid, and stage-appropriate velocity.
- 70-100 Healthy: moving, engaged, clear next step.
- 40-69 At Risk: stalled, silent, or missing a critical dependency.
- 0-39 Critical: effectively dead without intervention.

Return one entry per deal, same order, with the deal's id.
"risks" = 1-3 specific risks grounded in the data. "nextAction" = ONE concrete, do-it-today move.
`;
        const response = await ai.models.generateContent({
            model: FLASH,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        results: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    id: { type: Type.STRING },
                                    healthScore: { type: Type.NUMBER },
                                    label: { type: Type.STRING, enum: ["Healthy", "At Risk", "Critical"] },
                                    risks: { type: Type.ARRAY, items: { type: Type.STRING } },
                                    nextAction: { type: Type.STRING },
                                },
                                required: ["id", "healthScore", "label", "risks", "nextAction"],
                            },
                        },
                    },
                    required: ["results"],
                },
            },
        });

        const parsed = parseJsonResponse(response.text, { results: [] });
        const analyzedAt = new Date().toISOString();
        res.json({ results: (parsed.results || []).map((r: any) => ({ ...r, analyzedAt })) });
    } catch (e: any) {
        console.error("Deal intel error:", e);
        res.status(500).json({ error: e.message });
    }
});

// ---------------------------------------------------------------------------
// 10. TRANSCRIPT → CRM EXTRACTION
// ---------------------------------------------------------------------------
app.post("/api/transcript", async (req, res) => {
    try {
        const { transcript } = req.body;
        const prompt = `
You are the Meeting Intelligence Agent for NATIVE AI Consulting Agency. Today is ${new Date().toDateString()}.
Process this call transcript into structured CRM data.

TRANSCRIPT:
${transcript}

Extract:
- summary: 2-3 sentence executive summary of the call.
- decisions: key decisions or commitments made (by either side).
- actionItems: concrete tasks for OUR team with category (Discovery/Engineering/Sales/Delivery) and realistic dueDate (e.g. "Jun 12, 2026") inferred from any deadlines mentioned.
- sentiment: overall buyer sentiment (Positive/Neutral/Concerned).
- suggestedStage: if this maps to a deal stage, one of Draft/Sent/In Review/Won/Lost, else omit.
- followUpEmail: a complete, ready-to-send follow-up email to the client recapping the call, confirming commitments and next steps. Reference their specific numbers and concerns. Sign "— The NATIVE Team".
`;
        const response = await ai.models.generateContent({
            model: FLASH,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        summary: { type: Type.STRING },
                        decisions: { type: Type.ARRAY, items: { type: Type.STRING } },
                        actionItems: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    task: { type: Type.STRING },
                                    category: { type: Type.STRING },
                                    dueDate: { type: Type.STRING },
                                },
                                required: ["task", "category", "dueDate"],
                            },
                        },
                        sentiment: { type: Type.STRING, enum: ["Positive", "Neutral", "Concerned"] },
                        suggestedStage: { type: Type.STRING },
                        followUpEmail: { type: Type.STRING },
                    },
                    required: ["summary", "decisions", "actionItems", "sentiment", "followUpEmail"],
                },
            },
        });

        res.json(parseJsonResponse(response.text));
    } catch (e: any) {
        console.error("Transcript error:", e);
        res.status(500).json({ error: e.message });
    }
});

// ---------------------------------------------------------------------------
// 11. PROJECT-LEVEL AI (previously stubbed — now real)
// ---------------------------------------------------------------------------

app.post("/api/project-summary", async (req, res) => {
    try {
        const { project } = req.body;
        const prompt = `
You are the Delivery Intelligence Agent for NATIVE AI Consulting Agency. Today is ${new Date().toDateString()}.
Summarize the state of this project for an account lead in markdown (max ~120 words):

PROJECT: ${JSON.stringify(project)}

Include: **Status** (one punchy line), **Momentum** (what's done vs in flight vs blocked, citing task names),
and **Next Steps** (2-3 prioritized actions with owners implied). Be direct about risks.
`;
        const response = await ai.models.generateContent({ model: FLASH, contents: prompt });
        res.json({ summary: response.text || "" });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

app.post("/api/refine-description", async (req, res) => {
    try {
        const { text, tone } = req.body;
        const response = await ai.models.generateContent({
            model: FLASH,
            contents: `Rewrite this project description in a ${tone || "professional"} tone. Keep it under 80 words, plain text, no markdown, no preamble — output only the rewritten description:\n\n${text}`,
        });
        res.json({ text: (response.text || text).trim() });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

app.post("/api/suggest-tasks", async (req, res) => {
    try {
        const { title, description, currentTasks } = req.body;
        const prompt = `
You are a senior delivery lead at an AI consulting agency. Today is ${new Date().toDateString()}.
Project: "${title}" — ${description}
Existing tasks: ${JSON.stringify(currentTasks)}

Identify 3-5 MISSING tasks that are critical for this project to succeed (think: compliance, testing,
client sign-offs, data access, deployment, handover). Do not duplicate existing tasks.
dueDate format like "Jun 20, 2026", sequenced sensibly after existing work.
`;
        const response = await ai.models.generateContent({
            model: FLASH,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        tasks: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    task: { type: Type.STRING },
                                    category: { type: Type.STRING },
                                    dueDate: { type: Type.STRING },
                                },
                                required: ["task", "category", "dueDate"],
                            },
                        },
                    },
                    required: ["tasks"],
                },
            },
        });
        res.json(parseJsonResponse(response.text, { tasks: [] }));
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

app.post("/api/parse-sow", async (req, res) => {
    try {
        const { sowText } = req.body;
        const prompt = `
Extract the project tasks/milestones from this Statement of Work into a flat task list.
dueDate format like "Jun 20, 2026". Category from: Discovery, Engineering, Design, Compliance, Delivery.

SOW:
${sowText}
`;
        const response = await ai.models.generateContent({
            model: FLASH,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        tasks: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    task: { type: Type.STRING },
                                    category: { type: Type.STRING },
                                    dueDate: { type: Type.STRING },
                                },
                                required: ["task", "category", "dueDate"],
                            },
                        },
                    },
                    required: ["tasks"],
                },
            },
        });
        res.json(parseJsonResponse(response.text, { tasks: [] }));
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

app.post("/api/generate-document", async (req, res) => {
    try {
        const { kind, project } = req.body as { kind: "invoice" | "completion"; project: any };

        if (!kind || (kind !== "invoice" && kind !== "completion")) {
            return res.status(400).json({ error: "Invalid document kind. Must be 'invoice' or 'completion'." });
        }

        const prompts: Record<string, string> = {
            invoice: `
Generate a professional invoice in clean markdown for NATIVE AI Consulting Agency.
Invoice number: NAT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}. Date: ${new Date().toDateString()}. Net 15 terms.
Bill to: ${project.client}. Project: "${project.title}" — total $${project.value}.
Break the total into 2-4 plausible line items based on: ${project.description}
Include payment instructions (wire/ACH placeholder) and a thank-you line.`,
            completion: `
Generate a professional Project Completion Certificate in clean markdown for NATIVE AI Consulting Agency.
Project: "${project.title}" for ${project.client}, value $${project.value}, dates ${project.dateRange?.start} – ${project.dateRange?.end}.
Scope delivered (derive from): ${project.description}
Completed tasks: ${JSON.stringify((project.subTasks || []).filter((t: any) => t.status === "Completed").map((t: any) => t.task))}
Include: summary of delivered scope, acceptance statement, warranty/support note (30 days), and signature blocks for both parties.`,
        };
        const response = await ai.models.generateContent({ model: FLASH, contents: prompts[kind] });
        res.json({ content: response.text || "" });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// ---------------------------------------------------------------------------
// Server bootstrap
// ---------------------------------------------------------------------------
async function startServer() {
    if (process.env.NODE_ENV !== "production") {
        const vite = await createViteServer({
            server: { middlewareMode: true },
            appType: "spa",
        });
        app.use(vite.middlewares);
    } else {
        const distPath = path.join(process.cwd(), 'dist');
        app.use(express.static(distPath));
        app.get('*all', (req, res) => {
            res.sendFile(path.join(distPath, 'index.html'));
        });
    }

    app.listen(PORT, "0.0.0.0", () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}

startServer();
