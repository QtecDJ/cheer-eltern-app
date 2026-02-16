import 'server-only';
import { SessionUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

/**
 * Server-side helper to get active profile ID with automatic parent-child mapping.
 * This function can ONLY be used in Server Components and API routes (not Client Components).
 * 
 * For parent accounts: Returns the first child's member ID
 * For other accounts: Returns activeProfileId or session.id
 * 
 * @param session - The current session
 * @returns The active profile ID (child's ID for parents)
 */
export async function getActiveProfileWithParentMapping(session: SessionUser): Promise<number> {
  // If activeProfileId is explicitly set, use it
  if (session.activeProfileId) {
    return session.activeProfileId;
  }
  
  // Check if user has parent role
  const rolesFromArray = session.roles || [];
  const rolesFromString = session.userRole?.split(',').map(r => r.trim()) || [];
  const allRoles = [...new Set([...rolesFromArray, ...rolesFromString])];
  const hasParentRole = allRoles.includes('parent');
  
  // If user is a parent, find their first child's member ID
  if (hasParentRole) {
    const parentRelation = await prisma.parentChildRelation.findFirst({
      where: {
        parentId: session.id,
        isActive: true,
        child: {
          memberId: { not: null },
        },
      },
      select: {
        child: {
          select: {
            memberId: true,
          },
        },
      },
    });
    
    if (parentRelation?.child.memberId) {
      return parentRelation.child.memberId;
    }
  }
  
  // Default: return the user's own ID
  return session.id;
}
