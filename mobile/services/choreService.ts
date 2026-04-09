import {
  collection,
  doc,
  getDocs,
  setDoc,
  query,
  where,
  orderBy,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/firebase';

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
}

/**
 * Mark a chore as completed for the current week.
 */
export const markChoreCompleted = async (userId: string) => {
  const weekId = getWeekStart().toISOString().split('T')[0];
  const ref = doc(db, 'choreAssignments', weekId, 'assignments', userId);
  await setDoc(ref, { isCompleted: true }, { merge: true });
};

