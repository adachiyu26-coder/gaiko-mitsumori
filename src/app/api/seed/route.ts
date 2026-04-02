import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

// System data IDs
const SYSTEM_COMPANY_ID = "00000000-0000-0000-0000-000000000001";
const SYSTEM_USER_ID = "00000000-0000-0000-0000-000000000002";

interface Level4Item {
  itemName: string;
  specification?: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  costPrice: number;
}

interface Level3Group {
  itemName: string;
  items: Level4Item[];
}

interface Level2Group {
  itemName: string;
  children: Level3Group[];
}

interface TemplateDef {
  name: string;
  description: string;
  categoryKey: string;
  level1Name: string;
  level2Groups: Level2Group[];
}

const TEMPLATES: TemplateDef[] = [
  {
    name: "門柱・ポスト設置",
    description: "門柱本体、ポスト、インターホン取付を含む門まわり一式工事",
    categoryKey: "門まわり",
    level1Name: "門まわり工事",
    level2Groups: [
      { itemName: "門柱工事", children: [
        { itemName: "本体", items: [
          { itemName: "機能門柱（アルミ）", specification: "W400×H1600", quantity: 1, unit: "本", unitPrice: 85000, costPrice: 58000 },
          { itemName: "ポスト", specification: "前入れ後出し ダイヤル錠付", quantity: 1, unit: "台", unitPrice: 35000, costPrice: 22000 },
          { itemName: "インターホン子機", specification: "ワイヤレスカメラ付", quantity: 1, unit: "台", unitPrice: 28000, costPrice: 18000 },
        ]},
        { itemName: "基礎・施工", items: [
          { itemName: "基礎工事", specification: "コンクリート基礎 W500×D500×H400", quantity: 1, unit: "箇所", unitPrice: 18000, costPrice: 12000 },
          { itemName: "電気配線工事", specification: "インターホン・照明用", quantity: 1, unit: "式", unitPrice: 25000, costPrice: 16000 },
          { itemName: "門柱取付施工費", quantity: 1, unit: "式", unitPrice: 25000, costPrice: 18000 },
        ]},
      ]},
    ],
  },
  {
    name: "門扉設置",
    description: "門扉本体（片開き）の設置および門柱・基礎工事一式",
    categoryKey: "門まわり",
    level1Name: "門まわり工事",
    level2Groups: [
      { itemName: "門扉工事", children: [
        { itemName: "本体・金物", items: [
          { itemName: "アルミ門扉（片開き）", specification: "W700×H1200", quantity: 1, unit: "枚", unitPrice: 68000, costPrice: 45000 },
          { itemName: "門柱（受け側）", specification: "アルミ H1200", quantity: 2, unit: "本", unitPrice: 12000, costPrice: 8000 },
        ]},
        { itemName: "基礎・施工", items: [
          { itemName: "基礎工事", specification: "コンクリート基礎", quantity: 2, unit: "箇所", unitPrice: 15000, costPrice: 10000 },
          { itemName: "取付施工費", quantity: 1, unit: "式", unitPrice: 20000, costPrice: 14000 },
        ]},
      ]},
    ],
  },
  {
    name: "アルミフェンス工事",
    description: "アルミフェンスH800の設置一式（基礎ブロック含む）",
    categoryKey: "塀・フェンス",
    level1Name: "塀・フェンス工事",
    level2Groups: [
      { itemName: "フェンス工事", children: [
        { itemName: "材料", items: [
          { itemName: "アルミフェンス", specification: "H800 横格子タイプ", quantity: 20, unit: "m", unitPrice: 8500, costPrice: 6000 },
          { itemName: "フェンス柱", specification: "アルミ T80", quantity: 11, unit: "本", unitPrice: 3500, costPrice: 2200 },
          { itemName: "基礎ブロック", specification: "CB120 H400", quantity: 11, unit: "個", unitPrice: 2800, costPrice: 1800 },
        ]},
        { itemName: "施工", items: [
          { itemName: "掘削・据付", quantity: 11, unit: "箇所", unitPrice: 3000, costPrice: 2000 },
          { itemName: "フェンス取付施工費", quantity: 20, unit: "m", unitPrice: 2000, costPrice: 1400 },
        ]},
      ]},
    ],
  },
  {
    name: "ブロック塀工事",
    description: "化粧ブロック塀の新設工事（基礎・鉄筋含む）",
    categoryKey: "塀・フェンス",
    level1Name: "塀・フェンス工事",
    level2Groups: [
      { itemName: "ブロック塀", children: [
        { itemName: "材料", items: [
          { itemName: "化粧ブロック", specification: "CB150 スプリット", quantity: 100, unit: "個", unitPrice: 450, costPrice: 280 },
          { itemName: "鉄筋", specification: "D10", quantity: 30, unit: "m", unitPrice: 300, costPrice: 180 },
          { itemName: "モルタル", quantity: 2, unit: "㎥", unitPrice: 15000, costPrice: 10000 },
        ]},
        { itemName: "施工", items: [
          { itemName: "基礎工事", specification: "布基礎 W300×H400", quantity: 10, unit: "m", unitPrice: 8000, costPrice: 5500 },
          { itemName: "ブロック積み施工費", quantity: 10, unit: "㎡", unitPrice: 8000, costPrice: 5500 },
        ]},
      ]},
    ],
  },
  {
    name: "カーポート1台用",
    description: "カーポート1台用の設置工事一式",
    categoryKey: "カーポート・ガレージ",
    level1Name: "カーポート工事",
    level2Groups: [
      { itemName: "カーポート設置", children: [
        { itemName: "本体", items: [
          { itemName: "カーポート本体", specification: "1台用 W2700×L5000 ポリカ屋根", quantity: 1, unit: "台", unitPrice: 185000, costPrice: 125000 },
        ]},
        { itemName: "基礎・施工", items: [
          { itemName: "基礎工事", specification: "柱脚基礎 コンクリート", quantity: 2, unit: "箇所", unitPrice: 18000, costPrice: 12000 },
          { itemName: "組立施工費", quantity: 1, unit: "式", unitPrice: 45000, costPrice: 30000 },
          { itemName: "アンカー施工", quantity: 4, unit: "箇所", unitPrice: 3000, costPrice: 2000 },
        ]},
      ]},
    ],
  },
  {
    name: "カーポート2台用",
    description: "カーポート2台用（ワイドタイプ）の設置工事一式",
    categoryKey: "カーポート・ガレージ",
    level1Name: "カーポート工事",
    level2Groups: [
      { itemName: "カーポート設置", children: [
        { itemName: "本体", items: [
          { itemName: "カーポート本体", specification: "2台用ワイド W5400×L5000 ポリカ屋根", quantity: 1, unit: "台", unitPrice: 350000, costPrice: 235000 },
        ]},
        { itemName: "基礎・施工", items: [
          { itemName: "基礎工事", specification: "柱脚基礎 コンクリート", quantity: 4, unit: "箇所", unitPrice: 18000, costPrice: 12000 },
          { itemName: "組立施工費", quantity: 1, unit: "式", unitPrice: 65000, costPrice: 45000 },
          { itemName: "アンカー施工", quantity: 6, unit: "箇所", unitPrice: 3000, costPrice: 2000 },
        ]},
      ]},
    ],
  },
  {
    name: "ウッドデッキ設置",
    description: "人工木ウッドデッキの設置工事一式",
    categoryKey: "テラス・デッキ",
    level1Name: "テラス・デッキ工事",
    level2Groups: [
      { itemName: "ウッドデッキ", children: [
        { itemName: "材料", items: [
          { itemName: "人工木デッキ材", specification: "W140×t25 ブラウン", quantity: 10, unit: "㎡", unitPrice: 12000, costPrice: 8000 },
          { itemName: "束石", specification: "コンクリート 200角", quantity: 12, unit: "個", unitPrice: 1500, costPrice: 800 },
          { itemName: "鋼製束・根太", specification: "アルミ製", quantity: 10, unit: "㎡", unitPrice: 4000, costPrice: 2800 },
          { itemName: "幕板", specification: "人工木 H200", quantity: 8, unit: "m", unitPrice: 3000, costPrice: 2000 },
          { itemName: "ステップ", specification: "1段 W900", quantity: 1, unit: "台", unitPrice: 15000, costPrice: 9000 },
        ]},
        { itemName: "施工", items: [
          { itemName: "組立施工費", quantity: 10, unit: "㎡", unitPrice: 5000, costPrice: 3500 },
        ]},
      ]},
    ],
  },
  {
    name: "テラス屋根設置",
    description: "テラス屋根の設置工事一式",
    categoryKey: "テラス・デッキ",
    level1Name: "テラス・デッキ工事",
    level2Groups: [
      { itemName: "テラス屋根", children: [
        { itemName: "本体・施工", items: [
          { itemName: "テラス屋根本体", specification: "W3600×D1500 ポリカ屋根", quantity: 1, unit: "台", unitPrice: 120000, costPrice: 80000 },
          { itemName: "柱", specification: "アルミ柱 H2500", quantity: 2, unit: "本", unitPrice: 8000, costPrice: 5000 },
          { itemName: "基礎工事", quantity: 2, unit: "箇所", unitPrice: 12000, costPrice: 8000 },
          { itemName: "組立施工費", quantity: 1, unit: "式", unitPrice: 35000, costPrice: 25000 },
        ]},
      ]},
    ],
  },
  {
    name: "インターロッキング舗装",
    description: "インターロッキングブロックによるアプローチ舗装工事",
    categoryKey: "アプローチ",
    level1Name: "アプローチ工事",
    level2Groups: [
      { itemName: "インターロッキング舗装", children: [
        { itemName: "路盤工事", items: [
          { itemName: "鋤取り", specification: "t=200", quantity: 15, unit: "㎡", unitPrice: 1500, costPrice: 1000 },
          { itemName: "砕石路盤", specification: "RC-40 t=100", quantity: 15, unit: "㎡", unitPrice: 2000, costPrice: 1300 },
        ]},
        { itemName: "舗装", items: [
          { itemName: "インターロッキングブロック", specification: "W100×L200×t60 ナチュラル", quantity: 15, unit: "㎡", unitPrice: 8000, costPrice: 5500 },
          { itemName: "目地砂", specification: "珪砂", quantity: 15, unit: "㎡", unitPrice: 500, costPrice: 300 },
          { itemName: "縁石", specification: "コンクリート縁石", quantity: 10, unit: "m", unitPrice: 2500, costPrice: 1600 },
        ]},
      ]},
    ],
  },
  {
    name: "タイル舗装アプローチ",
    description: "タイル舗装によるアプローチ工事",
    categoryKey: "アプローチ",
    level1Name: "アプローチ工事",
    level2Groups: [
      { itemName: "タイル舗装", children: [
        { itemName: "下地・舗装", items: [
          { itemName: "鋤取り・路盤工事", specification: "砕石 t=100", quantity: 10, unit: "㎡", unitPrice: 3500, costPrice: 2500 },
          { itemName: "コンクリート下地", specification: "t=100 ワイヤーメッシュ入り", quantity: 10, unit: "㎡", unitPrice: 5000, costPrice: 3500 },
          { itemName: "タイル", specification: "300角 磁器質 ノンスリップ", quantity: 10, unit: "㎡", unitPrice: 9000, costPrice: 6000 },
          { itemName: "タイル施工費", quantity: 10, unit: "㎡", unitPrice: 5000, costPrice: 3500 },
        ]},
      ]},
    ],
  },
  {
    name: "駐車場1台分",
    description: "駐車場1台分の土間コンクリート打設工事",
    categoryKey: "駐車場・土間コンクリート",
    level1Name: "駐車場工事",
    level2Groups: [
      { itemName: "土間コンクリート", children: [
        { itemName: "施工", items: [
          { itemName: "鋤取り", specification: "t=200", quantity: 15, unit: "㎡", unitPrice: 1500, costPrice: 1000 },
          { itemName: "砕石路盤", specification: "RC-40 t=100", quantity: 15, unit: "㎡", unitPrice: 2000, costPrice: 1300 },
          { itemName: "ワイヤーメッシュ", specification: "6φ-150×150", quantity: 15, unit: "㎡", unitPrice: 800, costPrice: 500 },
          { itemName: "コンクリート打設", specification: "t=120 金鏝仕上げ", quantity: 15, unit: "㎡", unitPrice: 6500, costPrice: 4500 },
        ]},
      ]},
    ],
  },
  {
    name: "駐車場2台分",
    description: "駐車場2台分の土間コンクリート打設工事（伸縮目地付き）",
    categoryKey: "駐車場・土間コンクリート",
    level1Name: "駐車場工事",
    level2Groups: [
      { itemName: "土間コンクリート", children: [
        { itemName: "施工", items: [
          { itemName: "鋤取り", specification: "t=200", quantity: 30, unit: "㎡", unitPrice: 1500, costPrice: 1000 },
          { itemName: "砕石路盤", specification: "RC-40 t=100", quantity: 30, unit: "㎡", unitPrice: 2000, costPrice: 1300 },
          { itemName: "ワイヤーメッシュ", specification: "6φ-150×150", quantity: 30, unit: "㎡", unitPrice: 800, costPrice: 500 },
          { itemName: "コンクリート打設", specification: "t=120 金鏝仕上げ", quantity: 30, unit: "㎡", unitPrice: 6500, costPrice: 4500 },
          { itemName: "伸縮目地", specification: "ケンタイト t=10", quantity: 5, unit: "m", unitPrice: 1500, costPrice: 900 },
        ]},
      ]},
    ],
  },
  {
    name: "シンボルツリー植栽",
    description: "シンボルツリー1本の植栽工事一式",
    categoryKey: "植栽・造園",
    level1Name: "植栽工事",
    level2Groups: [
      { itemName: "シンボルツリー", children: [
        { itemName: "植栽・施工", items: [
          { itemName: "シマトネリコ", specification: "H3.0 株立ち", quantity: 1, unit: "本", unitPrice: 35000, costPrice: 22000 },
          { itemName: "植穴掘削", quantity: 1, unit: "箇所", unitPrice: 8000, costPrice: 5000 },
          { itemName: "客土", specification: "植栽用土", quantity: 0.3, unit: "㎥", unitPrice: 12000, costPrice: 7000 },
          { itemName: "支柱", specification: "八ツ掛け支柱 丸太", quantity: 1, unit: "式", unitPrice: 8000, costPrice: 5000 },
          { itemName: "灌水", quantity: 1, unit: "式", unitPrice: 3000, costPrice: 1500 },
        ]},
      ]},
    ],
  },
  {
    name: "庭園造園一式",
    description: "芝張り・低木植栽・花壇を含む庭園造成工事",
    categoryKey: "植栽・造園",
    level1Name: "植栽・造園工事",
    level2Groups: [
      { itemName: "造園工事", children: [
        { itemName: "植栽・造成", items: [
          { itemName: "芝張り", specification: "高麗芝 目地張り", quantity: 20, unit: "㎡", unitPrice: 3500, costPrice: 2200 },
          { itemName: "低木植栽", specification: "サツキ H400", quantity: 10, unit: "本", unitPrice: 3000, costPrice: 1800 },
          { itemName: "花壇造成", specification: "レンガ積み H300", quantity: 5, unit: "m", unitPrice: 8000, costPrice: 5500 },
          { itemName: "砂利敷き", specification: "白玉砂利 t=50", quantity: 5, unit: "㎡", unitPrice: 4000, costPrice: 2500 },
          { itemName: "防草シート", specification: "デュポン ザバーン240", quantity: 5, unit: "㎡", unitPrice: 1500, costPrice: 800 },
        ]},
      ]},
    ],
  },
  {
    name: "ガーデンライト設置",
    description: "LED庭園灯の設置工事一式",
    categoryKey: "照明・電気",
    level1Name: "照明工事",
    level2Groups: [
      { itemName: "ガーデンライト", children: [
        { itemName: "本体・施工", items: [
          { itemName: "LED庭園灯", specification: "ポール型 H600 電球色", quantity: 4, unit: "台", unitPrice: 18000, costPrice: 11000 },
          { itemName: "配管・配線工事", specification: "PF管 VVFケーブル", quantity: 1, unit: "式", unitPrice: 35000, costPrice: 22000 },
          { itemName: "タイマースイッチ", specification: "屋外用 防雨型", quantity: 1, unit: "台", unitPrice: 8000, costPrice: 5000 },
          { itemName: "施工費", quantity: 1, unit: "式", unitPrice: 25000, costPrice: 18000 },
        ]},
      ]},
    ],
  },
  {
    name: "門灯・表札灯設置",
    description: "門灯および表札灯の設置工事",
    categoryKey: "照明・電気",
    level1Name: "照明工事",
    level2Groups: [
      { itemName: "門灯・表札灯", children: [
        { itemName: "本体・施工", items: [
          { itemName: "門灯", specification: "LED ウォールライト", quantity: 1, unit: "台", unitPrice: 22000, costPrice: 14000 },
          { itemName: "表札灯", specification: "LED 表札用スポット", quantity: 1, unit: "台", unitPrice: 15000, costPrice: 9000 },
          { itemName: "配線工事", quantity: 1, unit: "式", unitPrice: 18000, costPrice: 12000 },
        ]},
      ]},
    ],
  },
  {
    name: "立水栓設置",
    description: "屋外立水栓の設置工事一式",
    categoryKey: "排水・給水",
    level1Name: "給排水工事",
    level2Groups: [
      { itemName: "立水栓設置", children: [
        { itemName: "本体・配管", items: [
          { itemName: "立水栓本体", specification: "ステンレス混合水栓 蛇口2口", quantity: 1, unit: "台", unitPrice: 28000, costPrice: 18000 },
          { itemName: "給水管", specification: "VP20 接続配管", quantity: 1, unit: "式", unitPrice: 15000, costPrice: 10000 },
          { itemName: "排水パン", specification: "コンクリート製 400角", quantity: 1, unit: "個", unitPrice: 8000, costPrice: 5000 },
          { itemName: "排水管", specification: "VU50 排水接続", quantity: 1, unit: "式", unitPrice: 12000, costPrice: 8000 },
          { itemName: "施工費", quantity: 1, unit: "式", unitPrice: 20000, costPrice: 14000 },
        ]},
      ]},
    ],
  },
  {
    name: "排水工事一式",
    description: "U字溝・グレーチングを含む排水工事",
    categoryKey: "排水・給水",
    level1Name: "給排水工事",
    level2Groups: [
      { itemName: "排水工事", children: [
        { itemName: "施工", items: [
          { itemName: "U字溝", specification: "W150×H150 コンクリート製", quantity: 10, unit: "m", unitPrice: 5000, costPrice: 3200 },
          { itemName: "グレーチング", specification: "W150 スチール", quantity: 3, unit: "枚", unitPrice: 5000, costPrice: 3000 },
          { itemName: "接続管", specification: "VU100 集水桝接続", quantity: 2, unit: "箇所", unitPrice: 8000, costPrice: 5000 },
          { itemName: "掘削・埋戻し", quantity: 10, unit: "m", unitPrice: 3000, costPrice: 2000 },
        ]},
      ]},
    ],
  },
  {
    name: "残土処分・整地",
    description: "残土処分と敷地整地工事",
    categoryKey: "付帯工事",
    level1Name: "付帯工事",
    level2Groups: [
      { itemName: "残土処分・整地", children: [
        { itemName: "施工", items: [
          { itemName: "残土処分", specification: "4tダンプ運搬・処分", quantity: 3, unit: "台", unitPrice: 25000, costPrice: 18000 },
          { itemName: "整地", specification: "敷地内整地・転圧", quantity: 50, unit: "㎡", unitPrice: 800, costPrice: 500 },
          { itemName: "重機回送費", specification: "ミニユンボ 往復", quantity: 1, unit: "式", unitPrice: 30000, costPrice: 20000 },
        ]},
      ]},
    ],
  },
  {
    name: "既存構造物撤去",
    description: "既存ブロック塀・フェンスの撤去および残材処分",
    categoryKey: "付帯工事",
    level1Name: "付帯工事",
    level2Groups: [
      { itemName: "撤去工事", children: [
        { itemName: "撤去・処分", items: [
          { itemName: "ブロック塀撤去", specification: "CB120 H1200以下", quantity: 10, unit: "m", unitPrice: 5000, costPrice: 3500 },
          { itemName: "フェンス撤去", specification: "既存アルミフェンス", quantity: 10, unit: "m", unitPrice: 2500, costPrice: 1500 },
          { itemName: "残材処分", specification: "コンクリートガラ", quantity: 2, unit: "㎥", unitPrice: 15000, costPrice: 10000 },
          { itemName: "重機回送費", specification: "ミニユンボ 往復", quantity: 1, unit: "式", unitPrice: 30000, costPrice: 20000 },
        ]},
      ]},
    ],
  },
];

