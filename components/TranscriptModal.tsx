import * as React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  X, AudioLines, Bot, Loader2, Copy, Check, ListPlus,
  Smile, Meh, Frown, FileDown,
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { cn } from '../lib/utils';
import { useWorkspace } from '../lib/store';
import { SAMPLE_TRANSCRIPT } from '../lib/seedData';
import { extractTranscript } from '../services/geminiService';
import { TranscriptExtraction, SubTask } from '../types';

const SENTIMENT_META = {
  Positive: { icon: Smile, className: 'border-green-500/40 bg-green-500/10 text-green-500' },
  Neutral: { icon: Meh, className: 'border-sky-500/40 bg-sky-500/10 text-sky-400' },
  Concerned: { icon: Frown, className: 'border-amber-500/40 bg-amber-500/10 text-amber-500' },
} as const;

export const TranscriptModal = ({ onClose }: { onClose: () => void }) => {
  const { state, dispatch } = useWorkspace();
  const [transcript, setTranscript] = React.useState('');
  const [extraction, setExtraction] = React.useState<TranscriptExtraction | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [targetProjectId, setTargetProjectId] = React.useState(state.projects[0]?.id ?? '');
  const [tasksApplied, setTasksApplied] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  const run = async () => {
    if (!transcript.trim() || busy) return;
    setBusy(true);
    setExtraction(null);
    setTasksApplied(false);
    try {
      const result = await extractTranscript(transcript);
      setExtraction(result);
      dispatch({
        type: 'ADD_ACTIVITY',
        entry: { actor: 'ai', kind: 'transcript', message: `Processed a meeting transcript — ${result.actionItems.length} action items extracted.` },
      });
    } catch (e) {
      console.error('Transcript extraction failed', e);
      alert('Extraction failed. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const applyTasks = () => {
    if (!extraction || !targetProjectId || tasksApplied) return;
    const project = state.projects.find(p => p.id === targetProjectId);
    if (!project) return;
    const baseId = Math.max(0, ...project.subTasks.map(t => t.id));
    const newTasks: SubTask[] = extraction.actionItems.map((item, i) => ({
      id: baseId + i + 1,
      task: item.task,
      category: item.category || 'Meeting Follow-up',
      status: 'Pending',
      dueDate: item.dueDate || new Date().toISOString().split('T')[0],
      dependsOn: [],
    }));
    dispatch({ type: 'UPDATE_PROJECT', project: { ...project, subTasks: [...project.subTasks, ...newTasks] } });
    dispatch({
      type: 'ADD_ACTIVITY',
      entry: { actor: 'ai', kind: 'transcript', message: `Added ${newTasks.length} tasks from meeting notes to "${project.title}".` },
    });
    setTasksApplied(true);
  };

  const copyEmail = async () => {
    if (!extraction) return;
    await navigator.clipboard.writeText(extraction.followUpEmail);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const Sentiment = extraction ? SENTIMENT_META[extraction.sentiment] : null;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-start justify-center bg-black/60 p-4 pt-[6vh] backdrop-blur-sm animate-in fade-in duration-150"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-border bg-popover shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <AudioLines className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-bold leading-none">Meeting → CRM</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">Paste a call transcript. AI turns it into tasks, stage moves, and a follow-up email.</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="thin-scrollbar flex-1 space-y-4 overflow-y-auto p-5">
          {/* Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Transcript</label>
              <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-primary" onClick={() => setTranscript(SAMPLE_TRANSCRIPT)}>
                <FileDown className="mr-1 h-3 w-3" /> Load sample call
              </Button>
            </div>
            <textarea
              value={transcript}
              onChange={e => setTranscript(e.target.value)}
              rows={extraction ? 4 : 10}
              placeholder="Paste your meeting notes or call transcript here…"
              className="thin-scrollbar w-full resize-none rounded-lg border border-input bg-background p-3 text-sm leading-relaxed placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none"
            />
            <Button onClick={run} disabled={busy || !transcript.trim()} className="w-full">
              {busy
                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Reading the room…</>
                : <><Bot className="mr-2 h-4 w-4" /> Extract with AI</>}
            </Button>
          </div>

          {/* Results */}
          <AnimatePresence>
            {extraction && Sentiment && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                {/* Summary + sentiment */}
                <div className="rounded-xl border border-primary/25 bg-primary/5 p-4">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className={cn('gap-1 font-bold', Sentiment.className)}>
                      <Sentiment.icon className="h-3 w-3" /> {extraction.sentiment}
                    </Badge>
                    {extraction.suggestedStage && (
                      <Badge variant="outline" className="font-bold">Suggested deal stage: {extraction.suggestedStage}</Badge>
                    )}
                  </div>
                  <p className="text-sm leading-relaxed text-foreground/85">{extraction.summary}</p>
                  {extraction.decisions.length > 0 && (
                    <ul className="mt-3 space-y-1">
                      {extraction.decisions.map((d, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-foreground/80">
                          <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-500" /> {d}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Action items */}
                <div className="rounded-xl border border-border bg-card p-4">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Action items ({extraction.actionItems.length})
                    </p>
                    <div className="flex items-center gap-2">
                      <select
                        value={targetProjectId}
                        onChange={e => setTargetProjectId(e.target.value)}
                        className="h-7 rounded-md border border-input bg-background px-2 text-xs focus:outline-none"
                      >
                        {state.projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                      </select>
                      <Button size="sm" className="h-7 text-xs" onClick={applyTasks} disabled={tasksApplied || !targetProjectId}>
                        {tasksApplied
                          ? <><Check className="mr-1 h-3 w-3" /> Added</>
                          : <><ListPlus className="mr-1 h-3 w-3" /> Add as tasks</>}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    {extraction.actionItems.map((item, i) => (
                      <div key={i} className="flex items-center justify-between gap-3 rounded-lg bg-muted/40 px-3 py-2 text-sm">
                        <span className="text-foreground/85">{item.task}</span>
                        <span className="shrink-0 text-[10px] font-semibold text-muted-foreground">
                          {item.category} · {item.dueDate}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Follow-up email */}
                <div className="rounded-xl border border-border bg-card p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Follow-up email — ready to send</p>
                    <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={copyEmail}>
                      {copied ? <Check className="mr-1 h-3 w-3 text-green-500" /> : <Copy className="mr-1 h-3 w-3" />}
                      {copied ? 'Copied' : 'Copy'}
                    </Button>
                  </div>
                  <div className="whitespace-pre-wrap rounded-lg bg-muted/30 p-3.5 text-sm leading-relaxed text-foreground/85">
                    {extraction.followUpEmail}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
