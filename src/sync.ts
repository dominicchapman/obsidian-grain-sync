export function computeAfterDatetime(daysBack: number, lastSyncedAt: string | null): string {
  if (lastSyncedAt) return lastSyncedAt;

  const daysBackDate = new Date();
  daysBackDate.setHours(0, 0, 0, 0);
  if (daysBack > 0) {
    daysBackDate.setDate(daysBackDate.getDate() - daysBack);
  }
  return daysBackDate.toISOString();
}