export async function POST() {
  // Only allow in development
  if (process.env.NODE_ENV === "production" && process.env.DEV_BYPASS_AUTH !== "true") {
    return NextResponse.json({ error: "本番環境では実行できません" }, { status: 403 });
  }

  try {
    // Check if system templates already exist
    const existingCount = await prisma.template.count({ where: { isSystem: true } });
    if (existingCount > 0) {
      return NextResponse.json({ message: `システムテンプレートは既に${existingCount}件あります`, count: existingCount });
    }

    // Resolve category IDs by name
    const categoryMap = new Map<string, string>();
    const categories = await prisma.category.findMany({ where: { isSystem: true } });
    for (const cat of categories) {
      categoryMap.set(cat.name, cat.id);
    }

    // Get or create system company
    let company = await prisma.company.findUnique({ where: { id: SYSTEM_COMPANY_ID } });
    if (!company) {
      company = await prisma.company.create({
        data: { id: SYSTEM_COMPANY_ID, name: "システム管理", abbreviation: "SYS" },
      });
    }

    // Get or create system user
    let user = await prisma.user.findFirst({ where: { email: "system@gaiko-mitsumori.local" } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          id: SYSTEM_USER_ID,
          companyId: SYSTEM_COMPANY_ID,
          name: "システム管理者",
          email: "system@gaiko-mitsumori.local",
          role: "admin",
        },
      });
    }

    // Create templates
    let created = 0;
    for (const tmpl of TEMPLATES) {
      const catId = categoryMap.get(tmpl.categoryKey) ?? null;

      const items: {
        level: number;
        sortOrder: number;
        itemName: string;
        specification?: string | null;
        quantity?: number | null;
        unit?: string | null;
        unitPrice?: number | null;
        costPrice?: number | null;
        categoryId?: string | null;
        parentItemId?: string | null;
      }[] = [];

      // Build flat item list with temporary parent tracking
      let sortCounter = 0;

      // Level 1
      const l1Sort = ++sortCounter;
      items.push({
        level: 1,
        sortOrder: l1Sort,
        itemName: tmpl.level1Name,
        categoryId: catId,
      });

      for (const l2Group of tmpl.level2Groups) {
        items.push({
          level: 2,
          sortOrder: ++sortCounter,
          itemName: l2Group.itemName,
          categoryId: catId,
        });

        for (const l3Group of l2Group.children) {
          items.push({
            level: 3,
            sortOrder: ++sortCounter,
            itemName: l3Group.itemName,
            categoryId: catId,
          });

          for (const item of l3Group.items) {
            items.push({
              level: 4,
              sortOrder: ++sortCounter,
              itemName: item.itemName,
              specification: item.specification ?? null,
              quantity: item.quantity,
              unit: item.unit,
              unitPrice: item.unitPrice,
              costPrice: item.costPrice,
              categoryId: catId,
            });
          }
        }
      }

      await prisma.template.create({
        data: {
          companyId: company.id,
          createdBy: user.id,
          name: tmpl.name,
          description: tmpl.description,
          isShared: true,
          isSystem: true,
          items: {
            create: items.map((item) => ({
              level: item.level,
              sortOrder: item.sortOrder,
              itemName: item.itemName,
              specification: item.specification ?? null,
              quantity: item.quantity ?? null,
              unit: item.unit ?? null,
              unitPrice: item.unitPrice ?? null,
              costPrice: item.costPrice ?? null,
              categoryId: item.categoryId ?? null,
            })),
          },
        },
      });

      created++;
    }

    return NextResponse.json({ message: `${created}件のシステムテンプレートを作成しました`, count: created });
  } catch (error) {
    console.error("Seed error:", error);
    return NextResponse.json({ error: "シード実行に失敗しました" }, { status: 500 });
  }
}
