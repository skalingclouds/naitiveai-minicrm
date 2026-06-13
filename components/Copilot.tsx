import * as React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { AnimatePresence, motion } from 'motion/react';
import {
  Bot, Send, X, Wrench, Check, CircleAlert, Command,
  ListPlus, RefreshCw, FolderPlus, Archive, TrendingUp, SquareCheckBig,
} from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '../lib/utils';
import { useWorkspace, buildWorkspaceSnapshot, uid } from '../lib/store';
import { streamCopilot } from '../services/geminiService';
import { CopilotMessage, CopilotMutation, ToolCallEvent } from '../types';

const TOOL_META: Record<string, { label: string; icon: React.ElementType }> = {
  create_task: { label: 'Creating task', icon: ListPlus },
  update_task_status: { label: 'Updating task status', icon: SquareCheckBig },
  update_project_stage: { label: 'Moving project stage', icon: RefreshCw },
  update_proposal_status: { label: 'Updating deal status', icon: TrendingUp },
  create_project: { label: 'Creating project', icon: FolderPlus },
  archive_lead: { label: 'Archiving lead', icon: Archive },
};

const SUGGESTIONS = [
  'Which deals are at risk and what should I do about each?',
  'Create a task on the Solace Health project to schedule the security review, due this Friday',
  'Draft a follow-up email to the Nordwind Travel CEO',
  'Archive the spam lead in my inbox',
  "What's my total pipeline value vs revenue collected?",
];

const ToolCallChip = ({ call }: { call: ToolCallEvent }) => {
  const meta = TOOL_META[call.tool] || { label: call.tool, icon: Wrench };
  const Icon = meta.icon;
  const argPreview = Object.entries(call.args)
    .filter(([k]) => !k.endsWith('Id'))
    .map(([, v]) => String(v))
    .join(' · ')
    .slice(0, 90);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="flex items-center gap-2.5 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-xs"
    >
      <span className={cn(
        'flex h-6 w-6 shrink-0 items-center justify-center rounded-md',
        call.status === 'done' ? 'bg-green-500/15 text-green-500' : 'bg-primary/10 text-primary',
      )}>
        {call.status === 'done' ? <Check className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5 animate-pulse" />}
      </span>
      <div className="min-w-0">
        <p className="font-semibold text-foreground">{meta.label}</p>
        {argPreview && <p className="truncate text-muted-foreground">{argPreview}</p>}
      </div>
      <span className="ml-auto shrink-0 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        {call.status === 'done' ? 'applied' : 'running'}
      </span>
    </motion.div>
  );
};

const MarkdownBody = ({ content, streaming }: { content: string; streaming?: boolean }) => (
  <div className={cn(
    'prose-sm max-w-none text-sm leading-relaxed text-foreground/90',
    '[&_p]:my-1.5 [&_ul]:my-1.5 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-1.5 [&_ol]:list-decimal [&_ol]:pl-5',
    '[&_strong]:font-semibold [&_strong]:text-foreground [&_h1]:text-base [&_h2]:text-base [&_h3]:text-sm',
    '[&_h1]:font-bold [&_h2]:font-bold [&_h3]:font-semibold [&_h1]:mt-3 [&_h2]:mt-3 [&_h3]:mt-2',
    '[&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-xs',
    '[&_table]:w-full [&_table]:text-xs [&_th]:border [&_th]:border-border [&_th]:p-1.5 [&_td]:border [&_td]:border-border [&_td]:p-1.5',
    streaming && 'streaming-caret',
  )}>
    <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
  </div>
);

