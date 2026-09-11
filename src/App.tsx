import React, { useState, useEffect } from 'react';
import { Task, NoteItem, NotebookEntry, MainTab, TaskCategory } from './types';
import { INITIAL_TASKS, INITIAL_NOTES, INITIAL_ENTRIES } from './data/initialData';
import { getTodayDateStr, formatPtDate } from './utils/dateUtils';
import { analyzeNoteWithAI } from './utils/nlpParser';
import { SemanaView } from './components/SemanaView';
import { CadernoView } from './components/CadernoView';
import { AnotacoesView } from './components/AnotacoesView';
import { TarefasView } from './components/TarefasView';
import { TaskDetailModal } from './components/TaskDetailModal';
import {
  Calendar,
  BookOpen,
  StickyNote,
  ListTodo,
  Sparkles,
  RotateCcw,
  CheckCircle,
} from 'lucide-react';

const STORAGE_KEYS = {
  TASKS: 'caderno_planner_tasks_v1',
  NOTES: 'caderno_planner_notes_v1',
  ENTRIES: 'caderno_planner_entries_v1',
};

export default function App() {
  // Load state from localStorage or seed with initial data
  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TASKS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_TASKS;
  });

  const [notes, setNotes] = useState<NoteItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.NOTES);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_NOTES;
  });

  const [entries, setEntries] = useState<NotebookEntry[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ENTRIES);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_ENTRIES;
  });

  const [currentTab, setCurrentTab] = useState<MainTab>('semana');
  const [currentWeekRefDate, setCurrentWeekRefDate] = useState<string>(getTodayDateStr());
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [highlightEntryId, setHighlightEntryId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync to local storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
    } catch (e) {
      console.error(e);
    }
  }, [tasks]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(notes));
    } catch (e) {
      console.error(e);
    }
  }, [notes]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(entries));
    } catch (e) {
      console.error(e);
    }
  }, [entries]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 4000);
  };

  // Toggle task completion
  const handleToggleTaskStatus = (taskId: string) => {
    const today = getTodayDateStr();
    const todayFormatted = formatPtDate(today);

    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const newStatus = t.status === 'concluido' ? 'pendente' : 'concluido';
          const nowIso = new Date().toISOString();
          const logLine = `${todayFormatted} — ${t.title} — ${newStatus === 'concluido' ? 'CONCLUÍDO' : 'REABERTO'}`;

          return {
            ...t,
            status: newStatus,
            completedAt: newStatus === 'concluido' ? nowIso : null,
            historyLog: [logLine, ...(t.historyLog || [])],
          };
        }
        return t;
      })
    );

    // Update selectedTask if currently opened in modal
    if (selectedTask && selectedTask.id === taskId) {
      setSelectedTask((prev) =>
        prev
          ? {
              ...prev,
              status: prev.status === 'concluido' ? 'pendente' : 'concluido',
            }
          : null
      );
    }
  };

  // Move task to today
  const handleMoveToToday = (taskId: string) => {
    const today = getTodayDateStr();
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              targetDate: today,
              deadlineText: 'Hoje',
              status: 'pendente',
            }
          : t
      )
    );
    showToast('Tarefa movida para hoje com sucesso!');
    if (selectedTask && selectedTask.id === taskId) {
      setSelectedTask((prev) =>
        prev ? { ...prev, targetDate: today, deadlineText: 'Hoje', status: 'pendente' } : null
      );
    }
  };

  // Reschedule task
  const handleRescheduleTask = (taskId: string, newDate: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              targetDate: newDate,
              deadlineText: formatPtDate(newDate),
              status: newDate < getTodayDateStr() ? 'atrasado' : 'pendente',
            }
          : t
      )
    );
    showToast(`Tarefa reprogramada para ${formatPtDate(newDate)}!`);
  };

  // Quick add task from week column
  const handleQuickAddTask = (title: string, targetDate: string) => {
    const today = getTodayDateStr();
    const newTask: Task = {
      id: `task-${Date.now()}`,
      title,
      person: null,
      deadlineText: formatPtDate(targetDate),
      targetDate,
      category: 'Trabalho',
      priority: 'media',
      status: targetDate < today ? 'atrasado' : 'pendente',
      originalNoteId: '',
      originalNoteText: `Inserido diretamente no dia ${formatPtDate(targetDate)}.`,
      createdDate: today,
    };
    setTasks((prev) => [newTask, ...prev]);
    showToast('Tarefa adicionada à semana!');
  };

  // Process freeform note in Caderno
  const handleProcessNote = async (rawText: string) => {
    const today = getTodayDateStr();
    const entryId = `entry-${Date.now()}`;
    const displayDate = formatPtDate(today);

    // Call intelligent parser (Gemini API or local fallback)
    const result = await analyzeNoteWithAI(rawText, today);

    // Create tasks
    const newTasks: Task[] = result.tasks.map((t, idx) => ({
      id: `task-${Date.now()}-${idx}`,
      title: t.title,
      person: t.person,
      deadlineText: t.deadlineText,
      targetDate: t.suggestedDate,
      category: t.category,
      priority: t.priority,
      status: t.suggestedDate < today ? 'atrasado' : 'pendente',
      originalNoteId: entryId,
      originalNoteText: rawText,
      createdDate: today,
    }));

    // Create notes
    const newNotes: NoteItem[] = result.notes.map((n, idx) => ({
      id: `note-${Date.now()}-${idx}`,
      type: n.type,
      title: n.title,
      content: n.content,
      createdDate: today,
      originalNotebookEntryId: entryId,
      associatedDate: today,
      checklistItems: n.items?.map((itemText, i) => ({
        id: `chk-${Date.now()}-${idx}-${i}`,
        text: itemText,
        done: false,
      })),
    }));

    const newEntry: NotebookEntry = {
      id: entryId,
      rawText,
      createdAt: new Date().toISOString(),
      displayDate,
      createdTasks: newTasks,
      createdNotes: newNotes,
    };

    setEntries((prev) => [newEntry, ...prev]);
    if (newTasks.length > 0) {
      setTasks((prev) => [...newTasks, ...prev]);
    }
    if (newNotes.length > 0) {
      setNotes((prev) => [...newNotes, ...prev]);
    }

    const toastMsg =
      newTasks.length > 0
        ? `✨ Organizado: ${newTasks.length} ${newTasks.length === 1 ? 'tarefa criada' : 'tarefas criadas'} na sua semana!`
        : `📝 Anotação salva com sucesso!`;
    showToast(toastMsg);
  };

  // Convert note to task
  const handleConvertToTask = (noteId: string, targetDate: string, category: TaskCategory) => {
    const note = notes.find((n) => n.id === noteId);
    if (!note) return;

    const today = getTodayDateStr();
    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: note.title,
      person: null,
      deadlineText: formatPtDate(targetDate),
      targetDate,
      category,
      priority: 'media',
      status: targetDate < today ? 'atrasado' : 'pendente',
      originalNoteId: note.originalNotebookEntryId || '',
      originalNoteText: note.content,
      createdDate: today,
    };

    setTasks((prev) => [newTask, ...prev]);
    setNotes((prev) =>
      prev.map((n) =>
        n.id === noteId ? { ...n, isConvertedToTask: true, convertedTaskId: newTask.id } : n
      )
    );
    showToast('Anotação transformada em tarefa com sucesso!');
  };

  // Toggle checklist item in note
  const handleToggleChecklistItem = (noteId: string, itemId: string) => {
    setNotes((prev) =>
      prev.map((n) => {
        if (n.id === noteId && n.checklistItems) {
          return {
            ...n,
            checklistItems: n.checklistItems.map((item) =>
              item.id === itemId ? { ...item, done: !item.done } : item
            ),
          };
        }
        return n;
      })
    );
  };

  // Delete handlers
  const handleDeleteTask = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    showToast('Tarefa removida.');
  };

  const handleDeleteNote = (noteId: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== noteId));
    showToast('Anotação removida.');
  };

  const handleDeleteEntry = (entryId: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== entryId));
    setTasks((prev) => prev.filter((t) => t.originalNoteId !== entryId));
    setNotes((prev) => prev.filter((n) => n.originalNotebookEntryId !== entryId));
    showToast('Registro do caderno e tarefas associadas removidos.');
  };

  // Reset demo data
  const handleResetData = () => {
    if (window.confirm('Deseja recarregar os exemplos iniciais do caderno e planner?')) {
      setTasks(INITIAL_TASKS);
      setNotes(INITIAL_NOTES);
      setEntries(INITIAL_ENTRIES);
      localStorage.removeItem(STORAGE_KEYS.TASKS);
      localStorage.removeItem(STORAGE_KEYS.NOTES);
      localStorage.removeItem(STORAGE_KEYS.ENTRIES);
      showToast('Dados de exemplo restaurados!');
    }
  };

  // Navigation from task directly to notebook entry
  const handleOpenNotebookEntry = (entryId: string) => {
    setHighlightEntryId(entryId);
    setCurrentTab('caderno');
    setTimeout(() => {
      const el = document.getElementById(`notebook-entry-${entryId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 150);
  };

  return (
    <div className="min-h-screen bg-slate-50/70 flex flex-col text-slate-800 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Toast banner */}
      {toastMessage && (
        <div
          id="app-toast"
          className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 animate-bounce"
        >
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Brand */}
          <div
            onClick={() => setCurrentTab('semana')}
            className="flex items-center gap-2.5 cursor-pointer select-none"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white text-base font-black shadow-xs">
              📓
            </div>
            <div>
              <span className="text-base font-black tracking-tight text-slate-900 leading-tight block">
                Caderno & Planner
              </span>
              <span className="text-[10px] font-semibold text-indigo-600 tracking-wider uppercase block">
                Inteligência Semanal
              </span>
            </div>
          </div>

          {/* The 4 Main Areas Navigation as explicitly defined in prompt:
              🏠 1. SEMANA | 📓 2. CADERNO | 📝 3. ANOTAÇÕES | 📋 4. TAREFAS */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl">
            <button
              id="nav-tab-semana"
              onClick={() => setCurrentTab('semana')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                currentTab === 'semana'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>1. Semana</span>
            </button>

            <button
              id="nav-tab-caderno"
              onClick={() => setCurrentTab('caderno')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                currentTab === 'caderno'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>2. Caderno</span>
            </button>

            <button
              id="nav-tab-anotacoes"
              onClick={() => setCurrentTab('anotacoes')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                currentTab === 'anotacoes'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <StickyNote className="w-3.5 h-3.5" />
              <span>3. Anotações</span>
            </button>

            <button
              id="nav-tab-tarefas"
              onClick={() => setCurrentTab('tarefas')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                currentTab === 'tarefas'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ListTodo className="w-3.5 h-3.5" />
              <span>4. Tarefas</span>
            </button>
          </nav>

          {/* Quick Action: Escrever no Caderno */}
          <div className="flex items-center gap-2">
            <button
              id="header-escrever-btn"
              onClick={() => setCurrentTab('caderno')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors shadow-xs"
            >
              <span>✍️</span>
              <span className="hidden sm:inline">Escrever</span>
            </button>
          </div>
        </div>

        {/* Mobile Nav Tabs */}
        <div className="md:hidden flex items-center justify-around border-t border-slate-200 px-2 py-1.5 bg-slate-50/90 text-xs">
          <button
            onClick={() => setCurrentTab('semana')}
            className={`py-1 px-2.5 rounded-lg font-bold flex items-center gap-1 ${
              currentTab === 'semana' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600'
            }`}
          >
            <span>Semana</span>
          </button>
          <button
            onClick={() => setCurrentTab('caderno')}
            className={`py-1 px-2.5 rounded-lg font-bold flex items-center gap-1 ${
              currentTab === 'caderno' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600'
            }`}
          >
            <span>Caderno</span>
          </button>
          <button
            onClick={() => setCurrentTab('anotacoes')}
            className={`py-1 px-2.5 rounded-lg font-bold flex items-center gap-1 ${
              currentTab === 'anotacoes' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600'
            }`}
          >
            <span>Anotações</span>
          </button>
          <button
            onClick={() => setCurrentTab('tarefas')}
            className={`py-1 px-2.5 rounded-lg font-bold flex items-center gap-1 ${
              currentTab === 'tarefas' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600'
            }`}
          >
            <span>Tarefas</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {currentTab === 'semana' && (
          <SemanaView
            tasks={tasks}
            notes={notes}
            currentWeekRefDate={currentWeekRefDate}
            onSetWeekRefDate={setCurrentWeekRefDate}
            onToggleTaskStatus={handleToggleTaskStatus}
            onMoveToToday={handleMoveToToday}
            onRescheduleTask={handleRescheduleTask}
            onOpenTaskDetail={setSelectedTask}
            onGoToCaderno={() => setCurrentTab('caderno')}
            onQuickAddTask={handleQuickAddTask}
          />
        )}

        {currentTab === 'caderno' && (
          <CadernoView
            entries={entries}
            tasks={tasks}
            notes={notes}
            onProcessNote={handleProcessNote}
            onToggleTaskStatus={handleToggleTaskStatus}
            onOpenTaskDetail={setSelectedTask}
            onGoToSemana={() => setCurrentTab('semana')}
            onDeleteEntry={handleDeleteEntry}
            highlightEntryId={highlightEntryId}
          />
        )}

        {currentTab === 'anotacoes' && (
          <AnotacoesView
            notes={notes}
            onCreateNote={(n) => {
              const newNote: NoteItem = {
                ...n,
                id: `note-${Date.now()}`,
                createdDate: getTodayDateStr(),
              };
              setNotes((prev) => [newNote, ...prev]);
              showToast('Nova anotação registrada!');
            }}
            onDeleteNote={handleDeleteNote}
            onToggleChecklistItem={handleToggleChecklistItem}
            onConvertToTask={handleConvertToTask}
          />
        )}

        {currentTab === 'tarefas' && (
          <TarefasView
            tasks={tasks}
            onToggleTaskStatus={handleToggleTaskStatus}
            onOpenTaskDetail={setSelectedTask}
            onMoveToToday={handleMoveToToday}
            onRescheduleTask={handleRescheduleTask}
            onGoToCaderno={() => setCurrentTab('caderno')}
          />
        )}
      </main>

      {/* Task Detail Modal */}
      <TaskDetailModal
        task={selectedTask}
        onClose={() => setSelectedTask(null)}
        onToggleStatus={handleToggleTaskStatus}
        onMoveToToday={handleMoveToToday}
        onReschedule={handleRescheduleTask}
        onDeleteTask={handleDeleteTask}
        onOpenNotebookEntry={handleOpenNotebookEntry}
      />

      {/* Minimal Footer */}
      <footer className="mt-auto border-t border-slate-200/80 bg-white py-4 px-6 text-center text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-3 max-w-7xl mx-auto w-full">
        <div>
          <span>Caderno & Planner Inteligente</span> •{' '}
          <span className="text-slate-500">
            "Eu escrevo como em um caderno. O Planner transforma em organização."
          </span>
        </div>

        <button
          onClick={handleResetData}
          className="text-[11px] text-slate-400 hover:text-indigo-600 flex items-center gap-1 transition-colors"
          title="Recarregar exemplos padrão"
        >
          <RotateCcw className="w-3 h-3" /> Restaurar exemplos
        </button>
      </footer>
    </div>
  );
}
