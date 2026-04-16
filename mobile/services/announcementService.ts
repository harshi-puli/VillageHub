import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase';

export function handleImageClick() {
  console.log('HelloWorld');
}

export const addAnnouncement = async (announcementData: {
  title: string;
  description?: string;
  dueDate: Date;
  category?: string;
}) => {
  const announcement = {
    title: announcementData.title,
    description: announcementData.description || '',
    dueDate: announcementData.dueDate,
    category: announcementData.category || 'general',
    isCompleted: false,
    createdAt: serverTimestamp(),
    notified: false,
  };

  const announcementRef = collection(db, 'announcements');
  const docRef = await addDoc(announcementRef, announcement);

  return { id: docRef.id, ...announcement };
};

