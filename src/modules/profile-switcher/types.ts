/**
 * Type definitions for Profile Switcher module
 */

export interface ProfileOption {
  id: number;
  name: string;
  firstName: string;
  lastName: string;
  teamId: number | null;
  teamName: string | null;
  photoUrl: string | null;
  relation: 'self' | 'child' | 'other'; // Relationship to logged-in user
  isSelf?: boolean; // Helper flag for UI
}

export interface ProfileSwitcherState {
  availableProfiles: ProfileOption[];
  activeProfileId: number | null;
  isLoading: boolean;
}
