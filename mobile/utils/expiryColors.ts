import type { ExpiryStatus } from '../types';

const STATUS_COLORS: Record<ExpiryStatus, string> = {
  fresh: '#22C55E',
  expiring_soon: '#F59E0B',
  expired: '#EF4444',
};

const STATUS_BACKGROUND_COLORS: Record<ExpiryStatus, string> = {
  fresh: '#DCFCE7',
  expiring_soon: '#FEF3C7',
  expired: '#FEE2E2',
};

export function getExpiryColor(status: ExpiryStatus): string {
  return STATUS_COLORS[status];
}

export function getExpiryBackgroundColor(status: ExpiryStatus): string {
  return STATUS_BACKGROUND_COLORS[status];
}
