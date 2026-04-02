"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { FileText, ShoppingCart } from "lucide-react";
import { createPurchaseOrderFromEstimate, createInvoiceFromEstimate } from "@/app/(dashboard)/documents/actions";
import { toast } from "sonner";

interface Props {
  estimateId: string;
  isAccepted: boolean;
}

export function CreateDocumentButtons({ estimateId, isAccepted }: Props) {
  if (!isAccepted) return null;

  return (
    <div className="flex gap-2">
      <CreatePODialog estimateId={estimateId} />
      <CreateInvoiceDialog estimateId={estimateId} />
    </div>
  );
}

function CreatePODialog({ estimateId }: { estimateId: string }) {
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
      <DialogTrigger render={<Button variant="outline" size="sm"><ShoppingCart className="mr-2 h-4 w-4" />発注書作成</Button>} />
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>発注書を作成</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>発注先名 *</Label>
            <Input value={supplierName} onChange={(e) => setSupplierName(e.target.value)} placeholder="株式会社〇〇建材" />
          </div>
          <div className="space-y-2">
            <Label>納品希望日</Label>
            <Input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>備考</Label>
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} />
          </div>
          <Button onClick={handleCreate} disabled={isPending} className="w-full bg-brand hover:bg-brand-hover">
            {isPending ? "作成中..." : "発注書を作成"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CreateInvoiceDialog({ estimateId }: { estimateId: string }) {
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
      <DialogTrigger render={<Button variant="outline" size="sm"><FileText className="mr-2 h-4 w-4" />請求書作成</Button>} />
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>請求書を作成</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>支払期限</Label>
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>備考</Label>
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} />
          </div>
          <Button onClick={handleCreate} disabled={isPending} className="w-full bg-brand hover:bg-brand-hover">
            {isPending ? "作成中..." : "請求書を作成"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
