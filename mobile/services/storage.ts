import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase';

export async function uploadImage(
  userId: string,
  uri: string,
  itemId: string
): Promise<string> {
  const response = await fetch(uri);
  const blob = await response.blob();

  const storageRef = ref(
    storage,
    `users/${userId}/items/${itemId}`
  );
  await uploadBytes(storageRef, blob);
  const downloadUrl = await getDownloadURL(storageRef);
  return downloadUrl;
}
