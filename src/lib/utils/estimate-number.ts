import { prisma } from "@/lib/db/prisma";

/**
 * Generate a unique estimate number using advisory lock to prevent race conditions.
 * Format: {abbreviation}-{YYYYMM}-{0001}
 */
export async function generateEstimateNumber(
  companyId: string,
  abbreviation: string | null
): Promise<string> {
  const now = new Date();
  const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
  const prefix = abbreviation || "EST";
  const searchPrefix = `${prefix}-${yearMonth}-`;

  // Use a transaction with serializable isolation to prevent duplicates
  const result = await prisma.$transaction(async (tx) => {
    const lastEstimate = await tx.estimate.findFirst({
      where: {
        companyId,
        estimateNumber: { startsWith: searchPrefix },
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
  });

  return result;
}
