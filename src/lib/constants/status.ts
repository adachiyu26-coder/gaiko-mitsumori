export type EstimateStatus = "draft" | "submitted" | "accepted" | "rejected" | "expired";

export const ESTIMATE_STATUS_CONFIG: Record<
  EstimateStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline"; color: string }
> = {
  draft: { label: "作成中", variant: "secondary", color: "bg-gray-100 text-gray-700" },
  submitted: { label: "提出済", variant: "default", color: "bg-blue-100 text-blue-700" },
  accepted: { label: "受注", variant: "outline", color: "bg-green-100 text-green-700" },
  rejected: { label: "失注", variant: "destructive", color: "bg-red-100 text-red-700" },
  expired: { label: "期限切れ", variant: "secondary", color: "bg-yellow-100 text-yellow-700" },
};

export const ESTIMATE_UNITS = ["㎡", "m", "個", "台", "本", "式", "m3", "人工", "セット"] as const;
