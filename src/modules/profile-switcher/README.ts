/**
 * PROFILE SWITCHER MODULE
 * =======================
 * 
 * Allows users with multiple member profiles (e.g., parents with multiple children)
 * to switch between profiles without re-authentication.
 * 
 * ARCHITECTURE:
 * -------------
 * - Session stores: userId (logged-in account) + activeProfileId (current member context)
 * - Default behavior: activeProfileId defaults to userId (self)
 * - Switching: User can select any member they have access to
 * - APIs: Can use getActiveProfile() helper to get current acting member
 * 
 * FILES:
 * ------
 * - ProfileContext.tsx: React context + provider for profile management
 * - ProfileSwitcher.tsx: UI component for profile selection
 * - getActiveProfile.ts: Helper function for API routes
 * - types.ts: Shared type definitions
 * 
 * INTEGRATION:
 * ------------
 * 1. Wrap app with ProfileProvider in layout.tsx
 * 2. Use ProfileSwitcher component in navigation
 * 3. Use getActiveProfile() in API routes instead of session.id directly
 * 
 * REMOVAL:
 * --------
 * To remove this feature:
 * 1. Delete src/modules/profile-switcher directory
 * 2. Remove activeProfileId from SessionUser interface in src/lib/auth.ts
 * 3. Remove ProfileProvider from layout.tsx
 * 4. Remove ProfileSwitcher from navigation
 * 5. Revert API changes (getActiveProfile back to session.id)
 */

export const PROFILE_SWITCHER_MODULE_INFO = {
  version: '1.0.0',
  author: 'GitHub Copilot',
  created: '2026-02-16',
};
