
// Type Definitions for Props

export type Stage = 'Kickoff' | 'In-Progress' | 'Completed' | 'Signed' | 'Paid';

export type Assignee = {
  name: string;
  avatarUrl?: string; // Optional to support default avatars
  email?: string; // Added for the freeform assignee feature
};

export type ProjectTag = {
  label: string;
  variant: "default" | "secondary" | "destructive" | "outline";
};

export type Attachment = {
  id: string;
  name: string;
  size: string;
  type: "pdf" | "figma" | "image" | "contract" | "invoice" | "other";
  url?: string;
  isUserUploaded?: boolean; // Track ownership for deletion permissions
  dateAdded?: string;
};

export type SubTask = {
  id: number;
  task: string;
  category: string;
  status: "Completed" | "In Progress" | "Pending";
  dueDate: string;
  dependsOn?: number[]; // Array of Task IDs that must be completed before this task can start
};

export type ProposalStage = 'Draft' | 'Sent' | 'In Review' | 'Won' | 'Lost';

export interface Proposal {
  id: string;
  client: string;
  title: string;
  status: ProposalStage;
  value: number;
  dateRange: { start: string; end: string };
  createdAt: string;
  notes: string;
  
  // Generated fields
  description: string;
  painPoints: string[];
  solution: string;
  architectureMermaid?: string;
  aiArchitectureImageUrl?: string;
  aiArchitectureImagePrompt?: string;
  sowContent?: string;
  documents: Attachment[];

  // AI pipeline intelligence (populated by deal analysis)
  intel?: DealIntel;

  // Status flags
  signed: boolean;
  paid: boolean;
}

export type Project = {
  id: string;
  title: string;
  client: string;
  status: Stage; // The 5-stage lifecycle
  completionPercentage: number; // Derived from tasks
  value: number; // Project value for billing
  breadcrumbs: { label: string; href: string }[];
  assignees: Assignee[];
  dateRange: {
    start: string;
    end: string;
  };
  tags: ProjectTag[];
  description: string;
  attachments: Attachment[];
  subTasks: SubTask[];
};

export type ProjectDetailViewProps = Project & {
  onBack: () => void;
  onUpdate: (updatedProject: Project) => void;
};

export interface ProposalInput {
    notes: string;
    budget: number;
    startDate: string;
    estimatedWeeks: number;
    clientName: string;
    projectTitle: string;
}

export interface ResearchResult {
    content: string;
    sources: { title: string; uri: string }[];
}

export interface AgentStatus {
    phase: 'idle' | 'researching' | 'synthesizing' | 'reviewing' | 'generating-image' | 'completed';
    message: string;
}

// ---------------------------------------------------------------------------
// AI-native CRM additions
// ---------------------------------------------------------------------------

/** A person at a client/prospect company. */
export interface Contact {
  id: string;
  name: string;
  title: string;
  company: string;
  email: string;
  avatarUrl?: string;
  lastTouch?: string; // ISO date of last interaction
  notes?: string;
}

export type LeadStatus = 'new' | 'triaged' | 'converted' | 'archived';

/** AI triage output attached to an inbound lead. */
export interface LeadTriage {
  score: number;            // 0-100 fit/intent score
  tier: 'Hot' | 'Warm' | 'Cold';
  reasoning: string;        // why the score
  painPoints: string[];
  suggestedValue: number;   // estimated deal value in USD
  suggestedTitle: string;   // proposed project title
  draftReply: string;       // personalized reply, ready to send
  triagedAt: string;
}

/** An inbound email sitting in the agency inbox. */
export interface Lead {
  id: string;
  fromName: string;
  fromEmail: string;
  company: string;
  subject: string;
  body: string;
  receivedAt: string;       // ISO
  status: LeadStatus;
  triage?: LeadTriage;
  linkedProposalId?: string;
}

/** AI health analysis attached to a deal/proposal. */
export interface DealIntel {
  healthScore: number;      // 0-100
  label: 'Healthy' | 'At Risk' | 'Critical';
  risks: string[];
  nextAction: string;
  analyzedAt: string;
}

/** A single entry in the workspace activity feed. */
export interface ActivityEntry {
  id: string;
  timestamp: string;        // ISO
  actor: 'ai' | 'user';
  kind: 'triage' | 'copilot' | 'briefing' | 'transcript' | 'proposal' | 'project' | 'deal' | 'system';
  message: string;
}

// --- Copilot agent protocol -------------------------------------------------

/** A tool invocation surfaced by the copilot agent. */
export interface ToolCallEvent {
  id: string;
  tool: string;
  args: Record<string, unknown>;
  status: 'running' | 'done' | 'error';
  result?: string;
}

export interface CopilotMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  toolCalls?: ToolCallEvent[];
  streaming?: boolean;
}

/** A state mutation the copilot agent asks the client to apply. */
export type CopilotMutation =
  | { type: 'create_task'; projectId: string; task: string; category: string; dueDate: string }
  | { type: 'update_task_status'; projectId: string; taskId: number; status: SubTask['status'] }
  | { type: 'update_project_stage'; projectId: string; stage: Stage }
  | { type: 'update_proposal_status'; proposalId: string; status: ProposalStage }
  | { type: 'create_project'; title: string; client: string; value: number; description: string }
  | { type: 'archive_lead'; leadId: string };

/** Transcript extraction result. */
export interface TranscriptExtraction {
  summary: string;
  decisions: string[];
  actionItems: { task: string; category: string; dueDate: string }[];
  sentiment: 'Positive' | 'Neutral' | 'Concerned';
  suggestedStage?: ProposalStage;
  followUpEmail: string;
}
