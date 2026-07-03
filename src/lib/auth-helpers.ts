import { getUserFromRequest, type JWTPayload } from '@/lib/auth';
import { NextResponse } from 'next/server';

/**
 * Extract authenticated user from JWT token in Authorization header.
 * Returns the JWT payload or null if not authenticated.
 */
export function getUserAuth(request: Request): JWTPayload | null {
  return getUserFromRequest(request);
}

/**
 * Require authentication - returns auth info or a 401 NextResponse.
 * Use in API routes: const auth = requireAuth(request); if (auth instanceof NextResponse) return auth;
 */
export function requireAuth(request: Request): JWTPayload | NextResponse {
  const payload = getUserFromRequest(request);
  if (!payload) {
    return NextResponse.json({ error: '未登入或登入已過期' }, { status: 401 });
  }
  return payload;
}

/**
 * Check if user has required role.
 * Returns true if authorized, or a 403 NextResponse if not.
 */
export function requireRole(payload: JWTPayload, ...roles: string[]): boolean | NextResponse {
  if (!roles.includes(payload.role)) {
    return NextResponse.json({ error: '沒有權限執行此操作' }, { status: 403 });
  }
  return true;
}
