import { NextRequest, NextResponse } from "next/server";
import { requireUser, canManageUsers } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";
import path from "path";
import { writeFile, unlink, mkdir } from "fs/promises";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];

export async function POST(request: NextRequest) {
  const user = await requireUser();
  if (!canManageUsers(user.role)) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get("logo") as File | null;

  if (!file) {
    return NextResponse.json({ error: "ファイルが選択されていません" }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "PNG、JPEG、WebP、SVG形式のファイルのみ対応しています" },
      { status: 400 }
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "ファイルサイズは2MB以下にしてください" },
      { status: 400 }
    );
  }

  // Delete old logo if exists
  const company = await prisma.company.findUnique({
    where: { id: user.companyId },
    select: { logoUrl: true },
  });
  if (company?.logoUrl) {
    const oldPath = path.join(process.cwd(), "public", company.logoUrl);
    try { await unlink(oldPath); } catch { /* ignore if file doesn't exist */ }
  }

  // Save new file
  const ext = file.name.split(".").pop() || "png";
  const filename = `logo-${user.companyId}.${ext}`;
  await mkdir(UPLOAD_DIR, { recursive: true });
  const bytes = new Uint8Array(await file.arrayBuffer());
  await writeFile(path.join(UPLOAD_DIR, filename), bytes);

  const logoUrl = `/uploads/${filename}`;

  // Update database
  await prisma.company.update({
    where: { id: user.companyId },
    data: { logoUrl },
  });

  revalidatePath("/settings");

  return NextResponse.json({ logoUrl });
}

export async function DELETE() {
  const user = await requireUser();
  if (!canManageUsers(user.role)) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const company = await prisma.company.findUnique({
    where: { id: user.companyId },
    select: { logoUrl: true },
  });

  if (company?.logoUrl) {
    const filePath = path.join(process.cwd(), "public", company.logoUrl);
    try { await unlink(filePath); } catch { /* ignore */ }
  }

  await prisma.company.update({
    where: { id: user.companyId },
    data: { logoUrl: null },
  });

  revalidatePath("/settings");

  return NextResponse.json({ success: true });
}
