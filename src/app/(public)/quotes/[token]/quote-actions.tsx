"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, X, MessageSquare } from "lucide-react";
import { toast } from "sonner";

interface Props {
  token: string;
  estimateId: string;
}

export function QuoteActions({ token, estimateId }: Props) {
  const [isPending, startTransition] = useTransition();
  const [showComment, setShowComment] = useState(false);
  const [comment, setComment] = useState("");
  const [name, setName] = useState("");

  const handleAction = (action: "accept" | "reject") => {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/quotes/${token}/${action}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: name || "お客様" }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "エラーが発生しました");
        }
        toast.success(action === "accept" ? "見積を承認しました" : "お断りしました");
        window.location.reload();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "エラーが発生しました");
      }
    });
  };

  const handleComment = () => {
    if (!comment.trim()) return;
    startTransition(async () => {
      try {
        const res = await fetch(`/api/quotes/${token}/comment`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: name || "お客様", content: comment }),
        });
        if (!res.ok) throw new Error();
        toast.success("コメントを送信しました");
        setComment("");
        window.location.reload();
      } catch {
        toast.error("コメントの送信に失敗しました");
      }
    });
  };

  return (
    <Card className="border-2 border-brand/30">
      <CardHeader>
        <CardTitle>ご回答</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label className="text-sm">お名前</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="山田 太郎"
            className="max-w-xs"
          />
        </div>

        <div className="flex gap-3">
          <Button
            onClick={() => handleAction("accept")}
            disabled={isPending}
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            <Check className="mr-2 h-4 w-4" />
            {isPending ? "処理中..." : "承認する"}
          </Button>
          <Button
            onClick={() => handleAction("reject")}
            disabled={isPending}
            variant="outline"
            className="flex-1"
          >
            <X className="mr-2 h-4 w-4" />
            お断りする
          </Button>
        </div>

        <div className="pt-2">
          {!showComment ? (
            <Button variant="ghost" size="sm" onClick={() => setShowComment(true)}>
              <MessageSquare className="mr-2 h-4 w-4" />
              質問・コメントする
            </Button>
          ) : (
            <div className="space-y-2">
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="ご質問やご要望をお書きください..."
                rows={3}
              />
              <div className="flex gap-2">
                <Button onClick={handleComment} disabled={isPending || !comment.trim()} size="sm">
                  送信
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setShowComment(false)}>
                  キャンセル
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
