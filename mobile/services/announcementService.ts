import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
} from 'firebase/firestore';
import { auth, db } from '@/firebase';

/** Input when creating an announcement */
export type AnnouncementInput = {
  title: string;
  description?: string;
  dueDate: Date;
  category?: string;
};

/** Partial fields when updating */
export type AnnouncementUpdates = {
  title?: string;
  description?: string;
  dueDate?: Date;
  category?: string;
  isCompleted?: boolean;
  notified?: boolean;
};

function requireSignedInUid(): string {
  const uid = auth.currentUser?.uid;
  if (!uid) {
    throw new Error('You must be signed in to modify announcements.');
  }
  return uid;
}

/** Legacy no-op from the web scaffold; safe to remove from UI later */
export function handleImageClick(): void {
  console.log('HelloWorld');
}

/**
 * Create an announcement in the top-level `announcements` collection.
 * Adds `createdByUid` when a user is logged in.
 */
export const addAnnouncement = async (announcementData: AnnouncementInput) => {
  const announcement = {
    title: announcementData.title.trim(),
    description: (announcementData.description ?? '').trim(),
    dueDate: Timestamp.fromDate(announcementData.dueDate),
    category: (announcementData.category ?? 'general').trim() || 'general',
    isCompleted: false,
    createdAt: serverTimestamp(),
    notified: false,
    ...(auth.currentUser?.uid ? { createdByUid: auth.currentUser.uid } : {}),
  };

  const docRef = await addDoc(collection(db, 'announcements'), announcement);

  return { id: docRef.id, ...announcement };
}; 

/**
 * Update an announcement by id (same collection as `addAnnouncement`).
 */
export const updateAnnouncement = async (
  announcementId: string,
  updates: AnnouncementUpdates,
): Promise<{ id: string } & AnnouncementUpdates> => {
  requireSignedInUid();

  const payload: Record<string, unknown> = {};

  if (updates.title !== undefined) payload.title = updates.title.trim();
  if (updates.description !== undefined) payload.description = updates.description.trim();
  if (updates.dueDate !== undefined) payload.dueDate = Timestamp.fromDate(updates.dueDate);
  if (updates.category !== undefined) {
    payload.category = updates.category.trim() || 'general';
  }
  if (updates.isCompleted !== undefined) payload.isCompleted = updates.isCompleted;
  if (updates.notified !== undefined) payload.notified = updates.notified;

  if (Object.keys(payload).length === 0) {
    return { id: announcementId };
  }

  await updateDoc(doc(db, 'announcements', announcementId), payload);

  return { id: announcementId, ...updates };
};

/**
 * Delete an announcement by id (same collection as `addAnnouncement`).
 */
export const deleteAnnouncement = async (announcementId: string): Promise<string> => {
  requireSignedInUid();
  await deleteDoc(doc(db, 'announcements', announcementId));
  return announcementId;
};

/**
 * List announcements newest first. Requires a Firestore index on `createdAt` if you use this at scale.
 */
export const listAnnouncements = async () => {
  const q = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}; 
