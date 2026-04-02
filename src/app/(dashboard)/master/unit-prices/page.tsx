import { requireUser, canEditUnitPriceMaster, canViewCostPrice } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search } from "lucide-react";
import { formatCurrency } from "@/lib/utils/format";
import { UnitPriceToolbar } from "@/components/unit-prices/unit-price-toolbar";
import { UnitPriceActions } from "@/components/unit-prices/unit-price-actions";
import Link from "next/link";

export default async function UnitPriceMasterPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; categoryId?: string }>;
}) {
  const user = await requireUser();
  const canEdit = canEditUnitPriceMaster(user.role);
  const showCost = canViewCostPrice(user.role);
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const categoryId = params.categoryId ?? "";

  const categories = await prisma.category.findMany({
    where: { OR: [{ companyId: user.companyId }, { isSystem: true }] },
    orderBy: { sortOrder: "asc" },
  });

  const where = {
    companyId: user.companyId,
    ...(categoryId ? { categoryId } : {}),
    ...(q
      ? {
          OR: [
            { itemName: { contains: q, mode: "insensitive" as const } },
            { specification: { contains: q, mode: "insensitive" as const } },
            { manufacturer: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const unitPrices = await prisma.unitPriceMaster.findMany({
    where,
    include: { category: true },
    orderBy: [{ category: { sortOrder: "asc" } }, { itemName: "asc" }],
    take: 500,
  });

  const categoriesMapped = categories.map((c) => ({ id: c.id, name: c.name }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">単価マスタ</h1>
      </div>

      <UnitPriceToolbar canEdit={canEdit} categories={categoriesMapped} />

      {/* 検索・フィルター */}
      <form action="/master/unit-prices" method="GET" className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            name="q"
            defaultValue={q}
            placeholder="品名・規格・メーカーで検索"
            className="pl-9"
          />
        </div>
        <select
          name="categoryId"
          defaultValue={categoryId}
          className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 min-w-[140px]"
        >
          <option value="">すべてのカテゴリ</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <Button type="submit" variant="outline">検索</Button>
        {(q || categoryId) && (
          <Link href="/master/unit-prices">
            <Button variant="ghost">クリア</Button>
          </Link>
        )}
      </form>

      <Card>
        <CardHeader>
          <CardTitle>
            {q || categoryId
              ? `検索結果（${unitPrices.length}件）`
              : `単価一覧（${unitPrices.length}件）`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {unitPrices.length === 0 ? (
            <p className="text-muted-foreground text-sm py-8 text-center">
              {q || categoryId
                ? "条件に一致する単価がありません。"
                : "単価マスタが登録されていません。CSVインポートまたは個別登録で追加してください。"}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>カテゴリ</TableHead>
                    <TableHead>品名</TableHead>
                    <TableHead>規格</TableHead>
                    <TableHead>単位</TableHead>
                    <TableHead className="text-right">見積単価</TableHead>
                    {showCost && (
                      <TableHead className="text-right">原価</TableHead>
                    )}
                    <TableHead>メーカー</TableHead>
                    {canEdit && <TableHead className="w-20">操作</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {unitPrices.map((item) => (
                    <TableRow key={item.id} className={!item.isActive ? "opacity-50" : ""}>
                      <TableCell className="text-xs">
                        {item.category?.name ?? "-"}
                      </TableCell>
                      <TableCell className="font-medium">
                        {item.itemName}
                        {!item.isActive && (
                          <span className="ml-2 text-xs text-muted-foreground">（無効）</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs">
                        {item.specification ?? "-"}
                      </TableCell>
                      <TableCell>{item.unit}</TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(Number(item.unitPrice))}
                      </TableCell>
                      {showCost && (
                        <TableCell className="text-right font-mono">
                          {item.costPrice
                            ? formatCurrency(Number(item.costPrice))
                            : "-"}
                        </TableCell>
                      )}
                      <TableCell className="text-xs">
                        {item.manufacturer ?? "-"}
                      </TableCell>
                      {canEdit && (
                        <TableCell>
                          <UnitPriceActions
                            item={{
                              id: item.id,
                              itemName: item.itemName,
                              specification: item.specification,
                              unit: item.unit,
                              unitPrice: Number(item.unitPrice),
                              costPrice: item.costPrice ? Number(item.costPrice) : null,
                              manufacturer: item.manufacturer,
                              modelNumber: item.modelNumber,
                              categoryId: item.categoryId,
                              isActive: item.isActive,
                              note: item.note,
                            }}
                            categories={categoriesMapped}
                          />
                        </TableCell>
                      )}
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
