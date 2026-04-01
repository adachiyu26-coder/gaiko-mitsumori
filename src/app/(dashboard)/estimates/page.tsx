import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { ESTIMATE_STATUS_CONFIG, PAGE_SIZE } from "@/lib/constants/status";

const statusConfig = ESTIMATE_STATUS_CONFIG;

export default async function EstimatesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const status = params.status && params.status !== "all" ? params.status : undefined;
  let page = Math.max(1, parseInt(params.page ?? "1") || 1);

  const where = {
    companyId: user.companyId,
    ...(status ? { status } : {}),
    ...(q
      ? {
          OR: [
            { estimateNumber: { contains: q, mode: "insensitive" as const } },
            { title: { contains: q, mode: "insensitive" as const } },
            { customer: { name: { contains: q, mode: "insensitive" as const } } },
          ],
        }
      : {}),
  };

  const [estimates, total] = await Promise.all([
    prisma.estimate.findMany({
      where,
      include: { customer: true, creator: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.estimate.count({ where }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);
  page = Math.min(page, Math.max(1, totalPages));

  const buildUrl = (overrides: { q?: string; status?: string; page?: number }) => {
    const p = new URLSearchParams();
    const newQ = overrides.q !== undefined ? overrides.q : q;
    const newStatus = overrides.status !== undefined ? overrides.status : (params.status ?? "");
    const newPage = overrides.page ?? 1;
    if (newQ) p.set("q", newQ);
    if (newStatus && newStatus !== "all") p.set("status", newStatus);
    if (newPage > 1) p.set("page", String(newPage));
    const qs = p.toString();
    return `/estimates${qs ? `?${qs}` : ""}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">見積一覧</h1>
        <Link href="/estimates/new">
          <Button className="bg-brand hover:bg-brand-hover">
            <Plus className="mr-2 h-4 w-4" />
            新規見積
          </Button>
        </Link>
      </div>

      {/* 検索・フィルター */}
      <div className="flex flex-col gap-3">
        <form className="flex gap-2" action="/estimates" method="GET">
          {params.status && params.status !== "all" && (
            <input type="hidden" name="status" value={params.status} />
          )}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              name="q"
              defaultValue={q}
              placeholder="見積番号・件名・顧客名で検索"
              className="pl-9"
            />
          </div>
          <Button type="submit" variant="outline">検索</Button>
        </form>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {["all", "draft", "submitted", "accepted", "rejected", "expired"].map((s) => {
            const label = s === "all" ? "すべて" : statusConfig[s as keyof typeof statusConfig]?.label ?? s;
            const isActive = (params.status ?? "all") === s;
            return (
              <Link key={s} href={buildUrl({ status: s, page: 1 })} className="flex-shrink-0">
                <Button
                  variant={isActive ? "default" : "outline"}
                  size="sm"
                  className={isActive ? "bg-brand hover:bg-brand-hover" : ""}
                >
                  {label}
                </Button>
              </Link>
            );
          })}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {q || status
              ? `検索結果（${total}件）`
              : `全見積（${total}件）`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {estimates.length === 0 ? (
            <p className="text-muted-foreground text-sm py-8 text-center">
              {q || status ? "条件に一致する見積がありません。" : "見積がまだありません。"}
              {!q && !status && (
                <Link href="/estimates/new" className="text-brand hover:underline ml-1">
                  最初の見積を作成
                </Link>
              )}
            </p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>見積番号</TableHead>
                      <TableHead>件名</TableHead>
                      <TableHead>顧客</TableHead>
                      <TableHead className="text-right">合計金額</TableHead>
                      <TableHead>ステータス</TableHead>
                      <TableHead>見積日</TableHead>
                      <TableHead>作成者</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {estimates.map((estimate) => {
                      const s = statusConfig[estimate.status as keyof typeof statusConfig] ?? statusConfig.draft;
                      return (
                        <TableRow key={estimate.id}>
                          <TableCell className="font-mono text-xs">
                            <Link
                              href={`/estimates/${estimate.id}`}
                              className="text-brand hover:underline"
                            >
                              {estimate.estimateNumber}
                            </Link>
                          </TableCell>
                          <TableCell className="font-medium">
                            <Link href={`/estimates/${estimate.id}`} className="hover:underline">
                              {estimate.title}
                            </Link>
                          </TableCell>
                          <TableCell>{estimate.customer?.name ?? "-"}</TableCell>
                          <TableCell className="text-right font-mono">
                            {formatCurrency(Number(estimate.totalAmount))}
                          </TableCell>
                          <TableCell>
                            <Badge variant={s.variant}>{s.label}</Badge>
                          </TableCell>
                          <TableCell>{formatDate(estimate.estimateDate)}</TableCell>
                          <TableCell className="text-xs">{estimate.creator.name}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* ページネーション */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    {(page - 1) * PAGE_SIZE + 1}〜{Math.min(page * PAGE_SIZE, total)} / {total}件
                  </p>
                  <div className="flex gap-2">
                    <Link href={buildUrl({ page: page - 1 })}>
                      <Button variant="outline" size="sm" disabled={page <= 1}>
                        <ChevronLeft className="h-4 w-4" />
                        前へ
                      </Button>
                    </Link>
                    <span className="flex items-center text-sm px-2">
                      {page} / {totalPages}
                    </span>
                    <Link href={buildUrl({ page: page + 1 })}>
                      <Button variant="outline" size="sm" disabled={page >= totalPages}>
                        次へ
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