export const Copilot = () => {
  const { state, dispatch } = useWorkspace();
  const [open, setOpen] = React.useState(false);
  const [input, setInput] = React.useState('');
  const [messages, setMessages] = React.useState<CopilotMessage[]>([]);
  const [busy, setBusy] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLTextAreaElement>(null);

  // Keep latest state in a ref so the snapshot reflects live mutations.
  const stateRef = React.useRef(state);
  stateRef.current = state;

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen(o => !o);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  React.useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || busy) return;

    const userMsg: CopilotMessage = { id: uid(), role: 'user', content: trimmed };
    const assistantId = uid();
    const history = [...messages, userMsg];

    setMessages([...history, { id: assistantId, role: 'assistant', content: '', toolCalls: [], streaming: true }]);
    setInput('');
    setBusy(true);

    const patchAssistant = (fn: (m: CopilotMessage) => CopilotMessage) =>
      setMessages(prev => prev.map(m => (m.id === assistantId ? fn(m) : m)));

    try {
      await streamCopilot(
        history.map(m => ({ role: m.role, content: m.content })),
        buildWorkspaceSnapshot(stateRef.current),
        {
          onText: (delta) => patchAssistant(m => ({ ...m, content: m.content + delta })),
          onToolCall: (id, tool, args) => patchAssistant(m => ({
            ...m,
            toolCalls: [...(m.toolCalls || []), { id, tool, args, status: 'running' }],
          })),
          onToolResult: (id, result) => patchAssistant(m => ({
            ...m,
            toolCalls: (m.toolCalls || []).map(tc => tc.id === id ? { ...tc, status: 'done' as const, result } : tc),
          })),
          onMutation: (mutation: CopilotMutation) => dispatch({ type: 'APPLY_MUTATION', mutation }),
          onError: (message) => patchAssistant(m => ({
            ...m,
            content: m.content + `\n\n⚠️ ${message}`,
          })),
          onDone: () => patchAssistant(m => ({ ...m, streaming: false })),
        },
      );
    } catch (e: any) {
      patchAssistant(m => ({ ...m, content: m.content || `⚠️ ${e.message || 'Copilot request failed.'}`, streaming: false }));
    } finally {
      patchAssistant(m => ({ ...m, streaming: false }));
      setBusy(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  return (
    <>
      {/* Header trigger */}
      <button
        onClick={() => setOpen(true)}
        className="group flex h-9 items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-3.5 text-sm font-medium text-primary transition-all hover:border-primary/60 hover:bg-primary/10"
      >
        <Bot className="h-4 w-4" />
        <span className="hidden sm:inline">Copilot</span>
        <kbd className="hidden items-center gap-0.5 rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:flex">
          <Command className="h-2.5 w-2.5" />K
        </kbd>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[100] flex items-start justify-center bg-black/60 p-4 pt-[8vh] backdrop-blur-sm"
            onClick={(e) => e.target === e.currentTarget && setOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="flex max-h-[78vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-border bg-popover shadow-2xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <Bot className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-sm font-bold leading-none">NATIVE Copilot</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">Reads your workspace · executes changes · shows its work</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {messages.length > 0 && (
                    <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground" onClick={() => setMessages([])}>
                      Clear
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setOpen(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Thread */}
              <div ref={scrollRef} className="thin-scrollbar flex-1 space-y-4 overflow-y-auto px-4 py-4">
                {messages.length === 0 && (
                  <div className="space-y-3 py-6">
                    <p className="text-center text-sm text-muted-foreground">
                      Ask anything about your pipeline — or tell me to do something.
                    </p>
                    <div className="space-y-1.5">
                      {SUGGESTIONS.map(s => (
                        <button
                          key={s}
                          onClick={() => send(s)}
                          className="block w-full rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-left text-xs text-foreground/80 transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-foreground"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {messages.map(m => (
                  <div key={m.id} className={cn('flex flex-col gap-2', m.role === 'user' && 'items-end')}>
                    {m.role === 'user' ? (
                      <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-3.5 py-2 text-sm text-primary-foreground">
                        {m.content}
                      </div>
                    ) : (
                      <div className="w-full space-y-2">
                        {(m.toolCalls || []).map(tc => <ToolCallChip key={tc.id} call={tc} />)}
                        {(m.content || m.streaming) && (
                          m.content
                            ? <MarkdownBody content={m.content} streaming={m.streaming} />
                            : <div className="ai-shimmer h-4 w-40 rounded" />
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Composer */}
              <div className="border-t border-border bg-muted/20 p-3">
                <div className="flex items-end gap-2 rounded-lg border border-border bg-background px-3 py-2 focus-within:border-primary/50">
                  <textarea
                    ref={inputRef}
                    rows={1}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        send(input);
                      }
                    }}
                    placeholder={busy ? 'Copilot is working…' : 'e.g. "Move the Nordwind deal to Lost and tell me why we lost it"'}
                    disabled={busy}
                    className="max-h-32 flex-1 resize-none bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none disabled:opacity-60"
                  />
                  <Button size="icon" className="h-8 w-8 shrink-0 rounded-md" disabled={busy || !input.trim()} onClick={() => send(input)}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                <p className="mt-2 flex items-center gap-1.5 px-1 text-[10px] text-muted-foreground">
                  <CircleAlert className="h-3 w-3" />
                  Actions are applied to the live workspace — watch the dashboard update behind this panel.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
