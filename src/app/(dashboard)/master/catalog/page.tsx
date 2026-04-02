import { requireUser, canEditUnitPriceMaster } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Search, Download } from "lucide-react";
import { formatCurrency } from "@/lib/utils/format";
import { ImportCatalogButton } from "@/components/catalog/import-catalog-button";

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; manufacturer?: string }>;
}) {
  const user = await requireUser();
  const canEdit = canEditUnitPriceMaster(user.role);
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const manufacturer = params.manufacturer ?? "";

  const where = {
    isActive: true,
    ...(q ? {
      OR: [
        { productName: { contains: q, mode: "insensitive" as const } },
        { productCode: { contains: q, mode: "insensitive" as const } },
      ],
    } : {}),
    ...(manufacturer ? { manufacturer } : {}),
  };

  const [items, manufacturers] = await Promise.all([
    prisma.manufacturerCatalog.findMany({
      where,
      orderBy: [{ manufacturer: "asc" }, { productName: "asc" }],
      take: 100,
    }),
    prisma.manufacturerCatalog.findMany({
      where: { isActive: true },
      select: { manufacturer: true },
      distinct: ["manufacturer"],
      orderBy: { manufacturer: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">メーカーカタログ</h1>
        {canEdit && <ImportCatalogButton />}
      </div>

      <div className="flex flex-col gap-3">
        <form action="/master/catalog" method="GET" className="flex gap-2">
          {manufacturer && <input type="hidden" name="manufacturer" value={manufacturer} />}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input name="q" defaultValue={q} placeholder="製品名・型番で検索" className="pl-9" />
          </div>
          <Button type="submit" variant="outline">検索</Button>
        </form>
        <div className="flex gap-2 overflow-x-auto pb-1">
          <Link href="/master/catalog">
            <Button variant={!manufacturer ? "default" : "outline"} size="sm"
              className={!manufacturer ? "bg-brand hover:bg-brand-hover" : ""}>
              すべて
            </Button>
          </Link>
          {manufacturers.map((m) => (
            <Link key={m.manufacturer} href={`/master/catalog?manufacturer=${encodeURIComponent(m.manufacturer)}`}>
              <Button variant={manufacturer === m.manufacturer ? "default" : "outline"} size="sm"
                className={manufacturer === m.manufacturer ? "bg-brand hover:bg-brand-hover" : ""}>
                {m.manufacturer}
              </Button>
            </Link>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>カタログ製品（{items.length}件）</CardTitle>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <p className="text-muted-foreground text-sm py-8 text-center">
              {q || manufacturer ? "条件に一致する製品がありません。" : "カタログが登録されていません。CSVインポートで追加してください。"}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>メーカー</TableHead>
                    <TableHead>製品名</TableHead>
                    <TableHead>型番</TableHead>
                    <TableHead>規格</TableHead>
                    <TableHead>単位</TableHead>
                    <TableHead className="text-right">定価</TableHead>
                    <TableHead>カテゴリ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Badge variant="outline">{item.manufacturer}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">{item.productName}</TableCell>
                      <TableCell className="text-xs text-muted-foreground font-mono">{item.productCode ?? "-"}</TableCell>
                      <TableCell className="text-xs">{item.specification ?? "-"}</TableCell>
                      <TableCell>{item.unit}</TableCell>
                      <TableCell className="text-right font-mono">{formatCurrency(Number(item.listPrice))}</TableCell>
                      <TableCell className="text-xs">{item.categoryName ?? "-"}</TableCell>
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
