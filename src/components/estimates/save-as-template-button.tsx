"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { BookmarkPlus } from "lucide-react";
import { saveEstimateAsTemplate } from "@/app/(dashboard)/master/templates/actions";
import { toast } from "sonner";

interface Props {
  estimateId: string;
  defaultName: string;
}

export function SaveAsTemplateButton({ estimateId, defaultName }: Props) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState(defaultName);
  const [description, setDescription] = useState("");

  const handleSave = () => {
    if (!name.trim()) {
      toast.error("テンプレート名を入力してください");
      return;
    }

    startTransition(async () => {
      try {
        await saveEstimateAsTemplate(estimateId, name.trim(), description.trim() || null);
        toast.success("テンプレートとして保存しました");
        setOpen(false);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "保存に失敗しました");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm">
            <BookmarkPlus className="mr-2 h-4 w-4" />
            テンプレ保存
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>テンプレートとして保存</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>テンプレート名 *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例: カーポート2台用標準"
            />
          </div>
          <div className="space-y-2">
            <Label>説明（任意）</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="このテンプレートの用途や特徴"
              rows={2}
            />
          </div>
          <Button onClick={handleSave} disabled={isPending || !name.trim()} className="w-full">
            {isPending ? "保存中..." : "保存"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
