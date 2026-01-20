export function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-4 p-4">
      {/* Header Skeleton */}
      <div className="space-y-2">
        <div className="h-8 bg-muted rounded-lg w-3/4" />
        <div className="h-4 bg-muted rounded w-1/2" />
      </div>

      {/* Stats Skeleton */}
      <div className="grid grid-cols-2 gap-3 mt-6">
        {[1, 2].map((i) => (
          <div key={i} className="h-28 bg-muted rounded-2xl" />
        ))}
      </div>

      {/* Cards Skeleton */}
      <div className="space-y-3 mt-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-muted rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

/**
 * @deprecated moved to src/deprecated/components/ui/loading.deprecated.tsx
 * Keep re-export to avoid breaking imports.
 */
// CardSkeleton deprecated; removed during cleanup
