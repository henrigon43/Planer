import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
  collection,
  query,
  where,
  onSnapshot,
  setDoc,
  updateDoc,
  deleteDoc,
  Unsubscribe,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { Task, NoteItem, NotebookEntry, UserAccount } from './types';

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// CRITICAL: The app will break without firebaseConfig.firestoreDatabaseId
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// Authentication provider
export const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test connection on boot as required by Firestore integration skill
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('✅ Conexão com Firestore estabelecida com sucesso.');
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore offline ou aguardando conexão de rede.');
    }
    return false;
  }
}

// User Authentication Actions
export async function signInWithGoogle(): Promise<User> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error('Erro ao fazer login com Google:', error);
    throw error;
  }
}

export async function logOut(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Erro ao sair:', error);
    throw error;
  }
}

// Realtime synchronizer for User Data
export function subscribeToUserCloudData(
  userId: string,
  callbacks: {
    onTasks: (tasks: Task[]) => void;
    onNotes: (notes: NoteItem[]) => void;
    onEntries: (entries: NotebookEntry[]) => void;
  }
): () => void {
  const unsubs: Unsubscribe[] = [];

  // Subscribe to Tasks
  const tasksPath = 'tasks';
  try {
    const tasksQuery = query(collection(db, tasksPath), where('userId', '==', userId));
    const unsubTasks = onSnapshot(
      tasksQuery,
      (snapshot) => {
        const tasks: Task[] = snapshot.docs.map((d) => d.data() as Task);
        callbacks.onTasks(tasks);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, tasksPath);
      }
    );
    unsubs.push(unsubTasks);
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, tasksPath);
  }

  // Subscribe to Notes
  const notesPath = 'notes';
  try {
    const notesQuery = query(collection(db, notesPath), where('userId', '==', userId));
    const unsubNotes = onSnapshot(
      notesQuery,
      (snapshot) => {
        const notes: NoteItem[] = snapshot.docs.map((d) => d.data() as NoteItem);
        callbacks.onNotes(notes);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, notesPath);
      }
    );
    unsubs.push(unsubNotes);
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, notesPath);
  }

  // Subscribe to Notebook Entries
  const entriesPath = 'entries';
  try {
    const entriesQuery = query(collection(db, entriesPath), where('userId', '==', userId));
    const unsubEntries = onSnapshot(
      entriesQuery,
      (snapshot) => {
        const entries: NotebookEntry[] = snapshot.docs.map((d) => d.data() as NotebookEntry);
        // Sort newest first
        entries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        callbacks.onEntries(entries);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, entriesPath);
      }
    );
    unsubs.push(unsubEntries);
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, entriesPath);
  }

  return () => {
    unsubs.forEach((unsub) => unsub());
  };
}

// Cloud persistence helpers
export async function saveTaskToCloud(task: Task, userId: string): Promise<void> {
  const path = `tasks/${task.id}`;
  try {
    const docRef = doc(db, 'tasks', task.id);
    await setDoc(docRef, { ...task, userId }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteTaskFromCloud(taskId: string): Promise<void> {
  const path = `tasks/${taskId}`;
  try {
    const docRef = doc(db, 'tasks', taskId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveNoteToCloud(note: NoteItem, userId: string): Promise<void> {
  const path = `notes/${note.id}`;
  try {
    const docRef = doc(db, 'notes', note.id);
    await setDoc(docRef, { ...note, userId }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteNoteFromCloud(noteId: string): Promise<void> {
  const path = `notes/${noteId}`;
  try {
    const docRef = doc(db, 'notes', noteId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveEntryToCloud(entry: NotebookEntry, userId: string): Promise<void> {
  const path = `entries/${entry.id}`;
  try {
    const docRef = doc(db, 'entries', entry.id);
    await setDoc(docRef, { ...entry, userId }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteEntryFromCloud(entryId: string): Promise<void> {
  const path = `entries/${entryId}`;
  try {
    const docRef = doc(db, 'entries', entryId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// User Accounts Management & Default Admin (Henrique)
export const DEFAULT_ADMIN: UserAccount = {
  id: 'henrique',
  username: 'henrique',
  name: 'Henrique (Administrador)',
  password: '1234',
  role: 'admin',
  createdAt: '2026-09-11T00:00:00.000Z',
  createdBy: 'sistema',
};

export function subscribeToUsersCloud(callback: (users: UserAccount[]) => void): () => void {
  const usersPath = 'users';
  try {
    const unsub = onSnapshot(
      collection(db, usersPath),
      (snapshot) => {
        const users: UserAccount[] = snapshot.docs.map((d) => d.data() as UserAccount);
        callback(users);
      },
      (error) => {
        console.warn('Alerta ao escutar usuários da nuvem:', error);
      }
    );
    return unsub;
  } catch (err) {
    console.warn('Erro ao conectar coleção de usuários:', err);
    return () => {};
  }
}

export async function saveUserToCloud(user: UserAccount): Promise<void> {
  const path = `users/${user.id}`;
  try {
    const docRef = doc(db, 'users', user.id);
    await setDoc(docRef, user, { merge: true });
  } catch (error) {
    console.error('Erro ao salvar usuário na nuvem:', error);
  }
}

export async function deleteUserFromCloud(userId: string): Promise<void> {
  const path = `users/${userId}`;
  try {
    const docRef = doc(db, 'users', userId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Erro ao deletar usuário da nuvem:', error);
  }
}

