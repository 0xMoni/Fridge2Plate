export interface User {
  uid: string;
  email: string;
  displayName?: string;
  pushToken?: string;
  createdAt: string;
  notificationPrefs: {
    threeDayBefore: boolean;
    oneDayBefore: boolean;
    onExpiry: boolean;
  };
}

export interface FoodItem {
  id: string;
  userId: string;
  itemName: string;
  expiryDate: string; // ISO 8601
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
  status: ExpiryStatus;
}

export interface ScanResult {
  itemName: string;
  expiryDate: string;
  confidence: number;
  rawText: string;
}

export type ExpiryStatus = 'fresh' | 'expiring_soon' | 'expired';
