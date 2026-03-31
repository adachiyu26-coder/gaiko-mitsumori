import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, TrendingUp, Percent, CheckCircle2 } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import Link from "next/link";

const statusConfig: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline"; color: string }
> = {
  draft: { label: "作成中", variant: "secondary", color: "bg-gray-100 text-gray-700" },
  submitted: { label: "提出済", variant: "default", color: "bg-blue-100 text-blue-700" },
  accepted: { label: "受注", variant: "outline", color: "bg-green-100 text-green-700" },
  rejected: { label: "失注", variant: "destructive", color: "bg-red-100 text-red-700" },
  expired: { label: "期限切れ", variant: "secondary", color: "bg-yellow-100 text-yellow-700" },
};

export default async function DashboardPage() {
  const user = await requireUser();
  const companyId = user.companyId;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    estimateCount,
    totalAmount,
    acceptedCount,
    recentEstimates,
    allMonthEstimates,
    pipelineData,
  ] = await Promise.all([
    prisma.estimate.count({
      where: { companyId, createdAt: { gte: startOfMonth } },
    }),
    prisma.estimate.aggregate({
      where: { companyId, createdAt: { gte: startOfMonth } },
      _sum: { totalAmount: true },
    }),
    prisma.estimate.count({
      where: { companyId, status: "accepted", createdAt: { gte: startOfMonth } },
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
    prisma.estimate.groupBy({
      by: ["status"],
      where: { companyId },
      _count: { _all: true },
      _sum: { totalAmount: true },
    }),
  ]);

  const acceptanceRate =
    estimateCount > 0 ? Math.round((acceptedCount / estimateCount) * 100) : 0;
  const avgProfitRate =
    allMonthEstimates.length > 0
      ? Math.round(
          (allMonthEstimates.reduce((sum, e) => sum + Number(e.grossProfitRate), 0) /
            allMonthEstimates.length) *
            10
        ) / 10
      : 0;

  const kpiCards = [
    {
      title: "今月見積数",
      value: `${estimateCount}件`,
      icon: FileText,
    },
    {
      title: "今月見積総額",
      value: formatCurrency(Number(totalAmount._sum.totalAmount ?? 0)),
      icon: TrendingUp,
    },
    {
      title: "今月受注率",
      value: `${acceptanceRate}%`,
      icon: CheckCircle2,
    },
    {
      title: "今月平均粗利率",
      value: `${avgProfitRate}%`,
      icon: Percent,
    },
  ];

  // パイプライン: 全ステータスを表示
  const pipeline = ["draft", "submitted", "accepted", "rejected", "expired"].map((status) => {
    const found = pipelineData.find((d) => d.status === status);
    return {
      status,
      count: found?._count._all ?? 0,
      amount: Number(found?._sum.totalAmount ?? 0),
    };
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">ダッシュボード</h1>

      {/* KPI カード */}
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

      {/* パイプライン（ステータス別件数） */}
      <Card>
        <CardHeader>
          <CardTitle>見積パイプライン（全期間）</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {pipeline.map(({ status, count, amount }) => {
              const cfg = statusConfig[status] ?? statusConfig.draft;
              return (
                <Link
                  key={status}
                  href={`/estimates?status=${status}`}
                  className="rounded-lg border p-4 hover:bg-accent transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cfg.color}`}>
                      {cfg.label}
                    </span>
                    <span className="text-2xl font-bold">{count}</span>
                  </div>
                  <p className="text-xs text-muted-foreground text-right">
                    {formatCurrency(amount)}
                  </p>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* 最近の見積 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>最近の見積</CardTitle>
          <Link href="/estimates" className="text-sm text-brand hover:underline">
            すべて見る
          </Link>
        </CardHeader>
        <CardContent>
          {recentEstimates.length === 0 ? (
            <p className="text-muted-foreground text-sm py-8 text-center">
              見積がまだありません。
              <Link href="/estimates/new" className="text-brand hover:underline ml-1">
                最初の見積を作成
              </Link>
            </p>
          ) : (
            <div className="space-y-3">
              {recentEstimates.map((estimate) => {
                const s = statusConfig[estimate.status] ?? statusConfig.draft;
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
