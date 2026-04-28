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
import { db, auth } from '@/firebase';


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
    site: choreData.site.trim(),
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
  if (!auth.currentUser) throw new Error('Must be signed in to delete chores.');
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

export const listResidentsBySite = async (_site?: string) => {
  const snap = await getDocs(collection(db, 'users'));
  return snap.docs
    .map((d) => ({ uid: d.id, ...d.data() } as {
      uid: string;
      name: string;
      email: string;
      unitNumber: string;
      site: string;
      role: string;
      isAdmin?: boolean;
    }))
    .filter((u) => !u.isAdmin);
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
  const [usersSnap, choresSnap] = await Promise.all([
    getDocs(collection(db, 'users')),
    getDocs(collection(db, 'chores')),
  ]);

  const residents = usersSnap.docs
    .map((d) => ({ uid: d.id, ...d.data() } as { uid: string; name: string; isAdmin?: boolean }))
    .filter((u) => !u.isAdmin);

  if (residents.length === 0) throw new Error('No residents to assign chores to.');

  // Fisher-Yates shuffle
  const shuffled = [...residents];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  await Promise.all(
    choresSnap.docs.map((choreDoc, i) => {
      const resident = shuffled[i % shuffled.length];
      return updateDoc(doc(db, 'chores', choreDoc.id), {
        assignedTo: resident.uid,
        assignedName: resident.name ?? resident.uid,
      });
    }),
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

