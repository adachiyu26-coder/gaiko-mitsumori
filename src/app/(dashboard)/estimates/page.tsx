import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils/format";

const statusConfig: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  draft: { label: "作成中", variant: "secondary" },
  submitted: { label: "提出済", variant: "default" },
  accepted: { label: "受注", variant: "outline" },
  rejected: { label: "失注", variant: "destructive" },
  expired: { label: "期限切れ", variant: "secondary" },
};

export default async function EstimatesPage() {
  const user = await requireUser();

  const estimates = await prisma.estimate.findMany({
    where: { companyId: user.companyId },
    include: { customer: true, creator: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">見積一覧</h1>
        <Link href="/estimates/new">
          <Button className="bg-[#1e3a5f] hover:bg-[#162d4a]">
            <Plus className="mr-2 h-4 w-4" />
            新規見積
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>全見積（{estimates.length}件）</CardTitle>
        </CardHeader>
        <CardContent>
          {estimates.length === 0 ? (
            <p className="text-muted-foreground text-sm py-8 text-center">
              見積がまだありません。
              <Link
                href="/estimates/new"
                className="text-[#1e3a5f] hover:underline ml-1"
              >
                最初の見積を作成
              </Link>
            </p>
          ) : (
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
                    const s =
                      statusConfig[estimate.status] ?? statusConfig.draft;
                    return (
                      <TableRow key={estimate.id}>
                        <TableCell className="font-mono text-xs">
                          <Link
                            href={`/estimates/${estimate.id}`}
                            className="text-[#1e3a5f] hover:underline"
                          >
                            {estimate.estimateNumber}
                          </Link>
                        </TableCell>
                        <TableCell className="font-medium">
                          <Link
                            href={`/estimates/${estimate.id}`}
                            className="hover:underline"
                          >
                            {estimate.title}
                          </Link>
                        </TableCell>
                        <TableCell>
                          {estimate.customer?.name ?? "-"}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatCurrency(Number(estimate.totalAmount))}
                        </TableCell>
                        <TableCell>
                          <Badge variant={s.variant}>{s.label}</Badge>
                        </TableCell>
                        <TableCell>
                          {formatDate(estimate.estimateDate)}
                        </TableCell>
                        <TableCell className="text-xs">
                          {estimate.creator.name}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
