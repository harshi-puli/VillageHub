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



