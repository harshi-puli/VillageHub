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
  return '6767';
  /*
  const user = auth.currentUser;
  if (!user) throw new Error('No user logged in');
  return user.uid;
  */
};

export function handleImageClick() {
  console.log("HelloWorld")
}

export const addAnnouncement = async (announcementData) => {
  const userId = getCurrentUserId();

  const announcement = {
    title: announcementData.title,
    description: announcementData.description || '',
    dueDate: announcementData.dueDate, // Should be a Firebase Timestamp or Date object
    category: announcementData.category || 'general',
    isCompleted: false,
    createdAt: serverTimestamp(),
    notified: false
  };

  const announcementRef = collection(db, 'users', userId, 'announcements');
  const docRef = await addDoc(announcementRef, announcement);

  return { id: docRef.id, ...announcement };
};