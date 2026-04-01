import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase';

export const addFeedback = async (feedbackData: {
  title: string;
  description?: string;
  dueDate: Date;
  category?: string;
}) => {
  const feedback = {
    title: feedbackData.title,
    description: feedbackData.description || '',
    dueDate: feedbackData.dueDate,
    category: feedbackData.category || 'general',
    isCompleted: false,
    createdAt: serverTimestamp(),
    notified: false,
  };

  const feedbackRef = collection(db, 'feedback');
  const docRef = await addDoc(feedbackRef, feedback);

  return { id: docRef.id, ...feedback };
};

