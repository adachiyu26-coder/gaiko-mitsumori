import { notFound } from "next/navigation";
import { requireUser, canEditEstimate } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils/format";
import { GanttChart } from "@/components/projects/gantt-chart";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();

  const [project, users] = await Promise.all([
    prisma.project.findUnique({
      where: { id, companyId: user.companyId },
      include: {
        customer: { select: { name: true } },
        estimate: { select: { estimateNumber: true, title: true } },
        tasks: { orderBy: { sortOrder: "asc" }, include: { assignee: { select: { name: true } } } },
      },
    }),
    prisma.user.findMany({
      where: { companyId: user.companyId, isActive: true },
      select: { id: true, name: true },
    }),
  ]);

  if (!project) notFound();

  const canEdit = canEditEstimate(user.role);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/projects"><Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <div>
          <h1 className="text-2xl font-bold">{project.name}</h1>
          <p className="text-sm text-muted-foreground">
            {project.customer?.name ?? "顧客未設定"}
            {project.estimate && ` ・ ${project.estimate.estimateNumber}`}
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <dl className="grid gap-3 md:grid-cols-4 text-sm">
            <div><dt className="text-muted-foreground">開始日</dt><dd>{project.startDate ? formatDate(project.startDate) : "-"}</dd></div>
            <div><dt className="text-muted-foreground">終了日</dt><dd>{project.endDate ? formatDate(project.endDate) : "-"}</dd></div>
            <div><dt className="text-muted-foreground">タスク数</dt><dd>{project.tasks.length}件</dd></div>
            <div><dt className="text-muted-foreground">ステータス</dt><dd><Badge variant="secondary">{project.status === "in_progress" ? "施工中" : project.status === "completed" ? "完了" : "計画中"}</Badge></dd></div>
          </dl>
        </CardContent>
      </Card>

      <GanttChart
        projectId={id}
        tasks={project.tasks.map((t) => ({
          id: t.id,
          name: t.name,
          startDate: t.startDate?.toISOString().slice(0, 10) ?? null,
          endDate: t.endDate?.toISOString().slice(0, 10) ?? null,
          progress: t.progress,
          assigneeName: t.assignee?.name ?? null,
          assigneeId: t.assigneeId,
          color: t.color ?? "#3b82f6",
          note: t.note,
        }))}
        users={users}
        canEdit={canEdit}
        projectStartDate={project.startDate?.toISOString().slice(0, 10) ?? new Date().toISOString().slice(0, 10)}
        projectEndDate={project.endDate?.toISOString().slice(0, 10) ?? new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10)}
      />
    </div>
  );
}
