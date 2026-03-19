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

export const addbooking = async (bookingData) => {
  const userId = getCurrentUserId();

  const booking = {
    title: bookingData.title,
    description: bookingData.description || '',
    dueDate: bookingData.dueDate, // Should be a Firebase Timestamp or Date object
    category: bookingData.category || 'general',
    isCompleted: false,
    createdAt: serverTimestamp(),
    notified: false
  };

  const bookingRef = collection(db, 'booking');
  const docRef = await addDoc(bookingRef, booking);

  return { id: docRef.id, ...booking };
};