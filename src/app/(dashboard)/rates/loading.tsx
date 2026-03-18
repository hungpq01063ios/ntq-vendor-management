export default function Loading() {
  return (
    <div className="space-y-4">
      <div className="h-8 w-40 bg-gray-200 rounded animate-pulse" />
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-8 w-20 bg-gray-100 rounded animate-pulse" />
        ))}
      </div>
      <div className="bg-white rounded-lg border p-4 space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />
        ))}
      </div>
    </div>
  );
}
