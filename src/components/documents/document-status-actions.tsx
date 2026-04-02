"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Send, Package, CircleDollarSign, Loader2 } from "lucide-react";
import { updateDocumentStatus, markInvoicePaid } from "@/app/(dashboard)/documents/actions";
import { toast } from "sonner";

// Purchase Order status actions
export function POStatusActions({ id, currentStatus }: { id: string; currentStatus: string }) {
  const [isPending, startTransition] = useTransition();

  const handleStatusChange = (status: string) => {
    startTransition(async () => {
      try {
        await updateDocumentStatus("po", id, status);
        toast.success("ステータスを更新しました");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "更新に失敗しました");
      }
    });
  };

  return (
    <div className="flex gap-2">
      {currentStatus === "draft" && (
        <Button variant="outline" size="sm" onClick={() => handleStatusChange("sent")} disabled={isPending}>
          {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
          発注済にする
        </Button>
      )}
      {currentStatus === "sent" && (
        <Button variant="outline" size="sm" onClick={() => handleStatusChange("delivered")} disabled={isPending}>
          {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Package className="mr-2 h-4 w-4" />}
          納品済にする
        </Button>
      )}
    </div>
  );
}

// Invoice status actions
export function InvoiceStatusActions({ id, currentStatus, totalAmount }: { id: string; currentStatus: string; totalAmount: number }) {
  const [isPending, startTransition] = useTransition();

  const handleStatusChange = (status: string) => {
    startTransition(async () => {
      try {
        await updateDocumentStatus("invoice", id, status);
        toast.success("ステータスを更新しました");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "更新に失敗しました");
      }
    });
  };

  return (
    <div className="flex gap-2 flex-wrap">
      {currentStatus === "draft" && (
        <Button variant="outline" size="sm" onClick={() => handleStatusChange("sent")} disabled={isPending}>
          {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
          送付済にする
        </Button>
      )}
      {(currentStatus === "sent" || currentStatus === "partial" || currentStatus === "overdue") && (
        <RecordPaymentDialog id={id} totalAmount={totalAmount} />
      )}
    </div>
  );
}

// Payment recording dialog
function RecordPaymentDialog({ id, totalAmount }: { id: string; totalAmount: number }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [amount, setAmount] = useState(String(totalAmount));

  const handleRecord = () => {
    const paidAmount = parseInt(amount) || 0;
    if (paidAmount <= 0) { toast.error("入金額を入力してください"); return; }
    startTransition(async () => {
      try {
        await markInvoicePaid(id, paidAmount);
        toast.success("入金を記録しました");
        setOpen(false);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "記録に失敗しました");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm">
            <CircleDollarSign className="mr-2 h-4 w-4" />
            入金記録
          </Button>
        }
      />
      <DialogContent className="sm:max-w-sm">
        <DialogHeader><DialogTitle>入金を記録</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>入金額</Label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="text-right font-mono"
            />
            <p className="text-xs text-muted-foreground">
              請求額: ¥{totalAmount.toLocaleString()}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setAmount(String(totalAmount))} className="flex-1">
              全額
            </Button>
            <Button variant="outline" size="sm" onClick={() => setAmount(String(Math.floor(totalAmount / 2)))} className="flex-1">
              半額
            </Button>
          </div>
          <Button onClick={handleRecord} disabled={isPending} className="w-full bg-brand hover:bg-brand-hover">
            {isPending ? "記録中..." : "入金を記録"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
