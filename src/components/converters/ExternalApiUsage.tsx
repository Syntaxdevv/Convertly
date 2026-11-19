interface ExternalApiUsageProps {
  remaining: number;
  limit: number;
  isLoading: boolean;
  error?: string;
}

export default function ExternalApiUsage({
  remaining,
  limit,
  isLoading,
  error,
}: ExternalApiUsageProps) {
  return (
    <div className="mb-5 rounded-lg border border-gray-200 bg-white px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-gray-800">
            Daily conversion limit
          </p>
        </div>

        {isLoading ? (
          <span className="text-xs font-medium text-gray-400">Loading...</span>
        ) : error ? (
          <span className="text-xs font-medium text-red-600">Unavailable</span>
        ) : (
          <span
            className={`text-sm font-bold ${
              remaining === 0 ? "text-red-600" : "text-[#C62828]"
            }`}
            >
            {remaining} / {limit} left
          </span>
        )}
      </div>

      {!isLoading && !error && (
        <>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-gray-100">
            <div
              className={`h-full rounded-full transition-all ${
                remaining === 0 ? "bg-red-500" : "bg-[#C62828]"
              }`}
              style={{
                width: `${Math.min(
                  100,
                  Math.max(0, ((limit - remaining) / limit) * 100),
                )}%`,
              }}
            />
          </div>

          {remaining === 0 && (
            <p className="mt-2 text-xs font-medium text-red-600">
              Daily limit reached. Try again tomorrow.
            </p>
          )}
        </>
      )}

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
