import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';
import { db, auth } from '../firebase';

// Get the current user's ID
const getCurrentUserId = () => {
  return '6769'; //lol
  /*
  const user = auth.currentUser;
  if (!user) throw new Error('No user logged in');
  return user.uid;
  */
};

export function handleImageClick() {
  console.log("HelloWorld")
}

export const addFeedback = async (feedbackData) => {
  const userId = getCurrentUserId();

  const feedback = {
    title: feedbackData.title,
    description: feedbackData.description || '',
    dueDate: feedbackData.dueDate, // Should be a Firebase Timestamp or Date object
    category: feedbackData.category || 'general',
    isCompleted: false,
    createdAt: serverTimestamp(),
    notified: false
  };

  const feedbackRef = collection(db, 'feedback');
  const docRef = await addDoc(feedbackRef, feedback);

  return { id: docRef.id, ...feedback };
};