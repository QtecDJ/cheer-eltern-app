const DEFAULT_TTL = 2000;
const DEFAULT_TIMEOUT = 10000;

export function clearDeduplicationCache(pattern?: string | RegExp): void {
  // original implementation moved here for archival
}

export function getDeduplicationStats() {
  return {
    cachedResults: 0,
    pendingRequests: 0,
    cacheKeys: [],
    pendingKeys: [],
  };
}
