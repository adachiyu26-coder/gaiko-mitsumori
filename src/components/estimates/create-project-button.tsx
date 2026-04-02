"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Hammer } from "lucide-react";
import { createProjectFromEstimate } from "@/app/(dashboard)/projects/actions";
import { toast } from "sonner";

export function CreateProjectButton({ estimateId }: { estimateId: string }) {
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(async () => {
      try {
        await createProjectFromEstimate(estimateId);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "工程の作成に失敗しました");
      }
    });
  };

  return (
    <Button variant="outline" size="sm" onClick={handleClick} disabled={isPending}>
      <Hammer className="mr-2 h-4 w-4" />
      {isPending ? "作成中..." : "工程を作成"}
    </Button>
  );
}
