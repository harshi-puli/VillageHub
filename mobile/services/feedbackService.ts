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


// EDIT ME ⚠️: This function tells the user what to input is expected from 
export type FeedbackInput = {
  title: string;
  /*Enter the rest of the fields and their expected data structures. 
  .... */
}

// EDIT ME ⚠️: Fields that can be changed: Only the status of a feedback. 
export type FeedbackUpdates = {
  /*Enter the rest of the fields and their expected data structures. 
  ....
  For this export you only need 1 line! Since only one field (status) can be changed
  It should look like --> fieldname: type of value. 
  ....*/
}

//Nothing to edit! This function is here to 
function requireSignedInUid(): string {
  const uid = auth.currentUser?.uid;
  if (!uid) {
    throw new Error('You must be signed in to modify announcements.');
  }
  return uid;
}

//Add Feedback - Nothing to change! Use as a quide/reference function.
export const addFeedback = async (feedbackData: {
  title: string;
  description?: string;
  category?: string;
  site: string; //users can either add site specific feedback or general feedback. 
}) => {
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

//EDIT ME ⚠️: Update Feedback
export const updateFeedback = async (
  feedbackId: string,
  updates: FeedbackUpdates,
): Promise<{ id: string } & FeedbackUpdates> => {
  requireSignedInUid();

  // `payload` collects only the fields we actually want to write.
  const payload: Record<string, unknown> = {};

  //add if statement that does the following: If a new status value was provided, queue it for saving.
  //ex. if (updates.isCompleted !== undefined) payload.isCompleted = updates.isCompleted;
  {
    
  }

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
  await deleteDoc(doc(db, 'booking', feedbackId));
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
  const { where } = await import('firebase/firestore');
  const uid = requireSignedInUid();

  const collectionRef = collection(db, 'feedback');
  const q = query(
    collectionRef,
    where('user', '==', uid),
    orderBy('createdAt', 'desc')
  );

  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const listFeedbackByCategory = async (category: string) => {
  const { where } = await import('firebase/firestore');

  const q = query(
    collection(db, 'feedback'),
    where('category', '==', category),
    orderBy('createdAt', 'desc')
  );

  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const listFeedbackByType = async (type: string) => {
  const { where } = await import('firebase/firestore');

  const q = query(
    collection(db, 'feedback'),
    where('type', '==', type),
    orderBy('createdAt', 'desc')
  );

  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const listFeedbackByUser = async (userId: string) => {
  const { where } = await import('firebase/firestore');

  const q = query(
    collection(db, 'feedback'),
    where('user', '==', userId),
    orderBy('createdAt', 'desc')
  );

  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const listFeedbackByStatus = async (status: string) => {
  const { where } = await import('firebase/firestore');

  const q = query(
    collection(db, 'feedback'),
    where('status', '==', status),
    orderBy('createdAt', 'desc')
  );

  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const listFeedbackByCompletion = async (isCompleted: boolean) => {
  const { where } = await import('firebase/firestore');

  const q = query(
    collection(db, 'feedback'),
    where('isCompleted', '==', isCompleted),
    orderBy('createdAt', 'desc')
  );

  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const listFeedbackBySite = async (site: string) => {
  const { where } = await import('firebase/firestore');

  const q = query(
    collection(db, 'feedback'),
    where('site', '==', site),
    orderBy('createdAt', 'desc')
  );

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
  const { where } = await import('firebase/firestore');

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
  const { where } = await import('firebase/firestore');

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
  const { where } = await import('firebase/firestore');

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
  const { where } = await import('firebase/firestore');

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
  const { where } = await import('firebase/firestore');
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


