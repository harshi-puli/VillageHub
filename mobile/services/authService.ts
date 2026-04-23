import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/firebase';

export type ResidentProfile = {
  uid: string;
  name: string;
  email: string;
  unitNumber: string;
  role: 'resident' | 'admin' | string;
  createdAt: string;
  isAdmin?: boolean;
};

/** Admins are indicated by `isAdmin: true` and/or `role: 'admin'` in Firestore. */
export const isResidentProfileAdmin = (profile: ResidentProfile | null | undefined): boolean => {
  if (!profile) return false;
  if (profile.isAdmin === true) return true;
  return profile.role === 'admin';
};

export const registerResident = async ({
  email,
  password,
  name,
  unitNumber,
}: {
  email: string;
  password: string;
  name: string;
  unitNumber: string;
}): Promise<{ user: User | null; error: string | null }> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      name,
      email,
      unitNumber,
      role: 'resident',
      createdAt: new Date().toISOString(),
    } satisfies ResidentProfile);

    return { user, error: null };
  } catch (error: any) {
    return { user: null, error: getFriendlyError(error?.code) };
  }
};

export const loginResident = async ({
  email,
  password,
}: {
  email: string;
  password: string;
}): Promise<{ user: User | null; profile: ResidentProfile | null; error: string | null }> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    const profileSnap = await getDoc(doc(db, 'users', user.uid));
    const profile = profileSnap.exists() ? (profileSnap.data() as ResidentProfile) : null;

    return { user, profile, error: null };
  } catch (error: any) {
    return { user: null, profile: null, error: getFriendlyError(error?.code) };
  }
};

export const logoutResident = async (): Promise<{ error: string | null }> => {
  try {
    await signOut(auth);
    return { error: null };
  } catch (error: any) {
    return { error: getFriendlyError(error?.code) };
  }
};

export const subscribeToAuthState = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

export const getResidentProfileByUid = async (
  uid: string,
): Promise<{ profile: ResidentProfile | null; error: string | null }> => {
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (!snap.exists()) return { profile: null, error: 'Profile not found' };
    return { profile: snap.data() as ResidentProfile, error: null };
  } catch (error: any) {
    return { profile: null, error: getFriendlyError(error?.code) };
  }
};

export const getCurrentResidentProfile = async () => {
  const user = auth.currentUser;
  if (!user) return { profile: null, error: 'No user logged in' as const };
  return await getResidentProfileByUid(user.uid);
};

const getFriendlyError = (code?: string) => {
  const errors: Record<string, string> = {
    'auth/email-already-in-use': 'This email is already registered.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/weak-password': 'Password must be at least 6 characters.',
    'auth/user-not-found': 'No account found with this email.',
    'auth/wrong-password': 'Incorrect password. Please try again.',
    'auth/too-many-requests': 'Too many attempts. Please try again later.',
    'auth/network-request-failed': 'Network error. Check your connection.',
    'auth/invalid-credential': 'Invalid email or password.',
  };
  return (code && errors[code]) || 'Something went wrong. Please try again.';
};

