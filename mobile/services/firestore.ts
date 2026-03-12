import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  getDocs,
  onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';
import type { FoodItem } from '../types';

const ITEMS_COLLECTION = 'items';
const USERS_COLLECTION = 'users';

export async function addItem(
  item: Omit<FoodItem, 'id'>
): Promise<string> {
  const docRef = await addDoc(collection(db, ITEMS_COLLECTION), item);
  return docRef.id;
}

export async function updateItem(
  id: string,
  data: Partial<FoodItem>
): Promise<void> {
  const docRef = doc(db, ITEMS_COLLECTION, id);
  await updateDoc(docRef, data);
}

export async function deleteItem(id: string): Promise<void> {
  const docRef = doc(db, ITEMS_COLLECTION, id);
  await deleteDoc(docRef);
}

export async function getUserItems(userId: string): Promise<FoodItem[]> {
  const q = query(
    collection(db, ITEMS_COLLECTION),
    where('userId', '==', userId),
    orderBy('expiryDate', 'asc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  })) as FoodItem[];
}

export function subscribeToItems(
  userId: string,
  callback: (items: FoodItem[]) => void
): Unsubscribe {
  const q = query(
    collection(db, ITEMS_COLLECTION),
    where('userId', '==', userId),
    orderBy('expiryDate', 'asc')
  );
  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as FoodItem[];
    callback(items);
  });
}

export async function updatePushToken(
  userId: string,
  token: string
): Promise<void> {
  const docRef = doc(db, USERS_COLLECTION, userId);
  await updateDoc(docRef, { pushToken: token });
}
