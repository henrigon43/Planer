export type TaskStatus = 'pendente' | 'concluido' | 'atrasado';

export type TaskCategory =
  | 'Trabalho'
  | 'Fornecedores'
  | 'Estoque'
  | 'Vendas'
  | 'Reunião'
  | 'Financeiro'
  | 'Pessoal'
  | 'Outro';

export type NoteType = 'anotacao' | 'ideia' | 'importante' | 'checklist';

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export interface Task {
  id: string;
  title: string;
  person?: string | null;
  deadlineText: string; // e.g. "quarta-feira", "até sexta"
  targetDate: string; // YYYY-MM-DD
  category: TaskCategory;
  priority?: 'alta' | 'media' | 'baixa';
  status: TaskStatus;
  originalNoteId: string; // Links back to Caderno entry!
  originalNoteText?: string;
  completedAt?: string | null; // ISO timestamp or date
  createdDate: string; // YYYY-MM-DD
  historyLog?: string[];
  notes?: string;
}

export interface NoteItem {
  id: string;
  type: NoteType;
  title: string;
  content: string;
  createdDate: string;
  originalNotebookEntryId?: string;
  checklistItems?: ChecklistItem[];
  associatedDate?: string | null; // Optional day on week board
  isConvertedToTask?: boolean;
  convertedTaskId?: string;
}

export interface NotebookEntry {
  id: string;
  rawText: string;
  createdAt: string; // Full ISO string
  displayDate: string; // e.g. "11/09/2026"
  createdTasks: Task[];
  createdNotes: NoteItem[];
  clarificationQuestion?: string | null;
  userAnswer?: string;
}

export type MainTab = 'semana' | 'caderno' | 'anotacoes' | 'tarefas';

export type TaskFilter = 'todos' | 'hoje' | 'semana' | 'proxima' | 'sem_prazo';
