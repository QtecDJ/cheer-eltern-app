/**
 * Profile Switcher Module - Entry Point
 * 
 * Export all public APIs for profile switching functionality
 */

// React Components
export { ProfileProvider, useProfileSwitcher } from './ProfileContext';
export { ProfileSwitcher } from './ProfileSwitcher';

// Helper functions for API routes
export { getActiveProfile, isSwitched, getOriginalUserId } from './getActiveProfile';

// Types
export type { ProfileOption, ProfileSwitcherState } from './types';
