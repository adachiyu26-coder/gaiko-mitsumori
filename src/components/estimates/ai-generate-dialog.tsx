"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Sparkles, Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface AiGeneratedItem {
  level: number;
  itemName: string;
  specification?: string | null;
  quantity?: number | null;
  unit?: string | null;
  unitPrice?: number | null;
  costPrice?: number | null;
}

interface Props {
  onGenerate: (title: string, items: AiGeneratedItem[]) => void;
}

export function AiGenerateDialog({ onGenerate }: Props) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);

  const handleGenerate = () => {
    if (!description.trim()) {
      toast.error("工事内容を入力してください");
      return;
    }

    startTransition(async () => {
      try {
        let imageBase64: string | undefined;
        if (imageFile) {
          const buffer = await imageFile.arrayBuffer();
          imageBase64 = btoa(
            new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), "")
          );
        }

        const res = await fetch("/api/ai/generate-estimate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ description, imageBase64 }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "生成に失敗しました");
        }

        const data = await res.json();
        onGenerate(data.title, data.items);
        setOpen(false);
        setDescription("");
        setImageFile(null);
        toast.success("AI見積を生成しました。内容をご確認ください。");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "AI生成に失敗しました");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline">
            <Sparkles className="mr-2 h-4 w-4" />
            AI生成
          </Button>
        }
      />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            AI見積自動生成
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>工事内容の説明</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="例: 駐車場2台分のコンクリート打設、アルミフェンス20m、門柱・ポスト設置、アプローチのインターロッキング舗装10㎡"
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              工事の種類、数量、範囲などを具体的に記載すると精度が上がります
            </p>
          </div>

          <div className="space-y-2">
            <Label>現場写真（任意）</Label>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() => document.getElementById("ai-photo-input")?.click()}
              >
                <Upload className="mr-2 h-4 w-4" />
                {imageFile ? imageFile.name : "写真を選択"}
              </Button>
              {imageFile && (
                <Button variant="ghost" size="sm" onClick={() => setImageFile(null)}>
                  削除
                </Button>
              )}
            </div>
            <input
              id="ai-photo-input"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
            />
          </div>

          <Button onClick={handleGenerate} disabled={isPending || !description.trim()} className="w-full">
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                AI生成中（30秒程度かかります）...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                見積を生成
              </>
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            ※ AI生成された見積は参考値です。必ず内容を確認し、必要に応じて修正してください。
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
