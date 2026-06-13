import {
  Project, SubTask, ProposalInput, ResearchResult, Lead, LeadTriage,
  DealIntel, TranscriptExtraction, CopilotMutation,
} from '../types';

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

const postJSON = async <T>(url: string, body: unknown): Promise<T> => {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Request to ${url} failed`);
  return data as T;
};

/** Consume a server-sent event stream from a POST endpoint. */
const consumeSSE = async (
  url: string,
  body: unknown,
  onEvent: (event: any) => void,
): Promise<void> => {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok || !res.body) throw new Error(`Stream from ${url} failed`);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const frames = buffer.split('\n\n');
    buffer = frames.pop() || '';
    for (const frame of frames) {
      const line = frame.trim();
      if (!line.startsWith('data: ')) continue;
      try {
        onEvent(JSON.parse(line.slice(6)));
      } catch { /* skip malformed frame */ }
    }
  }
};

// ---------------------------------------------------------------------------
// Proposal pipeline (research → synthesis → SOW → audit → image)
// ---------------------------------------------------------------------------

export const performProposalResearch = (input: ProposalInput): Promise<ResearchResult> =>
  postJSON('/api/research', { input });

export const generateRobustProposal = (input: ProposalInput, research: ResearchResult): Promise<any> =>
  postJSON('/api/synthesize', { input, research });

export const generateSOW = async (input: ProposalInput, proposalData: any, previousCritique?: string): Promise<string> => {
  const data = await postJSON<{ sow: string }>('/api/sow', { input, proposalData, previousCritique });
  return data.sow;
};

export const reviewSOW = (sow: string): Promise<{ isSolid: boolean; critique: string }> =>
  postJSON('/api/review', { sow });

export const generateProposalImage = async (prompt: string): Promise<string> => {
  const data = await postJSON<{ url: string }>('/api/generate-image', { prompt });
  return data.url;
};

// ---------------------------------------------------------------------------
// Project intelligence (all real now)
// ---------------------------------------------------------------------------

export const generateProjectSummary = async (
  projectData: Partial<Project> & Pick<Project, 'title' | 'description' | 'subTasks'>,
): Promise<string> => {
  const data = await postJSON<{ summary: string }>('/api/project-summary', { project: projectData });
  return data.summary;
};

export const refineDescription = async (
  text: string,
  tone: 'professional' | 'concise' | 'enthusiastic',
): Promise<string> => {
  const data = await postJSON<{ text: string }>('/api/refine-description', { text, tone });
  return data.text;
};

export const suggestMissingTasks = async (
  title: string, description: string, currentTasks: SubTask[],
): Promise<Partial<SubTask>[]> => {
  const data = await postJSON<{ tasks: Partial<SubTask>[] }>('/api/suggest-tasks', {
    title, description,
    currentTasks: currentTasks.map(t => ({ task: t.task, category: t.category, status: t.status })),
  });
  return data.tasks || [];
};

export const parseSOWToTasks = async (sowText: string): Promise<Partial<SubTask>[]> => {
  const data = await postJSON<{ tasks: Partial<SubTask>[] }>('/api/parse-sow', { sowText });
  return data.tasks || [];
};

export const generateCompletionDocument = async (project: Project): Promise<string> => {
  const data = await postJSON<{ content: string }>('/api/generate-document', { kind: 'completion', project });
  return data.content;
};

export const generateInvoice = async (project: Project): Promise<string> => {
  const data = await postJSON<{ content: string }>('/api/generate-document', { kind: 'invoice', project });
  return data.content;
};

// ---------------------------------------------------------------------------
// Lead triage
// ---------------------------------------------------------------------------

export const triageLead = (lead: Lead, context: unknown): Promise<LeadTriage> =>
  postJSON('/api/triage-lead', { lead, context });

// ---------------------------------------------------------------------------
// Pipeline intelligence
// ---------------------------------------------------------------------------

export const fetchDealIntel = async (
  deals: { id: string; title: string; client: string; status: string; value: number; createdAt: string; notes: string; signed: boolean; paid: boolean }[],
): Promise<(DealIntel & { id: string })[]> => {
  const data = await postJSON<{ results: (DealIntel & { id: string })[] }>('/api/deal-intel', { deals });
  return data.results || [];
};

export const streamBriefing = (
  snapshot: unknown,
  onDelta: (delta: string) => void,
): Promise<void> =>
  consumeSSE('/api/briefing', { snapshot }, (event) => {
    if (event.type === 'text') onDelta(event.delta);
    if (event.type === 'error') throw new Error(event.message);
  });

// ---------------------------------------------------------------------------
// Transcript → CRM
// ---------------------------------------------------------------------------

export const extractTranscript = (transcript: string): Promise<TranscriptExtraction> =>
  postJSON('/api/transcript', { transcript });

// ---------------------------------------------------------------------------
// Copilot agent
// ---------------------------------------------------------------------------

export interface CopilotStreamHandlers {
  onText: (delta: string) => void;
  onToolCall: (id: string, tool: string, args: Record<string, unknown>) => void;
  onToolResult: (id: string, result: string) => void;
  onMutation: (mutation: CopilotMutation) => void;
  onError: (message: string) => void;
  onDone: () => void;
}

export const streamCopilot = (
  messages: { role: 'user' | 'assistant'; content: string }[],
  snapshot: unknown,
  handlers: CopilotStreamHandlers,
): Promise<void> =>
  consumeSSE('/api/copilot', { messages, snapshot }, (event) => {
    switch (event.type) {
      case 'text': handlers.onText(event.delta); break;
      case 'tool_call': handlers.onToolCall(event.id, event.tool, event.args); break;
      case 'tool_result': handlers.onToolResult(event.id, event.result); break;
      case 'mutation': handlers.onMutation(event.mutation as CopilotMutation); break;
      case 'error': handlers.onError(event.message); break;
      case 'done': handlers.onDone(); break;
    }
  });
