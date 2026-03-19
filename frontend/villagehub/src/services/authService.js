import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

export const registerResident = async ({ email, password, name, unitNumber }) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      name,
      email,
      unitNumber,
      role: "resident",
      createdAt: new Date().toISOString(),
    });

    return { user, error: null };
  } catch (error) {
    return { user: null, error: getFriendlyError(error.code) };
  }
};

export const loginResident = async ({ email, password }) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    const profileSnap = await getDoc(doc(db, "users", user.uid));
    const profile = profileSnap.exists() ? profileSnap.data() : null;

    return { user, profile, error: null };
  } catch (error) {
    return { user: null, profile: null, error: getFriendlyError(error.code) };
  }
};

export const logoutResident = async () => {
  try {
    await signOut(auth);
    return { error: null };
  } catch (error) {
    return { error: getFriendlyError(error.code) };
  }
};

export const subscribeToAuthState = (callback) => {
  return onAuthStateChanged(auth, callback);
};

export const getCurrentResidentProfile = async () => {
  const user = auth.currentUser;
  if (!user) return { profile: null, error: "No user logged in" };

  try {
    const profileSnap = await getDoc(doc(db, "users", user.uid));
    if (!profileSnap.exists()) return { profile: null, error: "Profile not found" };
    return { profile: profileSnap.data(), error: null };
  } catch (error) {
    return { profile: null, error: getFriendlyError(error.code) };
  }
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
const getFriendlyError = (code) => {
  const errors = {
    "auth/email-already-in-use": "This email is already registered.",
    "auth/invalid-email": "Please enter a valid email address.",
    "auth/weak-password": "Password must be at least 6 characters.",
    "auth/user-not-found": "No account found with this email.",
    "auth/wrong-password": "Incorrect password. Please try again.",
    "auth/too-many-requests": "Too many attempts. Please try again later.",
    "auth/network-request-failed": "Network error. Check your connection.",
    "auth/invalid-credential": "Invalid email or password.",
  };
  return errors[code] || "Something went wrong. Please try again.";
};