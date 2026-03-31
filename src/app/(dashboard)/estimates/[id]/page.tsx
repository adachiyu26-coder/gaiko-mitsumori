import { notFound } from "next/navigation";
import Link from "next/link";
import { requireUser, canViewCostPrice, canDeleteEstimate } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Pencil, Copy, FileDown, Trash2 } from "lucide-react";
import { formatCurrency, formatDate, formatPercent } from "@/lib/utils/format";
import { EstimateStatusActions } from "@/components/estimates/estimate-status-actions";
import { DeleteEstimateButton } from "@/components/estimates/delete-estimate-button";
import { DuplicateEstimateButton } from "@/components/estimates/duplicate-estimate-button";

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

export default async function EstimateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const showCost = canViewCostPrice(user.role);

  const estimate = await prisma.estimate.findUnique({
    where: { id, companyId: user.companyId },
    include: {
      customer: true,
      creator: true,
      items: { orderBy: { sortOrder: "asc" } },
    },
  });

  if (!estimate) notFound();

  const s = statusConfig[estimate.status] ?? statusConfig.draft;

  // Build tree structure for display
  const rootItems = estimate.items.filter((i) => i.parentItemId === null);
  const getChildren = (parentId: string) =>
    estimate.items.filter((i) => i.parentItemId === parentId);

  const renderItem = (item: (typeof estimate.items)[0], depth: number) => {
    const children = getChildren(item.id);
    const isDetail = item.level === 4;
    const indent = depth * 24;

    return (
      <div key={item.id}>
        <div
          className="flex items-center gap-2 py-1.5 border-b text-sm"
          style={{ paddingLeft: `${indent + 8}px` }}
        >
          <div className="flex-1 font-medium">
            {!isDetail && <span className="text-muted-foreground mr-1">▸</span>}
            {item.itemName}
          </div>
          {isDetail && (
            <>
              <div className="w-28 text-xs">{item.specification ?? ""}</div>
              <div className="w-16 text-right">{item.quantity?.toString() ?? ""}</div>
              <div className="w-12 text-xs">{item.unit ?? ""}</div>
              <div className="w-24 text-right font-mono">
                {item.unitPrice ? formatCurrency(Number(item.unitPrice)) : ""}
              </div>
              <div className="w-24 text-right font-mono font-semibold">
                {formatCurrency(Number(item.amount))}
              </div>
              {showCost && (
                <div className="w-24 text-right font-mono text-muted-foreground">
                  {item.costPrice
                    ? formatCurrency(Number(item.costPrice))
                    : ""}
                </div>
              )}
            </>
          )}
          {!isDetail && (
            <div className="font-mono text-sm">
              小計{" "}
              {formatCurrency(
                estimate.items
                  .filter(
                    (c) =>
                      c.parentItemId === item.id ||
                      estimate.items.some(
                        (p) =>
                          p.parentItemId === item.id &&
                          c.parentItemId === p.id
                      )
                  )
                  .filter((c) => c.level === 4 && !c.isAlternative)
                  .reduce((sum, c) => sum + Number(c.amount), 0)
              )}
            </div>
          )}
        </div>
        {children.map((child) => renderItem(child, depth + 1))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{estimate.title}</h1>
            <Badge variant={s.variant}>{s.label}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {estimate.estimateNumber} ・ v{estimate.version}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <EstimateStatusActions
            estimateId={id}
            currentStatus={estimate.status}
          />
          <Link href={`/estimates/${id}/edit`}>
            <Button variant="outline" size="sm">
              <Pencil className="mr-2 h-4 w-4" />
              編集
            </Button>
          </Link>
          <DuplicateEstimateButton estimateId={id} />
          <a
            href={`/api/estimates/${id}/pdf`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline" size="sm">
              <FileDown className="mr-2 h-4 w-4" />
              PDF
            </Button>
          </a>
          {canDeleteEstimate(user.role) && (
            <DeleteEstimateButton estimateId={id} />
          )}
        </div>
      </div>

      {/* Info */}
      <Card>
        <CardContent className="pt-6">
          <dl className="grid gap-3 md:grid-cols-3 text-sm">
            <div>
              <dt className="text-muted-foreground">顧客</dt>
              <dd>
                {estimate.customer ? (
                  <Link
                    href={`/customers/${estimate.customer.id}`}
                    className="text-[#1e3a5f] hover:underline"
                  >
                    {estimate.customer.name}
                    {estimate.customer.honorific}
                  </Link>
                ) : (
                  "-"
                )}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">現場住所</dt>
              <dd>{estimate.siteAddress ?? "-"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">見積日</dt>
              <dd>{formatDate(estimate.estimateDate)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">有効期限</dt>
              <dd>{estimate.expiryDate ? formatDate(estimate.expiryDate) : "-"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">作成者</dt>
              <dd>{estimate.creator.name}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {/* Items */}
      <Card>
        <CardHeader>
          <CardTitle>見積明細</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <div className="flex items-center gap-2 py-2 px-2 bg-gray-50 border-b text-xs text-muted-foreground font-medium">
              <div className="flex-1">品名</div>
              <div className="w-28">規格</div>
              <div className="w-16 text-right">数量</div>
              <div className="w-12">単位</div>
              <div className="w-24 text-right">単価</div>
              <div className="w-24 text-right">金額</div>
              {showCost && <div className="w-24 text-right">原価</div>}
            </div>
            {rootItems.map((item) => renderItem(item, 0))}
          </div>
        </CardContent>
      </Card>

      {/* Totals */}
      <Card>
        <CardContent className="pt-6 space-y-2 text-sm max-w-md ml-auto">
          <div className="flex justify-between">
            <span>小計</span>
            <span className="font-mono">
              {formatCurrency(Number(estimate.subtotal))}
            </span>
          </div>
          <div className="flex justify-between">
            <span>
              諸経費（{Number(estimate.expenseRate)}%）
            </span>
            <span className="font-mono">
              {formatCurrency(Number(estimate.expenseAmount))}
            </span>
          </div>
          {Number(estimate.discountAmount) > 0 && (
            <div className="flex justify-between text-destructive">
              <span>値引き</span>
              <span className="font-mono">
                -{formatCurrency(Number(estimate.discountAmount))}
              </span>
            </div>
          )}
          <div className="flex justify-between">
            <span>消費税（{Number(estimate.taxRate)}%）</span>
            <span className="font-mono">
              {formatCurrency(Number(estimate.taxAmount))}
            </span>
          </div>
          <Separator />
          <div className="flex justify-between text-lg font-bold">
            <span>合計</span>
            <span className="font-mono">
              {formatCurrency(Number(estimate.totalAmount))}
            </span>
          </div>
          {showCost && (
            <>
              <Separator />
              <div className="flex justify-between text-muted-foreground">
                <span>原価合計</span>
                <span className="font-mono">
                  {formatCurrency(Number(estimate.costSubtotal))}
                </span>
              </div>
              <div className="flex justify-between">
                <span>粗利</span>
                <span className="font-mono font-semibold">
                  {formatCurrency(Number(estimate.grossProfit))}（
                  {formatPercent(Number(estimate.grossProfitRate))}）
                </span>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Notes */}
      {(estimate.note || estimate.paymentTerms) && (
        <Card>
          <CardHeader>
            <CardTitle>備考</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {estimate.note && (
              <div>
                <p className="text-muted-foreground text-xs">備考</p>
                <p className="whitespace-pre-wrap">{estimate.note}</p>
              </div>
            )}
            {estimate.paymentTerms && (
              <div>
                <p className="text-muted-foreground text-xs">支払条件</p>
                <p>{estimate.paymentTerms}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
