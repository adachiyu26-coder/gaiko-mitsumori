import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus } from "lucide-react";
import { formatDate } from "@/lib/utils/format";

const customerTypeLabels: Record<string, string> = {
  individual: "個人",
  corporate: "法人",
  subcontract: "下請",
};

export default async function CustomersPage() {
  const user = await requireUser();

  const customers = await prisma.customer.findMany({
    where: { companyId: user.companyId },
    include: { _count: { select: { estimates: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">顧客管理</h1>
        <Link href="/customers/new">
          <Button className="bg-[#1e3a5f] hover:bg-[#162d4a]">
            <Plus className="mr-2 h-4 w-4" />
            新規顧客
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>顧客一覧</CardTitle>
        </CardHeader>
        <CardContent>
          {customers.length === 0 ? (
            <p className="text-muted-foreground text-sm py-8 text-center">
              顧客がまだ登録されていません。
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>顧客名</TableHead>
                  <TableHead>区分</TableHead>
                  <TableHead>電話番号</TableHead>
                  <TableHead>住所</TableHead>
                  <TableHead className="text-right">見積数</TableHead>
                  <TableHead>登録日</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell>
                      <Link
                        href={`/customers/${customer.id}`}
                        className="text-[#1e3a5f] hover:underline font-medium"
                      >
                        {customer.name}
                        {customer.honorific}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {customerTypeLabels[customer.customerType] ?? customer.customerType}
                    </TableCell>
                    <TableCell>{customer.phone ?? "-"}</TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {customer.address ?? "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      {customer._count.estimates}
                    </TableCell>
                    <TableCell>{formatDate(customer.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
