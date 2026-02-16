import { SessionUser } from '@/lib/auth';

/**
 * Get the active profile ID from session.
 * Returns activeProfileId if set, otherwise falls back to the user's own ID.
 * 
 * Note: This does NOT handle parent-child mapping automatically.
 * Use getActiveProfileWithParentMapping() in server components for that.
 * 
 * Use this in API routes when you need to know "who is acting" in the current request.
 * 
 * Example:
 * ```ts
 * const session = await getSession();
 * if (!session) return unauthorized();
 * 
 * const activeProfileId = getActiveProfile(session);
 * // Now use activeProfileId for queries
 * const attendances = await prisma.attendance.findMany({
 *   where: { memberId: activeProfileId }
 * });
 * ```
 */
export function getActiveProfile(session: SessionUser): number {
  return session.activeProfileId ?? session.id;
}

/**
 * Check if the current session is acting as a different profile.
 * Returns true if activeProfileId is set and different from the logged-in user's ID.
 */
export function isSwitched(session: SessionUser): boolean {
  return !!(session.activeProfileId && session.activeProfileId !== session.id);
}

/**
 * Get the original logged-in user ID (not the active profile).
 * Useful for audit logs or permission checks.
 */
export function getOriginalUserId(session: SessionUser): number {
  return session.id;
}
