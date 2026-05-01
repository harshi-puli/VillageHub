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
  category?: string;
  releaseDate: Date;
  site?: string;
};

/** Partial fields when updating an announcement */
export type AnnouncementUpdates = {
  title?: string;
  description?: string;
  category?: string;
  releaseDate?: Date;
  site?: string;
  emailSent?: boolean;
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
 *
 * Important: SendGrid should NOT be called directly from this frontend file,
 * because that would expose the SendGrid API key in the browser.
 * Instead, this creates the Firestore document with emailSent: false.
 * A backend function / Firebase Cloud Function should watch for new
 * announcements and send the email through SendGrid.
 */
export const addAnnouncement = async (announcementData: AnnouncementInput) => {
  const userId = requireSignedInUid();

  const announcement = {
    title: announcementData.title.trim(),
    description: (announcementData.description ?? '').trim(),
    category: (announcementData.category ?? 'general').trim() || 'general',
    user: userId,
    createdAt: serverTimestamp(),
    releaseDate: Timestamp.fromDate(announcementData.releaseDate),
    site: (announcementData.site ?? 'TVS').trim() || 'TVS',
    emailSent: false,
  };

  const docRef = await addDoc(collection(db, 'announcements'), announcement);

  return { id: docRef.id, ...announcement };
};

/**
 * Update an announcement by id.
 */
export const updateAnnouncement = async (
  announcementId: string,
  updates: AnnouncementUpdates,
): Promise<{ id: string } & AnnouncementUpdates> => {
  requireSignedInUid();

  const payload: Record<string, unknown> = {};

  if (updates.title !== undefined) payload.title = updates.title.trim();
  if (updates.description !== undefined) payload.description = updates.description.trim();
  if (updates.category !== undefined) {
    payload.category = updates.category.trim() || 'general';
  }
  if (updates.releaseDate !== undefined) {
    payload.releaseDate = Timestamp.fromDate(updates.releaseDate);
  }
  if (updates.site !== undefined) {
    payload.site = updates.site.trim() || 'TVS';
  }
  if (updates.emailSent !== undefined) {
    payload.emailSent = updates.emailSent;
  }

  if (Object.keys(payload).length === 0) {
    return { id: announcementId };
  }

  await updateDoc(doc(db, 'announcements', announcementId), payload);

  return { id: announcementId, ...updates };
};

/**
 * Delete an announcement by id.
 */
export const deleteAnnouncement = async (announcementId: string): Promise<string> => {
  requireSignedInUid();
  await deleteDoc(doc(db, 'announcements', announcementId));
  return announcementId;
};

/**
 * List announcements newest first.
 */
export const listAnnouncements = async () => {
  const q = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}; 
