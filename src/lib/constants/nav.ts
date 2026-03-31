import { LayoutDashboard, FileText, Users, Database, Settings } from "lucide-react";

export const navItems = [
  { href: "/dashboard", label: "ダッシュボード", icon: LayoutDashboard },
  { href: "/estimates", label: "見積一覧", icon: FileText },
  { href: "/customers", label: "顧客管理", icon: Users },
  { href: "/master/unit-prices", label: "単価マスタ", icon: Database },
  { href: "/settings", label: "設定", icon: Settings },
] as const;
