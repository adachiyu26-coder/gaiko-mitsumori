import { notFound } from "next/navigation";
import Link from "next/link";
import { requireUser, canViewCostPrice, canDeleteEstimate } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Pencil, Copy, FileDown, Trash2, GitBranch } from "lucide-react";
import { formatCurrency, formatDate, formatPercent } from "@/lib/utils/format";
import { EstimateStatusActions } from "@/components/estimates/estimate-status-actions";
import { DeleteEstimateButton } from "@/components/estimates/delete-estimate-button";
import { DuplicateEstimateButton } from "@/components/estimates/duplicate-estimate-button";
import { CreateVersionButton } from "@/components/estimates/create-version-button";
import { ShareEstimateButton } from "@/components/estimates/share-estimate-button";
import { ESTIMATE_STATUS_CONFIG } from "@/lib/constants/status";

const statusConfig = ESTIMATE_STATUS_CONFIG;

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

  const versions = await prisma.estimate.findMany({
    where: {
      companyId: user.companyId,
      estimateNumber: estimate.estimateNumber,
    },
    select: {
      id: true,
      version: true,
      status: true,
      totalAmount: true,
      createdAt: true,
    },
    orderBy: { version: "desc" },
  });

  const s = statusConfig[estimate.status as keyof typeof statusConfig] ?? statusConfig.draft;

  // Build tree structure for display
  const rootItems = estimate.items.filter((i) => i.parentItemId === null && i.level === 1).sort((a, b) => a.sortOrder - b.sortOrder);
  const getChildren = (parentId: string) =>
    estimate.items.filter((i) => i.parentItemId === parentId).sort((a, b) => a.sortOrder - b.sortOrder);

  // Recursively sum all non-alternative descendants' amounts (all levels)
  const calcDescendantTotal = (parentId: string): number =>
    estimate.items
      .filter((c) => c.parentItemId === parentId && !c.isAlternative)
      .reduce((sum, child) => sum + Number(child.amount) + calcDescendantTotal(child.id), 0);

  const LEVEL_ROW_BG: Record<number, string> = {
    1: "bg-brand/[0.07]",
    2: "bg-blue-50/60",
    3: "bg-gray-50",
    4: "bg-white",
  };

  const renderItem = (item: (typeof estimate.items)[0], depth: number) => {
    const children = getChildren(item.id);
    const isHeader = item.level < 4;
    const indent = depth * 20;
    const sectionTotal = isHeader ? calcDescendantTotal(item.id) : 0;
    const hasOwnAmount = Number(item.amount) > 0;

    return (
      <div key={item.id}>
        <div
          className={`flex items-center gap-2 py-1.5 border-b text-sm ${LEVEL_ROW_BG[item.level] ?? "bg-white"} ${item.isAlternative ? "opacity-60" : ""}`}
          style={{ paddingLeft: `${indent + 8}px` }}
        >
          <div className={`flex-1 min-w-0 ${item.level === 1 ? "font-bold" : item.level === 2 ? "font-semibold" : item.level === 3 ? "font-medium" : ""}`}>
            {isHeader && <span className="text-muted-foreground mr-1">▸</span>}
            {item.itemName}
            {item.isAlternative && (
              <span className="ml-2 text-xs text-amber-600 font-normal">（代替案）</span>
            )}
          </div>
          {/* spec / qty / unit / unitPrice – only for level 4 or when item has values */}
          {item.level === 4 ? (
            <>
              <div className="w-24 text-xs text-muted-foreground shrink-0">{item.specification ?? ""}</div>
              <div className="w-12 text-right shrink-0 text-xs">{item.quantity != null ? String(item.quantity) : ""}</div>
              <div className="w-10 text-xs shrink-0">{item.unit ?? ""}</div>
              <div className="w-20 text-right font-mono text-xs shrink-0">
                {item.unitPrice ? formatCurrency(Number(item.unitPrice)) : ""}
              </div>
              <div className="w-24 text-right font-mono font-semibold shrink-0">
                {hasOwnAmount ? formatCurrency(Number(item.amount)) : ""}
              </div>
              {showCost && (
                <div className="w-24 text-right font-mono text-muted-foreground text-xs shrink-0">
                  {item.costPrice ? formatCurrency(Number(item.costPrice)) : ""}
                </div>
              )}
            </>
          ) : (
            <>
              {/* spacer columns */}
              <div className="w-24 shrink-0" />
              <div className="w-12 shrink-0" />
              <div className="w-10 shrink-0" />
              <div className="w-20 shrink-0" />
              {/* own amount (if any) */}
              <div className="w-24 text-right font-mono shrink-0">
                {hasOwnAmount && (
                  <span className="text-xs">{formatCurrency(Number(item.amount))}</span>
                )}
              </div>
              {showCost && <div className="w-24 shrink-0" />}
            </>
          )}
          {/* section total for header rows */}
          <div className="w-28 text-right shrink-0">
            {isHeader && (hasOwnAmount || sectionTotal > 0) && (
              <span className="text-xs font-mono text-muted-foreground">
                <span className="text-[10px] mr-0.5">計</span>
                {formatCurrency(Number(item.amount) + sectionTotal)}
              </span>
            )}
          </div>
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
          <CreateVersionButton estimateId={id} />
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
          <ShareEstimateButton estimateId={id} />
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
                    className="text-brand hover:underline"
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

      {/* Version History */}
      {versions.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GitBranch className="h-4 w-4" />
              バージョン履歴
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {versions.map((v) => {
                const isCurrent = v.id === id;
                const vs = statusConfig[v.status as keyof typeof statusConfig] ?? statusConfig.draft;
                return (
                  <div key={v.id} className={`flex items-center justify-between rounded-lg border p-2 text-sm ${isCurrent ? "bg-brand/[0.07] border-brand/30" : ""}`}>
                    <div className="flex items-center gap-2">
                      {isCurrent ? (
                        <span className="font-semibold">v{v.version}（現在）</span>
                      ) : (
                        <Link href={`/estimates/${v.id}`} className="text-brand hover:underline">
                          v{v.version}
                        </Link>
                      )}
                      <Badge variant={vs.variant}>{vs.label}</Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="font-mono">{formatCurrency(Number(v.totalAmount))}</span>
                      <span>{formatDate(v.createdAt)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Items */}
      <Card>
        <CardHeader>
          <CardTitle>見積明細</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden overflow-x-auto">
            <div className="flex items-center gap-2 py-2 px-2 bg-muted border-b text-xs text-muted-foreground font-medium min-w-[560px]">
              <div className="flex-1">品名</div>
              <div className="w-24 shrink-0">規格</div>
              <div className="w-12 text-right shrink-0">数量</div>
              <div className="w-10 shrink-0">単位</div>
              <div className="w-20 text-right shrink-0">単価</div>
              <div className="w-24 text-right shrink-0">金額</div>
              {showCost && <div className="w-24 text-right shrink-0">原価</div>}
              <div className="w-28 text-right shrink-0">小計</div>
            </div>
            <div className="min-w-[560px]">
              {rootItems.map((item) => renderItem(item, 0))}
            </div>
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
