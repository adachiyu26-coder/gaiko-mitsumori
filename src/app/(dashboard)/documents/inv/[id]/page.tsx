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

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  draft: { label: "下書き", variant: "secondary" },
  sent: { label: "送付済", variant: "default" },
  paid: { label: "入金済", variant: "outline" },
  partial: { label: "一部入金", variant: "destructive" },
  overdue: { label: "未入金", variant: "destructive" },
};

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();

  const invoice = await prisma.invoice.findUnique({
    where: { id, companyId: user.companyId },
    include: {
      estimate: { select: { estimateNumber: true, title: true } },
      customer: { select: { name: true, honorific: true } },
      items: true,
    },
  });

  if (!invoice) notFound();

  const s = statusLabels[invoice.status] ?? statusLabels.draft;
  const remaining = Number(invoice.totalAmount) - Number(invoice.paidAmount);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/documents">
          <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">請求書</h1>
            <Badge variant={s.variant}>{s.label}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">{invoice.invoiceNumber}</p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <dl className="grid gap-3 md:grid-cols-3 text-sm">
            <div>
              <dt className="text-muted-foreground">顧客</dt>
              <dd className="font-medium">{invoice.customer ? `${invoice.customer.name}${invoice.customer.honorific}` : "-"}</dd>
            </div>
            <div><dt className="text-muted-foreground">請求日</dt><dd>{formatDate(invoice.invoiceDate)}</dd></div>
            <div><dt className="text-muted-foreground">支払期限</dt><dd>{invoice.dueDate ? formatDate(invoice.dueDate) : "-"}</dd></div>
            {invoice.estimate && (
              <div>
                <dt className="text-muted-foreground">関連見積</dt>
                <dd>
                  <Link href="/estimates" className="text-brand hover:underline text-xs">
                    {invoice.estimate.estimateNumber} - {invoice.estimate.title}
                  </Link>
                </dd>
              </div>
            )}
            <div><dt className="text-muted-foreground">入金額</dt><dd className="font-mono">{formatCurrency(Number(invoice.paidAmount))}</dd></div>
            {remaining > 0 && (
              <div><dt className="text-muted-foreground">残額</dt><dd className="font-mono text-destructive">{formatCurrency(remaining)}</dd></div>
            )}
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>請求明細</CardTitle></CardHeader>
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
              {invoice.items.map((item) => (
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
            <div className="flex justify-between"><span>小計</span><span className="font-mono">{formatCurrency(Number(invoice.subtotal))}</span></div>
            <div className="flex justify-between"><span>消費税</span><span className="font-mono">{formatCurrency(Number(invoice.taxAmount))}</span></div>
            <Separator />
            <div className="flex justify-between font-bold text-lg"><span>合計</span><span className="font-mono">{formatCurrency(Number(invoice.totalAmount))}</span></div>
          </div>
        </CardContent>
      </Card>

      {invoice.note && (
        <Card>
          <CardHeader><CardTitle>備考</CardTitle></CardHeader>
          <CardContent><p className="text-sm whitespace-pre-wrap">{invoice.note}</p></CardContent>
        </Card>
      )}
    </div>
  );
}
