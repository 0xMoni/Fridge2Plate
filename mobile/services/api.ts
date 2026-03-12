import axios from 'axios';
import { auth } from './firebase';
import { API_URL } from '../utils/constants';
import type { FoodItem, ScanResult } from '../types';

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 30000,
});

apiClient.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export async function scanImages(
  images: string[]
): Promise<ScanResult[]> {
  const formData = new FormData();
  images.forEach((uri, index) => {
    const filename = uri.split('/').pop() || `image_${index}.jpg`;
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';

    formData.append('images', {
      uri,
      name: filename,
      type,
    } as unknown as Blob);
  });

  const response = await apiClient.post<{ results: ScanResult[] }>(
    '/scan',
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
    }
  );
  return response.data.results;
}

export async function fetchItems(): Promise<FoodItem[]> {
  const response = await apiClient.get<{ items: FoodItem[] }>('/items');
  return response.data.items;
}

export async function createItem(
  item: Omit<FoodItem, 'id'>
): Promise<FoodItem> {
  const response = await apiClient.post<{ item: FoodItem }>('/items', item);
  return response.data.item;
}

export async function patchItem(
  id: string,
  data: Partial<FoodItem>
): Promise<FoodItem> {
  const response = await apiClient.patch<{ item: FoodItem }>(
    `/items/${id}`,
    data
  );
  return response.data.item;
}

export async function removeItem(id: string): Promise<void> {
  await apiClient.delete(`/items/${id}`);
}

export default apiClient;
