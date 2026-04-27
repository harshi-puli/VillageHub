import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  setDoc,
  addDoc,
  updateDoc,
  serverTimestamp,
  where,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/firebase';


export type ChoreInput = {
  title: string;
  description?: string;
  site: string;
  dueDate: Date;
};

export type ChoreUpdate = {
  title?: string;
  description?: string;
  assignedTo?: string | null;
  assignedName?: string | null;
  site?: string;
  dueDate?: Date;
  isCompleted?: boolean;
};

export const addChore = async (choreData: ChoreInput) => {
  const chore = {
    title: choreData.title.trim(),
    description: (choreData.description ?? '').trim(),
    assignedTo: null,
    assignedName: null,
    site: choreData.site.trim().toLowerCase(),
    dueDate: choreData.dueDate,
    isCompleted: false,
    createdAt: serverTimestamp(),
  };
  const docRef = await addDoc(collection(db, 'chores'), chore);
  return { id: docRef.id, ...chore };
};

export const updateChore = async (choreId: string, updates: ChoreUpdate): Promise<void> => {
  await updateDoc(doc(db, 'chores', choreId), { ...updates });
};

export const assignChore = async (
  choreId: string,
  userId: string,
  userName: string,
): Promise<void> => {
  await updateDoc(doc(db, 'chores', choreId), {
    assignedTo: userId,
    assignedName: userName,
  });
};

export const unassignChore = async (choreId: string): Promise<void> => {
  await updateDoc(doc(db, 'chores', choreId), {
    assignedTo: null,
    assignedName: null,
  });
};

export const deleteChore = async (choreId: string): Promise<void> => {
  await deleteDoc(doc(db, 'chores', choreId));
};

export const listAllChores = async () => {
  const snap = await getDocs(collection(db, 'chores'));
  const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  const dueMs = (row: { dueDate?: unknown }) => {
    const v = row.dueDate;
    if (v instanceof Timestamp) return v.toMillis();
    if (v && typeof v === 'object' && 'seconds' in (v as { seconds: number })) {
      return (v as { seconds: number }).seconds * 1000;
    }
    if (v instanceof Date) return v.getTime();
    return 0;
  };
  return rows.sort((a, b) => dueMs(a) - dueMs(b));
};

export const listResidentsBySite = async (site: string) => {
  const q = query(
    collection(db, 'users'),
    where('site', '==', site),
    where('role', '==', 'resident'),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ uid: d.id, ...d.data() })) as {
    uid: string;
    name: string;
    email: string;
    unitNumber: string;
    site: string;
    role: string;
  }[];
};

const getWeekStart = (date: Date = new Date()): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

export const rotateChores = async () => {
  const weekStart = getWeekStart();
  const weekId = weekStart.toISOString().split('T')[0];
  await setDoc(
    doc(db, 'choreAssignments', weekId),
    { weekId, rotatedAt: serverTimestamp() },
    { merge: true }
  );
};

export function handleImageClick(): void {
  console.log('H668686868');
}

export const markChoreCompleted = async (userId: string) => {
  const weekId = getWeekStart().toISOString().split('T')[0];
  await setDoc(
    doc(db, 'choreAssignments', weekId, 'assignments', userId),
    { isCompleted: true },
    { merge: true }
  );
};

export const listChoresForUser = async (userId: string) => {
  const q = query(collection(db, 'chores'), where('assignedTo', '==', userId));
  const snap = await getDocs(q);
  const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  const dueMs = (row: { dueDate?: unknown }) => {
    const v = row.dueDate;
    if (v instanceof Timestamp) return v.toMillis();
    if (v && typeof v === 'object' && 'seconds' in (v as { seconds: number })) {
      return (v as { seconds: number }).seconds * 1000;
    }
    if (v instanceof Date) return v.getTime();
    return 0;
  };
  return rows.sort((a, b) => dueMs(a) - dueMs(b));
};

