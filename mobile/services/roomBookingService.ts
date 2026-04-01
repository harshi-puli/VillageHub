import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase';

export const addBooking = async (bookingData: {
  title: string;
  description?: string;
  dueDate: Date;
  category?: string;
}) => {
  const booking = {
    title: bookingData.title,
    description: bookingData.description || '',
    dueDate: bookingData.dueDate,
    category: bookingData.category || 'general',
    isCompleted: false,
    createdAt: serverTimestamp(),
    notified: false,
  };

  const bookingRef = collection(db, 'booking');
  const docRef = await addDoc(bookingRef, booking);

  return { id: docRef.id, ...booking };
};

// Web code currently uses `addbooking` (lowercase b).
export const addbooking = addBooking;

