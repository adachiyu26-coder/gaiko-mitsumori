import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { readFile } from "fs/promises";
import { prisma } from "@/lib/db/prisma";
import { requireUser, canViewCostPrice } from "@/lib/auth";
import { renderToBuffer } from "@react-pdf/renderer";
import { EstimatePdf } from "@/lib/pdf/estimate-pdf";

/** Convert a relative logoUrl to a data URI for react-pdf Image component */
async function resolveLogoUrl(logoUrl: string | null): Promise<string | null> {
  if (!logoUrl) return null;
  try {
    const filePath = path.join(process.cwd(), "public", logoUrl);
    const buffer = await readFile(filePath);
    const ext = path.extname(logoUrl).slice(1).toLowerCase();
    const mime = ext === "svg" ? "image/svg+xml" : ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
    return `data:${mime};base64,${buffer.toString("base64")}`;
  } catch {
    return null;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await requireUser();
  const showCost =
    request.nextUrl.searchParams.get("type") === "internal" &&
    canViewCostPrice(user.role);

  const estimate = await prisma.estimate.findUnique({
    where: { id, companyId: user.companyId },
    include: {
      company: true,
      customer: true,
      creator: true,
      items: { orderBy: { sortOrder: "asc" } },
    },
  });

  if (!estimate) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const buffer = await renderToBuffer(
    EstimatePdf({
      estimate: {
        ...estimate,
        subtotal: Number(estimate.subtotal),
        expenseRate: Number(estimate.expenseRate),
        expenseAmount: Number(estimate.expenseAmount),
        discountAmount: Number(estimate.discountAmount),
        taxRate: Number(estimate.taxRate),
        taxAmount: Number(estimate.taxAmount),
        totalAmount: Number(estimate.totalAmount),
        costSubtotal: Number(estimate.costSubtotal),
        grossProfit: Number(estimate.grossProfit),
        grossProfitRate: Number(estimate.grossProfitRate),
        items: estimate.items.map((item) => ({
          ...item,
          quantity: item.quantity ? Number(item.quantity) : null,
          unitPrice: item.unitPrice ? Number(item.unitPrice) : null,
          costPrice: item.costPrice ? Number(item.costPrice) : null,
          amount: Number(item.amount),
          costAmount: Number(item.costAmount),
        })),
      },
      company: {
        ...estimate.company,
        logoUrl: await resolveLogoUrl(estimate.company.logoUrl),
      },
      customer: estimate.customer,
      showCost,
    })
  );

  const uint8 = new Uint8Array(buffer);
  return new NextResponse(uint8, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${estimate.estimateNumber}.pdf"`,
    },
  });
}
