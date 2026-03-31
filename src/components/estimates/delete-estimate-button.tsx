"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteEstimate } from "@/app/(dashboard)/estimates/actions";
import { toast } from "sonner";

export function DeleteEstimateButton({ estimateId }: { estimateId: string }) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (!confirm("この見積を削除しますか？この操作は取り消せません。")) return;
    startTransition(async () => {
      try {
        await deleteEstimate(estimateId);
        toast.success("見積を削除しました");
      } catch {
        toast.error("削除に失敗しました");
      }
    });
  };

  return (
    <Button
      variant="destructive"
      size="sm"
      onClick={handleDelete}
      disabled={isPending}
    >
      <Trash2 className="mr-2 h-4 w-4" />
      削除
    </Button>
  );
}
