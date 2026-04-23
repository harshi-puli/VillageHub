import {
  collection,
  doc,
  getDocs,
  query,
  setDoc,
  addDoc,
  serverTimestamp,
  where,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/firebase';


export type ChoreInput = {
  title: string;
  description?: string;
  assignedTo: string;
  site: string;
  dueDate: Date;
};

export type ChoreUpdate = {
  title?: string;
  description?: string;
  assignedTo?: string;
  site?: string;
  dueDate?: Date;
  isCompleted?: boolean;
};

export const addChore = async (choreData: ChoreInput) => {
  const chore = {
    title: choreData.title.trim(),
    description: (choreData.description ?? '').trim(),
    assignedTo: choreData.assignedTo,
    site: choreData.site.trim(),
    dueDate: choreData.dueDate,
    isCompleted: false,
    createdAt: serverTimestamp(),
  };

  const choreRef = collection(db,'chores');
  const docRef = await addDoc(choreRef, chore);

  return { id: docRef.id, ...chore };
};

/**
 * Gets the Monday of the current week as a consistent week identifier.
 */
const getWeekStart = (date: Date = new Date()): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust for Sunday
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

/**
 * Rotate chores as the week starts. 
 */
export const rotateChores = async () => {
  const weekStart = getWeekStart();
  const weekId = weekStart.toISOString().split('T')[0]; // e.g. "2025-04-07"
  const rotationRef = doc(db, 'choreAssignments', weekId);
  await setDoc(
    rotationRef,
    {
      weekId,
      rotatedAt: serverTimestamp(),
    },
    { merge: true }
  );
};

/** Legacy no-op from the web scaffold; safe to remove from UI later */
export function handleImageClick(): void {
  console.log('H668686868');
}

/**
 * Mark a chore as completed for the current week.
 */
export const markChoreCompleted = async (userId: string) => {
  const weekId = getWeekStart().toISOString().split('T')[0];
  const ref = doc(db, 'choreAssignments', weekId, 'assignments', userId);
  await setDoc(ref, { isCompleted: true }, { merge: true });
};

/** Chores assigned to a user (by `assignedTo` uid). */
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

