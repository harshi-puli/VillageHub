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


//Nothing to edit! This function is here to record if the user is logged in or not.
function requireSignedInUid(): string {
  const uid = auth.currentUser?.uid;
  if (!uid) {
    throw new Error('You must be signed in to modify announcements.');
  }
  return uid;
}

// EDIT ME ⚠️: This function tells the user what to input is expected from 
export type BookingInput = {
  reservedSpot: string;
  /*Enter the rest of the fields and their expected data structures. 
  .... */
}

//no need to edit!
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

/**
 * EDIT ME ⚠️: Checks if a proposed booking conflicts with any existing bookings.
 * A conflict = same reservedSpot + same site + overlapping checkIn/checkOut.
 * Returns the conflicting bookings, or an empty array if none.
 */
export const checkBookingConflicts = async (proposed: BookingInput) => {
  const snap = await getDocs(collection(db, 'booking'));

  const conflicts = snap.docs.filter((d) => {})
  return 0;
};

/**
 * Delete feedback by id (same collection as `addFeedback`).
 */
export const deleteBooking = async (feedbackId: string): Promise<string> => {
  requireSignedInUid();

  await deleteDoc(doc(db, 'booking', feedbackId));
  return feedbackId;
};

/**
 * List feedback newest first. Requires a Firestore index on `createdAt` if you use this at scale.
 */
export const listBooking = async () => {
  const q = query(collection(db, 'booking'), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};
