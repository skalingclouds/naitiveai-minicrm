import * as React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion } from 'motion/react';
import {
  Sunrise, RefreshCw, Loader2, Bot, User, HeartPulse,
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { cn } from '../lib/utils';
import { useWorkspace, buildWorkspaceSnapshot } from '../lib/store';
import { streamBriefing, fetchDealIntel } from '../services/geminiService';
import { DealIntel } from '../types';

// ---------------------------------------------------------------------------
// Daily briefing — streamed morning intelligence
// ---------------------------------------------------------------------------

export const BriefingCard = () => {
  const { state, dispatch } = useWorkspace();
  const [draft, setDraft] = React.useState('');
  const [streaming, setStreaming] = React.useState(false);

  const generate = async () => {
    if (streaming) return;
    setStreaming(true);
    setDraft('');
    let acc = '';
    try {
      await streamBriefing(buildWorkspaceSnapshot(state), (delta) => {
        acc += delta;
        setDraft(acc);
      });
      dispatch({ type: 'SET_BRIEFING', briefing: { content: acc, generatedAt: new Date().toISOString() } });
      dispatch({ type: 'ADD_ACTIVITY', entry: { actor: 'ai', kind: 'briefing', message: 'Generated the daily briefing.' } });
    } catch (e) {
      console.error('Briefing failed', e);
      const errorMessage = e instanceof Error ? e.message : String(e);
      dispatch({ type: 'ADD_ACTIVITY', entry: { actor: 'system', kind: 'error', message: `Failed to generate briefing: ${errorMessage}` } });
      setDraft('Failed to generate briefing');
    } finally {
      setStreaming(false);
    }
  };

  const content = streaming ? draft : state.briefing?.content;

  return (
    <div className="overflow-hidden rounded-xl border border-primary/25 bg-gradient-to-br from-primary/[0.07] to-transparent">
      <div className="flex items-center justify-between border-b border-primary/15 px-5 py-3">
        <span className="flex items-center gap-2 text-sm font-bold text-primary">
          <Sunrise className="h-4 w-4" />
          Daily Briefing
          {state.briefing && !streaming && (
            <span className="font-normal text-muted-foreground">
              · {new Date(state.briefing.generatedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
            </span>
          )}
        </span>
        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={generate} disabled={streaming}>
          {streaming
            ? <><Loader2 className="mr-1.5 h-3 w-3 animate-spin" /> Briefing…</>
            : <><RefreshCw className="mr-1.5 h-3 w-3" /> {state.briefing ? 'Refresh' : 'Generate'}</>}
        </Button>
      </div>
      <div className="px-5 py-4">
        {content ? (
          <div className={cn(
            'max-w-none text-sm leading-relaxed text-foreground/85',
            '[&_p]:my-1.5 [&_ul]:my-1.5 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-1.5 [&_ol]:list-decimal [&_ol]:pl-5',
            '[&_strong]:font-semibold [&_strong]:text-foreground',
            '[&_h2]:mt-3 [&_h2]:text-sm [&_h2]:font-bold [&_h3]:mt-2.5 [&_h3]:text-sm [&_h3]:font-bold',
            streaming && 'streaming-caret',
          )}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
          </div>
        ) : (
          <p className="py-2 text-sm text-muted-foreground">
            One click and the AI reads your whole pipeline — every deal, lead, task, and deadline — and tells you exactly
            where today's attention should go.
          </p>
        )}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Deal health badge + analyze action
// ---------------------------------------------------------------------------

export const HealthBadge = ({ intel, compact }: { intel: DealIntel; compact?: boolean }) => {
  const styles = {
    'Healthy': 'border-green-500/40 bg-green-500/10 text-green-500',
    'At Risk': 'border-amber-500/40 bg-amber-500/10 text-amber-500',
    'Critical': 'border-red-500/40 bg-red-500/10 text-red-500',
  }[intel.label];
  return (
    <Badge variant="outline" className={cn('gap-1 font-bold text-[10px]', styles)} title={intel.nextAction}>
      <HeartPulse className="h-2.5 w-2.5" />
      {compact ? intel.healthScore : `${intel.label} · ${intel.healthScore}`}
    </Badge>
  );
};

export const useAnalyzePipeline = () => {
  const { state, dispatch } = useWorkspace();
  const [analyzing, setAnalyzing] = React.useState(false);

  const analyze = async () => {
    const active = state.proposals.filter(p => p.status !== 'Won' && p.status !== 'Lost');
    if (active.length === 0 || analyzing) return;
    setAnalyzing(true);
    try {
      const results = await fetchDealIntel(active.map(p => ({
        id: p.id, title: p.title, client: p.client, status: p.status, value: p.value,
        createdAt: p.createdAt, notes: p.notes.slice(0, 400), signed: p.signed, paid: p.paid,
      })));
      for (const r of results) {
        const proposal = state.proposals.find(p => p.id === r.id);
        if (!proposal) continue;
        const { id, ...intel } = r;
        dispatch({ type: 'UPDATE_PROPOSAL', proposal: { ...proposal, intel: { ...intel, analyzedAt: new Date().toISOString() } } });
      }
      const critical = results.filter(r => r.label !== 'Healthy').length;
      dispatch({
        type: 'ADD_ACTIVITY',
        entry: { actor: 'ai', kind: 'deal', message: `Analyzed ${results.length} active deals — ${critical} need attention.` },
      });
    } catch (e) {
      console.error('Pipeline analysis failed', e);
    } finally {
      setAnalyzing(false);
    }
  };

  return { analyze, analyzing };
};

// ---------------------------------------------------------------------------
// Activity feed — the AI's visible paper trail
// ---------------------------------------------------------------------------

const timeAgo = (iso: string) => {
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
};

export const ActivityFeed = ({ limit = 12 }: { limit?: number }) => {
  const { state } = useWorkspace();
  const entries = state.activity.slice(0, limit);

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="border-b border-border px-4 py-3">
        <p className="text-sm font-bold">Activity</p>
        <p className="text-[11px] text-muted-foreground">Everything the AI does is logged here.</p>
      </div>
      <div className="thin-scrollbar max-h-[420px] space-y-0.5 overflow-y-auto p-2">
        {entries.map((entry, i) => (
          <motion.div
            key={entry.id}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: Math.min(i * 0.03, 0.3) }}
            className="flex items-start gap-2.5 rounded-lg px-2 py-2 hover:bg-muted/40"
          >
            <span className={cn(
              'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full',
              entry.actor === 'ai' ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground',
            )}>
              {entry.actor === 'ai' ? <Bot className="h-3 w-3" /> : <User className="h-3 w-3" />}
            </span>
            <div className="min-w-0">
              <p className="text-xs leading-snug text-foreground/85">{entry.message}</p>
              <p className="mt-0.5 text-[10px] text-muted-foreground">{timeAgo(entry.timestamp)}</p>
            </div>
          </motion.div>
        ))}
        {entries.length === 0 && (
          <p className="px-2 py-6 text-center text-xs text-muted-foreground">No activity yet.</p>
        )}
      </div>
    </div>
  );
};
