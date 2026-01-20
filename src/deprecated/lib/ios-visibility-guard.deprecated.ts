const DEFAULT_MIN_PAUSE = 30 * 1000; // 30 Sekunden
const DEFAULT_DEBOUNCE = 800; // 800ms
const STORAGE_PREFIX = 'ios_visibility_';

function getLastVisibleTime(key: string): number | null {
  try {
    const stored = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
    return stored ? parseInt(stored, 10) : null;
  } catch (e) {
    return null;
  }
}

function setLastVisibleTime(key: string, timestamp: number): void {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${key}`, timestamp.toString());
  } catch (e) {
    // Ignore storage errors
  }
}

export function wouldTriggerResume(
  key: string,
  minPauseDuration: number = DEFAULT_MIN_PAUSE
): boolean {
  const lastTime = getLastVisibleTime(key);
  if (!lastTime) return false;

  const pauseDuration = Date.now() - lastTime;
  return pauseDuration >= minPauseDuration;
}

export function resetResumeTimer(key: string): void {
  setLastVisibleTime(key, Date.now());
}

export function clearAllVisibilityGuards(): void {
  try {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(STORAGE_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  } catch (e) {
    // Ignore
  }
}
