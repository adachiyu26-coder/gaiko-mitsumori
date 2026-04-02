"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { CheckCircle2, XCircle, Clock, Shield } from "lucide-react";
import { requestApproval, processApproval } from "@/app/(dashboard)/estimates/approval-actions";
import { toast } from "sonner";

interface ApprovalRequestData {
  id: string;
  status: string;
  currentStep: number;
  totalSteps: number;
  approverIds: string[];
  note: string | null;
  actions: {
    id: string;
    step: number;
    action: string;
    comment: string | null;
    actedAt: string;
    user: { name: string };
  }[];
  requester: { name: string };
  createdAt: string;
}

interface Props {
  estimateId: string;
  estimateStatus: string;
  currentUserId: string;
  currentUserRole: string;
  users: { id: string; name: string; role: string }[];
  approvalRequest: ApprovalRequestData | null;
}

const statusConfig: Record<string, { label: string; icon: typeof Clock; color: string }> = {
  pending: { label: "承認待ち", icon: Clock, color: "text-amber-600" },
  approved: { label: "承認済み", icon: CheckCircle2, color: "text-green-600" },
  rejected: { label: "差戻し", icon: XCircle, color: "text-red-600" },
};

export function ApprovalSection({ estimateId, estimateStatus, currentUserId, currentUserRole, users, approvalRequest }: Props) {
  const [isPending, startTransition] = useTransition();
  const [selectedApprovers, setSelectedApprovers] = useState<string[]>([""]);
  const [note, setNote] = useState("");
  const [comment, setComment] = useState("");

  const canRequest = estimateStatus === "draft" && !approvalRequest && (currentUserRole === "staff" || currentUserRole === "manager");
  const managers = users.filter((u) => u.role === "owner" || u.role === "manager");

  const isCurrentApprover = approvalRequest?.status === "pending" &&
    approvalRequest.approverIds[approvalRequest.currentStep - 1] === currentUserId;

  const handleRequest = () => {
    const approvers = selectedApprovers.filter(Boolean);
    if (approvers.length === 0) { toast.error("承認者を選択してください"); return; }
    startTransition(async () => {
      try {
        await requestApproval(estimateId, approvers, note || undefined);
        toast.success("承認申請を送信しました");
      } catch (err) { toast.error(err instanceof Error ? err.message : "申請に失敗しました"); }
    });
  };

  const handleProcess = (action: "approve" | "reject") => {
    if (!approvalRequest) return;
    startTransition(async () => {
      try {
        await processApproval(approvalRequest.id, action, comment || undefined);
        toast.success(action === "approve" ? "承認しました" : "差戻ししました");
      } catch (err) { toast.error(err instanceof Error ? err.message : "処理に失敗しました"); }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-4 w-4" />
          社内承認
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Show approval request form if eligible */}
        {canRequest && (
          <div className="space-y-3 border rounded-lg p-3">
            <p className="text-sm font-medium">承認申請</p>
            {selectedApprovers.map((id, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-16">Step {idx + 1}</span>
                <Select value={id} onValueChange={(v) => {
                  const next = [...selectedApprovers];
                  next[idx] = v ?? "";
                  setSelectedApprovers(next);
                }}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="承認者を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {managers.map((m) => (
                      <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setSelectedApprovers([...selectedApprovers, ""])}>+ 承認ステップ追加</Button>
            </div>
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="申請メモ（任意）" rows={2} />
            <Button onClick={handleRequest} disabled={isPending} className="w-full bg-brand hover:bg-brand-hover">
              {isPending ? "送信中..." : "承認を申請"}
            </Button>
          </div>
        )}

        {/* Show current approval status */}
        {approvalRequest && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {(() => {
                  const cfg = statusConfig[approvalRequest.status] ?? statusConfig.pending;
                  const Icon = cfg.icon;
                  return <><Icon className={`h-4 w-4 ${cfg.color}`} /><span className="text-sm font-medium">{cfg.label}</span></>;
                })()}
              </div>
              <span className="text-xs text-muted-foreground">
                申請者: {approvalRequest.requester.name}
              </span>
            </div>

            {approvalRequest.note && (
              <p className="text-sm text-muted-foreground bg-muted p-2 rounded">{approvalRequest.note}</p>
            )}

            {/* Steps progress */}
            <div className="space-y-1">
              {approvalRequest.approverIds.map((approverId, idx) => {
                const step = idx + 1;
                const actionRecord = approvalRequest.actions.find((a) => a.step === step);
                const approver = users.find((u) => u.id === approverId);
                const isCurrent = approvalRequest.status === "pending" && step === approvalRequest.currentStep;

                return (
                  <div key={idx} className={`flex items-center gap-2 text-sm p-2 rounded ${isCurrent ? "bg-amber-50 border border-amber-200" : ""}`}>
                    <span className="text-xs text-muted-foreground w-12">Step {step}</span>
                    <span className="flex-1">{approver?.name ?? "不明"}</span>
                    {actionRecord ? (
                      <Badge variant={actionRecord.action === "approve" ? "outline" : "destructive"}>
                        {actionRecord.action === "approve" ? "承認" : "差戻し"}
                      </Badge>
                    ) : isCurrent ? (
                      <Badge variant="secondary">待ち</Badge>
                    ) : (
                      <Badge variant="secondary">未処理</Badge>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Action comments */}
            {approvalRequest.actions.length > 0 && (
              <div className="space-y-1">
                {approvalRequest.actions.filter((a) => a.comment).map((a) => (
                  <div key={a.id} className="text-xs text-muted-foreground bg-muted p-2 rounded">
                    <span className="font-medium">{a.user.name}</span>: {a.comment}
                  </div>
                ))}
              </div>
            )}

            {/* Current approver actions */}
            {isCurrentApprover && (
              <div className="space-y-2 border-t pt-3">
                <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="コメント（任意）" rows={2} />
                <div className="flex gap-2">
                  <Button onClick={() => handleProcess("approve")} disabled={isPending} className="flex-1 bg-green-600 hover:bg-green-700">
                    <CheckCircle2 className="mr-2 h-4 w-4" />{isPending ? "処理中..." : "承認"}
                  </Button>
                  <Button onClick={() => handleProcess("reject")} disabled={isPending} variant="outline" className="flex-1">
                    <XCircle className="mr-2 h-4 w-4" />差戻し
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* No approval needed for owners */}
        {!canRequest && !approvalRequest && estimateStatus === "draft" && currentUserRole === "owner" && (
          <p className="text-sm text-muted-foreground text-center py-2">オーナーは承認不要で直接提出できます</p>
        )}
      </CardContent>
    </Card>
  );
}
