import { NextRequest } from 'next/server';

/**
 * Extract user ID and role from request, checking both query params and headers.
 * Query params are preferred because they don't trigger CORS preflight requests.
 */
export function getUserAuth(req: NextRequest): { userId: string; userRole: string } | null {
  // Try query params first (CORS-friendly)
  const userId = req.nextUrl.searchParams.get('userId') || req.headers.get('x-user-id');
  const userRole = req.nextUrl.searchParams.get('userRole') || req.headers.get('x-user-role');

  if (!userId || !userRole) return null;
  return { userId, userRole };
}

/**
 * Require authentication - returns auth info or null (caller should return 401)
 */
export function requireAuth(req: NextRequest): { userId: string; userRole: string } | { error: boolean } {
  const auth = getUserAuth(req);
  if (!auth) return { error: true };
  return auth;
}
