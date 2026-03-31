"use client";

import { useTransition } from "react";
import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { duplicateEstimate } from "@/app/(dashboard)/estimates/actions";
import { toast } from "sonner";

export function DuplicateEstimateButton({ estimateId }: { estimateId: string }) {
  const [isPending, startTransition] = useTransition();

  const handleDuplicate = () => {
    startTransition(async () => {
      try {
        await duplicateEstimate(estimateId);
        toast.success("見積を複製しました");
      } catch {
        toast.error("複製に失敗しました");
      }
    });
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleDuplicate}
      disabled={isPending}
    >
      <Copy className="mr-2 h-4 w-4" />
      複製
    </Button>
  );
}
