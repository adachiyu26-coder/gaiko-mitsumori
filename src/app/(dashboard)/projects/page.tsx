import { requireUser, canEditEstimate } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Plus, Hammer } from "lucide-react";
import { formatDate } from "@/lib/utils/format";

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  planning: { label: "計画中", variant: "secondary" },
  in_progress: { label: "施工中", variant: "default" },
  completed: { label: "完了", variant: "outline" },
};

export default async function ProjectsPage() {
  const user = await requireUser();

  const projects = await prisma.project.findMany({
    where: { companyId: user.companyId },
    include: {
      customer: { select: { name: true } },
      estimate: { select: { estimateNumber: true } },
      _count: { select: { tasks: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">工程管理</h1>
        {canEditEstimate(user.role) && (
          <Link href="/projects/new">
            <Button className="bg-brand hover:bg-brand-hover">
              <Plus className="mr-2 h-4 w-4" />
              新規工程
            </Button>
          </Link>
        )}
      </div>

      <Card>
        <CardContent className="pt-6">
          {projects.length === 0 ? (
            <div className="flex flex-col items-center py-12 space-y-3">
              <Hammer className="h-12 w-12 text-muted-foreground/50" />
              <p className="text-muted-foreground text-sm">工程がまだありません</p>
              <p className="text-xs text-muted-foreground">受注した見積から工程を作成できます</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>工程名</TableHead>
                  <TableHead>顧客</TableHead>
                  <TableHead>開始日</TableHead>
                  <TableHead>終了日</TableHead>
                  <TableHead className="text-right">タスク数</TableHead>
                  <TableHead>ステータス</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.map((project) => {
                  const s = statusLabels[project.status] ?? statusLabels.planning;
                  return (
                    <TableRow key={project.id}>
                      <TableCell className="font-medium">
                        <Link href={`/projects/${project.id}`} className="text-brand hover:underline">{project.name}</Link>
                      </TableCell>
                      <TableCell>{project.customer?.name ?? "-"}</TableCell>
                      <TableCell>{project.startDate ? formatDate(project.startDate) : "-"}</TableCell>
                      <TableCell>{project.endDate ? formatDate(project.endDate) : "-"}</TableCell>
                      <TableCell className="text-right">{project._count.tasks}</TableCell>
                      <TableCell><Badge variant={s.variant}>{s.label}</Badge></TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
