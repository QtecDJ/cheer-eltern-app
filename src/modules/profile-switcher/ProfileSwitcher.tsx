'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useProfileSwitcher } from './ProfileContext';
import { UserCircle, ChevronDown, Check } from 'lucide-react';

export function ProfileSwitcher() {
  const { availableProfiles, activeProfileId, isLoading, switchProfile } = useProfileSwitcher();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeProfile = availableProfiles.find((p) => p.id === activeProfileId);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleProfileSwitch = async (profileId: number) => {
    console.log('ProfileSwitcher: Switching to profile ID:', profileId);
    setIsOpen(false);
    await switchProfile(profileId);
  };

  // Show nothing if only one profile available (no need to switch)
  // IMPORTANT: This must come AFTER all hooks
  if (availableProfiles.length <= 1) {
    return null;
  }

  console.log('ProfileSwitcher render:', {
    availableProfiles,
    activeProfileId,
    activeProfile: activeProfile?.name,
    isLoading
  });

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Profile Switcher"
      >
        <UserCircle className="w-5 h-5 text-slate-400" />
        <div className="flex flex-col items-start min-w-0">
          <span className="text-sm font-medium text-white truncate">
            {activeProfile ? activeProfile.name : 'Select Profile'}
          </span>
          {activeProfile?.teamName && (
            <span className="text-xs text-slate-400 truncate">
              {activeProfile.teamName}
            </span>
          )}
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-[200] overflow-hidden">
          <div className="py-1">
            {availableProfiles.map((profile) => {
              const isActive = profile.id === activeProfileId;
              
              return (
                <button
                  key={profile.id}
                  onClick={() => handleProfileSwitch(profile.id)}
                  disabled={isActive || isLoading}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-700 transition-colors disabled:opacity-60 disabled:cursor-default"
                >
                  <UserCircle className="w-6 h-6 text-slate-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white truncate">
                        {profile.name}
                      </span>
                      {profile.relation === 'self' && (
                        <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded">
                          Du
                        </span>
                      )}
                      {profile.relation === 'child' && (
                        <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded">
                          Kind
                        </span>
                      )}
                    </div>
                    {profile.teamName && (
                      <span className="text-xs text-slate-400 truncate block">
                        {profile.teamName}
                      </span>
                    )}
                  </div>
                  {isActive && (
                    <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
