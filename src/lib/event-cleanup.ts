import { db } from '@/lib/db';

/**
 * Default retention policy for past events.
 * Events whose date is older than this many days are auto-deleted.
 *
 * 30 days is a sensible default — enough time for directors to review
 * attendance and for any post-event notifications to settle, but short
 * enough to keep the calendar and list views focused on upcoming events.
 *
 * Override via the EVENT_RETENTION_DAYS env var if needed.
 */
export const DEFAULT_EVENT_RETENTION_DAYS = 30;

export function getRetentionDays(): number {
  const raw = process.env.EVENT_RETENTION_DAYS;
  if (!raw) return DEFAULT_EVENT_RETENTION_DAYS;
  const n = parseInt(raw, 10);
  if (Number.isNaN(n) || n < 1) return DEFAULT_EVENT_RETENTION_DAYS;
  return n;
}

/**
 * Compute the cutoff date — events strictly older than this should be deleted.
 */
export function getCutoffDate(days: number = getRetentionDays()): Date {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return cutoff;
}

/**
 * Soft-fail delete of all events whose `date` is older than the retention cutoff.
 *
 * Semantics:
 *  - Never throws — cleanup failures are logged but do not break the caller.
 *    This is important because cleanup runs inline with GET /api/events,
 *    and we don't want a transient DB issue to break event listing.
 *  - Returns the count of deleted events (0 if nothing deleted or on error).
 *  - Deletes EventParticipant rows first (foreign key dependency).
 *
 * Usage:
 *   const deleted = await cleanupPastEvents();
 *   if (deleted > 0) console.log(`[Events] Auto-deleted ${deleted} past events`);
 */
export async function cleanupPastEvents(days: number = getRetentionDays()): Promise<number> {
  try {
    const cutoff = getCutoffDate(days);

    // Find events to delete (need their IDs to cascade-delete participants)
    const stale = await db.event.findMany({
      where: { date: { lt: cutoff } },
      select: { id: true },
    });

    if (stale.length === 0) return 0;

    const staleIds = stale.map((e) => e.id);

    // Delete participants first, then registrations, then events
    await db.eventParticipant.deleteMany({
      where: { eventId: { in: staleIds } },
    });
    await db.eventRegistration.deleteMany({
      where: { eventId: { in: staleIds } },
    });
    const result = await db.event.deleteMany({
      where: { id: { in: staleIds } },
    });

    return result.count;
  } catch (err) {
    // Soft-fail: log and return 0 — do not break the caller
    console.error('[Events] Auto-cleanup failed:', err);
    return 0;
  }
}
