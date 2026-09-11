import React, { useState, useEffect, useRef } from 'react';
import { Task, NoteItem, NotebookEntry, MainTab, TaskCategory, UserAccount } from './types';
import { INITIAL_TASKS, INITIAL_NOTES, INITIAL_ENTRIES } from './data/initialData';
import { getTodayDateStr, formatPtDate } from './utils/dateUtils';
import { analyzeNoteWithAI } from './utils/nlpParser';
import {
  testFirestoreConnection,
  subscribeToUserCloudData,
  saveTaskToCloud,
  deleteTaskFromCloud,
  saveNoteToCloud,
  deleteNoteFromCloud,
  saveEntryToCloud,
  deleteEntryFromCloud,
  DEFAULT_ADMIN,
  subscribeToUsersCloud,
  saveUserToCloud,
  deleteUserFromCloud,
  clearAllUserDataFromCloud,
} from './firebase';
import { SemanaView } from './components/SemanaView';
import { CadernoView } from './components/CadernoView';
import { AnotacoesView } from './components/AnotacoesView';
import { TarefasView } from './components/TarefasView';
import { TaskDetailModal } from './components/TaskDetailModal';
import { UsuariosView } from './components/UsuariosView';
import { LoginView } from './components/LoginView';
import {
  Calendar,
  BookOpen,
  StickyNote,
  ListTodo,
  Sparkles,
  RotateCcw,
  Cloud,
  Smartphone,
  Laptop,
  LogOut as LogOutIcon,
  LogIn,
  CheckCircle2,
  Users,
  ShieldCheck,
  User as UserIcon,
  Trash2,
} from 'lucide-react';

const STORAGE_ACTIVE_USER_LOCAL = 'caderno_planner_active_user_v1';
const STORAGE_ACTIVE_USER_SESSION = 'caderno_planner_active_user_session_v1';
const STORAGE_ALL_USERS = 'caderno_planner_users_list_v1';
const STORAGE_ZERO_RESET_KEY = 'caderno_planner_zero_reset_v5';

// Purge any old test/demo data in browser storage
try {
  if (typeof window !== 'undefined' && localStorage.getItem(STORAGE_ZERO_RESET_KEY) !== 'done') {
    Object.keys(localStorage).forEach((key) => {
      if (
        key.startsWith('caderno_planner_tasks') ||
        key.startsWith('caderno_planner_notes') ||
        key.startsWith('caderno_planner_entries')
      ) {
        localStorage.removeItem(key);
      }
    });
    localStorage.setItem(STORAGE_ZERO_RESET_KEY, 'done');
  }
} catch (e) {
  console.error(e);
}

