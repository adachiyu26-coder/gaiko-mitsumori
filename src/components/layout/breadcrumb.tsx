"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";

const pathLabels: Record<string, string> = {
  dashboard: "ダッシュボード",
  estimates: "見積一覧",
  new: "新規作成",
  edit: "編集",
  customers: "顧客管理",
  master: "マスタ管理",
  "unit-prices": "単価マスタ",
  settings: "設定",
};

export function Breadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length <= 1) return null;

  const crumbs: { label: string; href: string }[] = [
    { label: "ホーム", href: "/dashboard" },
  ];

  let accumulated = "";
  for (const segment of segments) {
    accumulated += `/${segment}`;
    const label = pathLabels[segment];
    if (label) {
      crumbs.push({ label, href: accumulated });
    } else if (segment.length === 36 && segment.includes("-")) {
      // UUID: リソース詳細ページ（ラベルは省略）
      crumbs.push({ label: "詳細", href: accumulated });
    }
  }

  if (crumbs.length <= 1) return null;

  return (
    <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-4 flex-wrap">
      {crumbs.map((crumb, i) => (
        <span key={crumb.href} className="flex items-center gap-1">
          {i > 0 && <ChevronRight className="h-3 w-3 flex-shrink-0" />}
          {i === 0 ? (
            <Link href={crumb.href} className="hover:text-foreground transition-colors">
              <Home className="h-3 w-3" />
            </Link>
          ) : i === crumbs.length - 1 ? (
            <span className="text-foreground font-medium">{crumb.label}</span>
          ) : (
            <Link href={crumb.href} className="hover:text-foreground transition-colors">
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}
