"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <div className="flex items-center gap-2 text-destructive">
        <AlertCircle className="h-6 w-6" />
        <h2 className="text-lg font-semibold">エラーが発生しました</h2>
      </div>
      <p className="text-sm text-muted-foreground text-center max-w-md">
        {error.message || "予期しないエラーが発生しました。再度お試しください。"}
      </p>
      <Button onClick={reset} className="bg-brand hover:bg-brand-hover">
        再試行
      </Button>
    </div>
  );
}
