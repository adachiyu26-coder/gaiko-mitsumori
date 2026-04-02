"use client";

export default function PublicErrorPage({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center space-y-4 px-4">
        <h2 className="text-xl font-semibold">エラーが発生しました</h2>
        <p className="text-sm text-muted-foreground">{error.message}</p>
        <button
          onClick={reset}
          className="px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300 text-sm"
        >
          再試行
        </button>
      </div>
    </div>
  );
}
