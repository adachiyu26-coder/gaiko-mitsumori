"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { updateEstimateStatus } from "@/app/(dashboard)/estimates/actions";
import { toast } from "sonner";

interface Props {
  estimateId: string;
  currentStatus: string;
}

const transitions: Record<string, { label: string; next: string }[]> = {
  draft: [{ label: "提出済にする", next: "submitted" }],
  submitted: [
    { label: "受注", next: "accepted" },
    { label: "失注", next: "rejected" },
  ],
  accepted: [],
  rejected: [{ label: "作成中に戻す", next: "draft" }],
  expired: [{ label: "作成中に戻す", next: "draft" }],
};

export function EstimateStatusActions({ estimateId, currentStatus }: Props) {
  const [isPending, startTransition] = useTransition();
  const available = transitions[currentStatus] ?? [];

  if (available.length === 0) return null;

  const handleChange = (nextStatus: string) => {
    startTransition(async () => {
      try {
        await updateEstimateStatus(estimateId, nextStatus);
        toast.success("ステータスを更新しました");
      } catch {
        toast.error("更新に失敗しました");
      }
    });
  };

  return (
    <>
      {available.map((t) => (
        <Button
          key={t.next}
          variant="outline"
          size="sm"
          disabled={isPending}
          onClick={() => handleChange(t.next)}
        >
          {t.label}
        </Button>
      ))}
    </>
  );
}
