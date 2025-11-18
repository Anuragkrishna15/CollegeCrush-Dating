import { useState, useEffect } from 'react';
import { MatchingPreferences, MatchingVariant } from '../types/types.ts';
import { matchingService } from '../services/matching.ts';

const STORAGE_KEY = 'matchingPreferences';

export const useMatchingPreferences = (userId: string | undefined) => {
  const [preferences, setPreferences] = useState<MatchingPreferences>(
    matchingService.getDefaultPreferences()
  );
  const [variant, setVariant] = useState<MatchingVariant>('advanced');
  const [isLoading, setIsLoading] = useState(true);

  // Load preferences from localStorage
  useEffect(() => {
    if (!userId) return;

    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_${userId}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Validate that parsed data is an object
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          setPreferences({ ...matchingService.getDefaultPreferences(), ...parsed });
        } else {
          console.warn('Invalid matching preferences format, using defaults');
          setPreferences(matchingService.getDefaultPreferences());
        }
      }
    } catch (error) {
      console.error('Error loading matching preferences:', error);
      // Reset to defaults if parsing fails
      setPreferences(matchingService.getDefaultPreferences());
    }

    // Assign A/B testing variant
    const assignedVariant = matchingService.assignVariant(userId);
    setVariant(assignedVariant);

    setIsLoading(false);
  }, [userId]);

  // Save preferences to localStorage
  const savePreferences = (newPreferences: Partial<MatchingPreferences>) => {
    if (!userId) return;

    const updated = { ...preferences, ...newPreferences };
    setPreferences(updated);

    try {
      localStorage.setItem(`${STORAGE_KEY}_${userId}`, JSON.stringify(updated));
      // Clear cache when preferences change
      matchingService.clearCacheForUser(userId);
    } catch (error) {
      console.error('Error saving matching preferences:', error);
    }
  };

  // Reset to defaults
  const resetToDefaults = () => {
    const defaults = matchingService.getDefaultPreferences();
    setPreferences(defaults);
    if (userId) {
      localStorage.removeItem(`${STORAGE_KEY}_${userId}`);
    }
  };

  return {
    preferences,
    variant,
    isLoading,
    savePreferences,
    resetToDefaults
  };
};