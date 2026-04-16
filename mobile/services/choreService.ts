import {
  collection,
  doc,
  getDocs,
  setDoc,
  addDoc,
  query,
  where,
  orderBy,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/firebase';
import Chores from '@/app/(admin)/manageChores';


//CRUD - BASIC FUNCTIONS, ADD, RECIEVE, UPDATE, DELETE.
// EDIT ME ⚠️: This function tells the user input is expected.
  //follow chore data structure. 
export type ChoreInput = {
  title: string;
  /*Enter the rest of the fields and their expected data structures. 
  .... */
}

// EDIT ME ⚠️: This function tells the user input is expected.
  //follow chore data structure. 
export type ChoreUpdate = {
  user: string; //user must change
  /*Enter the rest of the fields and their expected data structures. 
  .... */
}

// EDIT ME ⚠️: Add Feedback - Nothing to change! Use as a quide/reference function.
export const addChore = async (choreData: { // add what might be input into addChore;
}) => {
  const chore = { //Returns a feedback object!
    // add input fields to this empty chore!!!
  };

  const choreRef = collection(db,'chores');
  const docRef = await addDoc(choreRef, chore);

  return { id: docRef.id, ... Chores };
};

/**
 * Gets the Monday of the current week as a consistent week identifier.
 */
const getWeekStart = (date: Date = new Date()): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust for Sunday
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

/**
 * Rotate chores as the week starts. 
 */
export const rotateChores = async () => {
  const weekStart = getWeekStart();
  const weekId = weekStart.toISOString().split('T')[0]; // e.g. "2025-04-07"
}

/** Legacy no-op from the web scaffold; safe to remove from UI later */
export function handleImageClick(): void {
  console.log('H668686868');
}

/**
 * Mark a chore as completed for the current week.
 */
export const markChoreCompleted = async (userId: string) => {
  const weekId = getWeekStart().toISOString().split('T')[0];
  const ref = doc(db, 'choreAssignments', weekId, 'assignments', userId);
  await setDoc(ref, { isCompleted: true }, { merge: true });
};

