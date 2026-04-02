"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { requireUser, canEditEstimate } from "@/lib/auth";

export async function requestApproval(estimateId: string, approverIds: string[], note?: string) {
  const user = await requireUser();
  if (!canEditEstimate(user.role)) throw new Error("権限がありません");

  // Verify estimate exists and belongs to company
  const estimate = await prisma.estimate.findUnique({
    where: { id: estimateId, companyId: user.companyId },
    select: { id: true, status: true },
  });
  if (!estimate) throw new Error("見積が見つかりません");
  if (estimate.status !== "draft") throw new Error("作成中の見積のみ承認申請できます");

  // Check for existing pending request
  const existing = await prisma.approvalRequest.findFirst({
    where: { estimateId, status: "pending" },
  });
  if (existing) throw new Error("この見積には既に承認待ちの申請があります");

  await prisma.approvalRequest.create({
    data: {
      companyId: user.companyId,
      estimateId,
      requestedBy: user.id,
      approverIds,
      totalSteps: approverIds.length,
      note: note || null,
    },
  });

  revalidatePath(`/estimates/${estimateId}`);
  revalidatePath("/estimates");
}

export async function processApproval(requestId: string, action: "approve" | "reject", comment?: string) {
  const user = await requireUser();

  const request = await prisma.approvalRequest.findUnique({
    where: { id: requestId },
    include: { actions: true },
  });
  if (!request) throw new Error("承認申請が見つかりません");
  if (request.status !== "pending") throw new Error("この申請は既に処理済みです");

  // Verify user is the current step's approver
  const currentApprover = request.approverIds[request.currentStep - 1];
  if (currentApprover !== user.id) throw new Error("この承認ステップの担当者ではありません");

  // Record the action
  await prisma.approvalAction.create({
    data: {
      approvalRequestId: requestId,
      userId: user.id,
      step: request.currentStep,
      action,
      comment: comment || null,
    },
  });

  if (action === "reject") {
    // Rejected - update request status
    await prisma.approvalRequest.update({
      where: { id: requestId },
      data: { status: "rejected" },
    });
  } else if (request.currentStep >= request.totalSteps) {
    // All steps approved
    await prisma.approvalRequest.update({
      where: { id: requestId },
      data: { status: "approved", currentStep: request.currentStep },
    });
  } else {
    // Move to next step
    await prisma.approvalRequest.update({
      where: { id: requestId },
      data: { currentStep: request.currentStep + 1 },
    });
  }

  revalidatePath(`/estimates/${request.estimateId}`);
  revalidatePath("/estimates");
}
