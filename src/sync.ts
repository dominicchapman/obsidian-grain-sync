export function computeAfterDatetime(daysBack: number, lastSyncedAt: string | null): string {
  const daysBackDate = new Date();
  daysBackDate.setHours(0, 0, 0, 0);
  if (daysBack > 0) {
    daysBackDate.setDate(daysBackDate.getDate() - daysBack);
  }

  if (!lastSyncedAt) return daysBackDate.toISOString();

  const lastSync = new Date(lastSyncedAt);
  return lastSync > daysBackDate ? lastSync.toISOString() : daysBackDate.toISOString();
}
