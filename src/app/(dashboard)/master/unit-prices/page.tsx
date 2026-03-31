import { requireUser, canEditUnitPriceMaster, canViewCostPrice } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils/format";
import { UnitPriceToolbar } from "@/components/unit-prices/unit-price-toolbar";
import { UnitPriceActions } from "@/components/unit-prices/unit-price-actions";

export default async function UnitPriceMasterPage() {
  const user = await requireUser();
  const canEdit = canEditUnitPriceMaster(user.role);
  const showCost = canViewCostPrice(user.role);

  const [unitPrices, categories] = await Promise.all([
    prisma.unitPriceMaster.findMany({
      where: { companyId: user.companyId },
      include: { category: true },
      orderBy: [{ category: { sortOrder: "asc" } }, { itemName: "asc" }],
    }),
    prisma.category.findMany({
      where: {
        OR: [{ companyId: user.companyId }, { isSystem: true }],
      },
      orderBy: { sortOrder: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">単価マスタ</h1>
      </div>

      <UnitPriceToolbar
        canEdit={canEdit}
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
      />

      <Card>
        <CardHeader>
          <CardTitle>単価一覧（{unitPrices.length}件）</CardTitle>
        </CardHeader>
        <CardContent>
          {unitPrices.length === 0 ? (
            <p className="text-muted-foreground text-sm py-8 text-center">
              単価マスタが登録されていません。CSVインポートまたは個別登録で追加してください。
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
                    <TableRow key={item.id}>
                      <TableCell className="text-xs">
                        {item.category?.name ?? "-"}
                      </TableCell>
                      <TableCell className="font-medium">
                        {item.itemName}
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
                            categories={categories.map((c) => ({
                              id: c.id,
                              name: c.name,
                            }))}
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
