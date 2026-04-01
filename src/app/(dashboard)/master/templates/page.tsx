import { requireUser, canEditUnitPriceMaster } from "@/lib/auth";
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
import { Plus, FileText } from "lucide-react";
import { formatDate } from "@/lib/utils/format";

export default async function TemplatesPage() {
  const user = await requireUser();
  const canEdit = canEditUnitPriceMaster(user.role);

  const templates = await prisma.template.findMany({
    where: {
      OR: [{ companyId: user.companyId }, { isSystem: true }],
    },
    include: {
      _count: { select: { items: true } },
    },
    orderBy: [{ isSystem: "desc" }, { name: "asc" }],
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">テンプレート管理</h1>
        {canEdit && (
          <Link href="/master/templates/new">
            <Button className="bg-brand hover:bg-brand-hover">
              <Plus className="mr-2 h-4 w-4" />
              新規テンプレート
            </Button>
          </Link>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>テンプレート一覧（{templates.length}件）</CardTitle>
        </CardHeader>
        <CardContent>
          {templates.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-sm">
                テンプレートがありません。
                {canEdit && (
                  <Link
                    href="/master/templates/new"
                    className="text-brand hover:underline ml-1"
                  >
                    最初のテンプレートを作成
                  </Link>
                )}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>テンプレート名</TableHead>
                    <TableHead>説明</TableHead>
                    <TableHead className="text-right">明細数</TableHead>
                    <TableHead>種別</TableHead>
                    <TableHead>作成日</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {templates.map((template) => (
                    <TableRow key={template.id}>
                      <TableCell className="font-medium">
                        <Link
                          href={`/master/templates/${template.id}`}
                          className="text-brand hover:underline"
                        >
                          {template.name}
                        </Link>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {template.description
                          ? template.description.length > 50
                            ? `${template.description.slice(0, 50)}...`
                            : template.description
                          : "-"}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {template._count.items}
                      </TableCell>
                      <TableCell>
                        {template.isSystem ? (
                          <Badge variant="secondary">システム</Badge>
                        ) : template.isShared ? (
                          <Badge variant="outline">共有</Badge>
                        ) : (
                          <Badge variant="default">個人</Badge>
                        )}
                      </TableCell>
                      <TableCell>{formatDate(template.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
