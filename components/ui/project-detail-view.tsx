
import * as React from "react";
import { cn } from "../../lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";
import { Badge } from "./badge";
import { Button } from "./button";
import {
  Card,
  CardContent,
  CardHeader,
} from "./card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./table";
import { 
  generateProjectSummary, 
  refineDescription, 
  suggestMissingTasks, 
  generateCompletionDocument, 
  generateInvoice,
  performProposalResearch,
  generateRobustProposal,
  generateSOW,
  reviewSOW,
  parseSOWToTasks
} from "../../services/geminiService";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Attachment, ProjectDetailViewProps, SubTask, ProjectTag, Assignee, Stage, ProposalInput } from "../../types";

// --- Inline Icons ---
const Icons = {
  FileText: (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>,
  Figma: (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M5 5.5A3.5 3.5 0 0 1 8.5 2H12v7H8.5A3.5 3.5 0 0 1 5 5.5z"/><path d="M12 2h3.5a3.5 3.5 0 1 1 0 7H12V2z"/><path d="M12 12.5a3.5 3.5 0 1 1 7 0 3.5 3.5 0 1 1-7 0z"/><path d="M5 19.5A3.5 3.5 0 0 1 8.5 23H12v-3.5a3.5 3.5 0 1 1-7 0z"/><path d="M5 12.5A3.5 3.5 0 0 1 8.5 9H12v7H8.5A3.5 3.5 0 0 1 5 12.5z"/></svg>,
  Calendar: (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  Tag: (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>,
  Paperclip: (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>,
  Users: (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  MoreHorizontal: (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>,
  Download: (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  Plus: (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  ArrowRight: (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
  ArrowLeft: (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>,
  Edit2: (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>,
  X: (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Share2: (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>,
  LoaderCircle: (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>,
  BrainCircuit: (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/><path d="M9 13a4.5 4.5 0 0 0 3-4"/><path d="M6.003 5.125A3 3 0 0 1 19.5 4.125"/><path d="M12 18a4 4 0 0 0 4-3.464 4.004 4.004 0 0 0 3.464-6.928A4.003 4.003 0 0 0 12 5"/><path d="M12 13a4.5 4.5 0 0 1-3-4"/></svg>,
  Check: (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polyline points="20 6 9 17 4 12"/></svg>,
  Trash2: (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>,
  UserPlus: (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>,
  Save: (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>,
  CreditCard: (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect width="20" height="14" x="2" y="5" rx="2" /><line x1="2" x2="22" y1="10" y2="10" /></svg>,
  Lock: (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>,
};


// Helper component for status badges
const TaskStatusBadge = ({ status, onClick, isBlocked }: { status: SubTask["status"], onClick?: () => void, isBlocked?: boolean }) => {
  const statusStyles = {
    Completed: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-400 border-green-200 dark:border-green-700/60",
    "In Progress": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-400 border-yellow-200 dark:border-yellow-700/60",
    Pending: "bg-gray-100 text-gray-800 dark:bg-gray-900/40 dark:text-gray-400 border-gray-200 dark:border-gray-700/60",
  };
  
  return (
    <Badge 
      variant="outline" 
      className={cn(
        "font-medium cursor-pointer select-none hover:opacity-80 transition-opacity whitespace-nowrap gap-1.5", 
        statusStyles[status],
        isBlocked && "opacity-75 cursor-not-allowed bg-red-50/50 text-red-700 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/40"
      )}
      onClick={isBlocked ? undefined : onClick}
      title={isBlocked ? "Blocked by incomplete dependencies" : "Click to toggle status"}
    >
      {isBlocked && <Icons.Lock className="h-3 w-3 shadow-sm" />}
      {status}
    </Badge>
  );
};

// Helper to get file icon
const FileIcon = ({ type }: { type: Attachment["type"] | string }) => {
  if (type === "pdf") return <Icons.FileText className="h-6 w-6 text-red-500" />;
  if (type === "figma") return <Icons.Figma className="h-6 w-6 text-purple-500" />;
  if (type === "contract") return <Icons.FileText className="h-6 w-6 text-blue-600" />;
  if (type === "invoice") return <Icons.FileText className="h-6 w-6 text-green-600" />;
  if (type === "image") return <div className="h-6 w-6 bg-blue-100 text-blue-500 rounded flex items-center justify-center text-xs font-bold">IMG</div>;
  return <Icons.Paperclip className="h-6 w-6 text-muted-foreground" />;
};


export function ProjectDetailView(props: ProjectDetailViewProps) {
  // Sync state with props
  React.useEffect(() => {
    setDescription(props.description);
    setTasks(props.subTasks);
    setAttachments(props.attachments);
    setStage(props.status);
  }, [props.description, props.subTasks, props.attachments, props.status]);

  // State for editable content
  const [description, setDescription] = React.useState(props.description);
  const [isEditingDescription, setIsEditingDescription] = React.useState(false);
  const [isRefining, setIsRefining] = React.useState(false);

  const [tasks, setTasks] = React.useState<SubTask[]>(props.subTasks);
  const [isThinkingTasks, setIsThinkingTasks] = React.useState(false);
  const [assignees, setAssignees] = React.useState<Assignee[]>(props.assignees);
  const [tags, setTags] = React.useState<ProjectTag[]>(props.tags);
  const [attachments, setAttachments] = React.useState<Attachment[]>(props.attachments);
  const [stage, setStage] = React.useState<Stage>(props.status);

  // Inline Task Editing
  const [editingTaskId, setEditingTaskId] = React.useState<number | null>(null);
  const [editingTaskState, setEditingTaskState] = React.useState<{ task: string, category: string, dueDate: string, dependsOnString: string } | null>(null);

  // Add Task Modal
  const [isAddTaskOpen, setIsAddTaskOpen] = React.useState(false);
  const [newTaskData, setNewTaskData] = React.useState({ task: "", category: "", dueDate: "", dependsOn: [] as number[] });

  // Add Assignee Modal
  const [isAssigneeModalOpen, setIsAssigneeModalOpen] = React.useState(false);
  const [newAssigneeData, setNewAssigneeData] = React.useState({ name: "", email: "", avatarUrl: "" });

  // Add Tag State
  const [isTagInputOpen, setIsTagInputOpen] = React.useState(false);
  const [newTagLabel, setNewTagLabel] = React.useState("");

  // AI Loading States
  const [aiSummary, setAiSummary] = React.useState<string>('');
  const [isGeneratingSummary, setIsGeneratingSummary] = React.useState<boolean>(false);
  const [isGeneratingDoc, setIsGeneratingDoc] = React.useState(false);
  const [isGeneratingInvoice, setIsGeneratingInvoice] = React.useState(false);
  const [isGeneratingProposal, setIsGeneratingProposal] = React.useState(false);
  const [isGeneratingSOW, setIsGeneratingSOW] = React.useState(false);
  const [docPreview, setDocPreview] = React.useState<{ name: string; content: string } | null>(null);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // --- Helpers ---
  const isTaskBlocked = (task: SubTask, allTasks: SubTask[]) => {
    if (!task.dependsOn || task.dependsOn.length === 0) return false;
    const dependencies = allTasks.filter(t => task.dependsOn?.includes(t.id));
    return dependencies.some(t => t.status !== 'Completed');
  };

  const getTaskStatus = (task: SubTask, allTasks: SubTask[]): SubTask["status"] => {
     if (task.status === 'Completed') return 'Completed';
     if (isTaskBlocked(task, allTasks)) return 'Pending';
     return task.status;
  };

  // --- Effects to Update Parent ---
  const notifyUpdate = (updates: Partial<ProjectDetailViewProps>) => {
      props.onUpdate({
          ...props,
          description,
          subTasks: tasks,
          attachments,
          status: stage,
          assignees,
          tags,
          ...updates
      });
  };

  // --- File Handlers ---
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newAttachments: Attachment[] = Array.from(files).map((file: File) => ({
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        size: (file.size / (1024 * 1024)).toFixed(1) + " Mb",
        type: file.type.includes("pdf") ? "pdf" : file.type.includes("image") ? "image" : "other",
        isUserUploaded: true,
        dateAdded: new Date().toISOString()
      }));
      const updated = [...attachments, ...newAttachments];
      setAttachments(updated);
      notifyUpdate({ attachments: updated });
    }
  };

  const handleDownloadFile = (file: Attachment) => {
    if (file.type === 'contract' && stage === 'Completed') {
        if (confirm("Sign this document? This will move the project stage to 'Signed'.")) {
            setStage('Signed');
            notifyUpdate({ status: 'Signed' });
        }
    } else {
        alert(`Opening ${file.name}...`);
    }
  };

  const handleDeleteFile = (id: string) => {
    const updated = attachments.filter(f => f.id !== id);
    setAttachments(updated);
    notifyUpdate({ attachments: updated });
  };

  // --- Tag Handlers ---
  const handleAddTag = () => {
    if (newTagLabel.trim()) {
      const updated = [...tags, { label: newTagLabel.trim(), variant: "secondary" } as ProjectTag];
      setTags(updated);
      notifyUpdate({ tags: updated });
      setNewTagLabel("");
      setIsTagInputOpen(false);
    }
  };
  
  const handleDeleteTag = (label: string) => {
    const updated = tags.filter(t => t.label !== label);
    setTags(updated);
    notifyUpdate({ tags: updated });
  };

  // --- Assignee Handlers ---
  const handleAddAssignee = () => {
    if (newAssigneeData.name.trim()) {
      const updated = [...assignees, {
        name: newAssigneeData.name,
        avatarUrl: newAssigneeData.avatarUrl || `https://ui-avatars.com/api/?name=${newAssigneeData.name.replace(" ", "+")}`,
        email: newAssigneeData.email
      }];
      setAssignees(updated);
      notifyUpdate({ assignees: updated });
      setIsAssigneeModalOpen(false);
      setNewAssigneeData({ name: "", email: "", avatarUrl: "" });
    }
  };


  // --- Task Handlers ---
  const handleRefineDescription = async () => {
    if (!description) return;
    setIsRefining(true);
    try {
      const refined = await refineDescription(description, "professional");
      setDescription(refined);
      notifyUpdate({ description: refined });
    } catch (e) {
      console.error(e);
    } finally {
      setIsRefining(false);
    }
  };

  const toggleTaskStatus = (id: number) => {
    if (editingTaskId === id) return;
    
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    if (isTaskBlocked(task, tasks)) {
        alert("This task cannot be started because it depends on other tasks that are not yet completed.");
        return;
    }

    const updatedTasks: SubTask[] = tasks.map(t => {
      if (t.id !== id) return t;
      const nextStatus: SubTask["status"] = t.status === "Pending" ? "In Progress" : t.status === "In Progress" ? "Completed" : "Pending";
      return { ...t, status: nextStatus };
    });
    setTasks(updatedTasks);
    notifyUpdate({ subTasks: updatedTasks });
    
    // Auto-update stage based on activity
    if (stage === 'Kickoff' && updatedTasks.some(t => t.status === 'In Progress')) {
        setStage('In-Progress');
        notifyUpdate({ status: 'In-Progress', subTasks: updatedTasks });
    }
  };

  const handleDeepBrainstorm = async () => {
    setIsThinkingTasks(true);
    try {
      const suggestions = await suggestMissingTasks(props.title, description, tasks);
      if (suggestions && suggestions.length > 0) {
        const baseId = tasks.length > 0 ? Math.max(...tasks.map(t => t.id)) : 0;
        const newTasks: SubTask[] = suggestions.map((s, i) => ({
          id: baseId + i + 1,
          task: s.task || "New Task",
          category: s.category || "General",
          status: (s.status as any) || "Pending",
          dueDate: s.dueDate || new Date().toISOString().split('T')[0],
          dependsOn: s.dependsOn || []
        }));
        const updated = [...tasks, ...newTasks];
        setTasks(updated);
        notifyUpdate({ subTasks: updated });
      } else {
        alert("No missing tasks identified.");
      }
    } catch (e) {
      console.error("Deep Brainstorm Error: ", e);
      alert("Failed to brainstorm tasks. Please try again.");
    } finally {
      setIsThinkingTasks(false);
    }
  };

  const handleDeleteTask = (id: number) => {
    const updated = tasks.filter(t => t.id !== id);
    setTasks(updated);
    notifyUpdate({ subTasks: updated });
  };

  const handleAddNewTask = () => {
    if (!newTaskData.task.trim()) return;

    const newId = Math.max(0, ...tasks.map(t => t.id)) + 1;
    const newTask: SubTask = {
        id: newId,
        task: newTaskData.task.trim(),
        category: newTaskData.category.trim() || "General",
        status: "Pending",
        dueDate: newTaskData.dueDate || new Date().toISOString().split('T')[0],
        dependsOn: newTaskData.dependsOn
    };
    
    const updated = [...tasks, newTask];
    setTasks(updated);
    notifyUpdate({ subTasks: updated });
    setIsAddTaskOpen(false);
    setNewTaskData({ task: "", category: "", dueDate: "", dependsOn: [] });
  };
  
  const handleGenerateSummary = async () => {
    setIsGeneratingSummary(true);
    setAiSummary('');
    const summary = await generateProjectSummary({ title: props.title, description, subTasks: tasks });
    setAiSummary(summary);
    setIsGeneratingSummary(false);
  };

  // --- Inline Task Editing Handlers ---
  const startEditingTask = (task: SubTask) => {
    setEditingTaskId(task.id);
    setEditingTaskState({ 
        task: task.task, 
        category: task.category, 
        dueDate: task.dueDate,
        dependsOnString: task.dependsOn ? task.dependsOn.join(", ") : ""
    });
  };

  const saveTask = () => {
    if (editingTaskId !== null && editingTaskState) {
      if (editingTaskState.task.trim() !== "") {
          const deps = editingTaskState.dependsOnString
            .split(",")
            .map(s => parseInt(s.trim()))
            .filter(n => !isNaN(n) && n !== editingTaskId); // Prevent self-dependency

          const updated = tasks.map(t =>
            t.id === editingTaskId ? { 
                ...t, 
                task: editingTaskState.task.trim(),
                category: editingTaskState.category.trim(),
                dueDate: editingTaskState.dueDate,
                dependsOn: deps
            } : t
          );
          setTasks(updated);
          notifyUpdate({ subTasks: updated });
      }
      setEditingTaskId(null);
      setEditingTaskState(null);
    }
  };

  const cancelEditingTask = () => {
    setEditingTaskId(null);
    setEditingTaskState(null);
  };

  const handleTaskKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      saveTask();
    } else if (e.key === 'Escape') {
      cancelEditingTask();
    }
  };

  const toggleNewTaskDependency = (id: number) => {
      setNewTaskData(prev => {
          const exists = prev.dependsOn.includes(id);
          if (exists) {
              return { ...prev, dependsOn: prev.dependsOn.filter(d => d !== id) };
          } else {
              return { ...prev, dependsOn: [...prev.dependsOn, id] };
          }
      });
  }

  // --- Client Portal / Billing Actions ---

  const handleGenerateProposal = async () => {
      setIsGeneratingProposal(true);
      try {
          const input: ProposalInput = {
              clientName: props.client,
              projectTitle: props.title,
              budget: props.value,
              notes: props.description,
              startDate: props.dateRange.start,
              estimatedWeeks: 4 // default
          };
          const research = await performProposalResearch(input);
          const proposal = await generateRobustProposal(input, research);

          const docName = `Proposal_${props.client}_${props.title.substring(0, 10)}.md`;
          const content = [
              `# Proposal — ${props.title}`,
              `**Client:** ${props.client}  |  **Value:** $${props.value.toLocaleString()}`,
              '',
              proposal.description || '',
              '',
              Array.isArray(proposal.painPoints) && proposal.painPoints.length
                  ? `## Pain Points\n${proposal.painPoints.map((p: string) => `- ${p}`).join('\n')}`
                  : '',
              '',
              proposal.solution || '',
          ].filter(Boolean).join('\n');

          const newDoc: Attachment = {
              id: Math.random().toString(36).substr(2, 9),
              name: docName,
              size: `${Math.max(1, Math.round(content.length / 1024))} KB`,
              type: "contract",
              dateAdded: new Date().toISOString(),
              isUserUploaded: false
          };
          const updated = [...attachments, newDoc];
          setAttachments(updated);
          notifyUpdate({ attachments: updated });
          setDocPreview({ name: docName, content });
      } catch (e) {
          console.error(e);
      } finally {
          setIsGeneratingProposal(false);
      }
  };

  const handleGenerateSOW = async () => {
      setIsGeneratingSOW(true);
      try {
          const input: ProposalInput = {
              clientName: props.client,
              projectTitle: props.title,
              budget: props.value,
              notes: props.description,
              startDate: props.dateRange.start,
              estimatedWeeks: 4 // default
          };
          const research = { content: "Previously conducted research.", sources: [] }; // Mock for flow
          const proposal = await generateRobustProposal(input, research);
          const sow = await generateSOW(input, proposal);

          const docName = `SOW_${props.client}_${props.title.substring(0, 10)}.md`;
          const newDoc: Attachment = {
              id: Math.random().toString(36).substr(2, 9),
              name: docName,
              size: `${Math.max(1, Math.round(sow.length / 1024))} KB`,
              type: "contract",
              dateAdded: new Date().toISOString(),
              isUserUploaded: false
          };
          const updatedDocs = [...attachments, newDoc];
          setAttachments(updatedDocs);
          setDocPreview({ name: docName, content: sow });

          // Task Population Logic
          if (confirm("SOW generated! Would you like to automatically populate the project task list with the milestones from this SOW?")) {
              const extracted = await parseSOWToTasks(sow);
              if (extracted.length > 0) {
                  const baseId = Math.max(0, ...tasks.map(t => t.id));
                  const newTasks: SubTask[] = extracted.map((t, idx) => ({
                      id: baseId + idx + 1,
                      task: t.task || "Milestone Task",
                      category: t.category || "Project Plan",
                      dueDate: t.dueDate || new Date().toISOString().split('T')[0],
                      status: "Pending",
                      dependsOn: t.dependsOn ? t.dependsOn.map(d => baseId + d) : []
                  }));
                  const allTasks = [...tasks, ...newTasks];
                  setTasks(allTasks);
                  notifyUpdate({ attachments: updatedDocs, subTasks: allTasks });
              } else {
                  notifyUpdate({ attachments: updatedDocs });
              }
          } else {
              notifyUpdate({ attachments: updatedDocs });
          }
      } catch (e) {
          console.error(e);
      } finally {
          setIsGeneratingSOW(false);
      }
  };

  const handleGenerateCompletionDoc = async () => {
      setIsGeneratingDoc(true);
      try {
          const text = await generateCompletionDocument(props);
          const docName = `Completion_Cert_${props.title.substring(0, 10)}.md`;
          const newDoc: Attachment = {
              id: Math.random().toString(36),
              name: docName,
              size: `${Math.max(1, Math.round(text.length / 1024))} KB`,
              type: "contract",
              dateAdded: new Date().toISOString(),
              isUserUploaded: false
          };
          const updated = [...attachments, newDoc];
          setAttachments(updated);
          setStage('Completed');
          notifyUpdate({ attachments: updated, status: 'Completed' });
          setDocPreview({ name: docName, content: text });
      } catch (e) {
          console.error(e);
      } finally {
          setIsGeneratingDoc(false);
      }
  };

  const handleGenerateInvoice = async () => {
      setIsGeneratingInvoice(true);
      try {
          const text = await generateInvoice(props);
          const docName = `Invoice_${props.title.substring(0, 10)}.md`;
          const newDoc: Attachment = {
              id: Math.random().toString(36),
              name: docName,
              size: `${Math.max(1, Math.round(text.length / 1024))} KB`,
              type: "invoice",
              dateAdded: new Date().toISOString(),
              isUserUploaded: false
          };
          const updated = [...attachments, newDoc];
          setAttachments(updated);
          notifyUpdate({ attachments: updated });
          setDocPreview({ name: docName, content: text });
      } catch (e) {
          console.error(e);
      } finally {
          setIsGeneratingInvoice(false);
      }
  };

  const handlePay = () => {
      if (confirm(`Pay invoice for $${props.value.toLocaleString()} via Stripe (Test Mode)?`)) {
          setStage('Paid');
          notifyUpdate({ status: 'Paid' });
      }
  };

  // --- Stage Logic ---
  const handleStageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newStage = e.target.value as Stage;
      setStage(newStage);
      notifyUpdate({ status: newStage });
  };

  // Progress Bar for Header
  const stages: Stage[] = ['Kickoff', 'In-Progress', 'Completed', 'Signed', 'Paid'];
  const progressIndex = stages.indexOf(stage);

  return (
    <>
    <Card className="w-full max-w-5xl mx-auto overflow-hidden border shadow-lg bg-card dark:border-border mb-8">
      <div>
        {/* Header Section */}
        <CardHeader className="p-4 border-b bg-muted/40 dark:bg-muted/20 dark:border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                 <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={props.onBack}>
                    <Icons.ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="text-sm text-muted-foreground hidden sm:block">
                {props.breadcrumbs.map((breadcrumb, index) => (
                    <React.Fragment key={index}>
                    <a href={breadcrumb.href} className="hover:text-foreground transition-colors">{breadcrumb.label}</a>
                    {index < props.breadcrumbs.length - 1 && <span className="mx-2">/</span>}
                    </React.Fragment>
                ))}
                </div>
            </div>
            <div className="flex items-center gap-3">
                 <select 
                    className="h-8 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    value={stage}
                    onChange={handleStageChange}
                 >
                    {stages.map(s => <option key={s} value={s}>{s}</option>)}
                 </select>
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon"><Icons.Share2 className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon"><Icons.X className="h-4 w-4" onClick={props.onBack}/></Button>
                </div>
            </div>
          </div>
          {/* Progress Bar */}
          <div className="mt-4 flex items-center gap-1 w-full px-1">
             {stages.map((s, idx) => (
                <div key={s} className="flex-1 flex flex-col items-center">
                     <div 
                        className={cn(
                            "h-1.5 w-full rounded-full transition-all duration-500",
                            idx <= progressIndex 
                                ? "bg-primary" 
                                : "bg-muted"
                        )}
                    />
                    <span className={cn("text-[10px] mt-1 font-medium", idx <= progressIndex ? "text-primary" : "text-muted-foreground")}>{s}</span>
                </div>
             ))}
          </div>
        </CardHeader>
        
        <CardContent className="p-6 md:p-8 space-y-10">
            {/* Title Section */}
            <h1 className="text-3xl font-bold tracking-tight text-foreground">{props.title}</h1>

            {/* Meta Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-sm">
                <div className="flex items-start gap-3">
                    <Icons.MoreHorizontal className="h-5 w-5 mt-0.5 text-muted-foreground" />
                    <div>
                        <p className="text-muted-foreground">Status</p>
                        <Badge variant="outline" className="mt-1 font-semibold bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-400 border-yellow-200 dark:border-yellow-700/60 whitespace-nowrap">
                            <span className="mr-2 h-2 w-2 rounded-full bg-yellow-500 animate-pulse"></span>
                            {stage}
                        </Badge>
                    </div>
                </div>
                <div className="flex items-start gap-3">
                    <Icons.Users className="h-5 w-5 mt-0.5 text-muted-foreground" />
                    <div>
                        <p className="text-muted-foreground">Assignee</p>
                        <div className="flex items-center gap-2 mt-1">
                            <div className="flex items-center -space-x-2">
                            {assignees.map((assignee, i) => (
                                <Avatar key={i} className="h-8 w-8 border-2 border-card">
                                    <AvatarImage src={assignee.avatarUrl} alt={assignee.name} />
                                    <AvatarFallback>{assignee.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                            ))}
                            </div>
                            <Button 
                                size="sm" 
                                variant="outline" 
                                className="h-8 w-8 rounded-full p-0 flex items-center justify-center border-dashed"
                                onClick={() => setIsAssigneeModalOpen(true)}
                            >
                                <Icons.Plus className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
                <div className="flex items-start gap-3">
                    <Icons.Calendar className="h-5 w-5 mt-0.5 text-muted-foreground" />
                    <div>
                        <p className="text-muted-foreground">Date</p>
                        <p className="font-medium flex items-center gap-2 mt-1">
                            {props.dateRange.start} <Icons.ArrowRight className="h-4 w-4 text-muted-foreground" /> {props.dateRange.end}
                        </p>
                    </div>
                </div>
                 <div className="flex items-start gap-3">
                    <Icons.Tag className="h-5 w-5 mt-0.5 text-muted-foreground" />
                    <div className="flex-1">
                        <p className="text-muted-foreground">Tags</p>
                        <div className="flex flex-wrap gap-2 mt-1 items-center">
                            {tags.map((tag) => (
                                <Badge 
                                    key={tag.label} 
                                    variant={tag.variant} 
                                    className="group pr-1 cursor-default"
                                >
                                    {tag.label}
                                    <span 
                                        role="button" 
                                        onClick={() => handleDeleteTag(tag.label)}
                                        className="ml-1 opacity-50 group-hover:opacity-100 hover:text-destructive cursor-pointer"
                                    >
                                        <Icons.X className="h-3 w-3" />
                                    </span>
                                </Badge>
                            ))}
                            {isTagInputOpen ? (
                                <div className="flex items-center gap-1 animate-in fade-in duration-200">
                                    <input 
                                        className="h-6 w-24 text-xs rounded-full border px-2 focus:outline-none bg-transparent"
                                        placeholder="New tag..."
                                        value={newTagLabel}
                                        onChange={(e) => setNewTagLabel(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                                        autoFocus
                                        onBlur={() => !newTagLabel && setIsTagInputOpen(false)}
                                    />
                                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0 rounded-full" onClick={handleAddTag}>
                                        <Icons.Check className="h-3 w-3" />
                                    </Button>
                                </div>
                            ) : (
                                <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="h-5 px-2 text-[10px] rounded-full border-dashed"
                                    onClick={() => setIsTagInputOpen(true)}
                                >
                                    + Add
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
                 
                 {/* Editable Description */}
                 <div className="flex items-start gap-3 col-span-1 md:col-span-2">
                    <Icons.FileText className="h-5 w-5 mt-0.5 text-muted-foreground" />
                    <div className="w-full">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-muted-foreground">Description</p>
                          <div className="flex gap-1">
                            {isEditingDescription ? (
                                <>
                                  <Button 
                                    size="sm" 
                                    variant="ghost"
                                    disabled={isRefining}
                                    onClick={handleRefineDescription} 
                                    className="h-6 text-xs text-blue-600 dark:text-blue-400"
                                  >
                                    {isRefining ? <Icons.LoaderCircle className="h-3 w-3 animate-spin mr-1"/> : null}
                                    Polish
                                  </Button>
                                  <Button size="sm" variant="ghost" onClick={() => { setIsEditingDescription(false); notifyUpdate({ description }); }} className="h-6 w-6 p-0"><Icons.Check className="h-3 w-3" /></Button>
                                </>
                            ) : (
                              <Button size="sm" variant="ghost" onClick={() => setIsEditingDescription(true)} className="h-6 w-6 p-0"><Icons.Edit2 className="h-3 w-3" /></Button>
                            )}
                          </div>
                        </div>
                        
                        {isEditingDescription ? (
                          <textarea 
                            className="w-full min-h-[100px] rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                          />
                        ) : (
                          <p className="text-foreground/80 leading-relaxed">{description}</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Client Portal / Billing Section */}
            <div className="p-5 border rounded-xl bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/20 dark:to-blue-900/10 dark:border-indigo-900/30">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold flex items-center gap-2 text-indigo-900 dark:text-indigo-200">
                        <Icons.CreditCard className="h-5 w-5" />
                        Client Portal & Billing
                    </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div className="space-y-3">
                        <p className="text-sm text-muted-foreground">AI Documentation</p>
                        <div className="grid grid-cols-2 gap-2">
                             <Button 
                                size="sm" 
                                variant="outline" 
                                className="w-full border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 gap-2"
                                onClick={handleGenerateProposal}
                                disabled={isGeneratingProposal}
                            >
                                {isGeneratingProposal ? <Icons.LoaderCircle className="h-4 w-4 animate-spin"/> : <Icons.FileText className="h-4 w-4" />}
                                Proposal
                            </Button>
                            <Button 
                                size="sm" 
                                variant="outline" 
                                className="w-full border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 gap-2"
                                onClick={handleGenerateSOW}
                                disabled={isGeneratingSOW}
                            >
                                {isGeneratingSOW ? <Icons.LoaderCircle className="h-4 w-4 animate-spin"/> : <Icons.BrainCircuit className="h-4 w-4" />}
                                SOW
                            </Button>
                            <Button 
                                size="sm" 
                                variant="outline" 
                                className="w-full border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/40"
                                onClick={handleGenerateCompletionDoc}
                                disabled={isGeneratingDoc}
                            >
                                {isGeneratingDoc ? <Icons.LoaderCircle className="h-4 w-4 animate-spin mr-2"/> : null}
                                Completion Doc
                            </Button>
                            <Button 
                                size="sm" 
                                variant="outline"
                                className="w-full border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/40"
                                onClick={handleGenerateInvoice}
                                disabled={isGeneratingInvoice}
                            >
                                {isGeneratingInvoice ? <Icons.LoaderCircle className="h-4 w-4 animate-spin mr-2"/> : null}
                                Invoice
                            </Button>
                        </div>
                     </div>
                     <div className="space-y-3 flex flex-col justify-end">
                        {stage === 'Signed' && attachments.some(a => a.type === 'invoice') ? (
                            <Button 
                                className="w-full bg-[#635BFF] hover:bg-[#544ee0] text-white"
                                onClick={handlePay}
                            >
                                <Icons.CreditCard className="h-4 w-4 mr-2" />
                                Pay ${props.value.toLocaleString()} with Stripe
                            </Button>
                        ) : stage === 'Paid' ? (
                            <div className="w-full h-9 flex items-center justify-center rounded-md bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-400 font-medium">
                                <Icons.Check className="h-4 w-4 mr-2" /> Invoice Paid
                            </div>
                        ) : (
                             <div className="w-full h-9 flex items-center justify-center rounded-md border border-dashed text-muted-foreground text-sm">
                                Invoice pending generation
                            </div>
                        )}
                     </div>
                </div>
            </div>

            {/* Attachments Section */}
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="font-semibold flex items-center gap-2"><Icons.Paperclip className="h-5 w-5 text-muted-foreground"/>Attachment <Badge variant="secondary">{attachments.length}</Badge></h3>
                    <Button variant="ghost" size="sm" className="text-primary" onClick={() => alert("Downloading all files...")}>
                        <Icons.Download className="h-4 w-4 mr-2" />Download All
                    </Button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {attachments.map((file, i) => (
                        <div key={i} className={cn("group flex items-center gap-3 p-3 border rounded-lg relative transition-colors", file.type === 'invoice' ? "bg-green-50 dark:bg-green-900/10 border-green-200" : "bg-muted/40 dark:bg-muted/20 dark:border-border")}>
                            <FileIcon type={file.type} />
                            <div className="flex-1 overflow-hidden cursor-pointer" onClick={() => handleDownloadFile(file)}>
                                <p className="font-medium text-sm truncate hover:underline">{file.name}</p>
                                <p className="text-xs text-muted-foreground">{file.size} • {new Date(file.dateAdded || Date.now()).toLocaleDateString()}</p>
                            </div>
                             {file.isUserUploaded && (
                                <button 
                                    className="absolute top-2 right-2 p-1 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => handleDeleteFile(file.id)}
                                >
                                    <Icons.Trash2 className="h-4 w-4" />
                                </button>
                             )}
                        </div>
                    ))}
                    <div 
                        className="flex items-center justify-center p-3 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/40 transition-colors dark:border-border hover:dark:bg-muted/20"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} multiple />
                        <Icons.Plus className="h-6 w-6 text-muted-foreground"/>
                    </div>
                </div>
            </div>
            
             {/* AI Assistant Section */}
            <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">AI Assistant</h3>
                 <div className="p-4 border rounded-lg bg-muted/40 dark:bg-muted/20 dark:border-border space-y-4">
                    {!aiSummary && !isGeneratingSummary && (
                        <div className="text-center text-muted-foreground p-4">
                            <p>Get a quick summary and suggested next steps for this project.</p>
                            <Button onClick={handleGenerateSummary} className="mt-4">
                                Generate Summary
                            </Button>
                        </div>
                    )}
                    {isGeneratingSummary && (
                        <div className="flex flex-col items-center justify-center p-8 space-y-3 text-center">
                            <Icons.LoaderCircle className="h-8 w-8 animate-spin text-primary" />
                            <p className="font-semibold">Gemini is thinking...</p>
                            <p className="text-sm text-muted-foreground max-w-sm">Generating a concise summary for you.</p>
                        </div>
                    )}
                    {aiSummary && (
                        <div>
                             <div className="prose prose-sm dark:prose-invert max-w-none p-2 text-sm leading-relaxed text-foreground/90 [&_h2]:mt-4 [&_h2]:mb-2 [&_h2]:text-base [&_h2]:font-semibold [&_h3]:mt-3 [&_h3]:mb-1 [&_h3]:text-sm [&_h3]:font-semibold [&_p]:my-1.5 [&_ul]:my-1.5 [&_ol]:my-1.5 [&_li]:my-0.5 [&_strong]:text-foreground">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{aiSummary}</ReactMarkdown>
                             </div>
                            <Button onClick={handleGenerateSummary} variant="ghost" size="sm" className="mt-4 text-primary">
                                Regenerate
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* Task List Section */}
            <div className="space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                    <h3 className="font-semibold">Task List</h3>
                    <div className="flex gap-2">
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={handleDeepBrainstorm}
                            disabled={isThinkingTasks}
                        >
                             {isThinkingTasks ? (
                                <>
                                    <Icons.LoaderCircle className="h-4 w-4 animate-spin mr-2"/>
                                    Deep Thinking...
                                </>
                             ) : (
                                <>
                                    Brainstorm Tasks
                                </>
                             )}
                        </Button>
                        <Button size="sm" onClick={() => setIsAddTaskOpen(true)}><Icons.Plus className="h-4 w-4 mr-2" />Add Task</Button>
                    </div>
                </div>
                
                {isThinkingTasks && (
                    <div className="p-3 bg-purple-50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-900/30 rounded-lg text-sm text-purple-800 dark:text-purple-300 flex items-center gap-3">
                         <Icons.BrainCircuit className="h-5 w-5 animate-pulse" />
                         Gemini 3 Pro is analyzing project context to identify missing critical steps...
                    </div>
                )}

                <div className="overflow-x-auto border rounded-lg dark:border-border">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/40 dark:bg-muted/20 hover:bg-muted/50 dark:hover:bg-muted/30">
                                <TableHead className="w-[50px]">No</TableHead>
                                <TableHead>Task</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Dependencies</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Due Date</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {tasks.map((task) => (
                                <TableRow key={task.id}>
                                    <TableCell className="text-muted-foreground">{task.id}</TableCell>
                                    <TableCell className="font-medium min-w-[200px]">
                                      {editingTaskId === task.id ? (
                                          <input
                                              type="text"
                                              className="w-full bg-transparent border-b border-primary focus:outline-none py-1"
                                              value={editingTaskState?.task || ""}
                                              onChange={(e) => setEditingTaskState(prev => prev ? {...prev, task: e.target.value} : null)}
                                              onKeyDown={handleTaskKeyDown}
                                              autoFocus
                                          />
                                      ) : (
                                          <div 
                                              onClick={() => startEditingTask(task)}
                                              className="group flex items-center gap-2 cursor-pointer hover:text-primary transition-colors"
                                              title="Click to edit"
                                          >
                                              <span>{task.task}</span>
                                          </div>
                                      )}
                                    </TableCell>
                                    <TableCell>
                                        {editingTaskId === task.id ? (
                                           <input
                                              type="text"
                                              className="w-full bg-transparent border-b border-primary focus:outline-none py-1"
                                              value={editingTaskState?.category || ""}
                                              onChange={(e) => setEditingTaskState(prev => prev ? {...prev, category: e.target.value} : null)}
                                              onKeyDown={handleTaskKeyDown}
                                          />
                                        ) : (
                                            <div 
                                                onClick={() => startEditingTask(task)}
                                                className="cursor-pointer hover:text-primary transition-colors"
                                                title="Click to edit"
                                            >
                                                {task.category}
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {editingTaskId === task.id ? (
                                           <input
                                              type="text"
                                              placeholder="1, 2"
                                              className="w-full bg-transparent border-b border-primary focus:outline-none py-1"
                                              value={editingTaskState?.dependsOnString || ""}
                                              onChange={(e) => setEditingTaskState(prev => prev ? {...prev, dependsOnString: e.target.value} : null)}
                                              onKeyDown={handleTaskKeyDown}
                                          />
                                        ) : (
                                            <div 
                                                onClick={() => startEditingTask(task)}
                                                className="cursor-pointer hover:text-primary transition-colors min-h-[1.5rem]"
                                                title="Click to edit"
                                            >
                                                {task.dependsOn && task.dependsOn.length > 0 ? (
                                                    <div className="flex gap-1 flex-wrap">
                                                        {task.dependsOn.map(did => (
                                                            <Badge key={did} variant="secondary" className="px-1.5 py-0 text-[10px] h-5">{did}</Badge>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground text-xs">-</span>
                                                )}
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <TaskStatusBadge 
                                            status={task.status}
                                            isBlocked={isTaskBlocked(task, tasks)} 
                                            onClick={() => toggleTaskStatus(task.id)} 
                                        />
                                    </TableCell>
                                    <TableCell className="text-right text-muted-foreground">
                                        {editingTaskId === task.id ? (
                                           <div className="flex justify-end">
                                              <input
                                                  type="date"
                                                  className="bg-transparent border-b border-primary focus:outline-none py-1 text-right"
                                                  value={editingTaskState?.dueDate || ""}
                                                  onChange={(e) => setEditingTaskState(prev => prev ? {...prev, dueDate: e.target.value} : null)}
                                                  onKeyDown={handleTaskKeyDown}
                                              />
                                           </div>
                                        ) : (
                                            <div 
                                                onClick={() => startEditingTask(task)}
                                                className="cursor-pointer hover:text-primary transition-colors"
                                                title="Click to edit"
                                            >
                                                {task.dueDate}
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {editingTaskId === task.id ? (
                                             <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-100 dark:hover:bg-green-900/40"
                                                onClick={saveTask}
                                            >
                                                <Icons.Save className="h-4 w-4" />
                                            </Button>
                                        ) : (
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                                                onClick={() => handleDeleteTask(task.id)}
                                            >
                                                <Icons.Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {tasks.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                        No tasks found. Try brainstorming with AI!
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </CardContent>
      </div>
    </Card>

    {/* Add Task Modal */}
    {isAddTaskOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-background rounded-lg border shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6 pb-4 border-b">
                    <h3 className="text-lg font-semibold">Add New Task</h3>
                    <p className="text-sm text-muted-foreground">Create a new task for this project.</p>
                </div>
                <div className="p-6 space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Task Name</label>
                        <input
                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            value={newTaskData.task}
                            onChange={e => setNewTaskData({...newTaskData, task: e.target.value})}
                            placeholder="e.g., Finalize Review"
                            autoFocus
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-2">
                            <label className="text-sm font-medium">Category</label>
                             <input
                                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                value={newTaskData.category}
                                onChange={e => setNewTaskData({...newTaskData, category: e.target.value})}
                                placeholder="e.g., Design"
                            />
                        </div>
                         <div className="space-y-2">
                            <label className="text-sm font-medium">Due Date</label>
                             <input
                                type="date"
                                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                value={newTaskData.dueDate}
                                onChange={e => setNewTaskData({...newTaskData, dueDate: e.target.value})}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Dependencies (Optional)</label>
                        <div className="border rounded-md p-2 max-h-32 overflow-y-auto space-y-1">
                            {tasks.length > 0 ? tasks.map(t => (
                                <div key={t.id} className="flex items-center gap-2 text-sm">
                                    <input 
                                        type="checkbox" 
                                        id={`dep-${t.id}`} 
                                        checked={newTaskData.dependsOn.includes(t.id)}
                                        onChange={() => toggleNewTaskDependency(t.id)}
                                        className="h-4 w-4 rounded border-gray-300"
                                    />
                                    <label htmlFor={`dep-${t.id}`} className="flex-1 cursor-pointer select-none truncate">
                                        <span className="text-muted-foreground mr-1">#{t.id}</span> {t.task}
                                    </label>
                                </div>
                            )) : <p className="text-xs text-muted-foreground text-center">No existing tasks to depend on.</p>}
                        </div>
                    </div>
                </div>
                <div className="flex justify-end gap-2 p-6 pt-0">
                    <Button variant="outline" onClick={() => setIsAddTaskOpen(false)}>Cancel</Button>
                    <Button onClick={handleAddNewTask}>Add Task</Button>
                </div>
            </div>
        </div>
    )}

    {/* Add Assignee Modal */}
    {isAssigneeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-sm bg-background rounded-lg border shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6 pb-4 border-b">
                    <h3 className="text-lg font-semibold">Invite Assignee</h3>
                    <p className="text-sm text-muted-foreground">Add a new member to this project.</p>
                </div>
                <div className="p-6 space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Full Name</label>
                        <input
                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            value={newAssigneeData.name}
                            onChange={e => setNewAssigneeData({...newAssigneeData, name: e.target.value})}
                            placeholder="John Doe"
                            autoFocus
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Email Address</label>
                        <input
                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            value={newAssigneeData.email}
                            onChange={e => setNewAssigneeData({...newAssigneeData, email: e.target.value})}
                            placeholder="john@example.com"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Avatar URL (Optional)</label>
                        <input
                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            value={newAssigneeData.avatarUrl}
                            onChange={e => setNewAssigneeData({...newAssigneeData, avatarUrl: e.target.value})}
                            placeholder="https://..."
                        />
                    </div>
                </div>
                <div className="flex justify-end gap-2 p-6 pt-0">
                    <Button variant="outline" onClick={() => setIsAssigneeModalOpen(false)}>Cancel</Button>
                    <Button onClick={handleAddAssignee}>Invite</Button>
                </div>
            </div>
        </div>
    )}
    {/* Generated Document Preview Modal */}
    {docPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={() => setDocPreview(null)}>
            <div
                className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-lg border bg-background shadow-xl animate-in zoom-in-95 duration-200"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center justify-between border-b p-4">
                    <div className="flex items-center gap-2 min-w-0">
                        <Icons.FileText className="h-5 w-5 shrink-0 text-primary" />
                        <h3 className="truncate text-sm font-semibold">{docPreview.name}</h3>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                                try {
                                    await navigator.clipboard.writeText(docPreview.content);
                                    // Optionally add visual feedback here
                                } catch {
                                    // Fallback or error notification
                                }
                            }}
                        >
                            Copy
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDocPreview(null)}>
                            <Icons.X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
                <div className="custom-scrollbar overflow-y-auto p-6">
                    <div className="text-sm leading-relaxed text-foreground/90 [&_h1]:mb-3 [&_h1]:text-xl [&_h1]:font-bold [&_h2]:mt-5 [&_h2]:mb-2 [&_h2]:text-base [&_h2]:font-semibold [&_h3]:mt-4 [&_h3]:mb-1.5 [&_h3]:text-sm [&_h3]:font-semibold [&_p]:my-2 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-1 [&_strong]:text-foreground [&_table]:my-3 [&_table]:w-full [&_th]:border-b [&_th]:p-2 [&_th]:text-left [&_th]:font-semibold [&_td]:border-b [&_td]:border-border/50 [&_td]:p-2 [&_hr]:my-4 [&_hr]:border-border">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{docPreview.content}</ReactMarkdown>
                    </div>
                </div>
            </div>
        </div>
    )}
    </>
  );
}
