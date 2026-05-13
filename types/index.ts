
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
    phase: 'idle' | 'researching' | 'synthesizing' | 'reviewing' | 'completed';
    message: string;
}
