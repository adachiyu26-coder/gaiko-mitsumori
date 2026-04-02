import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency, formatDate } from "@/lib/utils/format";

const poStatusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  draft: { label: "下書き", variant: "secondary" },
  sent: { label: "発注済", variant: "default" },
  delivered: { label: "納品済", variant: "outline" },
};

const invStatusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  draft: { label: "下書き", variant: "secondary" },
  sent: { label: "送付済", variant: "default" },
  paid: { label: "入金済", variant: "outline" },
  partial: { label: "一部入金", variant: "destructive" },
  overdue: { label: "未入金", variant: "destructive" },
};

export default async function DocumentsPage() {
  const user = await requireUser();

  const [purchaseOrders, invoices] = await Promise.all([
    prisma.purchaseOrder.findMany({
      where: { companyId: user.companyId },
      include: { estimate: { select: { title: true, estimateNumber: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.invoice.findMany({
      where: { companyId: user.companyId },
      include: {
        estimate: { select: { title: true, estimateNumber: true } },
        customer: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">帳票管理</h1>

      <Tabs defaultValue="invoices">
        <TabsList>
          <TabsTrigger value="invoices">請求書（{invoices.length}）</TabsTrigger>
          <TabsTrigger value="orders">発注書（{purchaseOrders.length}）</TabsTrigger>
        </TabsList>

        <TabsContent value="invoices">
          <Card>
            <CardContent className="pt-6">
              {invoices.length === 0 ? (
                <p className="text-muted-foreground text-sm py-8 text-center">請求書がありません。見積の受注後に作成できます。</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>請求番号</TableHead>
                      <TableHead>顧客</TableHead>
                      <TableHead>見積</TableHead>
                      <TableHead className="text-right">金額</TableHead>
                      <TableHead>ステータス</TableHead>
                      <TableHead>請求日</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map((inv) => {
                      const s = invStatusLabels[inv.status] ?? invStatusLabels.draft;
                      return (
                        <TableRow key={inv.id}>
                          <TableCell className="font-mono text-xs">
                            <Link href={`/documents/inv/${inv.id}`} className="text-brand hover:underline">{inv.invoiceNumber}</Link>
                          </TableCell>
                          <TableCell>{inv.customer?.name ?? "-"}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{inv.estimate?.estimateNumber ?? "-"}</TableCell>
                          <TableCell className="text-right font-mono">{formatCurrency(Number(inv.totalAmount))}</TableCell>
                          <TableCell><Badge variant={s.variant}>{s.label}</Badge></TableCell>
                          <TableCell>{formatDate(inv.invoiceDate)}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders">
          <Card>
            <CardContent className="pt-6">
              {purchaseOrders.length === 0 ? (
                <p className="text-muted-foreground text-sm py-8 text-center">発注書がありません。見積の受注後に作成できます。</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>発注番号</TableHead>
                      <TableHead>発注先</TableHead>
                      <TableHead>見積</TableHead>
                      <TableHead className="text-right">金額</TableHead>
                      <TableHead>ステータス</TableHead>
                      <TableHead>発注日</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchaseOrders.map((po) => {
                      const s = poStatusLabels[po.status] ?? poStatusLabels.draft;
                      return (
                        <TableRow key={po.id}>
                          <TableCell className="font-mono text-xs">
                            <Link href={`/documents/po/${po.id}`} className="text-brand hover:underline">{po.orderNumber}</Link>
                          </TableCell>
                          <TableCell>{po.supplierName}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{po.estimate?.estimateNumber ?? "-"}</TableCell>
                          <TableCell className="text-right font-mono">{formatCurrency(Number(po.totalAmount))}</TableCell>
                          <TableCell><Badge variant={s.variant}>{s.label}</Badge></TableCell>
                          <TableCell>{formatDate(po.orderDate)}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
