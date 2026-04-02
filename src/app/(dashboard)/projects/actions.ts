"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { requireUser, canEditEstimate } from "@/lib/auth";

export async function createProject(data: {
  name: string;
  estimateId?: string | null;
  customerId?: string | null;
  siteAddress?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  note?: string | null;
}) {
  const user = await requireUser();
  if (!canEditEstimate(user.role)) throw new Error("権限がありません");

  const project = await prisma.project.create({
    data: {
      companyId: user.companyId,
      name: data.name,
      estimateId: data.estimateId || null,
      customerId: data.customerId || null,
      siteAddress: data.siteAddress || null,
      startDate: data.startDate ? new Date(data.startDate) : null,
      endDate: data.endDate ? new Date(data.endDate) : null,
      note: data.note || null,
      createdBy: user.id,
    },
  });

  revalidatePath("/projects");
  redirect(`/projects/${project.id}`);
}

export async function createProjectFromEstimate(estimateId: string) {
  const user = await requireUser();
  if (!canEditEstimate(user.role)) throw new Error("権限がありません");

  const estimate = await prisma.estimate.findUnique({
    where: { id: estimateId, companyId: user.companyId },
    include: { customer: true, items: { where: { level: 1 }, orderBy: { sortOrder: "asc" } } },
  });
  if (!estimate) throw new Error("見積が見つかりません");

  const today = new Date();
  const defaultEnd = new Date(today);
  defaultEnd.setDate(defaultEnd.getDate() + 30);

  const project = await prisma.project.create({
    data: {
      companyId: user.companyId,
      name: estimate.title,
      estimateId,
      customerId: estimate.customerId,
      siteAddress: estimate.siteAddress,
      startDate: today,
      endDate: defaultEnd,
      createdBy: user.id,
      tasks: {
        create: estimate.items.map((item, idx) => ({
          name: item.itemName,
          startDate: today,
          endDate: defaultEnd,
          sortOrder: idx,
          color: ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899", "#f97316", "#14b8a6", "#6366f1"][idx % 10],
        })),
      },
    },
  });

  revalidatePath("/projects");
  redirect(`/projects/${project.id}`);
}

export async function updateTask(taskId: string, data: {
  name?: string;
  startDate?: string | null;
  endDate?: string | null;
  progress?: number;
  assigneeId?: string | null;
  note?: string | null;
}) {
  const user = await requireUser();

  const task = await prisma.projectTask.findUnique({
    where: { id: taskId },
    include: { project: { select: { companyId: true, id: true } } },
  });
  if (!task || task.project.companyId !== user.companyId) throw new Error("タスクが見つかりません");

  await prisma.projectTask.update({
    where: { id: taskId },
    data: {
      name: data.name ?? undefined,
      startDate: data.startDate !== undefined ? (data.startDate ? new Date(data.startDate) : null) : undefined,
      endDate: data.endDate !== undefined ? (data.endDate ? new Date(data.endDate) : null) : undefined,
      progress: data.progress ?? undefined,
      assigneeId: data.assigneeId !== undefined ? (data.assigneeId || null) : undefined,
      note: data.note !== undefined ? (data.note || null) : undefined,
    },
  });

  revalidatePath(`/projects/${task.project.id}`);
}

export async function addTask(projectId: string, name: string) {
  const user = await requireUser();

  const project = await prisma.project.findUnique({
    where: { id: projectId, companyId: user.companyId },
    select: { id: true, startDate: true, endDate: true, _count: { select: { tasks: true } } },
  });
  if (!project) throw new Error("工程が見つかりません");

  await prisma.projectTask.create({
    data: {
      projectId,
      name,
      startDate: project.startDate,
      endDate: project.endDate,
      sortOrder: project._count.tasks,
      color: "#3b82f6",
    },
  });

  revalidatePath(`/projects/${projectId}`);
}

export async function deleteTask(taskId: string) {
  const user = await requireUser();

  const task = await prisma.projectTask.findUnique({
    where: { id: taskId },
    include: { project: { select: { companyId: true, id: true } } },
  });
  if (!task || task.project.companyId !== user.companyId) throw new Error("タスクが見つかりません");

  await prisma.projectTask.delete({ where: { id: taskId } });
  revalidatePath(`/projects/${task.project.id}`);
}

export async function deleteProject(projectId: string) {
  const user = await requireUser();
  await prisma.project.delete({ where: { id: projectId, companyId: user.companyId } });
  revalidatePath("/projects");
  redirect("/projects");
}
