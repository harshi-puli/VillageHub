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
  where,
} from 'firebase/firestore';
import { auth, db } from '@/firebase';

// Nothing to edit! This function is here to record if the user is logged in or not.
function requireSignedInUid(): string {
  const uid = auth.currentUser?.uid;
  if (!uid) {
    throw new Error('You must be signed in to modify bookings.');
  }
  return uid;
}

// Describes the full shape of a booking document.
export type BookingInput = {
  reservedSpot: string;
  description: string;
  site: string;
  user: string;
  checkIn: Date;
  checkOut: Date;
  approved: boolean;
  type: string;
};

// No need to edit!
export const addBooking = async (bookingData: {
  title: string;
  description?: string;
  dueDate: Date;
  category: string;
  reservedSpot: string;
  site: string;
  user: string;
  checkIn: Date;
  checkOut: Date;
  approved: boolean;
  type?: string;
}) => {
  const signedInUid = requireSignedInUid();
  const booking = {
    title: bookingData.title,
    description: bookingData.description || '',
    dueDate: bookingData.dueDate,
    category: bookingData.category || 'general',
    reservedSpot: bookingData.reservedSpot,
    site: bookingData.site,
    user: bookingData.user || signedInUid,
    checkIn: bookingData.checkIn,
    checkOut: bookingData.checkOut,
    approved: bookingData.approved,
    type: bookingData.type || '',
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
 * Checks if a proposed booking conflicts with any existing bookings.
 * A conflict = same reservedSpot + same site + overlapping checkIn/checkOut.
 * Returns the conflicting booking documents, or an empty array if none.
 */
export const checkBookingConflicts = async (proposed: BookingInput) => {
  const snap = await getDocs(collection(db, 'booking'));

  const conflicts = snap.docs.filter((d) => {
    const data = d.data();

    if (data.reservedSpot !== proposed.reservedSpot) return false;
    if (data.site !== proposed.site) return false;

    const existingCheckIn  = data.checkIn  instanceof Timestamp ? data.checkIn.toDate()  : new Date(data.checkIn);
    const existingCheckOut = data.checkOut instanceof Timestamp ? data.checkOut.toDate() : new Date(data.checkOut);

    // Overlap: proposed starts before existing ends AND proposed ends after existing starts
    return proposed.checkIn < existingCheckOut && proposed.checkOut > existingCheckIn;
  });

  return conflicts.map((d) => ({ id: d.id, ...d.data() }));
};

/**
 * Delete a booking by id.
 */
export const deleteBooking = async (bookingId: string): Promise<string> => {
  requireSignedInUid();
  await deleteDoc(doc(db, 'booking', bookingId));
  return bookingId;
};

/**
 * List all bookings, newest first.
 * Requires a Firestore index on `createdAt` if you use this at scale.
 */
export const listBooking = async () => {
  const q = query(collection(db, 'booking'), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

/**
 * List only the signed-in user's bookings, newest first.
 */
export const listUsersBookings = async () => {
  const uid = requireSignedInUid();
  const q = query(
    collection(db, 'booking'),
    where('user', '==', uid),
    orderBy('createdAt', 'desc'),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

/**
 * Update a booking by id. Only the provided fields are written.
 */
export const updateBooking = async (
  bookingId: string,
  updates: Partial<BookingInput>,
): Promise<void> => {
  requireSignedInUid();
  const bookingRef = doc(db, 'booking', bookingId);
  await updateDoc(bookingRef, { ...updates });
};

export const listBookingBySite = async (site: string) => {
  const q = query(
    collection(db, 'booking'),
    orderBy('createdAt', 'desc'),
    where('site', '==', site)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data()}));
}

export const listBookingByReservedSpot = async (reservedSpot: string) => {
  const q = query(
    collection(db, 'booking'),
    orderBy('createdAt', 'desc'),
    where('reservedSpot', '==', reservedSpot));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data()}));
}

export const listBookingApproved = async (approved: boolean) => {
  const q = query(
    collection(db, 'booking'),
    orderBy('createdAt', 'desc'),
    where('true', '==', approved));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data()}));
}

export const listBookingByUser = async (user: string) => {
  const q = query(
    collection(db, 'booking'),
    orderBy('createdAt', 'desc'),
    where('user', '==', user)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data()}));
}

export const listBookingByCheckIn = async (checkIn: Date) => {
const q = query(
    collection(db, 'booking'),
    orderBy('createdAt', 'desc'),
    where('checkIn', '==', checkIn)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data()}));
}

export const listBookingByCheckOut = async (checkOut: Date) => {
const q = query(
    collection(db, 'booking'),
    orderBy('createdAt', 'desc'),
    where('checkOut', '==', checkOut)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data()}));
}

export const listBookingByReservedAndSite = async (reservedSpot: string, site: string) => {
  const q = query(
    collection(db, 'booking'),
    orderBy('createdAt', 'desc'),
    where('reservedSpot', '==', reservedSpot),
    where('site', '==', site)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data()}));
}

export const listBookingByReservedSiteApproved = async (reservedSpot: string, site: string, approved: boolean) => {
  const q = query(
    collection(db, 'booking'),
    orderBy('createdAt', 'desc'),
    where('reservedSpot', '==', reservedSpot),
    where('site', '==', site),
    where('true', '==', approved)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data()}));
}

export const listBookingByApprovedAndSite = async (reservedSpot: string, site: string, approved: boolean) => {
  const q = query(
    collection(db, 'booking'),
    orderBy('createdAt', 'desc'),
    where('site', '==', site),
    where('true', '==', approved)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data()}));
}

function toDateStr(val: unknown): string {
  if (!val) return '';
  if (val instanceof Date) return val.toDateString();
  if (val instanceof Timestamp) return val.toDate().toDateString();
  if (typeof val === 'object' && val !== null && 'seconds' in val)
    return new Date((val as { seconds: number }).seconds * 1000).toDateString();
  return '';
}

/**
 * Returns true if a booking already exists for the exact same room and exact
 * same check-in/check-out dates (day-level precision).
 */
export const checkExactBookingConflict = async (
  reservedSpot: string,
  checkIn: Date,
  checkOut: Date,
): Promise<boolean> => {
  const snap = await getDocs(collection(db, 'booking'));
  return snap.docs.some((d) => {
    const data = d.data();
    if (data.reservedSpot !== reservedSpot) return false;
    return (
      toDateStr(data.checkIn) === checkIn.toDateString() &&
      toDateStr(data.checkOut) === checkOut.toDateString()
    );
  });
};
