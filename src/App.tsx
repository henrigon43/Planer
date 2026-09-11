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
import { AppLogo } from './components/AppLogo';
import { SiteInfoModal } from './components/SiteInfoModal';
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
  Info,
} from 'lucide-react';

const STORAGE_ACTIVE_USER_LOCAL = 'caderno_planner_active_user_v2';
const STORAGE_ACTIVE_USER_SESSION = 'caderno_planner_active_user_session_v2';
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
      // 1. Check local storage (permanent login - stays connected on refresh/reopen)
      const savedLocal =
        localStorage.getItem(STORAGE_ACTIVE_USER_LOCAL) ||
        localStorage.getItem('caderno_current_user') ||
        localStorage.getItem('caderno_planner_active_user_v1');
      if (savedLocal) {
        const user = JSON.parse(savedLocal);
        if (user && user.id) return user;
      }

      // 2. Check session storage (fallback)
      const savedSession =
        sessionStorage.getItem(STORAGE_ACTIVE_USER_SESSION) ||
        sessionStorage.getItem('caderno_planner_active_user_session_v1');
      if (savedSession) {
        const user = JSON.parse(savedSession);
        if (user && user.id) return user;
      }
    } catch (e) {
      console.error('Erro recuperando login salvo:', e);
    }
    // Returns null only if user has never logged in or explicitly logged out
    return null;
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
  const [showSiteInfoModal, setShowSiteInfoModal] = useState(false);

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

    return () => unsubUsers();
  }, []);

  // Sync active user's tasks, notes, and entries with Firestore in real time
  useEffect(() => {
    if (!activeUser) return;

    setIsCloudSyncing(true);

    const unsubscribeSync = subscribeToUserCloudData(activeUser.id, {
      onTasks: (cloudTasks) => {
        setIsCloudSyncing(false);

        // On first sync on this device, check if there are local tasks created offline/earlier not yet in cloud
        if (!initialUploadDoneRef.current[activeUser.id + '_tasks']) {
          initialUploadDoneRef.current[activeUser.id + '_tasks'] = true;
          try {
            const localSaved = localStorage.getItem(getUserTasksKey(activeUser.id));
            if (localSaved) {
              const localTasks: Task[] = JSON.parse(localSaved);
              const missingInCloud = localTasks.filter(
                (lt) => !cloudTasks.some((ct) => ct.id === lt.id)
              );
              if (missingInCloud.length > 0) {
                console.log(`[Cloud Sync] Sincronizando ${missingInCloud.length} tarefas locais para a nuvem...`);
                missingInCloud.forEach((t) => saveTaskToCloud(t, activeUser.id));
                const merged = [...cloudTasks, ...missingInCloud];
                setTasks(merged);
                localStorage.setItem(getUserTasksKey(activeUser.id), JSON.stringify(merged));
                return;
              }
            }
          } catch (e) {
            console.error(e);
          }
        }

        setTasks(cloudTasks);
        try {
          localStorage.setItem(getUserTasksKey(activeUser.id), JSON.stringify(cloudTasks));
        } catch (e) {
          console.error(e);
        }
      },
      onNotes: (cloudNotes) => {
        // On first sync, upload any local notes missing from cloud
        if (!initialUploadDoneRef.current[activeUser.id + '_notes']) {
          initialUploadDoneRef.current[activeUser.id + '_notes'] = true;
          try {
            const localSaved = localStorage.getItem(getUserNotesKey(activeUser.id));
            if (localSaved) {
              const localNotes: NoteItem[] = JSON.parse(localSaved);
              const missingInCloud = localNotes.filter(
                (ln) => !cloudNotes.some((cn) => cn.id === ln.id)
              );
              if (missingInCloud.length > 0) {
                console.log(`[Cloud Sync] Sincronizando ${missingInCloud.length} notas locais para a nuvem...`);
                missingInCloud.forEach((n) => saveNoteToCloud(n, activeUser.id));
                const merged = [...cloudNotes, ...missingInCloud];
                setNotes(merged);
                localStorage.setItem(getUserNotesKey(activeUser.id), JSON.stringify(merged));
                return;
              }
            }
          } catch (e) {
            console.error(e);
          }
        }

        setNotes(cloudNotes);
        try {
          localStorage.setItem(getUserNotesKey(activeUser.id), JSON.stringify(cloudNotes));
        } catch (e) {
          console.error(e);
        }
      },
      onEntries: (cloudEntries) => {
        // On first sync, upload any local notebook entries missing from cloud
        if (!initialUploadDoneRef.current[activeUser.id + '_entries']) {
          initialUploadDoneRef.current[activeUser.id + '_entries'] = true;
          try {
            const localSaved = localStorage.getItem(getUserEntriesKey(activeUser.id));
            if (localSaved) {
              const localEntries: NotebookEntry[] = JSON.parse(localSaved);
              const missingInCloud = localEntries.filter(
                (le) => !cloudEntries.some((ce) => ce.id === le.id)
              );
              if (missingInCloud.length > 0) {
                console.log(`[Cloud Sync] Sincronizando ${missingInCloud.length} entradas locais para a nuvem...`);
                missingInCloud.forEach((e) => saveEntryToCloud(e, activeUser.id));
                const merged = [...cloudEntries, ...missingInCloud];
                setEntries(merged);
                localStorage.setItem(getUserEntriesKey(activeUser.id), JSON.stringify(merged));
                return;
              }
            }
          } catch (e) {
            console.error(e);
          }
        }

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

  // Persist activeUser to localStorage so page refresh never logs out
  useEffect(() => {
    if (activeUser) {
      try {
        localStorage.setItem(STORAGE_ACTIVE_USER_LOCAL, JSON.stringify(activeUser));
        localStorage.setItem('caderno_current_user', JSON.stringify(activeUser));
        sessionStorage.setItem(STORAGE_ACTIVE_USER_SESSION, JSON.stringify(activeUser));
      } catch (e) {
        console.error('Erro salvando sessão ativa:', e);
      }
    }
  }, [activeUser]);

  // -------------------------------------------------------------
  // LOGIN / LOGOUT HANDLERS
  // -------------------------------------------------------------
  const handleLogin = (
    enteredUsername: string,
    enteredPass: string,
    rememberMe: boolean = true
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

    // Set active user and immediately persist to local storage
    setActiveUser(matchedUser);
    setShowSwitchUserModal(false);

    try {
      localStorage.setItem(STORAGE_ACTIVE_USER_LOCAL, JSON.stringify(matchedUser));
      localStorage.setItem('caderno_current_user', JSON.stringify(matchedUser));
      sessionStorage.setItem(STORAGE_ACTIVE_USER_SESSION, JSON.stringify(matchedUser));
    } catch (e) {
      console.error('Erro ao persistir sessão:', e);
    }

    showToast(`Conectado como ${matchedUser.name}! Seu planner individual foi carregado.`);
    return { success: true };
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem(STORAGE_ACTIVE_USER_LOCAL);
      localStorage.removeItem('caderno_current_user');
      localStorage.removeItem('caderno_planner_active_user_v1');
      sessionStorage.removeItem(STORAGE_ACTIVE_USER_SESSION);
      sessionStorage.removeItem('caderno_planner_active_user_session_v1');
    } catch (e) {
      console.error('Erro ao limpar sessão:', e);
    }
    setActiveUser(null);
    setCurrentTab('semana');
    showToast('Você saiu da sua conta.');
  };

  // Self-registration for new users from the Access Screen
  const handleRegisterUser = async (
    name: string,
    username: string,
    password: string,
    rememberMe: boolean
  ): Promise<{ success: boolean; error?: string }> => {
    const cleanName = name.trim();
    const cleanUser = username.trim().toLowerCase().replace(/\s+/g, '');
    const cleanPass = password.trim();

    if (!cleanName || !cleanUser || !cleanPass) {
      return { success: false, error: 'Por favor, preencha todos os campos obrigatórios.' };
    }

    // Check if user already exists
    const exists = allUsers.some(
      (u) => u.username.toLowerCase() === cleanUser || cleanUser === 'henrique'
    );
    if (exists) {
      return {
        success: false,
        error: 'Este nome de usuário já está em uso. Por favor, escolha outro.',
      };
    }

    const newAccount: UserAccount = {
      id: `user-${cleanUser}-${Date.now().toString(36)}`,
      name: cleanName,
      username: cleanUser,
      password: cleanPass,
      role: 'user',
      createdAt: new Date().toISOString(),
      createdBy: 'Auto-cadastro (Novo Usuário)',
    };

    const updated = [...allUsers, newAccount];
    setAllUsers(updated);
    try {
      localStorage.setItem(STORAGE_ALL_USERS, JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }

    // Save to Cloud Firestore
    await saveUserToCloud(newAccount);

    // Immediately log in this new user into their fresh, individual planner!
    setActiveUser(newAccount);
    setShowSwitchUserModal(false);

    if (rememberMe) {
      localStorage.setItem(STORAGE_ACTIVE_USER_LOCAL, JSON.stringify(newAccount));
      sessionStorage.removeItem(STORAGE_ACTIVE_USER_SESSION);
    } else {
      sessionStorage.setItem(STORAGE_ACTIVE_USER_SESSION, JSON.stringify(newAccount));
      localStorage.removeItem(STORAGE_ACTIVE_USER_LOCAL);
    }

    showToast(`✨ Bem-vindo(a), ${cleanName}! Sua conta individual foi criada com sucesso.`);
    return { success: true };
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

  const handleUpdateTaskTitle = async (taskId: string, newTitle: string) => {
    if (!activeUser || !newTitle.trim()) return;
    const cleanTitle = newTitle.trim();
    let updatedTask: Task | null = null;

    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          updatedTask = {
            ...t,
            title: cleanTitle,
          };
          return updatedTask;
        }
        return t;
      })
    );

    if (updatedTask && activeUser) {
      await saveTaskToCloud(updatedTask, activeUser.id);
    }
    if (selectedTask && selectedTask.id === taskId && updatedTask) {
      setSelectedTask(updatedTask);
    }
    showToast('✏️ Texto atualizado com sucesso!');
  };

  const handleUpdateNotebookEntry = async (
    entryId: string,
    newRawText: string,
    reprocessWithAI: boolean = false
  ) => {
    if (!activeUser || !newRawText.trim()) return;
    const cleanText = newRawText.trim();
    let updatedEntry: NotebookEntry | null = null;

    setEntries((prev) =>
      prev.map((e) => {
        if (e.id === entryId) {
          updatedEntry = {
            ...e,
            rawText: cleanText,
          };
          return updatedEntry;
        }
        return e;
      })
    );

    if (updatedEntry && activeUser) {
      await saveEntryToCloud(updatedEntry, activeUser.id);
    }

    if (reprocessWithAI && activeUser) {
      const today = getTodayDateStr();
      const result = await analyzeNoteWithAI(cleanText, today);

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
        originalNoteText: cleanText,
        createdDate: today,
        userId: activeUser.id,
      }));

      if (newTasks.length > 0) {
        setTasks((prev) => [...newTasks, ...prev]);
        await Promise.allSettled(newTasks.map((t) => saveTaskToCloud(t, activeUser.id)));
        showToast(`✨ Anotação atualizada e ${newTasks.length} nova(s) tarefa(s) gerada(s)!`);
        return;
      }
    }

    showToast('✏️ Anotação do caderno atualizada com sucesso!');
  };

  const handleQuickAddTask = async (title: string, targetDate: string) => {
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
    await saveTaskToCloud(newTask, activeUser.id);
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

    try {
      await Promise.allSettled([
        saveEntryToCloud(newEntry, activeUser.id),
        ...newTasks.map((t) => saveTaskToCloud(t, activeUser.id)),
        ...newNotes.map((n) => saveNoteToCloud(n, activeUser.id)),
      ]);
    } catch (err) {
      console.error('Erro salvando no Firestore:', err);
    }

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
        <LoginView
          allUsers={allUsers}
          onLogin={handleLogin}
          onOpenSiteInfo={() => setShowSiteInfoModal(true)}
        />
        <SiteInfoModal
          isOpen={showSiteInfoModal}
          onClose={() => setShowSiteInfoModal(false)}
          currentUser={null}
          cloudConnected={cloudConnected}
        />
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
            onClick={() => setShowSiteInfoModal(true)}
            className="flex items-center gap-2.5 cursor-pointer select-none group"
            title="Clique para ver Informações do Site e Detalhes do Caderno & Planner"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white border border-slate-200 p-1 flex items-center justify-center text-slate-900 shadow-xs group-hover:border-indigo-400 group-hover:shadow-md transition-all">
              <AppLogo className="w-full h-full text-slate-900" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base font-black tracking-tight text-slate-900 leading-tight block group-hover:text-indigo-600 transition-colors">
                  Caderno & Planner
                </span>
                <Info className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-500 transition-colors" />
              </div>
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

            {/* Site Info Button */}
            <button
              id="btn-header-site-info"
              onClick={() => setShowSiteInfoModal(true)}
              className="p-2 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 border border-transparent hover:border-indigo-100 transition-colors cursor-pointer"
              title="Informações Oficiais do Site"
            >
              <Info className="w-4 h-4" />
            </button>

            {/* Logout / Switch User */}
            <button
              id="btn-header-logout"
              onClick={handleLogout}
              className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors cursor-pointer"
              title="Sair / Trocar de Usuário"
            >
              <LogOutIcon className="w-4 h-4" />
            </button>

            {/* Write shortcut */}
            <button
              id="header-escrever-btn"
              onClick={() => setCurrentTab('caderno')}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors shadow-xs cursor-pointer"
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
            onUpdateTaskTitle={handleUpdateTaskTitle}
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
            onUpdateEntryText={handleUpdateNotebookEntry}
            onUpdateTaskTitle={handleUpdateTaskTitle}
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
        onUpdateTitle={handleUpdateTaskTitle}
      />

      {/* Minimal Footer */}
      <footer className="mt-auto border-t border-slate-200/80 bg-white py-4 px-6 text-center text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-3 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-lg bg-white border border-slate-200 p-0.5 flex items-center justify-center text-slate-900 shadow-2xs shrink-0">
            <AppLogo className="w-full h-full text-slate-900" />
          </div>
          <button
            onClick={() => setShowSiteInfoModal(true)}
            className="font-bold text-slate-700 hover:text-indigo-600 transition-colors cursor-pointer flex items-center gap-1"
            title="Ver Informações Oficiais do Site"
          >
            <span>Caderno & Planner Inteligente</span>
            <Info className="w-3.5 h-3.5 text-indigo-500" />
          </button>
          <span className="hidden md:inline text-slate-300">•</span>
          <span className="hidden md:inline text-slate-600 font-medium">
            Planner Individual de <strong>{activeUser.name}</strong> (@{activeUser.username})
          </span>
          <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-semibold inline-flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Nuvem Ativa
          </span>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowSiteInfoModal(true)}
            className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold transition-colors flex items-center gap-1 cursor-pointer"
          >
            <Info className="w-3 h-3" /> Informações do Site
          </button>
          <button
            onClick={() => setShowSwitchUserModal(true)}
            className="text-[11px] text-slate-600 hover:text-indigo-600 font-medium transition-colors cursor-pointer"
          >
            Trocar Usuário
          </button>
          <button
            id="btn-zerar-dados"
            onClick={handleClearAllData}
            className="text-[11px] text-rose-500 hover:text-rose-700 flex items-center gap-1 font-medium transition-colors cursor-pointer"
            title="Apagar todas as tarefas e anotações e começar o caderno do zero"
          >
            <Trash2 className="w-3 h-3" /> Zerar tudo
          </button>
        </div>
      </footer>

      {/* Site Info Modal */}
      <SiteInfoModal
        isOpen={showSiteInfoModal}
        onClose={() => setShowSiteInfoModal(false)}
        currentUser={activeUser}
        cloudConnected={cloudConnected}
      />
    </div>
  );
}
