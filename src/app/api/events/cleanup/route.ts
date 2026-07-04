import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRole } from '@/lib/auth-helpers';
import { cleanupPastEvents, getRetentionDays, getCutoffDate } from '@/lib/event-cleanup';

/**
 * POST /api/events/cleanup
 *
 * Manually triggers the past-event cleanup sweep.
 * Returns the count of deleted events and the retention policy in effect.
 *
 * Two ways this endpoint is called:
 *  1. Lazily on every GET /api/events (the cleanup also runs inline there)
 *  2. Externally via an FC timer trigger / cron job hitting this endpoint
 *     with a service token (for periodic cleanup when no one is browsing)
 *
 * Auth: requires admin or director (same as event create/edit/delete).
 * External cron can also pass an X-Cron-Secret header matching
 * CRON_SECRET env var to bypass JWT auth (set CRON_SECRET on the FC
 * service if you want this — otherwise just use a director JWT).
 */
export async function POST(req: NextRequest) {
  try {
    // Allow bypass via shared secret for external cron triggers
    const cronSecret = process.env.CRON_SECRET;
    const providedSecret = req.headers.get('x-cron-secret');
    const isCronAuth = cronSecret && providedSecret && providedSecret === cronSecret;

    if (!isCronAuth) {
      const auth = requireAuth(req);
      if (auth instanceof NextResponse) return auth;
      const roleCheck = requireRole(auth, 'admin', 'director');
      if (roleCheck instanceof NextResponse) return roleCheck;
    }

    const retentionDays = getRetentionDays();
    const cutoff = getCutoffDate(retentionDays);
    const deleted = await cleanupPastEvents();

    return NextResponse.json({
      success: true,
      deletedCount: deleted,
      retentionDays,
      cutoffDate: cutoff.toISOString(),
      message:
        deleted === 0
          ? `No past events to clean up (cutoff: ${cutoff.toISOString()})`
          : `Deleted ${deleted} past event(s) older than ${retentionDays} day(s)`,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Cleanup failed';
    console.error('[Events Cleanup] Error:', err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/**
 * GET /api/events/cleanup
 * Returns the current retention policy and what would be deleted.
 * Useful for admin UI to show "X events will be auto-deleted in Y days".
 */
export async function GET(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    if (auth instanceof NextResponse) return auth;
    const roleCheck = requireRole(auth, 'admin', 'director');
    if (roleCheck instanceof NextResponse) return roleCheck;

    const retentionDays = getRetentionDays();
    const cutoff = getCutoffDate(retentionDays);

    return NextResponse.json({
      retentionDays,
      cutoffDate: cutoff.toISOString(),
      policy: `Events older than ${retentionDays} day(s) are automatically deleted on every events list fetch and via this endpoint.`,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch cleanup policy';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
