import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { auth, db } from '@/firebase';


export type FeedbackInput = {
  title: string;
  description?: string;
  category?: string;
  site: string;
};

export type FeedbackUpdates = {
  status?: string;
  isCompleted?: boolean;
};

function requireSignedInUid(): string {
  const uid = auth.currentUser?.uid;
  if (!uid) {
    throw new Error('You must be signed in to modify feedback.');
  }
  return uid;
}

//Add Feedback - Nothing to change! Use as a quide/reference function.
export const addFeedback = async (feedbackData: FeedbackInput) => {
  const feedback = { //Returns a feedback object!
    title: feedbackData.title,
    description: feedbackData.description || '',
    category: feedbackData.category || 'general', //main categories are either maintenance requests or general feedback. 
    user: requireSignedInUid(), //stores the associated of the feedback with userID and not their actual name. 
    status: 'Awaiting Review', //changes to different statuses depending on if the 
    isCompleted: false,
    createdAt: serverTimestamp(),
    site: feedbackData.site
  };

  const feedbackRef = collection(db,'feedback');
  const docRef = await addDoc(feedbackRef, feedback);

  return { id: docRef.id, ...feedback };
};

export const updateFeedback = async (
  feedbackId: string,
  updates: FeedbackUpdates,
): Promise<{ id: string } | ({ id: string } & FeedbackUpdates)> => {
  requireSignedInUid();

  // `payload` collects only the fields we actually want to write.
  const payload: Record<string, unknown> = {};

  if (updates.status !== undefined) payload.status = updates.status;
  if (updates.isCompleted !== undefined) payload.isCompleted = updates.isCompleted;

  if (Object.keys(payload).length === 0) {
    return { id: feedbackId };
  }

  await updateDoc(doc(db, 'feedback', feedbackId), payload);

  return { id: feedbackId, ...updates };
};

/**
 * Delete feedback by id (same collection as `addFeedback`).
 */
export const deleteFeedback = async (feedbackId: string): Promise<string> => {
  requireSignedInUid();
  await deleteDoc(doc(db, 'feedback', feedbackId));
  return feedbackId;
};

/**
 * List feedback newest first. Requires a Firestore index on `createdAt` if you use this at scale.
 */
export const listFeedback = async () => {
  const q = query(collection(db, 'feedback'), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

/**
 * EDIT ME ⚠️: List feedback newest first that belong to the current logged in user.
 * use requireSignedInUid() to get the current user Id
 * To filter user where("userIdField", "==", "targetUserID") in the query.
 * note that the user field in the docs is called "user"
 */

export const listUsersFeedback = async () => {
  const uid = requireSignedInUid();
  const q = query(collection(db, 'feedback'), where('user', '==', uid), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

/** Current user's feedback, oldest first. */
export const listUsersFeedbackOldestFirst = async () => {
  const uid = requireSignedInUid();
  const q = query(collection(db, 'feedback'), where('user', '==', uid), orderBy('createdAt', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const listFeedbackByCategory = async (category: string) => {
  const q = query(collection(db, 'feedback'), where('category', '==', category), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const listFeedbackByType = async (type: string) => {
  const q = query(collection(db, 'feedback'), where('type', '==', type), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const listFeedbackByUser = async (userId: string) => {
  const q = query(collection(db, 'feedback'), where('user', '==', userId), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const listFeedbackByStatus = async (status: string) => {
  const q = query(collection(db, 'feedback'), where('status', '==', status), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const listFeedbackByCompletion = async (isCompleted: boolean) => {
  const q = query(collection(db, 'feedback'), where('isCompleted', '==', isCompleted), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const listFeedbackBySite = async (site: string) => {
  const q = query(collection(db, 'feedback'), where('site', '==', site), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const listFeedbackOldestFirst = async () => {
  const q = query(collection(db, 'feedback'), orderBy('createdAt', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const listFeedbackByCategoryAndStatus = async (
  category: string,
  status: string,
) => {
  const q = query(
    collection(db, 'feedback'),
    where('category', '==', category),
    where('status', '==', status),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const listFeedbackBySiteAndStatus = async (
  site: string,
  status: string,
) => {
  const q = query(
    collection(db, 'feedback'),
    where('site', '==', site),
    where('status', '==', status),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const listFeedbackByTypeAndStatus = async (
  type: string,
  status: string,
) => {
  const q = query(
    collection(db, 'feedback'),
    where('type', '==', type),
    where('status', '==', status),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const listFeedbackBySiteAndCategory = async (
  site: string,
  category: string,
) => {
  const q = query(
    collection(db, 'feedback'),
    where('site', '==', site),
    where('category', '==', category),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const listUsersFeedbackByStatus = async (status: string) => {
  const uid = requireSignedInUid();
  const q = query(
    collection(db, 'feedback'),
    where('user', '==', uid),
    where('status', '==', status),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};


