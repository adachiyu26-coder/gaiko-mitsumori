import { notFound } from "next/navigation";
import Link from "next/link";
import { requireUser, canEditUnitPriceMaster } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { DeleteTemplateButton } from "@/components/templates/delete-template-button";

export default async function TemplateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const canEdit = canEditUnitPriceMaster(user.role);

  const template = await prisma.template.findFirst({
    where: {
      id,
      OR: [{ companyId: user.companyId }, { isSystem: true }],
    },
    include: {
      items: { orderBy: { sortOrder: "asc" } },
    },
  });

  if (!template) notFound();

  const LEVEL_BG: Record<number, string> = {
    1: "bg-brand/[0.07] font-bold",
    2: "bg-blue-50/60 font-semibold",
    3: "bg-gray-50 font-medium",
    4: "",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link href="/master/templates">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{template.name}</h1>
              {template.isSystem ? (
                <Badge variant="secondary">システム</Badge>
              ) : template.isShared ? (
                <Badge variant="outline">共有</Badge>
              ) : (
                <Badge variant="default">個人</Badge>
              )}
            </div>
            {template.description && (
              <p className="text-sm text-muted-foreground mt-1">{template.description}</p>
            )}
          </div>
        </div>
        {canEdit && !template.isSystem && (
          <div className="flex gap-2">
            <Link href={`/master/templates/${id}/edit`}>
              <Button variant="outline" size="sm">
                <Pencil className="mr-2 h-4 w-4" />
                編集
              </Button>
            </Link>
            <DeleteTemplateButton templateId={id} />
          </div>
        )}
      </div>

      <Card>
        <CardContent className="pt-6">
          <dl className="grid gap-3 md:grid-cols-3 text-sm">
            <div>
              <dt className="text-muted-foreground">明細数</dt>
              <dd>{template.items.length}件</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">作成日</dt>
              <dd>{formatDate(template.createdAt)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">更新日</dt>
              <dd>{formatDate(template.updatedAt)}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>テンプレート明細</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <div className="flex items-center gap-2 py-2 px-3 bg-muted border-b text-xs text-muted-foreground font-medium">
              <div className="flex-1">品名</div>
              <div className="w-28 shrink-0">規格</div>
              <div className="w-12 text-right shrink-0">数量</div>
              <div className="w-10 shrink-0">単位</div>
              <div className="w-20 text-right shrink-0">単価</div>
              <div className="w-20 text-right shrink-0">原価</div>
            </div>
            {template.items.map((item) => {
              const indent = (item.level - 1) * 20;
              return (
                <div
                  key={item.id}
                  className={`flex items-center gap-2 py-1.5 px-3 border-b text-sm ${LEVEL_BG[item.level] ?? ""}`}
                  style={{ paddingLeft: `${indent + 12}px` }}
                >
                  <div className="flex-1 min-w-0">
                    {item.level < 4 && <span className="text-muted-foreground mr-1">▸</span>}
                    {item.itemName}
                  </div>
                  <div className="w-28 text-xs text-muted-foreground shrink-0">
                    {item.specification ?? ""}
                  </div>
                  <div className="w-12 text-right text-xs shrink-0">
                    {item.quantity != null ? String(item.quantity) : ""}
                  </div>
                  <div className="w-10 text-xs shrink-0">{item.unit ?? ""}</div>
                  <div className="w-20 text-right font-mono text-xs shrink-0">
                    {item.unitPrice ? formatCurrency(Number(item.unitPrice)) : ""}
                  </div>
                  <div className="w-20 text-right font-mono text-xs text-muted-foreground shrink-0">
                    {item.costPrice ? formatCurrency(Number(item.costPrice)) : ""}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
