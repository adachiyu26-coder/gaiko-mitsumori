"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { deleteEstimate } from "@/app/(dashboard)/estimates/actions";
import { toast } from "sonner";

export function DeleteEstimateButton({ estimateId }: { estimateId: string }) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
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
    <AlertDialog>
      <AlertDialogTrigger>
        <Button variant="destructive" size="sm" disabled={isPending}>
          <Trash2 className="mr-2 h-4 w-4" />
          削除
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>見積を削除しますか？</AlertDialogTitle>
          <AlertDialogDescription>
            この操作は取り消せません。見積のすべての明細データも削除されます。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>キャンセル</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            削除する
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
