"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, Mail, MessageSquare } from "lucide-react";
import { toast } from "sonner";

interface NotificationPref {
  emailEnabled: boolean;
  emailExpiryWarning: boolean;
  emailStatusChange: boolean;
  emailCustomerAction: boolean;
  lineEnabled: boolean;
  lineUserId: string | null;
  expiryWarningDays: number;
}

interface Props {
  preferences: NotificationPref | null;
  userId: string;
}

export function NotificationSettings({ preferences, userId }: Props) {
  const [isPending, startTransition] = useTransition();
  const [pref, setPref] = useState<NotificationPref>(preferences ?? {
    emailEnabled: true,
    emailExpiryWarning: true,
    emailStatusChange: true,
    emailCustomerAction: true,
    lineEnabled: false,
    lineUserId: null,
    expiryWarningDays: 7,
  });

  const handleSave = () => {
    startTransition(async () => {
      try {
        const res = await fetch("/api/notifications/preferences", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(pref),
        });
        if (!res.ok) throw new Error();
        toast.success("通知設定を保存しました");
      } catch {
        toast.error("保存に失敗しました");
      }
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            メール通知
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>メール通知を有効にする</Label>
            <Switch checked={pref.emailEnabled} onCheckedChange={(v) => setPref({ ...pref, emailEnabled: v })} />
          </div>
          {pref.emailEnabled && (
            <div className="space-y-3 pl-4 border-l-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">有効期限切れ警告</Label>
                <Switch checked={pref.emailExpiryWarning} onCheckedChange={(v) => setPref({ ...pref, emailExpiryWarning: v })} />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-sm">ステータス変更通知</Label>
                <Switch checked={pref.emailStatusChange} onCheckedChange={(v) => setPref({ ...pref, emailStatusChange: v })} />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-sm">顧客アクション通知（承認・お断り・コメント）</Label>
                <Switch checked={pref.emailCustomerAction} onCheckedChange={(v) => setPref({ ...pref, emailCustomerAction: v })} />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            LINE通知
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>LINE通知を有効にする</Label>
            <Switch checked={pref.lineEnabled} onCheckedChange={(v) => setPref({ ...pref, lineEnabled: v })} />
          </div>
          {pref.lineEnabled && (
            <div className="space-y-2 pl-4 border-l-2">
              <Label className="text-sm">LINE User ID</Label>
              <Input
                value={pref.lineUserId ?? ""}
                onChange={(e) => setPref({ ...pref, lineUserId: e.target.value || null })}
                placeholder="U1234567890abcdef..."
                className="max-w-sm"
              />
              <p className="text-xs text-muted-foreground">
                LINE Messaging APIのUser IDを入力してください。LINE公式アカウントとの友だち追加が必要です。
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            通知タイミング
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Label>有効期限切れ警告</Label>
            <Input
              type="number"
              value={pref.expiryWarningDays}
              onChange={(e) => setPref({ ...pref, expiryWarningDays: parseInt(e.target.value) || 7 })}
              className="w-20"
              min={1}
              max={30}
            />
            <span className="text-sm text-muted-foreground">日前に通知</span>
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={isPending} className="bg-brand hover:bg-brand-hover">
        {isPending ? "保存中..." : "通知設定を保存"}
      </Button>
    </div>
  );
}
