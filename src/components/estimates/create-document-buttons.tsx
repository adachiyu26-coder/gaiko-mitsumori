"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { FileText, ShoppingCart, Loader2, ArrowRight } from "lucide-react";
import { createPurchaseOrderFromEstimate, createInvoiceFromEstimate } from "@/app/(dashboard)/documents/actions";
import { toast } from "sonner";

interface Props {
  estimateId: string;
  isAccepted: boolean;
}

export function CreateDocumentButtons({ estimateId, isAccepted }: Props) {
  if (!isAccepted) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">帳票を作成</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 md:grid-cols-2">
          <CreatePOCard estimateId={estimateId} />
          <CreateInvoiceCard estimateId={estimateId} />
        </div>
      </CardContent>
    </Card>
  );
}

function CreatePOCard({ estimateId }: { estimateId: string }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [supplierName, setSupplierName] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [note, setNote] = useState("");

  const handleCreate = () => {
    if (!supplierName.trim()) { toast.error("発注先名を入力してください"); return; }
    startTransition(async () => {
      try {
        await createPurchaseOrderFromEstimate(estimateId, {
          supplierName: supplierName.trim(),
          deliveryDate: deliveryDate || undefined,
          note: note || undefined,
        });
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "発注書の作成に失敗しました");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <button className="flex items-center gap-3 rounded-lg border p-4 text-left hover:bg-muted/50 transition-colors w-full">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 shrink-0">
              <ShoppingCart className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">発注書を作成</p>
              <p className="text-xs text-muted-foreground">仕入先への発注書を見積明細から自動作成</p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
          </button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>発注書を作成</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>発注先名 <span className="text-destructive">*</span></Label>
            <Input value={supplierName} onChange={(e) => setSupplierName(e.target.value)} placeholder="株式会社〇〇建材" />
          </div>
          <div className="space-y-2">
            <Label>納品希望日</Label>
            <Input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>備考</Label>
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="発注に関する備考" />
          </div>
          <p className="text-xs text-muted-foreground">見積明細の原価単価で発注書が作成されます</p>
          <Button onClick={handleCreate} disabled={isPending} className="w-full bg-brand hover:bg-brand-hover">
            {isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />作成中...</> : "発注書を作成"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CreateInvoiceCard({ estimateId }: { estimateId: string }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [dueDate, setDueDate] = useState("");
  const [note, setNote] = useState("");

  const handleCreate = () => {
    startTransition(async () => {
      try {
        await createInvoiceFromEstimate(estimateId, {
          dueDate: dueDate || undefined,
          note: note || undefined,
        });
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "請求書の作成に失敗しました");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <button className="flex items-center gap-3 rounded-lg border p-4 text-left hover:bg-muted/50 transition-colors w-full">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 text-green-600 shrink-0">
              <FileText className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">請求書を作成</p>
              <p className="text-xs text-muted-foreground">顧客への請求書を見積金額から自動作成</p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
          </button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>請求書を作成</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>支払期限</Label>
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>備考</Label>
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="請求に関する備考" />
          </div>
          <p className="text-xs text-muted-foreground">見積の合計金額で請求書が作成されます</p>
          <Button onClick={handleCreate} disabled={isPending} className="w-full bg-brand hover:bg-brand-hover">
            {isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />作成中...</> : "請求書を作成"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
