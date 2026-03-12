import { differenceInDays, format, parseISO, startOfDay } from 'date-fns';
import type { ExpiryStatus } from '../types';
import { EXPIRY_THRESHOLDS } from './constants';

export function daysUntilExpiry(date: string): number {
  const expiryDate = startOfDay(parseISO(date));
  const today = startOfDay(new Date());
  return differenceInDays(expiryDate, today);
}

export function getExpiryStatus(date: string): ExpiryStatus {
  const days = daysUntilExpiry(date);
  if (days <= 0) return 'expired';
  if (days <= EXPIRY_THRESHOLDS.warning) return 'expiring_soon';
  return 'fresh';
}

export function formatExpiryDate(date: string): string {
  try {
    return format(parseISO(date), 'MMM d, yyyy');
  } catch {
    return date;
  }
}

export function formatDaysLeft(days: number): string {
  if (days === 0) return 'Expires today';
  if (days === 1) return '1 day left';
  if (days > 1) return `${days} days left`;
  if (days === -1) return 'Expired 1 day ago';
  return `Expired ${Math.abs(days)} days ago`;
}
