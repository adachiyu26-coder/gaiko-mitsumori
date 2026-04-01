import { requireUser, canViewCostPrice } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatPercent } from "@/lib/utils/format";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { AnalyticsCharts } from "@/components/dashboard/analytics-charts";

export default async function AnalyticsPage() {
  const user = await requireUser();
  const showCost = canViewCostPrice(user.role);
  const companyId = user.companyId;

  // Monthly data for last 12 months
  const now = new Date();
  const months: { label: string; start: Date; end: Date }[] = [];
  for (let i = 11; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
    months.push({
      label: `${start.getFullYear()}/${String(start.getMonth() + 1).padStart(2, "0")}`,
      start,
      end,
    });
  }

  // Fetch monthly estimates data
  const monthlyData = await Promise.all(
    months.map(async (month) => {
      const [total, accepted, estimates] = await Promise.all([
        prisma.estimate.count({
          where: { companyId, createdAt: { gte: month.start, lte: month.end } },
        }),
        prisma.estimate.count({
          where: { companyId, status: "accepted", createdAt: { gte: month.start, lte: month.end } },
        }),
        prisma.estimate.aggregate({
          where: { companyId, createdAt: { gte: month.start, lte: month.end } },
          _sum: { totalAmount: true, grossProfit: true },
        }),
      ]);
      return {
        month: month.label,
        total,
        accepted,
        acceptanceRate: total > 0 ? Math.round((accepted / total) * 100) : 0,
        totalAmount: Number(estimates._sum.totalAmount ?? 0),
        grossProfit: Number(estimates._sum.grossProfit ?? 0),
      };
    })
  );

  // Category performance (from accepted estimates)
  const categoryPerformance = await prisma.estimateItem.groupBy({
    by: ["categoryId"],
    where: {
      estimate: { companyId, status: "accepted" },
      categoryId: { not: null },
      level: 4,
      isAlternative: false,
    },
    _sum: { amount: true, costAmount: true },
    _count: { _all: true },
  });

  const categoryIds = categoryPerformance.map((c) => c.categoryId!).filter(Boolean);
  const categories = await prisma.category.findMany({
    where: { id: { in: categoryIds } },
  });
  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

  const categoryData = categoryPerformance
    .map((c) => ({
      name: categoryMap.get(c.categoryId!) ?? "未分類",
      revenue: Number(c._sum.amount ?? 0),
      cost: Number(c._sum.costAmount ?? 0),
      profit: Number(c._sum.amount ?? 0) - Number(c._sum.costAmount ?? 0),
      count: c._count._all,
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  // Top customers
  const topCustomers = await prisma.estimate.groupBy({
    by: ["customerId"],
    where: { companyId, status: "accepted", customerId: { not: null } },
    _sum: { totalAmount: true, grossProfit: true },
    _count: { _all: true },
    orderBy: { _sum: { totalAmount: "desc" } },
    take: 10,
  });

  const customerIds = topCustomers.map((c) => c.customerId!).filter(Boolean);
  const customers = await prisma.customer.findMany({
    where: { id: { in: customerIds } },
    select: { id: true, name: true },
  });
  const customerMap = new Map(customers.map((c) => [c.id, c.name]));

  const customerData = topCustomers.map((c) => ({
    name: customerMap.get(c.customerId!) ?? "不明",
    revenue: Number(c._sum.totalAmount ?? 0),
    profit: Number(c._sum.grossProfit ?? 0),
    count: c._count._all,
  }));

  // Staff performance
  const staffPerformance = await prisma.estimate.groupBy({
    by: ["createdBy"],
    where: { companyId },
    _count: { _all: true },
    _sum: { totalAmount: true },
  });

  const staffAccepted = await prisma.estimate.groupBy({
    by: ["createdBy"],
    where: { companyId, status: "accepted" },
    _count: { _all: true },
  });

  const staffIds = staffPerformance.map((s) => s.createdBy);
  const staffUsers = await prisma.user.findMany({
    where: { id: { in: staffIds } },
    select: { id: true, name: true },
  });
  const staffMap = new Map(staffUsers.map((u) => [u.id, u.name]));
  const acceptedMap = new Map(staffAccepted.map((s) => [s.createdBy, s._count._all]));

  const staffData = staffPerformance.map((s) => ({
    name: staffMap.get(s.createdBy) ?? "不明",
    total: s._count._all,
    accepted: acceptedMap.get(s.createdBy) ?? 0,
    acceptanceRate: s._count._all > 0 ? Math.round((Number(acceptedMap.get(s.createdBy) ?? 0) / s._count._all) * 100) : 0,
    revenue: Number(s._sum.totalAmount ?? 0),
  })).sort((a, b) => b.revenue - a.revenue);

  // Summary KPIs
  const totalEstimates = monthlyData.reduce((sum, m) => sum + m.total, 0);
  const totalAccepted = monthlyData.reduce((sum, m) => sum + m.accepted, 0);
  const totalRevenue = monthlyData.reduce((sum, m) => sum + m.totalAmount, 0);
  const totalProfit = monthlyData.reduce((sum, m) => sum + m.grossProfit, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">経営分析</h1>
        </div>
      </div>

      {/* Summary KPIs (12-month totals) */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">年間見積数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEstimates}件</div>
            <p className="text-xs text-muted-foreground">受注: {totalAccepted}件（{totalEstimates > 0 ? Math.round((totalAccepted / totalEstimates) * 100) : 0}%）</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">年間見積総額</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
          </CardContent>
        </Card>
        {showCost && (
          <>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">年間粗利</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(totalProfit)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">平均粗利率</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalRevenue > 0 ? formatPercent(Math.round((totalProfit / totalRevenue) * 1000) / 10) : "0%"}</div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Charts */}
      <AnalyticsCharts
        monthlyData={monthlyData}
        categoryData={categoryData}
        showCost={showCost}
      />

      {/* Top customers */}
      <Card>
        <CardHeader>
          <CardTitle>顧客別受注実績（上位10社）</CardTitle>
        </CardHeader>
        <CardContent>
          {customerData.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">受注データがありません</p>
          ) : (
            <div className="space-y-2">
              {customerData.map((c, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground w-6 text-right">{i + 1}.</span>
                    <span className="font-medium">{c.name}</span>
                    <span className="text-xs text-muted-foreground">({c.count}件)</span>
                  </div>
                  <div className="flex items-center gap-4 font-mono">
                    <span>{formatCurrency(c.revenue)}</span>
                    {showCost && (
                      <span className="text-xs text-muted-foreground">粗利 {formatCurrency(c.profit)}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Staff performance */}
      <Card>
        <CardHeader>
          <CardTitle>担当者別パフォーマンス</CardTitle>
        </CardHeader>
        <CardContent>
          {staffData.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">データがありません</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-2 font-medium">担当者</th>
                    <th className="py-2 font-medium text-right">見積数</th>
                    <th className="py-2 font-medium text-right">受注数</th>
                    <th className="py-2 font-medium text-right">受注率</th>
                    <th className="py-2 font-medium text-right">見積総額</th>
                  </tr>
                </thead>
                <tbody>
                  {staffData.map((s, i) => (
                    <tr key={i} className="border-b">
                      <td className="py-2 font-medium">{s.name}</td>
                      <td className="py-2 text-right">{s.total}件</td>
                      <td className="py-2 text-right">{s.accepted}件</td>
                      <td className="py-2 text-right">{s.acceptanceRate}%</td>
                      <td className="py-2 text-right font-mono">{formatCurrency(s.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
