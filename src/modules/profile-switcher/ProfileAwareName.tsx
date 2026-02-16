'use client';

import { useProfileSwitcher } from './ProfileContext';

/**
 * Client component that displays the active profile's name
 * Reads from ProfileContext to show real-time profile changes
 */
export function ProfileAwareName({ fallbackName }: { fallbackName?: string }) {
  const { availableProfiles, activeProfileId } = useProfileSwitcher();
  
  const activeProfile = availableProfiles.find((p) => p.id === activeProfileId);
  
  // Use active profile's firstName, or fall back to session name
  return <>{activeProfile?.firstName || fallbackName || 'User'}</>;
}
