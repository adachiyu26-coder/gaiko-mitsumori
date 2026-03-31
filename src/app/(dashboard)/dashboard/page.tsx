import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Users, TrendingUp, Percent } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import Link from "next/link";

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  draft: { label: "作成中", variant: "secondary" },
  submitted: { label: "提出済", variant: "default" },
  accepted: { label: "受注", variant: "outline" },
  rejected: { label: "失注", variant: "destructive" },
  expired: { label: "期限切れ", variant: "secondary" },
};

export default async function DashboardPage() {
  const user = await requireUser();
  const companyId = user.companyId;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [estimateCount, totalAmount, acceptedCount, recentEstimates, allMonthEstimates] =
    await Promise.all([
      prisma.estimate.count({
        where: { companyId, createdAt: { gte: startOfMonth } },
      }),
      prisma.estimate.aggregate({
        where: { companyId, createdAt: { gte: startOfMonth } },
        _sum: { totalAmount: true },
      }),
      prisma.estimate.count({
        where: {
          companyId,
          status: "accepted",
          createdAt: { gte: startOfMonth },
        },
      }),
      prisma.estimate.findMany({
        where: { companyId },
        include: { customer: true },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      prisma.estimate.findMany({
        where: { companyId, createdAt: { gte: startOfMonth } },
        select: { grossProfitRate: true },
      }),
    ]);

  const acceptanceRate =
    estimateCount > 0 ? Math.round((acceptedCount / estimateCount) * 100) : 0;
  const avgProfitRate =
    allMonthEstimates.length > 0
      ? Math.round(
          allMonthEstimates.reduce(
            (sum, e) => sum + Number(e.grossProfitRate),
            0
          ) / allMonthEstimates.length * 10
        ) / 10
      : 0;

  const kpiCards = [
    {
      title: "今月見積数",
      value: `${estimateCount}件`,
      icon: FileText,
    },
    {
      title: "見積総額",
      value: formatCurrency(Number(totalAmount._sum.totalAmount ?? 0)),
      icon: TrendingUp,
    },
    {
      title: "受注率",
      value: `${acceptanceRate}%`,
      icon: Users,
    },
    {
      title: "平均粗利率",
      value: `${avgProfitRate}%`,
      icon: Percent,
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">ダッシュボード</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <card.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>最近の見積</CardTitle>
        </CardHeader>
        <CardContent>
          {recentEstimates.length === 0 ? (
            <p className="text-muted-foreground text-sm py-8 text-center">
              見積がまだありません。
              <Link href="/estimates/new" className="text-[#1e3a5f] hover:underline ml-1">
                最初の見積を作成
              </Link>
            </p>
          ) : (
            <div className="space-y-3">
              {recentEstimates.map((estimate) => {
                const s = statusLabels[estimate.status] ?? statusLabels.draft;
                return (
                  <Link
                    key={estimate.id}
                    href={`/estimates/${estimate.id}`}
                    className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent transition-colors"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{estimate.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {estimate.estimateNumber} ・{" "}
                        {estimate.customer?.name ?? "顧客未設定"} ・{" "}
                        {formatDate(estimate.estimateDate)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold">
                        {formatCurrency(Number(estimate.totalAmount))}
                      </span>
                      <Badge variant={s.variant}>{s.label}</Badge>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
