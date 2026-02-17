'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import type { ProfileOption } from './types';

interface ProfileContextValue {
  availableProfiles: ProfileOption[];
  activeProfileId: number | null;
  isLoading: boolean;
  switchProfile: (profileId: number) => Promise<void>;
  refreshProfiles: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

interface ProfileProviderProps {
  children: ReactNode;
}

export function ProfileProvider({ children }: ProfileProviderProps) {  const router = useRouter();  const [availableProfiles, setAvailableProfiles] = useState<ProfileOption[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch available profiles on mount
  const refreshProfiles = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/profile-switcher/profiles', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      if (res.ok) {
        const data = await res.json();
        setAvailableProfiles(data.profiles || []);
        setActiveProfileId(data.activeProfileId || null);
      } else {
        console.error('Failed to fetch profiles');
      }
    } catch (error) {
      console.error('Error fetching profiles:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshProfiles();
  }, []);

  const switchProfile = async (profileId: number) => {
    try {
      console.log('ProfileContext: Starting profile switch to ID:', profileId);
      setIsLoading(true);
      const res = await fetch('/api/profile-switcher/profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId }),
        cache: 'no-store',
      });

      console.log('ProfileContext: API response status:', res.status);
      
      if (res.ok) {
        const data = await res.json();
        console.log('ProfileContext: Switch successful, response:', data);
        
        // Update active profile locally immediately for instant UI feedback
        setActiveProfileId(profileId);
        
        // Small delay to ensure session cookies are set, then reload page
        // This ensures all server components get fresh session data
        setTimeout(() => {
          console.log('ProfileContext: Reloading page with new session...');
          window.location.reload();
        }, 200);
      } else {
        const data = await res.json();
        console.error('ProfileContext: Switch failed:', data);
        alert(data.error || 'Failed to switch profile');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('ProfileContext: Error switching profile:', error);
      alert('Error switching profile');
      setIsLoading(false);
    }
  };

  const value: ProfileContextValue = {
    availableProfiles,
    activeProfileId,
    isLoading,
    switchProfile,
    refreshProfiles,
  };

  return (
    <ProfileContext.Provider value={value}>
      {children}
    </ProfileContext.Provider>
  );
}

/**
 * Hook to access profile switcher functionality
 */
export function useProfileSwitcher(): ProfileContextValue {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfileSwitcher must be used within ProfileProvider');
  }
  return context;
}
