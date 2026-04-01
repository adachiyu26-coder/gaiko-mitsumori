import { NextRequest, NextResponse } from "next/server";
import { requireUser, canManageUsers } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";
import path from "path";
import { writeFile, unlink, mkdir } from "fs/promises";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"];
const ALLOWED_EXTENSIONS = ["png", "jpg", "jpeg", "webp"];

/** マジックバイトでファイル形式を検証 */
function validateMagicBytes(bytes: Uint8Array): boolean {
  // PNG: 89 50 4E 47
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return true;
  // JPEG: FF D8 FF
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return true;
  // WebP: 52 49 46 46 ... 57 45 42 50
  if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
      bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) return true;
  return false;
}

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
      { error: "PNG、JPEG、WebP形式のファイルのみ対応しています" },
      { status: 400 }
    );
  }

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return NextResponse.json(
      { error: "PNG、JPEG、WebP形式のファイルのみ対応しています" },
      { status: 400 }
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "ファイルサイズは2MB以下にしてください" },
      { status: 400 }
    );
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!validateMagicBytes(bytes)) {
    return NextResponse.json(
      { error: "ファイルの内容が画像形式と一致しません" },
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
  const filename = `logo-${user.companyId}.${ext}`;
  await mkdir(UPLOAD_DIR, { recursive: true });
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
