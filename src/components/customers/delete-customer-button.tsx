"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteCustomer } from "@/app/(dashboard)/customers/actions";
import { toast } from "sonner";

export function DeleteCustomerButton({ customerId }: { customerId: string }) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (!confirm("この顧客を削除しますか？関連する見積は保持されます。")) return;
    startTransition(async () => {
      try {
        await deleteCustomer(customerId);
        toast.success("顧客を削除しました");
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
