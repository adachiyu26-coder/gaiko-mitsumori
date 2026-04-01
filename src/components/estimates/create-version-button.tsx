"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { GitBranch } from "lucide-react";
import { createNewVersion } from "@/app/(dashboard)/estimates/actions";
import { toast } from "sonner";

export function CreateVersionButton({ estimateId }: { estimateId: string }) {
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(async () => {
      try {
        await createNewVersion(estimateId);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "バージョン作成に失敗しました");
      }
    });
  };

  return (
    <Button variant="outline" size="sm" onClick={handleClick} disabled={isPending}>
      <GitBranch className="mr-2 h-4 w-4" />
      {isPending ? "作成中..." : "新バージョン"}
    </Button>
  );
}
