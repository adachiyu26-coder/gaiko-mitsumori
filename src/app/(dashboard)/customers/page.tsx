import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { formatDate } from "@/lib/utils/format";
import { PAGE_SIZE } from "@/lib/constants/status";

const customerTypeLabels: Record<string, string> = {
  individual: "個人",
  corporate: "法人",
  subcontract: "下請",
};

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  let page = Math.max(1, parseInt(params.page ?? "1") || 1);

  const where = {
    companyId: user.companyId,
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" as const } },
            { nameKana: { contains: q, mode: "insensitive" as const } },
            { phone: { contains: q, mode: "insensitive" as const } },
            { email: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      include: { _count: { select: { estimates: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.customer.count({ where }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);
  page = Math.min(page, Math.max(1, totalPages));

  const buildUrl = (overrides: { q?: string; page?: number }) => {
    const p = new URLSearchParams();
    const newQ = overrides.q !== undefined ? overrides.q : q;
    const newPage = overrides.page ?? 1;
    if (newQ) p.set("q", newQ);
    if (newPage > 1) p.set("page", String(newPage));
    const qs = p.toString();
    return `/customers${qs ? `?${qs}` : ""}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">顧客管理</h1>
        <Link href="/customers/new">
          <Button className="bg-brand hover:bg-brand-hover">
            <Plus className="mr-2 h-4 w-4" />
            新規顧客
          </Button>
        </Link>
      </div>

      {/* 検索 */}
      <form action="/customers" method="GET" className="flex gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            name="q"
            defaultValue={q}
            placeholder="顧客名・フリガナ・電話番号・メールで検索"
            className="pl-9"
          />
        </div>
        <Button type="submit" variant="outline">検索</Button>
        {q && (
          <Link href="/customers">
            <Button variant="ghost">クリア</Button>
          </Link>
        )}
      </form>

      <Card>
        <CardHeader>
          <CardTitle>
            {q ? `検索結果（${total}件）` : `顧客一覧（${total}件）`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {customers.length === 0 ? (
            <p className="text-muted-foreground text-sm py-8 text-center">
              {q ? "条件に一致する顧客がいません。" : "顧客がまだ登録されていません。"}
            </p>
          ) : (
            <>
              <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>顧客名</TableHead>
                    <TableHead>区分</TableHead>
                    <TableHead>電話番号</TableHead>
                    <TableHead>住所</TableHead>
                    <TableHead className="text-right">見積数</TableHead>
                    <TableHead>登録日</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell>
                        <Link
                          href={`/customers/${customer.id}`}
                          className="text-brand hover:underline font-medium"
                        >
                          {customer.name}
                          {customer.honorific}
                        </Link>
                      </TableCell>
                      <TableCell>
                        {customerTypeLabels[customer.customerType] ?? customer.customerType}
                      </TableCell>
                      <TableCell>{customer.phone ?? "-"}</TableCell>
                      <TableCell className="max-w-[200px] truncate" title={customer.address ?? ""}>
                        {customer.address ?? "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        {customer._count.estimates}
                      </TableCell>
                      <TableCell>{formatDate(customer.createdAt)}</TableCell>
                    </TableRow>
                  ))}
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
