import {
  addDoc,
  collection,
  getDocs,
  orderBy,
  query,
  Timestamp,
  where,
} from 'firebase/firestore';
import { db } from '@/firebase';

// ─── Types ────────────────────────────────────────────────────────────────────

export type CalendarEvent = {
  id: string;
  title: string;
  description?: string;
  location?: string;
  startDate: Timestamp;
  endDate: Timestamp;
  createdAt?: Timestamp;
  createdBy?: string; // admin uid
};

export type GardeningSlot = {
  id: string;
  title: string;
  description?: string;
  plot?: string; // e.g. "Plot A3"
  date: Timestamp;
  createdAt?: Timestamp;
};

// ─── Events (admin creates, users read) ───────────────────────────────────────

const EVENTS_COLLECTION = 'calendarEvents';

export async function listEvents(): Promise<CalendarEvent[]> {
  const q = query(
    collection(db, EVENTS_COLLECTION),
    orderBy('startDate', 'asc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<CalendarEvent, 'id'>) }));
}

export async function listUpcomingEvents(): Promise<CalendarEvent[]> {
  const now = Timestamp.now();
  const q = query(
    collection(db, EVENTS_COLLECTION),
    where('startDate', '>=', now),
    orderBy('startDate', 'asc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<CalendarEvent, 'id'>) }));
}

/** Admin only — protect this with Firestore rules */
export async function createEvent(
  data: Omit<CalendarEvent, 'id' | 'createdAt'>
): Promise<string> {
  const ref = await addDoc(collection(db, EVENTS_COLLECTION), {
    ...data,
    createdAt: Timestamp.now(),
  });
  return ref.id;
}

// ─── Gardening ────────────────────────────────────────────────────────────────

const GARDENING_COLLECTION = 'gardeningSlots';

export async function listGardeningSlots(): Promise<GardeningSlot[]> {
  const q = query(
    collection(db, GARDENING_COLLECTION),
    orderBy('date', 'asc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<GardeningSlot, 'id'>) }));
}

/** Admin only */
export async function createGardeningSlot(
  data: Omit<GardeningSlot, 'id' | 'createdAt'>
): Promise<string> {
  const ref = await addDoc(collection(db, GARDENING_COLLECTION), {
    ...data,
    createdAt: Timestamp.now(),
  });
  return ref.id;
}