export default function App() {
  // 1. Users List & Active User State
  const [allUsers, setAllUsers] = useState<UserAccount[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_ALL_USERS);
      if (saved) {
        const parsed = JSON.parse(saved) as UserAccount[];
        // Ensure default admin exists
        if (!parsed.some((u) => u.username.toLowerCase() === 'henrique')) {
          parsed.unshift(DEFAULT_ADMIN);
        }
        return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return [DEFAULT_ADMIN];
  });

  const [activeUser, setActiveUser] = useState<UserAccount | null>(() => {
    try {
      // 1. Check local storage (remembered / deixar logado)
      const savedLocal = localStorage.getItem(STORAGE_ACTIVE_USER_LOCAL);
      if (savedLocal) return JSON.parse(savedLocal);

      // 2. Check session storage (single session)
      const savedSession = sessionStorage.getItem(STORAGE_ACTIVE_USER_SESSION);
      if (savedSession) return JSON.parse(savedSession);
    } catch (e) {
      console.error(e);
    }
    // Default to admin Henrique logged in initially if no choice made yet,
    // so Henrique immediately has access with remember me
    return DEFAULT_ADMIN;
  });

  // Cloud status
  const [cloudConnected, setCloudConnected] = useState(false);
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);

  // App UI State
  const [currentTab, setCurrentTab] = useState<MainTab>('semana');
  const [currentWeekRefDate, setCurrentWeekRefDate] = useState<string>(getTodayDateStr());
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [highlightEntryId, setHighlightEntryId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showSwitchUserModal, setShowSwitchUserModal] = useState(false);

  const initialUploadDoneRef = useRef<Record<string, boolean>>({});

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 4000);
  };

  // Helper storage key generators per user for total isolation
  const getUserTasksKey = (uid: string) => `caderno_planner_tasks_user_${uid}`;
  const getUserNotesKey = (uid: string) => `caderno_planner_notes_user_${uid}`;
  const getUserEntriesKey = (uid: string) => `caderno_planner_entries_user_${uid}`;

  // Local state for active user's planner (all initialized clean from scratch)
  const [tasks, setTasks] = useState<Task[]>(() => {
    if (!activeUser) return [];
    try {
      const saved = localStorage.getItem(getUserTasksKey(activeUser.id));
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  const [notes, setNotes] = useState<NoteItem[]>(() => {
    if (!activeUser) return [];
    try {
      const saved = localStorage.getItem(getUserNotesKey(activeUser.id));
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  const [entries, setEntries] = useState<NotebookEntry[]>(() => {
    if (!activeUser) return [];
    try {
      const saved = localStorage.getItem(getUserEntriesKey(activeUser.id));
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  // Reload user data when activeUser changes
  useEffect(() => {
    if (!activeUser) {
      setTasks([]);
      setNotes([]);
      setEntries([]);
      return;
    }

    try {
      const savedTasks = localStorage.getItem(getUserTasksKey(activeUser.id));
      setTasks(savedTasks ? JSON.parse(savedTasks) : []);

      const savedNotes = localStorage.getItem(getUserNotesKey(activeUser.id));
      setNotes(savedNotes ? JSON.parse(savedNotes) : []);

      const savedEntries = localStorage.getItem(getUserEntriesKey(activeUser.id));
      setEntries(savedEntries ? JSON.parse(savedEntries) : []);
    } catch (err) {
      console.error('Erro ao carregar dados locais do usuário:', err);
    }
  }, [activeUser?.id]);

  // Check cloud connection on mount
  useEffect(() => {
    testFirestoreConnection().then((connected) => {
      setCloudConnected(connected);
    });

    // Subscribe to cloud users directory so created users immediately sync across PC and mobile
    const unsubUsers = subscribeToUsersCloud((cloudUsers) => {
      if (cloudUsers.length > 0) {
        setAllUsers((prev) => {
          const map = new Map<string, UserAccount>();
          // Add default admin first
          map.set(DEFAULT_ADMIN.username.toLowerCase(), DEFAULT_ADMIN);
          // Add local ones
          prev.forEach((u) => map.set(u.username.toLowerCase(), u));
          // Overwrite with cloud ones
          cloudUsers.forEach((u) => map.set(u.username.toLowerCase(), u));
          const merged = Array.from(map.values());
          try {
            localStorage.setItem(STORAGE_ALL_USERS, JSON.stringify(merged));
          } catch (e) {
            console.error(e);
          }
          return merged;
        });
      } else {
        // Seed default admin in cloud if empty
        saveUserToCloud(DEFAULT_ADMIN);
      }
    });

    // One-time automatic cleanup of old cloud demo records
    if (typeof window !== 'undefined' && sessionStorage.getItem('cloud_demo_purged_v5') !== 'done') {
      sessionStorage.setItem('cloud_demo_purged_v5', 'done');
      clearAllUserDataFromCloud('henrique');
    }

    return () => unsubUsers();
  }, []);

  // Sync active user's tasks, notes, and entries with Firestore in real time
  useEffect(() => {
    if (!activeUser) return;

    setIsCloudSyncing(true);

    const unsubscribeSync = subscribeToUserCloudData(activeUser.id, {
      onTasks: (cloudTasks) => {
        setIsCloudSyncing(false);
        setTasks(cloudTasks);
        try {
          localStorage.setItem(getUserTasksKey(activeUser.id), JSON.stringify(cloudTasks));
        } catch (e) {
          console.error(e);
        }
      },
      onNotes: (cloudNotes) => {
        setNotes(cloudNotes);
        try {
          localStorage.setItem(getUserNotesKey(activeUser.id), JSON.stringify(cloudNotes));
        } catch (e) {
          console.error(e);
        }
      },
      onEntries: (cloudEntries) => {
        setEntries(cloudEntries);
        try {
          localStorage.setItem(getUserEntriesKey(activeUser.id), JSON.stringify(cloudEntries));
        } catch (e) {
          console.error(e);
        }
      },
    });

    return () => unsubscribeSync();
  }, [activeUser?.id]);

  // Persist local backup whenever active user's state changes
  useEffect(() => {
    if (!activeUser) return;
    try {
      localStorage.setItem(getUserTasksKey(activeUser.id), JSON.stringify(tasks));
    } catch (e) {
      console.error(e);
    }
  }, [tasks, activeUser?.id]);

  useEffect(() => {
    if (!activeUser) return;
    try {
      localStorage.setItem(getUserNotesKey(activeUser.id), JSON.stringify(notes));
    } catch (e) {
      console.error(e);
    }
  }, [notes, activeUser?.id]);

  useEffect(() => {
    if (!activeUser) return;
    try {
      localStorage.setItem(getUserEntriesKey(activeUser.id), JSON.stringify(entries));
    } catch (e) {
      console.error(e);
    }
  }, [entries, activeUser?.id]);

  // Persist allUsers to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_ALL_USERS, JSON.stringify(allUsers));
    } catch (e) {
      console.error(e);
    }
  }, [allUsers]);

  // -------------------------------------------------------------
  // LOGIN / LOGOUT HANDLERS
  // -------------------------------------------------------------
  const handleLogin = (
    enteredUsername: string,
    enteredPass: string,
    rememberMe: boolean
  ): { success: boolean; error?: string } => {
    const cleanUser = enteredUsername.trim().toLowerCase();
    const cleanPass = enteredPass.trim();

    // Check against all users
    let matchedUser = allUsers.find(
      (u) => u.username.toLowerCase() === cleanUser && u.password === cleanPass
    );

    // Fallback for default admin Henrique (1234)
    if (!matchedUser && cleanUser === 'henrique' && cleanPass === '1234') {
      matchedUser = DEFAULT_ADMIN;
    }

    if (!matchedUser) {
      return {
        success: false,
        error: 'Usuário ou senha incorretos. Verifique suas credenciais.',
      };
    }

    // Set active user
    setActiveUser(matchedUser);
    setShowSwitchUserModal(false);

    // "Deixar logado" handling
    if (rememberMe) {
      localStorage.setItem(STORAGE_ACTIVE_USER_LOCAL, JSON.stringify(matchedUser));
      sessionStorage.removeItem(STORAGE_ACTIVE_USER_SESSION);
    } else {
      sessionStorage.setItem(STORAGE_ACTIVE_USER_SESSION, JSON.stringify(matchedUser));
      localStorage.removeItem(STORAGE_ACTIVE_USER_LOCAL);
    }

    showToast(`Conectado como ${matchedUser.name}! Seu planner individual foi carregado.`);
    return { success: true };
  };

  const handleLogout = () => {
    localStorage.removeItem(STORAGE_ACTIVE_USER_LOCAL);
    sessionStorage.removeItem(STORAGE_ACTIVE_USER_SESSION);
    setActiveUser(null);
    setCurrentTab('semana');
    showToast('Você saiu da sua conta.');
  };

  // -------------------------------------------------------------
  // ADMIN USER CREATION (Exclusively by Henrique)
  // -------------------------------------------------------------
  const handleCreateUser = async (
    newUserData: Omit<UserAccount, 'id' | 'createdAt' | 'createdBy'>
  ): Promise<boolean> => {
    if (!activeUser || (activeUser.role !== 'admin' && activeUser.username !== 'henrique')) {
      showToast('Apenas o administrador Henrique pode criar novos logins.');
      return false;
    }

    const newAccount: UserAccount = {
      ...newUserData,
      id: `user-${newUserData.username.toLowerCase()}`,
      createdAt: new Date().toISOString(),
      createdBy: activeUser.username,
    };

    setAllUsers((prev) => [...prev, newAccount]);

    // Save in Firestore so user can immediately login on mobile or PC
    await saveUserToCloud(newAccount);

    showToast(`Novo usuário @${newAccount.username} criado e sincronizado na nuvem!`);
    return true;
  };

  const handleDeleteUser = async (userId: string) => {
    if (!activeUser || (activeUser.role !== 'admin' && activeUser.username !== 'henrique')) {
      return;
    }
    setAllUsers((prev) => prev.filter((u) => u.id !== userId));
    await deleteUserFromCloud(userId);
    showToast('Usuário removido.');
  };

  const handleUpdatePassword = async (userId: string, newPass: string) => {
    if (!activeUser || (activeUser.role !== 'admin' && activeUser.username !== 'henrique')) {
      return;
    }
    const target = allUsers.find((u) => u.id === userId);
    if (!target) return;

    const updated = { ...target, password: newPass };
    setAllUsers((prev) => prev.map((u) => (u.id === userId ? updated : u)));
    await saveUserToCloud(updated);
    showToast(`Senha do usuário @${target.username} atualizada!`);
  };

  // -------------------------------------------------------------
  // TASK / PLANNER ACTIONS (Scoped to Active User)
  // -------------------------------------------------------------
  const handleToggleTaskStatus = (taskId: string) => {
    const today = getTodayDateStr();
    const todayFormatted = formatPtDate(today);

    let updatedTask: Task | null = null;

    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const newStatus = t.status === 'concluido' ? 'pendente' : 'concluido';
          const nowIso = new Date().toISOString();
          const logLine = `${todayFormatted} — ${t.title} — ${newStatus === 'concluido' ? 'CONCLUÍDO' : 'REABERTO'}`;

          updatedTask = {
            ...t,
            status: newStatus,
            completedAt: newStatus === 'concluido' ? nowIso : null,
            historyLog: [logLine, ...(t.historyLog || [])],
          };
          return updatedTask;
        }
        return t;
      })
    );

    if (updatedTask && activeUser) {
      saveTaskToCloud(updatedTask, activeUser.id);
    }

    if (selectedTask && selectedTask.id === taskId && updatedTask) {
      setSelectedTask(updatedTask);
    }
  };

  const handleMoveToToday = (taskId: string) => {
    const today = getTodayDateStr();
    let updatedTask: Task | null = null;

    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          updatedTask = {
            ...t,
            targetDate: today,
            deadlineText: 'Hoje',
            status: 'pendente',
          };
          return updatedTask;
        }
        return t;
      })
    );

    if (updatedTask && activeUser) {
      saveTaskToCloud(updatedTask, activeUser.id);
    }

    showToast('Tarefa movida para hoje!');
    if (selectedTask && selectedTask.id === taskId && updatedTask) {
      setSelectedTask(updatedTask);
    }
  };

  const handleRescheduleTask = (taskId: string, newDate: string) => {
    let updatedTask: Task | null = null;

    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          updatedTask = {
            ...t,
            targetDate: newDate,
            deadlineText: formatPtDate(newDate),
            status: newDate < getTodayDateStr() ? 'atrasado' : 'pendente',
          };
          return updatedTask;
        }
        return t;
      })
    );

    if (updatedTask && activeUser) {
      saveTaskToCloud(updatedTask, activeUser.id);
    }

    showToast(`Tarefa reprogramada para ${formatPtDate(newDate)}!`);
  };

  const handleQuickAddTask = (title: string, targetDate: string) => {
    if (!activeUser) return;
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
      userId: activeUser.id,
    };

    setTasks((prev) => [newTask, ...prev]);
    saveTaskToCloud(newTask, activeUser.id);
    showToast('Tarefa adicionada à sua semana!');
  };

  const handleProcessNote = async (rawText: string) => {
    if (!activeUser) return;
    const today = getTodayDateStr();
    const entryId = `entry-${Date.now()}`;
    const displayDate = formatPtDate(today);

    const result = await analyzeNoteWithAI(rawText, today);

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
      userId: activeUser.id,
    }));

    const newNotes: NoteItem[] = result.notes.map((n, idx) => ({
      id: `note-${Date.now()}-${idx}`,
      type: n.type,
      title: n.title,
      content: n.content,
      createdDate: today,
      originalNotebookEntryId: entryId,
      associatedDate: today,
      userId: activeUser.id,
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
      userId: activeUser.id,
    };

    setEntries((prev) => [newEntry, ...prev]);
    if (newTasks.length > 0) {
      setTasks((prev) => [...newTasks, ...prev]);
    }
    if (newNotes.length > 0) {
      setNotes((prev) => [...newNotes, ...prev]);
    }

    saveEntryToCloud(newEntry, activeUser.id);
    newTasks.forEach((t) => saveTaskToCloud(t, activeUser.id));
    newNotes.forEach((n) => saveNoteToCloud(n, activeUser.id));

    const toastMsg =
      newTasks.length > 0
        ? `✨ Organizado: ${newTasks.length} ${newTasks.length === 1 ? 'tarefa criada' : 'tarefas criadas'} no seu planner!`
        : `📝 Anotação salva com sucesso!`;
    showToast(toastMsg);
  };

  const handleConvertToTask = (noteId: string, targetDate: string, category: TaskCategory) => {
    if (!activeUser) return;
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
      userId: activeUser.id,
    };

    const updatedNote: NoteItem = {
      ...note,
      isConvertedToTask: true,
      convertedTaskId: newTask.id,
    };

    setTasks((prev) => [newTask, ...prev]);
    setNotes((prev) => prev.map((n) => (n.id === noteId ? updatedNote : n)));

    saveTaskToCloud(newTask, activeUser.id);
    saveNoteToCloud(updatedNote, activeUser.id);

    showToast('Anotação transformada em tarefa com sucesso!');
  };

  const handleToggleChecklistItem = (noteId: string, itemId: string) => {
    if (!activeUser) return;
    let updatedNote: NoteItem | null = null;
    setNotes((prev) =>
      prev.map((n) => {
        if (n.id === noteId && n.checklistItems) {
          updatedNote = {
            ...n,
            checklistItems: n.checklistItems.map((item) =>
              item.id === itemId ? { ...item, done: !item.done } : item
            ),
          };
          return updatedNote;
        }
        return n;
      })
    );

    if (updatedNote) {
      saveNoteToCloud(updatedNote, activeUser.id);
    }
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    deleteTaskFromCloud(taskId);
    showToast('Tarefa removida.');
  };

  const handleDeleteNote = (noteId: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== noteId));
    deleteNoteFromCloud(noteId);
    showToast('Anotação removida.');
  };

  const handleDeleteEntry = (entryId: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== entryId));
    setTasks((prev) => prev.filter((t) => t.originalNoteId !== entryId));
    setNotes((prev) => prev.filter((n) => n.originalNotebookEntryId !== entryId));
    deleteEntryFromCloud(entryId);
    showToast('Registro do caderno removido.');
  };

  const handleClearAllData = async () => {
    if (!activeUser) return;
    const confirmed = window.confirm(
      'Tem certeza que deseja ZERAR todas as tarefas, anotações e registros do caderno para começar 100% do zero?'
    );
    if (!confirmed) return;

    setTasks([]);
    setNotes([]);
    setEntries([]);

    try {
      localStorage.removeItem(getUserTasksKey(activeUser.id));
      localStorage.removeItem(getUserNotesKey(activeUser.id));
      localStorage.removeItem(getUserEntriesKey(activeUser.id));
    } catch (e) {
      console.error(e);
    }

    await clearAllUserDataFromCloud(activeUser.id);
    showToast('✨ Todas as informações foram zeradas! Seu caderno está 100% limpo para começar.');
  };

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

  // If user is not logged in, show the Login screen
  if (!activeUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center">
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 animate-bounce">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>{toastMessage}</span>
          </div>
        )}
        <LoginView allUsers={allUsers} onLogin={handleLogin} />
      </div>
    );
  }

  const isAdmin = activeUser.role === 'admin' || activeUser.username === 'henrique';

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

      {/* Switch User Modal (if opened while logged in) */}
      {showSwitchUserModal && (
        <LoginView
          allUsers={allUsers}
          onLogin={handleLogin}
          onCancel={() => setShowSwitchUserModal(false)}
          isModal={true}
        />
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

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl">
            <button
              id="nav-tab-semana"
              onClick={() => setCurrentTab('semana')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
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
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
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
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
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
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                currentTab === 'tarefas'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ListTodo className="w-3.5 h-3.5" />
              <span>4. Tarefas</span>
            </button>

            {/* Exclusive Tab: 5. Usuários (Only for Admin Henrique) */}
            {isAdmin && (
              <button
                id="nav-tab-usuarios"
                onClick={() => setCurrentTab('usuarios')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  currentTab === 'usuarios'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-indigo-700 bg-indigo-50/70 hover:bg-indigo-100/70'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>5. Usuários</span>
                <span className="text-[9px] bg-amber-400 text-slate-900 px-1 py-0.2 rounded font-black uppercase">
                  Admin
                </span>
              </button>
            )}
          </nav>

          {/* User Profile & Actions */}
          <div className="flex items-center gap-2">
            {/* Active User Chip */}
            <div
              onClick={() => setShowSwitchUserModal(true)}
              className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200/80 cursor-pointer border border-slate-200/80 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 transition-colors select-none"
              title="Clique para trocar de usuário"
            >
              <div
                className={`w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-bold text-white ${
                  isAdmin ? 'bg-indigo-600' : 'bg-slate-700'
                }`}
              >
                {activeUser.name.charAt(0).toUpperCase()}
              </div>

              <div className="hidden sm:block text-left leading-none">
                <div className="flex items-center gap-1">
                  <span className="font-bold text-slate-900 text-xs">
                    {activeUser.name.split(' ')[0]}
                  </span>
                  {isAdmin && (
                    <span className="text-[9px] font-bold bg-amber-100 text-amber-900 border border-amber-300 px-1 rounded">
                      Admin
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-slate-500 font-mono">
                  @{activeUser.username}
                </span>
              </div>

              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ml-0.5" title="Sincronizado" />
            </div>

            {/* Logout / Switch User */}
            <button
              id="btn-header-logout"
              onClick={handleLogout}
              className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors"
              title="Sair / Trocar de Usuário"
            >
              <LogOutIcon className="w-4 h-4" />
            </button>

            {/* Write shortcut */}
            <button
              id="header-escrever-btn"
              onClick={() => setCurrentTab('caderno')}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors shadow-xs"
            >
              <span>✍️</span>
              <span className="hidden sm:inline">Escrever</span>
            </button>
          </div>
        </div>

        {/* Mobile Nav Tabs */}
        <div className="md:hidden flex items-center justify-around border-t border-slate-200 px-1 py-1.5 bg-slate-50/90 text-xs overflow-x-auto">
          <button
            onClick={() => setCurrentTab('semana')}
            className={`py-1 px-2 rounded-lg font-bold flex items-center gap-1 ${
              currentTab === 'semana' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600'
            }`}
          >
            <span>Semana</span>
          </button>
          <button
            onClick={() => setCurrentTab('caderno')}
            className={`py-1 px-2 rounded-lg font-bold flex items-center gap-1 ${
              currentTab === 'caderno' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600'
            }`}
          >
            <span>Caderno</span>
          </button>
          <button
            onClick={() => setCurrentTab('anotacoes')}
            className={`py-1 px-2 rounded-lg font-bold flex items-center gap-1 ${
              currentTab === 'anotacoes' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600'
            }`}
          >
            <span>Anotações</span>
          </button>
          <button
            onClick={() => setCurrentTab('tarefas')}
            className={`py-1 px-2 rounded-lg font-bold flex items-center gap-1 ${
              currentTab === 'tarefas' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600'
            }`}
          >
            <span>Tarefas</span>
          </button>
          {isAdmin && (
            <button
              onClick={() => setCurrentTab('usuarios')}
              className={`py-1 px-2 rounded-lg font-bold flex items-center gap-1 ${
                currentTab === 'usuarios'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-indigo-700 bg-indigo-50'
              }`}
            >
              <Users className="w-3 h-3" />
              <span>Usuários</span>
            </button>
          )}
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
                userId: activeUser.id,
              };
              setNotes((prev) => [newNote, ...prev]);
              saveNoteToCloud(newNote, activeUser.id);
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

        {currentTab === 'usuarios' && (
          <UsuariosView
            currentUser={activeUser}
            allUsers={allUsers}
            onCreateUser={handleCreateUser}
            onDeleteUser={handleDeleteUser}
            onUpdatePassword={handleUpdatePassword}
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
        <div className="flex items-center gap-2">
          <span>Caderno & Planner Inteligente</span> •{' '}
          <span className="text-slate-600 font-medium">
            Planner Individual de <strong>{activeUser.name}</strong> (@{activeUser.username})
          </span>
          <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-semibold inline-flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Nuvem Ativa
          </span>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowSwitchUserModal(true)}
            className="text-[11px] text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
          >
            Trocar Usuário
          </button>
          <button
            id="btn-zerar-dados"
            onClick={handleClearAllData}
            className="text-[11px] text-rose-500 hover:text-rose-700 flex items-center gap-1 font-medium transition-colors"
            title="Apagar todas as tarefas e anotações e começar o caderno do zero"
          >
            <Trash2 className="w-3 h-3" /> Zerar tudo e começar do zero
          </button>
        </div>
      </footer>
    </div>
  );
}
