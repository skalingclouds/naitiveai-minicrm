import * as React from 'react';
import {
  Project, Proposal, Lead, Contact, ActivityEntry, CopilotMutation, Stage,
} from '../types';
import {
  SEED_PROJECTS, SEED_PROPOSALS, SEED_LEADS, SEED_CONTACTS, SEED_ACTIVITY,
} from './seedData';

const STORAGE_KEY = 'naitive-connect-workspace-v1';

export interface Briefing {
  content: string;
  generatedAt: string;
}

export interface WorkspaceState {
  projects: Project[];
  proposals: Proposal[];
  leads: Lead[];
  contacts: Contact[];
  activity: ActivityEntry[];
  briefing: Briefing | null;
}

const seedState = (): WorkspaceState => ({
  projects: SEED_PROJECTS,
  proposals: SEED_PROPOSALS,
  leads: SEED_LEADS,
  contacts: SEED_CONTACTS,
  activity: SEED_ACTIVITY,
  briefing: null,
});

type Action =
  | { type: 'CREATE_PROJECT'; project: Project }
  | { type: 'UPDATE_PROJECT'; project: Project }
  | { type: 'DELETE_PROJECT'; projectId: string }
  | { type: 'CREATE_PROPOSAL'; proposal: Proposal }
  | { type: 'UPDATE_PROPOSAL'; proposal: Proposal }
  | { type: 'DELETE_PROPOSAL'; proposalId: string }
  | { type: 'UPDATE_LEAD'; lead: Lead }
  | { type: 'ADD_ACTIVITY'; entry: Omit<ActivityEntry, 'id' | 'timestamp'> }
  | { type: 'SET_BRIEFING'; briefing: Briefing }
  | { type: 'APPLY_MUTATION'; mutation: CopilotMutation }
  | { type: 'RESET' };

export const uid = () => Math.random().toString(36).slice(2, 10);

function withActivity(state: WorkspaceState, entry: Omit<ActivityEntry, 'id' | 'timestamp'>): WorkspaceState {
  return {
    ...state,
    activity: [
      { ...entry, id: uid(), timestamp: new Date().toISOString() },
      ...state.activity,
    ].slice(0, 50),
  };
}

function applyMutation(state: WorkspaceState, m: CopilotMutation): WorkspaceState {
  switch (m.type) {
    case 'create_task': {
      const projects = state.projects.map(p => {
        if (p.id !== m.projectId) return p;
        const nextId = Math.max(0, ...p.subTasks.map(t => t.id)) + 1;
        return {
          ...p,
          subTasks: [...p.subTasks, {
            id: nextId, task: m.task, category: m.category || 'General',
            status: 'Pending' as const, dueDate: m.dueDate, dependsOn: [],
          }],
        };
      });
      return withActivity({ ...state, projects }, {
        actor: 'ai', kind: 'copilot',
        message: `Copilot created task "${m.task}" on ${state.projects.find(p => p.id === m.projectId)?.title ?? 'project'}.`,
      });
    }
    case 'update_task_status': {
      const projects = state.projects.map(p => p.id !== m.projectId ? p : {
        ...p,
        subTasks: p.subTasks.map(t => t.id === m.taskId ? { ...t, status: m.status } : t),
      });
      return withActivity({ ...state, projects }, {
        actor: 'ai', kind: 'copilot',
        message: `Copilot set task #${m.taskId} to ${m.status} on ${state.projects.find(p => p.id === m.projectId)?.title ?? 'project'}.`,
      });
    }
    case 'update_project_stage': {
      const projects = state.projects.map(p => p.id === m.projectId ? { ...p, status: m.stage as Stage } : p);
      return withActivity({ ...state, projects }, {
        actor: 'ai', kind: 'copilot',
        message: `Copilot moved ${state.projects.find(p => p.id === m.projectId)?.title ?? 'project'} to ${m.stage}.`,
      });
    }
    case 'update_proposal_status': {
      const proposals = state.proposals.map(p => p.id === m.proposalId ? { ...p, status: m.status } : p);
      return withActivity({ ...state, proposals }, {
        actor: 'ai', kind: 'copilot',
        message: `Copilot set deal "${state.proposals.find(p => p.id === m.proposalId)?.title ?? 'deal'}" to ${m.status}.`,
      });
    }
    case 'create_project': {
      const project: Project = {
        id: uid(),
        title: m.title,
        client: m.client,
        status: 'Kickoff',
        completionPercentage: 0,
        value: m.value,
        breadcrumbs: [{ label: 'Client Projects', href: '#' }, { label: m.title, href: '#' }],
        assignees: [],
        dateRange: { start: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }), end: 'TBD' },
        tags: [],
        description: m.description,
        attachments: [],
        subTasks: [],
      };
      return withActivity({ ...state, projects: [...state.projects, project] }, {
        actor: 'ai', kind: 'copilot',
        message: `Copilot created project "${m.title}" for ${m.client}.`,
      });
    }
    case 'archive_lead': {
      const leads = state.leads.map(l => l.id === m.leadId ? { ...l, status: 'archived' as const } : l);
      return withActivity({ ...state, leads }, {
        actor: 'ai', kind: 'copilot',
        message: `Copilot archived lead from ${state.leads.find(l => l.id === m.leadId)?.company ?? 'unknown'}.`,
      });
    }
    default:
      return state;
  }
}

