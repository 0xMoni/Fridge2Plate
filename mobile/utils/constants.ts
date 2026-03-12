export const API_URL =
  process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

export const EXPIRY_THRESHOLDS = {
  warning: 3,
  urgent: 1,
} as const;

export const COLORS = {
  primary: '#3B82F6',
  background: '#F9FAFB',
  card: '#FFFFFF',
  text: '#111827',
  secondaryText: '#6B7280',
  border: '#E5E7EB',
  fresh: '#22C55E',
  expiringSoon: '#F59E0B',
  expired: '#EF4444',
  white: '#FFFFFF',
  black: '#000000',
  overlay: 'rgba(0, 0, 0, 0.4)',
} as const;

export const MAX_SCAN_IMAGES = 5;
