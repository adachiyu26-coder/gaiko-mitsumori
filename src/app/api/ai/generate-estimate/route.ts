import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireUser } from "@/lib/auth";
import { rateLimit } from "@/lib/utils/rate-limit";

export async function POST(request: NextRequest) {
  const user = await requireUser();

  const { success } = rateLimit(`ai:${user.id}`, 10, 60 * 1000); // 10 per minute
  if (!success) {
    return NextResponse.json({ error: "リクエストが多すぎます。しばらく待ってから再試行してください。" }, { status: 429 });
  }
  const body = await request.json();
  const { description, imageBase64 } = body;

  if (!description?.trim()) {
    return NextResponse.json({ error: "工事内容を入力してください" }, { status: 400 });
  }

  // Fetch company's unit price master for context
  const unitPrices = await prisma.unitPriceMaster.findMany({
    where: { companyId: user.companyId, isActive: true },
    include: { category: true },
    take: 200, // Limit to avoid token overflow
    orderBy: { itemName: "asc" },
  });

  const categories = await prisma.category.findMany({
    where: {
      OR: [{ companyId: user.companyId }, { isSystem: true }],
    },
    orderBy: { sortOrder: "asc" },
  });

  // Build unit price context for the prompt
  const priceContext = unitPrices.map((p) =>
    `- ${p.category?.name ?? "未分類"} > ${p.itemName}${p.specification ? ` (${p.specification})` : ""}: 単価¥${Number(p.unitPrice)}, 単位: ${p.unit}`
  ).join("\n");

  const categoryList = categories.map((c) => c.name).join("、");

  const systemPrompt = `あなたは外構・エクステリア工事の見積もりを作成する専門家です。
ユーザーの説明に基づいて、4階層の見積明細を生成してください。

階層構造:
- level 1: 工種（例: 門まわり、塀・フェンス、駐車場）
- level 2: 大項目（例: フェンス工事、門柱設置）
- level 3: 中項目（例: 基礎工事、本体工事）
- level 4: 品名・作業名（具体的な材料や作業）

カテゴリ一覧: ${categoryList}

会社の単価マスタ（参考用）:
${priceContext || "（単価マスタ未登録）"}

以下のJSON形式で出力してください。他のテキストは含めないでください:
{
  "title": "見積タイトル",
  "items": [
    {
      "level": 1,
      "itemName": "工種名",
      "specification": null,
      "quantity": null,
      "unit": null,
      "unitPrice": null,
      "costPrice": null
    },
    {
      "level": 4,
      "itemName": "品名",
      "specification": "規格",
      "quantity": 10,
      "unit": "m",
      "unitPrice": 5000,
      "costPrice": 3500
    }
  ]
}

注意事項:
- level 1-3は数量・単価は null にする
- level 4のみ数量・単価・単位を設定する
- 単価マスタに一致する品名がある場合はその単価を使用する
- 単価マスタにない場合は業界標準的な価格を推定する（推定値は specification に「※概算」と記載）
- 実用的で現実的な見積を作成する
- 日本の外構工事の一般的な単価感を反映する`;

  const userMessage = imageBase64
    ? `以下の工事内容の見積を作成してください:\n${description}\n\n（現場画像が添付されています）`
    : `以下の工事内容の見積を作成してください:\n${description}`;

  try {
    // Call Claude API
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "AI機能が設定されていません（ANTHROPIC_API_KEY未設定）" }, { status: 500 });
    }

    const messages: Array<{ role: string; content: unknown }> = [{
      role: "user",
      content: imageBase64
        ? [
            { type: "image", source: { type: "base64", media_type: "image/jpeg", data: imageBase64 } },
            { type: "text", text: userMessage },
          ]
        : userMessage,
    }];

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        system: systemPrompt,
        messages,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("AI API error:", errorData);
      return NextResponse.json({ error: "AI生成に失敗しました" }, { status: 500 });
    }

    const aiResult = await response.json();
    const textContent = aiResult.content?.find((c: { type: string }) => c.type === "text");
    if (!textContent?.text) {
      return NextResponse.json({ error: "AI応答が空です" }, { status: 500 });
    }

    // Extract JSON from response (handle markdown code blocks)
    let jsonText = textContent.text.trim();
    const jsonMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonText = jsonMatch[1].trim();
    }

    const parsed = JSON.parse(jsonText);

    return NextResponse.json({
      title: parsed.title ?? "AI生成見積",
      items: parsed.items ?? [],
    });
  } catch (error) {
    console.error("AI generation error:", error);
    return NextResponse.json({ error: "AI見積生成に失敗しました" }, { status: 500 });
  }
}
