import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  type User as FirebaseUser,
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import type { User } from '../types';

export async function signIn(
  email: string,
  password: string
): Promise<FirebaseUser> {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
}

export async function signUp(
  email: string,
  password: string,
  displayName: string
): Promise<FirebaseUser> {
  const credential = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  );
  await updateProfile(credential.user, { displayName });

  const userDoc: Omit<User, 'uid'> = {
    email,
    displayName,
    createdAt: new Date().toISOString(),
    notificationPrefs: {
      threeDayBefore: true,
      oneDayBefore: true,
      onExpiry: true,
    },
  };
  await setDoc(doc(db, 'users', credential.user.uid), userDoc);

  return credential.user;
}

export async function signOutUser(): Promise<void> {
  await signOut(auth);
}

export function onAuthChange(
  callback: (user: FirebaseUser | null) => void
): () => void {
  return onAuthStateChanged(auth, callback);
}
