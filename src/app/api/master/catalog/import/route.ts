import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireUser, canEditUnitPriceMaster } from "@/lib/auth";

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') { current += '"'; i++; }
      else if (ch === '"') { inQuotes = false; }
      else { current += ch; }
    } else {
      if (ch === '"') { inQuotes = true; }
      else if (ch === ",") { fields.push(current.trim()); current = ""; }
      else { current += ch; }
    }
  }
  fields.push(current.trim());
  return fields;
}

export async function POST(request: NextRequest) {
  const user = await requireUser();
  if (!canEditUnitPriceMaster(user.role)) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const { csvText } = await request.json();
  if (!csvText) return NextResponse.json({ error: "CSVデータがありません" }, { status: 400 });

  const lines = csvText.trim().split("\n");
  if (lines.length < 2) return NextResponse.json({ error: "CSVにデータがありません" }, { status: 400 });

  const headers = parseCsvLine(lines[0]);
  const mfgIdx = headers.indexOf("メーカー");
  const nameIdx = headers.indexOf("製品名");
  const codeIdx = headers.indexOf("型番");
  const specIdx = headers.indexOf("規格");
  const unitIdx = headers.indexOf("単位");
  const priceIdx = headers.indexOf("定価");
  const catIdx = headers.indexOf("カテゴリ");

  if (mfgIdx === -1 || nameIdx === -1 || priceIdx === -1) {
    return NextResponse.json({ error: "必須列（メーカー、製品名、定価）が見つかりません" }, { status: 400 });
  }

  const records = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    if (!cols[nameIdx]) continue;
    const price = parseFloat(cols[priceIdx]);
    if (isNaN(price) || price < 0) continue;

    records.push({
      manufacturer: cols[mfgIdx],
      productName: cols[nameIdx],
      productCode: codeIdx >= 0 ? cols[codeIdx] || null : null,
      specification: specIdx >= 0 ? cols[specIdx] || null : null,
      unit: unitIdx >= 0 ? cols[unitIdx] || "式" : "式",
      listPrice: Math.floor(price),
      categoryName: catIdx >= 0 ? cols[catIdx] || null : null,
    });
  }

  if (records.length === 0) {
    return NextResponse.json({ error: "インポート可能なデータがありません" }, { status: 400 });
  }

  await prisma.manufacturerCatalog.createMany({ data: records });

  return NextResponse.json({ count: records.length });
}
