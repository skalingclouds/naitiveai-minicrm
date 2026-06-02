import express from "express";
import path from "path";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json({ limit: "50mb" }));

// 1. RESEARCH
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
            model: "gemini-3.1-pro-preview",
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }]
            }
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

// 2. SYNTHESIZE
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
            model: 'gemini-3.5-flash',
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

        let text = response.text || '{}';
        // Remove markdown code blocks if present
        text = text.replace(/^```json\n?/, '').replace(/\n?```$/,'').trim();
        res.json(JSON.parse(text));
    } catch (e: any) {
        console.error("Synthesize error:", e);
        res.status(500).json({ error: e.message });
    }
});

// 3. SOW
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
        
        ${previousCritique ? "REVISION REQUEST FROM AUDITOR:\\n" + previousCritique + "\\nAddress these points in this updated version." : ""}
        
        Format in clean Markdown. Ensure any and all tables use standard single pipe (|) cell walls and aligned separator rows. Do not output double pipes (||).
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-3.5-flash',
            contents: prompt
        });

        res.json({ sow: response.text || "" });
    } catch (e: any) {
        console.error("SOW error:", e);
        res.status(500).json({ error: e.message });
    }
});

// 4. REVIEW SOW
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

        Return your findings in JSON format.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-3.5-flash',
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

        let text = response.text || '{"isSolid": false, "critique": "Error parsing review."}';
        text = text.replace(/^```json\n?/, '').replace(/\n?```$/,'').trim();
        res.json(JSON.parse(text));
    } catch (e: any) {
        console.error("Review error:", e);
        res.status(500).json({ error: e.message });
    }
});

// 5. IMAGE GENERATION (Interactions API for Nano Banana 2)
app.post("/api/generate-image", async (req, res) => {
    try {
        const { prompt } = req.body;
        
        const response = await ai.models.generateContent({
            model: 'gemini-3.1-flash-image',
            contents: {
                parts: [
                    {
                        text: `${prompt}. Create a highly detailed, professional, abstract corporate cloud architecture system diagram or conceptual tech design. Highly aesthetic developer blueprint style with thin glowing lines, modern clean dark background. Do not generate random photorealistic subjects unless directly related to technology.`
                    }
                ]
            },
            config: {
                imageConfig: {
                    aspectRatio: "16:9",
                    imageSize: "1K"
                }
            }
        });
        
        let base64Output = null;
        let mimeType = 'image/png';
        
        const candidate = response.candidates?.[0];
        if (candidate?.content?.parts) {
            for (const part of candidate.content.parts) {
                if (part.inlineData && part.inlineData.data) {
                    base64Output = part.inlineData.data;
                    mimeType = part.inlineData.mimeType || 'image/png';
                    break;
                }
            }
        }
        
        if (base64Output) {
            res.json({ url: `data:${mimeType};base64,${base64Output}` });
        } else {
            throw new Error("No image generated by the Interactions API");
        }
    } catch (e: any) {
        console.error("Image generation error:", e);
        // Fallback
        res.json({ url: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=1200&h=675&q=80" });
    }
});

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
        app.get('*', (req, res) => {
            res.sendFile(path.join(distPath, 'index.html'));
        });
    }

    app.listen(PORT, "0.0.0.0", () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}

startServer();
