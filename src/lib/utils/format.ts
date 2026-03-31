export function formatCurrency(amount: number | null | undefined): string {
  if (amount == null) return "¥0";
  return `¥${amount.toLocaleString("ja-JP")}`;
}

export function formatNumber(value: number | null | undefined): string {
  if (value == null) return "0";
  return value.toLocaleString("ja-JP");
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export function formatPercent(value: number | null | undefined): string {
  if (value == null) return "0%";
  return `${value}%`;
}
