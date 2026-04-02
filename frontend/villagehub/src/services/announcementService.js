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
  const user = auth.currentUser;
  if (!user) throw new Error('No user logged in');
  return user.uid;
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

  const announcementRef = collection(db, 'announcements');
  const docRef = await addDoc(announcementRef, announcement);

  return { id: docRef.id, ...announcement };
};

// Update an announcement
export const updateAnnouncement = async (announcementId, updates) => {
  const userId = getCurrentUserId();
  
  const announcementRef = doc(db, 'users', userId, 'announcements', announcementId);
  await updateDoc(announcementRef, updates);
  
  return { id: announcementId, ...updates };
};

// Delete an announcement
export const deleteAnnouncement = async (announcementId) => {
  const userId = getCurrentUserId();
  
  const announcementRef = doc(db, 'users', userId, 'announcements', announcementId);
  await deleteDoc(announcementRef);
  
  return announcementId;
};