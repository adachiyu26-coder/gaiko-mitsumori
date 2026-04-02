"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User } from "lucide-react";
import { toast } from "sonner";

interface Props {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export function ProfileSettings({ user }: Props) {
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState(user.name);

  const handleSave = () => {
    if (!name.trim()) {
      toast.error("名前を入力してください");
      return;
    }
    startTransition(async () => {
      try {
        const res = await fetch("/api/user/profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: name.trim() }),
        });
        if (!res.ok) throw new Error();
        toast.success("プロフィールを更新しました");
      } catch {
        toast.error("更新に失敗しました");
      }
    });
  };

  const roleLabels: Record<string, string> = {
    owner: "オーナー",
    manager: "マネージャー",
    staff: "スタッフ",
    viewer: "閲覧者",
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-4 w-4" />
            プロフィール
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>名前</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="max-w-sm"
            />
          </div>
          <div className="space-y-2">
            <Label>メールアドレス</Label>
            <Input value={user.email} disabled className="max-w-sm bg-muted" />
            <p className="text-xs text-muted-foreground">メールアドレスは変更できません</p>
          </div>
          <div className="space-y-2">
            <Label>ロール</Label>
            <Input value={roleLabels[user.role] ?? user.role} disabled className="max-w-sm bg-muted" />
          </div>
          <Button onClick={handleSave} disabled={isPending} className="bg-brand hover:bg-brand-hover">
            {isPending ? "保存中..." : "プロフィールを保存"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
