"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Share2, Copy, Check } from "lucide-react";
import { shareEstimate } from "@/app/(dashboard)/estimates/actions";
import { toast } from "sonner";

export function ShareEstimateButton({ estimateId }: { estimateId: string }) {
  const [isPending, startTransition] = useTransition();
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    startTransition(async () => {
      try {
        const result = await shareEstimate(estimateId);
        const url = `${window.location.origin}/quotes/${result.token}`;
        setShareUrl(url);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "共有に失敗しました");
      }
    });
  };

  const handleCopy = async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success("URLをコピーしました");
    setTimeout(() => setCopied(false), 2000);
  };

  if (shareUrl) {
    return (
      <div className="flex items-center gap-1">
        <input
          readOnly
          value={shareUrl}
          className="h-8 text-xs border rounded px-2 w-48 bg-muted"
          onClick={(e) => (e.target as HTMLInputElement).select()}
        />
        <Button variant="outline" size="sm" onClick={handleCopy}>
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>
    );
  }

  return (
    <Button variant="outline" size="sm" onClick={handleShare} disabled={isPending}>
      <Share2 className="mr-2 h-4 w-4" />
      {isPending ? "共有中..." : "顧客に共有"}
    </Button>
  );
}
