import { notFound } from "next/navigation";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { ArrowLeft } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { POStatusActions } from "@/components/documents/document-status-actions";

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  draft: { label: "下書き", variant: "secondary" },
  sent: { label: "発注済", variant: "default" },
  delivered: { label: "納品済", variant: "outline" },
};

export default async function PurchaseOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();

  const po = await prisma.purchaseOrder.findUnique({
    where: { id, companyId: user.companyId },
    include: {
      estimate: { select: { estimateNumber: true, title: true } },
      items: true,
    },
  });

  if (!po) notFound();

  const s = statusLabels[po.status] ?? statusLabels.draft;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/documents">
          <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">発注書</h1>
            <Badge variant={s.variant}>{s.label}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">{po.orderNumber}</p>
        </div>
        <POStatusActions id={id} currentStatus={po.status} />
      </div>

      <Card>
        <CardContent className="pt-6">
          <dl className="grid gap-3 md:grid-cols-3 text-sm">
            <div><dt className="text-muted-foreground">発注先</dt><dd className="font-medium">{po.supplierName}</dd></div>
            <div><dt className="text-muted-foreground">発注日</dt><dd>{formatDate(po.orderDate)}</dd></div>
            <div><dt className="text-muted-foreground">納品希望日</dt><dd>{po.deliveryDate ? formatDate(po.deliveryDate) : "-"}</dd></div>
            {po.estimate && (
              <div>
                <dt className="text-muted-foreground">関連見積</dt>
                <dd>
                  <Link href={`/estimates`} className="text-brand hover:underline text-xs">
                    {po.estimate.estimateNumber} - {po.estimate.title}
                  </Link>
                </dd>
              </div>
            )}
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>発注明細</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>品名</TableHead>
                <TableHead>規格</TableHead>
                <TableHead className="text-right">数量</TableHead>
                <TableHead>単位</TableHead>
                <TableHead className="text-right">単価</TableHead>
                <TableHead className="text-right">金額</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {po.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.itemName}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{item.specification ?? "-"}</TableCell>
                  <TableCell className="text-right">{item.quantity != null ? String(item.quantity) : "-"}</TableCell>
                  <TableCell>{item.unit ?? "-"}</TableCell>
                  <TableCell className="text-right font-mono">{item.unitPrice ? formatCurrency(Number(item.unitPrice)) : "-"}</TableCell>
                  <TableCell className="text-right font-mono">{formatCurrency(Number(item.amount))}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="mt-4 space-y-1 text-sm max-w-xs ml-auto">
            <div className="flex justify-between"><span>小計</span><span className="font-mono">{formatCurrency(Number(po.subtotal))}</span></div>
            <div className="flex justify-between"><span>消費税</span><span className="font-mono">{formatCurrency(Number(po.taxAmount))}</span></div>
            <Separator />
            <div className="flex justify-between font-bold"><span>合計</span><span className="font-mono">{formatCurrency(Number(po.totalAmount))}</span></div>
          </div>
        </CardContent>
      </Card>

      {po.note && (
        <Card>
          <CardHeader><CardTitle>備考</CardTitle></CardHeader>
          <CardContent><p className="text-sm whitespace-pre-wrap">{po.note}</p></CardContent>
        </Card>
      )}
    </div>
  );
}
