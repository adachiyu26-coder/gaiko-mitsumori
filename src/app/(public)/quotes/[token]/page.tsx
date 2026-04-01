import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { QuoteActions } from "./quote-actions";

export default async function PublicQuotePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const estimate = await prisma.estimate.findUnique({
    where: { shareToken: token },
    include: {
      company: true,
      customer: true,
      items: { orderBy: { sortOrder: "asc" } },
      comments: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!estimate) notFound();

  const isExpired = estimate.expiryDate && new Date(estimate.expiryDate) < new Date();
  const isAccepted = estimate.status === "accepted";
  const isRejected = estimate.status === "rejected";
  const canRespond = estimate.status === "submitted" && !isExpired;

  // Build tree
  const rootItems = estimate.items.filter((i) => !i.parentItemId && i.level === 1).sort((a, b) => a.sortOrder - b.sortOrder);
  const getChildren = (parentId: string) =>
    estimate.items.filter((i) => i.parentItemId === parentId).sort((a, b) => a.sortOrder - b.sortOrder);

  const renderItem = (item: typeof estimate.items[0], depth: number) => {
    const children = getChildren(item.id);
    const indent = depth * 16;
    const isHeader = item.level < 4;

    return (
      <div key={item.id}>
        <div
          className={`flex items-center gap-2 py-2 border-b text-sm ${item.isAlternative ? "opacity-60 bg-amber-50/50" : ""}`}
          style={{ paddingLeft: `${indent + 12}px` }}
        >
          <div className={`flex-1 min-w-0 ${item.level === 1 ? "font-bold text-base" : item.level === 2 ? "font-semibold" : item.level === 3 ? "font-medium" : ""}`}>
            {item.itemName}
            {item.isAlternative && (
              <Badge variant="outline" className="ml-2 text-[10px]">代替案</Badge>
            )}
          </div>
          {item.level === 4 && (
            <>
              <div className="w-16 text-right text-xs text-muted-foreground shrink-0">
                {item.quantity != null ? `${item.quantity}${item.unit ?? ""}` : ""}
              </div>
              <div className="w-24 text-right font-mono shrink-0">
                {Number(item.amount) > 0 ? formatCurrency(Number(item.amount)) : ""}
              </div>
            </>
          )}
          {isHeader && (
            <>
              <div className="w-16 shrink-0" />
              <div className="w-24 shrink-0" />
            </>
          )}
        </div>
        {children.map((child) => renderItem(child, depth + 1))}
      </div>
    );
  };

  // Days until expiry
  const daysLeft = estimate.expiryDate
    ? Math.ceil((new Date(estimate.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Company header */}
        <div className="text-center space-y-2">
          <h2 className="text-lg font-semibold text-muted-foreground">{estimate.company.name}</h2>
          <h1 className="text-2xl font-bold">御見積書</h1>
        </div>

        {/* Status banner */}
        {isExpired && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-center text-sm text-red-700">
            この見積書の有効期限が切れています。
          </div>
        )}
        {isAccepted && (
          <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-center text-sm text-green-700">
            この見積書は承認済みです。
          </div>
        )}
        {isRejected && (
          <div className="rounded-lg bg-gray-50 border border-gray-200 p-3 text-center text-sm text-gray-700">
            この見積書はお断りされています。
          </div>
        )}

        {/* Estimate info */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid gap-4 md:grid-cols-2 text-sm">
              <div>
                <h3 className="font-semibold text-lg mb-2">{estimate.title}</h3>
                {estimate.customer && (
                  <p className="text-muted-foreground">{estimate.customer.name}{estimate.customer.honorific}</p>
                )}
              </div>
              <div className="space-y-1 text-right">
                <p className="text-xs text-muted-foreground">見積番号: {estimate.estimateNumber}</p>
                <p className="text-xs text-muted-foreground">見積日: {formatDate(estimate.estimateDate)}</p>
                {estimate.expiryDate && (
                  <p className={`text-xs ${isExpired ? "text-red-600" : daysLeft != null && daysLeft <= 7 ? "text-amber-600" : "text-muted-foreground"}`}>
                    有効期限: {formatDate(estimate.expiryDate)}
                    {!isExpired && daysLeft != null && ` （残り${daysLeft}日）`}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Items */}
        <Card>
          <CardHeader>
            <CardTitle>明細</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden">
              {rootItems.map((item) => renderItem(item, 0))}
            </div>
          </CardContent>
        </Card>

        {/* Totals */}
        <Card>
          <CardContent className="pt-6 space-y-2 text-sm">
            <div className="flex justify-between">
              <span>小計</span>
              <span className="font-mono">{formatCurrency(Number(estimate.subtotal))}</span>
            </div>
            {Number(estimate.expenseAmount) > 0 && (
              <div className="flex justify-between">
                <span>諸経費</span>
                <span className="font-mono">{formatCurrency(Number(estimate.expenseAmount))}</span>
              </div>
            )}
            {Number(estimate.discountAmount) > 0 && (
              <div className="flex justify-between text-green-700">
                <span>値引き</span>
                <span className="font-mono">-{formatCurrency(Number(estimate.discountAmount))}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>消費税</span>
              <span className="font-mono">{formatCurrency(Number(estimate.taxAmount))}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-xl font-bold">
              <span>合計金額</span>
              <span className="font-mono">{formatCurrency(Number(estimate.totalAmount))}</span>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        {estimate.note && (
          <Card>
            <CardHeader>
              <CardTitle>備考</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{estimate.note}</p>
            </CardContent>
          </Card>
        )}

        {estimate.paymentTerms && (
          <Card>
            <CardHeader>
              <CardTitle>支払条件</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{estimate.paymentTerms}</p>
            </CardContent>
          </Card>
        )}

        {/* Comments */}
        {estimate.comments.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>コメント</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {estimate.comments.map((comment) => (
                  <div key={comment.id} className={`rounded-lg p-3 text-sm ${comment.authorType === "customer" ? "bg-blue-50 ml-4" : "bg-gray-50 mr-4"}`}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium text-xs">{comment.authorName}</span>
                      <span className="text-xs text-muted-foreground">{formatDate(comment.createdAt)}</span>
                    </div>
                    <p className="whitespace-pre-wrap">{comment.content}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action buttons */}
        {canRespond && (
          <QuoteActions token={token} estimateId={estimate.id} />
        )}

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground space-y-1 pt-4">
          <p>{estimate.company.name}</p>
          {estimate.company.phone && <p>TEL: {estimate.company.phone}</p>}
          {estimate.company.email && <p>Email: {estimate.company.email}</p>}
        </div>
      </div>
    </div>
  );
}
