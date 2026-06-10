import * as React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Inbox as InboxIcon, Bot, Flame, Sun, Snowflake, Archive,
  ArrowRight, Copy, Check, Loader2, Mail, RotateCcw,
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { cn } from '../lib/utils';
import { useWorkspace, uid } from '../lib/store';
import { triageLead } from '../services/geminiService';
import { Lead, Proposal } from '../types';

const TIER_META = {
  Hot: { icon: Flame, className: 'bg-red-500/10 text-red-500 border-red-500/30' },
  Warm: { icon: Sun, className: 'bg-amber-500/10 text-amber-500 border-amber-500/30' },
  Cold: { icon: Snowflake, className: 'bg-sky-500/10 text-sky-400 border-sky-500/30' },
} as const;

const ScoreRing = ({ score }: { score: number }) => {
  const r = 18;
  const c = 2 * Math.PI * r;
  const color = score >= 70 ? 'text-red-500' : score >= 40 ? 'text-amber-500' : 'text-sky-400';
  return (
    <div className="relative h-12 w-12 shrink-0">
      <svg viewBox="0 0 44 44" className="h-12 w-12 -rotate-90">
        <circle cx="22" cy="22" r={r} fill="none" strokeWidth="4" className="stroke-muted" />
        <motion.circle
          cx="22" cy="22" r={r} fill="none" strokeWidth="4" strokeLinecap="round"
          className={cn('stroke-current', color)}
          initial={{ strokeDasharray: c, strokeDashoffset: c }}
          animate={{ strokeDashoffset: c - (c * score) / 100 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </svg>
      <span className={cn('absolute inset-0 flex items-center justify-center text-xs font-bold', color)}>
        {score}
      </span>
    </div>
  );
};

const timeAgo = (iso: string) => {
  const mins = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
};

interface InboxProps {
  onOpenProposal: (proposalId: string) => void;
}

export const Inbox = ({ onOpenProposal }: InboxProps) => {
  const { state, dispatch } = useWorkspace();
  const visible = state.leads.filter(l => l.status !== 'archived');
  const archived = state.leads.filter(l => l.status === 'archived');
  const [selectedId, setSelectedId] = React.useState<string | null>(visible[0]?.id ?? null);
  const [triaging, setTriaging] = React.useState<Set<string>>(new Set());
  const [copied, setCopied] = React.useState(false);
  const [showArchived, setShowArchived] = React.useState(false);

  const leads = showArchived ? state.leads : visible;
  const selected = state.leads.find(l => l.id === selectedId) ?? leads[0] ?? null;

  const runTriage = async (lead: Lead) => {
    if (triaging.has(lead.id)) return;
    setTriaging(prev => new Set(prev).add(lead.id));
    try {
      const triage = await triageLead(lead, {
        agency: 'NATIVE AI Consulting — AI strategy, agentic systems, LLM integrations. Typical engagements $15k–$120k.',
      });
      dispatch({
        type: 'UPDATE_LEAD',
        lead: { ...lead, status: lead.status === 'new' ? 'triaged' : lead.status, triage: { ...triage, triagedAt: new Date().toISOString() } },
      });
      dispatch({
        type: 'ADD_ACTIVITY',
        entry: { actor: 'ai', kind: 'triage', message: `Triaged lead from ${lead.company}: ${triage.tier} (${triage.score}/100), est. $${(triage.suggestedValue || 0).toLocaleString()}.` },
      });
    } catch (e) {
      console.error('Triage failed', e);
    } finally {
      setTriaging(prev => {
        const next = new Set(prev);
        next.delete(lead.id);
        return next;
      });
    }
  };

  const triageAll = () => {
    state.leads.filter(l => l.status === 'new' && !l.triage).forEach(runTriage);
  };

  const convertToDeal = (lead: Lead) => {
    if (!lead.triage) return;
    const proposal: Proposal = {
      id: uid(),
      client: lead.company,
      title: lead.triage.suggestedTitle || `AI Engagement — ${lead.company}`,
      status: 'Draft',
      value: lead.triage.suggestedValue || 25000,
      dateRange: { start: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }), end: 'TBD' },
      createdAt: new Date().toISOString(),
      notes: `Inbound from ${lead.fromName} (${lead.fromEmail}).\n\nOriginal email:\n${lead.body}\n\nAI triage: ${lead.triage.reasoning}`,
      description: lead.triage.reasoning,
      painPoints: lead.triage.painPoints,
      solution: '',
      documents: [],
      signed: false,
      paid: false,
    };
    dispatch({ type: 'CREATE_PROPOSAL', proposal });
    dispatch({ type: 'UPDATE_LEAD', lead: { ...lead, status: 'converted', linkedProposalId: proposal.id } });
    dispatch({
      type: 'ADD_ACTIVITY',
      entry: { actor: 'ai', kind: 'deal', message: `Converted ${lead.company} lead into deal "${proposal.title}" ($${proposal.value.toLocaleString()}).` },
    });
    onOpenProposal(proposal.id);
  };

  const copyReply = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const newCount = state.leads.filter(l => l.status === 'new' && !l.triage).length;

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
            <InboxIcon className="h-8 w-8 text-primary" />
            Lead Inbox
          </h1>
          <p className="mt-1 text-muted-foreground">
            Inbound emails, scored and answered by AI before you finish your coffee.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => setShowArchived(s => !s)}>
            <Archive className="mr-1.5 h-3.5 w-3.5" />
            {showArchived ? 'Hide archived' : `Archived (${archived.length})`}
          </Button>
          <Button onClick={triageAll} disabled={newCount === 0 || triaging.size > 0}>
            {triaging.size > 0
              ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Triaging {triaging.size}…</>
              : <><Bot className="mr-2 h-4 w-4" /> Triage all new ({newCount})</>}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[360px_1fr]">
        {/* Lead list */}
        <div className="space-y-2">
          {leads.map(lead => {
            const isBusy = triaging.has(lead.id);
            const tier = lead.triage?.tier;
            const TierIcon = tier ? TIER_META[tier].icon : Mail;
            return (
              <button
                key={lead.id}
                onClick={() => setSelectedId(lead.id)}
                className={cn(
                  'w-full rounded-lg border p-3.5 text-left transition-all',
                  selected?.id === lead.id
                    ? 'border-primary/50 bg-primary/5 shadow-sm'
                    : 'border-border/60 bg-card hover:border-border hover:bg-muted/30',
                  lead.status === 'archived' && 'opacity-50',
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-semibold">{lead.fromName} · {lead.company}</span>
                  <span className="shrink-0 text-[10px] text-muted-foreground">{timeAgo(lead.receivedAt)}</span>
                </div>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">{lead.subject}</p>
                <div className="mt-2 flex items-center gap-1.5">
                  {isBusy ? (
                    <Badge variant="outline" className="gap-1 border-primary/40 text-[10px] text-primary">
                      <Loader2 className="h-2.5 w-2.5 animate-spin" /> AI scoring…
                    </Badge>
                  ) : lead.triage ? (
                    <Badge variant="outline" className={cn('gap-1 text-[10px] font-bold', TIER_META[lead.triage.tier].className)}>
                      <TierIcon className="h-2.5 w-2.5" /> {lead.triage.tier} · {lead.triage.score}
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-[10px]">New</Badge>
                  )}
                  {lead.status === 'converted' && (
                    <Badge variant="outline" className="border-green-500/40 text-[10px] text-green-500">Converted</Badge>
                  )}
                  {lead.status === 'archived' && (
                    <Badge variant="outline" className="text-[10px]">Archived</Badge>
                  )}
                </div>
              </button>
            );
          })}
          {leads.length === 0 && (
            <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
              Inbox zero. Nice.
            </div>
          )}
        </div>

        {/* Detail pane */}
        {selected ? (
          <div className="space-y-4">
            {/* Email */}
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold leading-snug">{selected.subject}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">{selected.fromName}</span> &lt;{selected.fromEmail}&gt; · {selected.company}
                  </p>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">{timeAgo(selected.receivedAt)}</span>
              </div>
              <div className="mt-4 whitespace-pre-wrap border-t border-border/60 pt-4 text-sm leading-relaxed text-foreground/85">
                {selected.body}
              </div>
            </div>

            {/* Triage results */}
            <AnimatePresence mode="wait">
              {triaging.has(selected.id) ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="space-y-3 rounded-xl border border-primary/20 bg-primary/5 p-5"
                >
                  <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                    <Bot className="h-4 w-4 animate-pulse" /> Gemini is reading this email…
                  </div>
                  <div className="ai-shimmer h-3.5 w-3/4 rounded" />
                  <div className="ai-shimmer h-3.5 w-1/2 rounded" />
                  <div className="ai-shimmer h-3.5 w-2/3 rounded" />
                </motion.div>
              ) : selected.triage ? (
                <motion.div
                  key="triage"
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className="overflow-hidden rounded-xl border border-primary/25"
                >
                  <div className="flex items-center justify-between border-b border-primary/20 bg-primary/5 px-5 py-3">
                    <span className="flex items-center gap-2 text-sm font-bold text-primary">
                      <Bot className="h-4 w-4" /> AI Triage
                    </span>
                    <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground" onClick={() => runTriage(selected)}>
                      <RotateCcw className="mr-1 h-3 w-3" /> Re-run
                    </Button>
                  </div>
                  <div className="space-y-4 bg-card p-5">
                    <div className="flex flex-wrap items-center gap-4">
                      <ScoreRing score={selected.triage.score} />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline" className={cn('font-bold', TIER_META[selected.triage.tier].className)}>
                            {selected.triage.tier} lead
                          </Badge>
                          <Badge variant="outline" className="font-mono">
                            est. ${selected.triage.suggestedValue.toLocaleString()}
                          </Badge>
                        </div>
                        <p className="mt-1.5 text-sm leading-relaxed text-foreground/80">{selected.triage.reasoning}</p>
                      </div>
                    </div>

                    {selected.triage.painPoints.length > 0 && (
                      <div>
                        <p className="mb-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">Detected pain points</p>
                        <div className="flex flex-wrap gap-1.5">
                          {selected.triage.painPoints.map((p, i) => (
                            <Badge key={i} variant="secondary" className="font-normal">{p}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <div className="mb-1.5 flex items-center justify-between">
                        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Draft reply — ready to send</p>
                        <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => copyReply(selected.triage!.draftReply)}>
                          {copied ? <Check className="mr-1 h-3 w-3 text-green-500" /> : <Copy className="mr-1 h-3 w-3" />}
                          {copied ? 'Copied' : 'Copy'}
                        </Button>
                      </div>
                      <div className="whitespace-pre-wrap rounded-lg border border-border/60 bg-muted/30 p-3.5 text-sm leading-relaxed text-foreground/85">
                        {selected.triage.draftReply}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-1">
                      {selected.status !== 'converted' ? (
                        <Button onClick={() => convertToDeal(selected)}>
                          Convert to deal · ${selected.triage.suggestedValue.toLocaleString()}
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      ) : selected.linkedProposalId && (
                        <Button variant="outline" onClick={() => onOpenProposal(selected.linkedProposalId!)}>
                          View deal <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      )}
                      {selected.status !== 'archived' && (
                        <Button
                          variant="ghost"
                          className="text-muted-foreground"
                          onClick={() => dispatch({ type: 'UPDATE_LEAD', lead: { ...selected, status: 'archived' } })}
                        >
                          <Archive className="mr-2 h-4 w-4" /> Archive
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="untriaged"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border p-8 text-center"
                >
                  <p className="text-sm text-muted-foreground">
                    This lead hasn't been scored yet. Let the AI read it, score the fit, extract pain points, and draft your reply.
                  </p>
                  <Button onClick={() => runTriage(selected)}>
                    <Bot className="mr-2 h-4 w-4" /> Triage with AI
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <div className="flex items-center justify-center rounded-xl border border-dashed p-16 text-sm text-muted-foreground">
            Select a lead to review it.
          </div>
        )}
      </div>
    </div>
  );
};
