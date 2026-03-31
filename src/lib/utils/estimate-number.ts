import { prisma } from "@/lib/db/prisma";

export async function generateEstimateNumber(
  companyId: string,
  abbreviation: string | null
): Promise<string> {
  const now = new Date();
  const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
  const prefix = abbreviation || "EST";

  const lastEstimate = await prisma.estimate.findFirst({
    where: {
      companyId,
      estimateNumber: { startsWith: `${prefix}-${yearMonth}-` },
    },
    orderBy: { estimateNumber: "desc" },
  });

  let seq = 1;
  if (lastEstimate) {
    const parts = lastEstimate.estimateNumber.split("-");
    const lastSeq = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(lastSeq)) seq = lastSeq + 1;
  }

  return `${prefix}-${yearMonth}-${String(seq).padStart(4, "0")}`;
}
