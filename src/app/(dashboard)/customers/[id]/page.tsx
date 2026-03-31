import { notFound } from "next/navigation";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Pencil } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { DeleteCustomerButton } from "@/components/customers/delete-customer-button";

const customerTypeLabels: Record<string, string> = {
  individual: "個人",
  corporate: "法人",
  subcontract: "下請",
};

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  draft: { label: "作成中", variant: "secondary" },
  submitted: { label: "提出済", variant: "default" },
  accepted: { label: "受注", variant: "outline" },
  rejected: { label: "失注", variant: "destructive" },
  expired: { label: "期限切れ", variant: "secondary" },
};

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();

  const customer = await prisma.customer.findUnique({
    where: { id, companyId: user.companyId },
    include: {
      estimates: {
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  });

  if (!customer) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          {customer.name}
          {customer.honorific}
        </h1>
        <div className="flex gap-2">
          <Link href={`/customers/${id}/edit`}>
            <Button variant="outline" size="sm">
              <Pencil className="mr-2 h-4 w-4" />
              編集
            </Button>
          </Link>
          <DeleteCustomerButton customerId={id} />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>基本情報</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-3 md:grid-cols-2 text-sm">
            <div>
              <dt className="text-muted-foreground">区分</dt>
              <dd>{customerTypeLabels[customer.customerType]}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">フリガナ</dt>
              <dd>{customer.nameKana ?? "-"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">郵便番号</dt>
              <dd>{customer.postalCode ?? "-"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">電話番号</dt>
              <dd>{customer.phone ?? "-"}</dd>
            </div>
            <div className="md:col-span-2">
              <dt className="text-muted-foreground">住所</dt>
              <dd>{customer.address ?? "-"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">メール</dt>
              <dd>{customer.email ?? "-"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">紹介元</dt>
              <dd>{customer.referralSource ?? "-"}</dd>
            </div>
            {customer.note && (
              <div className="md:col-span-2">
                <dt className="text-muted-foreground">備考</dt>
                <dd className="whitespace-pre-wrap">{customer.note}</dd>
              </div>
            )}
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>関連見積</CardTitle>
        </CardHeader>
        <CardContent>
          {customer.estimates.length === 0 ? (
            <p className="text-muted-foreground text-sm py-4 text-center">
              見積がありません
            </p>
          ) : (
            <div className="space-y-2">
              {customer.estimates.map((estimate) => {
                const s = statusLabels[estimate.status] ?? statusLabels.draft;
                return (
                  <Link
                    key={estimate.id}
                    href={`/estimates/${estimate.id}`}
                    className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium">{estimate.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {estimate.estimateNumber} ・ {formatDate(estimate.estimateDate)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold">
                        {formatCurrency(Number(estimate.totalAmount))}
                      </span>
                      <Badge variant={s.variant}>{s.label}</Badge>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