function reducer(state: WorkspaceState, action: Action): WorkspaceState {
  switch (action.type) {
    case 'CREATE_PROJECT':
      return { ...state, projects: [...state.projects, action.project] };
    case 'UPDATE_PROJECT':
      return { ...state, projects: state.projects.map(p => p.id === action.project.id ? action.project : p) };
    case 'DELETE_PROJECT':
      return { ...state, projects: state.projects.filter(p => p.id !== action.projectId) };
    case 'CREATE_PROPOSAL':
      return { ...state, proposals: [...state.proposals, action.proposal] };
    case 'UPDATE_PROPOSAL':
      return { ...state, proposals: state.proposals.map(p => p.id === action.proposal.id ? action.proposal : p) };
    case 'DELETE_PROPOSAL':
      return { ...state, proposals: state.proposals.filter(p => p.id !== action.proposalId) };
    case 'UPDATE_LEAD':
      return { ...state, leads: state.leads.map(l => l.id === action.lead.id ? action.lead : l) };
    case 'ADD_ACTIVITY':
      return withActivity(state, action.entry);
    case 'SET_BRIEFING':
      return { ...state, briefing: action.briefing };
    case 'APPLY_MUTATION':
      return applyMutation(state, action.mutation);
    case 'RESET':
      return seedState();
    default:
      return state;
  }
}

function loadInitial(): WorkspaceState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.projects)) return parsed as WorkspaceState;
    }
  } catch { /* corrupted storage falls through to seed */ }
  return seedState();
}

interface WorkspaceContextValue {
  state: WorkspaceState;
  dispatch: React.Dispatch<Action>;
}

const WorkspaceContext = React.createContext<WorkspaceContextValue | null>(null);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = React.useReducer(reducer, undefined, loadInitial);

  React.useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch { /* storage full — demo data is regenerable */ }
  }, [state]);

  const value = React.useMemo(() => ({ state, dispatch }), [state]);
  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace(): WorkspaceContextValue {
  const ctx = React.useContext(WorkspaceContext);
  if (!ctx) throw new Error('useWorkspace must be used within WorkspaceProvider');
  return ctx;
}

/**
 * Compact workspace snapshot for the copilot agent — strips heavy markdown
 * bodies and images so the prompt stays small.
 */
export function buildWorkspaceSnapshot(state: WorkspaceState) {
  return {
    today: new Date().toISOString().split('T')[0],
    projects: state.projects.map(p => ({
      id: p.id, title: p.title, client: p.client, stage: p.status, value: p.value,
      dateRange: p.dateRange,
      tasks: p.subTasks.map(t => ({ id: t.id, task: t.task, category: t.category, status: t.status, dueDate: t.dueDate })),
      description: p.description.slice(0, 300),
    })),
    deals: state.proposals.map(p => ({
      id: p.id, title: p.title, client: p.client, status: p.status, value: p.value,
      createdAt: p.createdAt, signed: p.signed, paid: p.paid,
      notes: p.notes.slice(0, 300),
      health: p.intel ? { score: p.intel.healthScore, label: p.intel.label, risks: p.intel.risks, nextAction: p.intel.nextAction } : null,
    })),
    leads: state.leads.map(l => ({
      id: l.id, from: l.fromName, company: l.company, subject: l.subject,
      receivedAt: l.receivedAt, status: l.status,
      triage: l.triage ? { score: l.triage.score, tier: l.triage.tier, suggestedValue: l.triage.suggestedValue } : null,
    })),
    contacts: state.contacts.map(c => ({
      id: c.id, name: c.name, title: c.title, company: c.company, email: c.email, lastTouch: c.lastTouch, notes: c.notes,
    })),
    recentActivity: state.activity.slice(0, 10).map(a => ({ at: a.timestamp, actor: a.actor, message: a.message })),
  };
}
