# Naitive Connect — AI-Native CRM

A portfolio demo by **NATIVE AI Consulting**: a mini-CRM where the AI isn't a feature bolted on the side — it's an employee that runs the pipeline and shows its work.

Every action the AI takes (triaging leads, drafting replies, moving deals, creating tasks) lands in a visible activity feed, so prospects can see exactly what "AI operating your business" looks like.

## What the AI does

| Capability | Where | How |
| --- | --- | --- |
| **Copilot (⌘K)** | Global command bar | Agentic loop with function calling — give it an instruction in plain English ("archive the spam lead", "move Solace to negotiation and add a task") and watch it execute real CRM mutations with a live tool trace. |
| **Lead triage** | Inbox | Scores every inbound email (Hot/Warm/Cold + 0–100), estimates deal value, extracts pain points, and drafts a reply ready to send. One click converts a lead into a pipeline deal. |
| **Daily briefing** | Dashboard | Streams a morning briefing across pipeline, inbox, and delivery: what matters today, and exactly what to do about it. |
| **Deal health** | Dashboard | Analyzes every open deal for risk (silence, slipping dates, blockers) and recommends the next action. |
| **Meeting → CRM** | "Log Meeting" | Paste a call transcript. AI extracts summary, decisions, sentiment, action items (applied as project tasks with owners and due dates), and a follow-up email. |
| **Document engine** | Project view | Generates proposals (with research pass), SOWs (generated → audited → revised until they pass), completion docs, and invoices. |
| **Proposal pipeline** | "AI Proposal Engine" | Multi-agent run: research → pitch synthesis → SOW with self-audit → architecture diagram (Mermaid + generated image). |

## Stack

Deliberately minimal — the point is the AI, not the infrastructure.

- **Client:** React 18 + Vite 6, Tailwind CSS v4, shadcn-style components
- **Server:** Single Express file (`server.ts`) proxying Gemini
- **AI:** Google Gemini (`gemini-3.1-pro-preview` for reasoning/agentic work, `gemini-3.5-flash` for fast tasks, image-gen for architecture art)
- **Streaming:** Server-Sent Events for all generative output
- **Persistence:** `localStorage` (demo-grade by design — reset anytime with the ↺ button)

## Run locally

**Prerequisites:** Node.js 20+

```bash
npm install
echo "GEMINI_API_KEY=your-key-here" > .env.local
npm run dev          # client + API on http://localhost:3010
```

## Build

```bash
npm run build        # bundles client (dist/) and server (dist/server.js)
npm start            # serve the production build
```

## Demo script (60 seconds)

1. Land on **Mission Control** — the daily briefing streams in.
2. Open **Inbox** → hit **Triage all new** — watch leads get scored, valued, and answered.
3. Hit **⌘K** → type *"archive any spam leads and create a follow-up task for the hottest one"* — watch the agent work with a live tool trace.
4. Click **Log Meeting** → load the sample call → **Extract with AI** → apply the action items as project tasks.
5. Open a project → generate a SOW — it's audited and revised by a second AI pass before it lands.

Everything the AI did is in the **Activity** feed. That's the pitch.
