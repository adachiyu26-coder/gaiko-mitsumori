import pg from "pg";
import "dotenv/config";

// Dynamic import to handle ESM resolution
async function createClient() {
  const { PrismaClient } = await import("../src/generated/prisma/client.js");
  const { PrismaPg } = await import("@prisma/adapter-pg");
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL! });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

let prisma: any;

// Fixed UUIDs for system data
const SYSTEM_COMPANY_ID = "00000000-0000-0000-0000-000000000001";
const SYSTEM_USER_ID = "00000000-0000-0000-0000-000000000001";

// Category IDs will be resolved at runtime from the database
let CAT_IDS: Record<string, string> = {};

// Helper to generate deterministic template IDs
function templateId(n: number): string {
  return `00000000-0000-0000-0001-${String(n).padStart(12, "0")}`;
}

// Helper to generate deterministic template item IDs
let itemCounter = 0;
function nextItemId(): string {
  itemCounter++;
  return `00000000-0000-0000-0002-${String(itemCounter).padStart(12, "0")}`;
}

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

interface TemplateDefinition {
  name: string;
  description: string;
  categoryKey: string;
  level1Name: string;
  level2Groups: Level2Group[];
}

const templates: TemplateDefinition[] = [
  // ── 1. 門柱・ポスト設置 ──
  {
    name: "門柱・ポスト設置",
    description: "門柱本体、ポスト、インターホン取付を含む門まわり一式工事",
    categoryKey: "門まわり",
    level1Name: "門まわり工事",
    level2Groups: [
      {
        itemName: "門柱工事",
        children: [
          {
            itemName: "本体",
            items: [
              { itemName: "機能門柱（アルミ）", specification: "W400×H1600", quantity: 1, unit: "本", unitPrice: 85000, costPrice: 58000 },
              { itemName: "ポスト", specification: "前入れ後出し ダイヤル錠付", quantity: 1, unit: "台", unitPrice: 35000, costPrice: 22000 },
              { itemName: "インターホン子機", specification: "ワイヤレスカメラ付", quantity: 1, unit: "台", unitPrice: 28000, costPrice: 18000 },
            ],
          },
          {
            itemName: "基礎・施工",
            items: [
              { itemName: "基礎工事", specification: "コンクリート基礎 W500×D500×H400", quantity: 1, unit: "箇所", unitPrice: 18000, costPrice: 12000 },
              { itemName: "電気配線工事", specification: "インターホン・照明用 PF管配管", quantity: 1, unit: "式", unitPrice: 25000, costPrice: 16000 },
              { itemName: "門柱取付施工費", specification: "", quantity: 1, unit: "式", unitPrice: 25000, costPrice: 18000 },
            ],
          },
        ],
      },
    ],
  },
  // ── 2. 門扉設置 ──
  {
    name: "門扉設置",
    description: "門扉本体（片開き）の設置および門柱・基礎工事一式",
    categoryKey: "門まわり",
    level1Name: "門まわり工事",
    level2Groups: [
      {
        itemName: "門扉工事",
        children: [
          {
            itemName: "本体・金物",
            items: [
              { itemName: "アルミ門扉（片開き）", specification: "W700×H1200 鋳物調デザイン", quantity: 1, unit: "枚", unitPrice: 68000, costPrice: 45000 },
              { itemName: "門柱（アルミ）", specification: "H1400", quantity: 2, unit: "本", unitPrice: 15000, costPrice: 9500 },
              { itemName: "ヒンジ・ラッチ金物", specification: "ステンレス製", quantity: 1, unit: "組", unitPrice: 8500, costPrice: 5200 },
            ],
          },
          {
            itemName: "基礎・施工",
            items: [
              { itemName: "柱基礎工事", specification: "コンクリート基礎 W300×D300×H450", quantity: 2, unit: "箇所", unitPrice: 12000, costPrice: 8000 },
              { itemName: "門扉取付施工費", specification: "", quantity: 1, unit: "式", unitPrice: 28000, costPrice: 18000 },
            ],
          },
        ],
      },
    ],
  },
  // ── 3. アルミフェンス工事 ──
  {
    name: "アルミフェンス工事",
    description: "アルミフェンス（H800）の設置工事一式",
    categoryKey: "塀・フェンス",
    level1Name: "塀・フェンス工事",
    level2Groups: [
      {
        itemName: "フェンス工事",
        children: [
          {
            itemName: "材料",
            items: [
              { itemName: "アルミフェンス本体", specification: "H800 縦格子タイプ W2000", quantity: 10, unit: "m", unitPrice: 8500, costPrice: 6000 },
              { itemName: "フェンス柱", specification: "アルミ T-8 自由柱", quantity: 6, unit: "本", unitPrice: 3200, costPrice: 2000 },
              { itemName: "コーナー部材", specification: "", quantity: 2, unit: "個", unitPrice: 1500, costPrice: 900 },
            ],
          },
          {
            itemName: "基礎・施工",
            items: [
              { itemName: "基礎ブロック", specification: "CB120 2段積み", quantity: 10, unit: "m", unitPrice: 6500, costPrice: 4200 },
              { itemName: "柱建て込み施工費", specification: "", quantity: 6, unit: "本", unitPrice: 2500, costPrice: 1800 },
              { itemName: "フェンス取付施工費", specification: "", quantity: 10, unit: "m", unitPrice: 1500, costPrice: 1000 },
            ],
          },
        ],
      },
    ],
  },
  // ── 4. ブロック塀工事 ──
  {
    name: "ブロック塀工事",
    description: "コンクリートブロック塀（CB150）の新設工事一式",
    categoryKey: "塀・フェンス",
    level1Name: "塀・フェンス工事",
    level2Groups: [
      {
        itemName: "ブロック塀工事",
        children: [
          {
            itemName: "材料",
            items: [
              { itemName: "CB150ブロック", specification: "150×190×390 基本型", quantity: 150, unit: "個", unitPrice: 350, costPrice: 220 },
              { itemName: "鉄筋", specification: "D10 縦横配筋", quantity: 80, unit: "m", unitPrice: 250, costPrice: 160 },
              { itemName: "モルタル", specification: "目地・充填用", quantity: 1.5, unit: "㎥", unitPrice: 15000, costPrice: 10000 },
              { itemName: "天端笠木ブロック", specification: "W150", quantity: 10, unit: "m", unitPrice: 1200, costPrice: 750 },
            ],
          },
          {
            itemName: "基礎・施工",
            items: [
              { itemName: "基礎工事", specification: "布基礎 W350×H400", quantity: 10, unit: "m", unitPrice: 8500, costPrice: 5800 },
              { itemName: "ブロック積み施工費", specification: "5段積み", quantity: 10, unit: "m", unitPrice: 12000, costPrice: 8500 },
              { itemName: "人工（ブロック工）", specification: "", quantity: 3, unit: "人工", unitPrice: 25000, costPrice: 18000 },
            ],
          },
        ],
      },
    ],
  },
  // ── 5. カーポート1台用 ──
  {
    name: "カーポート1台用",
    description: "1台用カーポートの設置および土間コンクリート工事一式",
    categoryKey: "カーポート・ガレージ",
    level1Name: "カーポート工事",
    level2Groups: [
      {
        itemName: "カーポート設置",
        children: [
          {
            itemName: "本体",
            items: [
              { itemName: "カーポート本体（1台用）", specification: "W2700×L5000 ポリカ屋根 片支持", quantity: 1, unit: "台", unitPrice: 185000, costPrice: 125000 },
              { itemName: "サポート柱", specification: "着脱式", quantity: 1, unit: "本", unitPrice: 15000, costPrice: 9000 },
            ],
          },
          {
            itemName: "基礎・土間",
            items: [
              { itemName: "柱基礎工事", specification: "コンクリート基礎 W500×D500×H600", quantity: 2, unit: "箇所", unitPrice: 18000, costPrice: 12000 },
              { itemName: "土間コンクリート打設", specification: "t=100 ワイヤーメッシュ入り", quantity: 13.5, unit: "㎡", unitPrice: 6500, costPrice: 4500 },
              { itemName: "アンカーボルト", specification: "M12 オールアンカー", quantity: 8, unit: "本", unitPrice: 800, costPrice: 450 },
              { itemName: "組立施工費", specification: "", quantity: 1, unit: "式", unitPrice: 45000, costPrice: 30000 },
            ],
          },
        ],
      },
    ],
  },
  // ── 6. カーポート2台用 ──
  {
    name: "カーポート2台用",
    description: "2台用ワイドカーポートの設置および土間コンクリート工事一式",
    categoryKey: "カーポート・ガレージ",
    level1Name: "カーポート工事",
    level2Groups: [
      {
        itemName: "カーポート設置",
        children: [
          {
            itemName: "本体",
            items: [
              { itemName: "カーポート本体（2台用ワイド）", specification: "W5400×L5000 ポリカ屋根 両支持", quantity: 1, unit: "台", unitPrice: 380000, costPrice: 260000 },
              { itemName: "サポート柱", specification: "着脱式", quantity: 2, unit: "本", unitPrice: 15000, costPrice: 9000 },
            ],
          },
          {
            itemName: "基礎・土間",
            items: [
              { itemName: "柱基礎工事", specification: "コンクリート基礎 W500×D500×H600", quantity: 4, unit: "箇所", unitPrice: 18000, costPrice: 12000 },
              { itemName: "土間コンクリート打設", specification: "t=100 ワイヤーメッシュ入り", quantity: 27, unit: "㎡", unitPrice: 6500, costPrice: 4500 },
              { itemName: "アンカーボルト", specification: "M12 オールアンカー", quantity: 16, unit: "本", unitPrice: 800, costPrice: 450 },
              { itemName: "伸縮目地", specification: "W20 エラスタイト", quantity: 5, unit: "m", unitPrice: 1200, costPrice: 700 },
              { itemName: "組立施工費", specification: "", quantity: 1, unit: "式", unitPrice: 65000, costPrice: 45000 },
            ],
          },
        ],
      },
    ],
  },
  // ── 7. ウッドデッキ設置 ──
  {
    name: "ウッドデッキ設置",
    description: "人工木ウッドデッキの設置工事一式（約3m×2.5m）",
    categoryKey: "テラス・デッキ",
    level1Name: "テラス・デッキ工事",
    level2Groups: [
      {
        itemName: "ウッドデッキ工事",
        children: [
          {
            itemName: "材料",
            items: [
              { itemName: "デッキ材（人工木）", specification: "W145×t25 中空タイプ", quantity: 7.5, unit: "㎡", unitPrice: 12000, costPrice: 8000 },
              { itemName: "束石", specification: "200×200×200 コンクリート製", quantity: 9, unit: "個", unitPrice: 1200, costPrice: 700 },
              { itemName: "根太・大引き", specification: "アルミ根太 40×60", quantity: 20, unit: "m", unitPrice: 1800, costPrice: 1100 },
              { itemName: "幕板", specification: "人工木 H200", quantity: 7, unit: "m", unitPrice: 3500, costPrice: 2200 },
              { itemName: "ステップ", specification: "1段 W900", quantity: 1, unit: "台", unitPrice: 18000, costPrice: 11000 },
            ],
          },
          {
            itemName: "施工",
            items: [
              { itemName: "組立施工費", specification: "", quantity: 7.5, unit: "㎡", unitPrice: 5000, costPrice: 3500 },
              { itemName: "人工（大工）", specification: "", quantity: 2, unit: "人工", unitPrice: 25000, costPrice: 18000 },
            ],
          },
        ],
      },
    ],
  },
  // ── 8. テラス屋根設置 ──
  {
    name: "テラス屋根設置",
    description: "テラス屋根（間口3m×出幅1.5m）の設置工事一式",
    categoryKey: "テラス・デッキ",
    level1Name: "テラス・デッキ工事",
    level2Groups: [
      {
        itemName: "テラス屋根工事",
        children: [
          {
            itemName: "本体",
            items: [
              { itemName: "テラス屋根本体", specification: "W3000×D1500 ポリカ屋根 壁付タイプ", quantity: 1, unit: "台", unitPrice: 128000, costPrice: 85000 },
              { itemName: "柱", specification: "アルミ H2500 標準柱", quantity: 2, unit: "本", unitPrice: 12000, costPrice: 7500 },
            ],
          },
          {
            itemName: "基礎・施工",
            items: [
              { itemName: "柱基礎工事", specification: "コンクリート基礎 W400×D400×H500", quantity: 2, unit: "箇所", unitPrice: 15000, costPrice: 10000 },
              { itemName: "壁面取付工事", specification: "外壁ビス止め コーキング処理", quantity: 1, unit: "式", unitPrice: 18000, costPrice: 12000 },
              { itemName: "組立施工費", specification: "", quantity: 1, unit: "式", unitPrice: 35000, costPrice: 25000 },
            ],
          },
        ],
      },
    ],
  },
  // ── 9. インターロッキング舗装 ──
  {
    name: "インターロッキング舗装",
    description: "インターロッキングブロック舗装によるアプローチ工事一式（約10㎡）",
    categoryKey: "アプローチ",
    level1Name: "アプローチ工事",
    level2Groups: [
      {
        itemName: "インターロッキング舗装",
        children: [
          {
            itemName: "路盤工事",
            items: [
              { itemName: "路盤掘削", specification: "掘削深さ250mm", quantity: 10, unit: "㎡", unitPrice: 2500, costPrice: 1800 },
              { itemName: "砕石敷き", specification: "RC-40 t=150", quantity: 10, unit: "㎡", unitPrice: 2800, costPrice: 1900 },
              { itemName: "転圧", specification: "プレートコンパクター", quantity: 10, unit: "㎡", unitPrice: 800, costPrice: 500 },
            ],
          },
          {
            itemName: "舗装工事",
            items: [
              { itemName: "敷砂", specification: "t=30 砂敷き均し", quantity: 10, unit: "㎡", unitPrice: 1200, costPrice: 800 },
              { itemName: "インターロッキングブロック", specification: "W100×L200×t60 ヘリンボーン敷き", quantity: 10, unit: "㎡", unitPrice: 7500, costPrice: 4800 },
              { itemName: "目地砂", specification: "珪砂充填", quantity: 10, unit: "㎡", unitPrice: 500, costPrice: 300 },
              { itemName: "縁石", specification: "コンクリート縁石", quantity: 8, unit: "m", unitPrice: 2200, costPrice: 1400 },
            ],
          },
        ],
      },
    ],
  },
  // ── 10. タイル舗装アプローチ ──
  {
    name: "タイル舗装アプローチ",
    description: "タイル仕上げアプローチ工事一式（約8㎡）",
    categoryKey: "アプローチ",
    level1Name: "アプローチ工事",
    level2Groups: [
      {
        itemName: "タイル舗装工事",
        children: [
          {
            itemName: "下地工事",
            items: [
              { itemName: "路盤掘削", specification: "掘削深さ300mm", quantity: 8, unit: "㎡", unitPrice: 2500, costPrice: 1800 },
              { itemName: "砕石敷き", specification: "RC-40 t=100", quantity: 8, unit: "㎡", unitPrice: 2800, costPrice: 1900 },
              { itemName: "コンクリート下地", specification: "t=100 ワイヤーメッシュ入り", quantity: 8, unit: "㎡", unitPrice: 5500, costPrice: 3800 },
            ],
          },
          {
            itemName: "タイル仕上げ",
            items: [
              { itemName: "磁器質タイル", specification: "300角 外床用 滑り止め付", quantity: 8, unit: "㎡", unitPrice: 9500, costPrice: 6200 },
              { itemName: "タイル施工費", specification: "モルタル圧着張り", quantity: 8, unit: "㎡", unitPrice: 6000, costPrice: 4200 },
              { itemName: "目地仕上げ", specification: "目地材充填", quantity: 8, unit: "㎡", unitPrice: 800, costPrice: 500 },
            ],
          },
        ],
      },
    ],
  },
  // ── 11. 駐車場1台分 ──
  {
    name: "駐車場1台分",
    description: "駐車場1台分（約15㎡）の土間コンクリート工事一式",
    categoryKey: "駐車場・土間コンクリート",
    level1Name: "駐車場・土間コンクリート工事",
    level2Groups: [
      {
        itemName: "土間コンクリート工事",
        children: [
          {
            itemName: "路盤工事",
            items: [
              { itemName: "鋤取り", specification: "掘削深さ300mm", quantity: 15, unit: "㎡", unitPrice: 2000, costPrice: 1400 },
              { itemName: "砕石敷き", specification: "RC-40 t=100", quantity: 15, unit: "㎡", unitPrice: 2800, costPrice: 1900 },
              { itemName: "転圧", specification: "プレートコンパクター", quantity: 15, unit: "㎡", unitPrice: 800, costPrice: 500 },
            ],
          },
          {
            itemName: "コンクリート打設",
            items: [
              { itemName: "ワイヤーメッシュ", specification: "6φ-150×150", quantity: 15, unit: "㎡", unitPrice: 900, costPrice: 550 },
              { itemName: "コンクリート打設", specification: "t=120 金鏝仕上げ", quantity: 15, unit: "㎡", unitPrice: 6500, costPrice: 4500 },
              { itemName: "型枠", specification: "鋼製型枠", quantity: 16, unit: "m", unitPrice: 1500, costPrice: 1000 },
            ],
          },
        ],
      },
    ],
  },
  // ── 12. 駐車場2台分 ──
  {
    name: "駐車場2台分",
    description: "駐車場2台分（約30㎡）の土間コンクリート工事一式",
    categoryKey: "駐車場・土間コンクリート",
    level1Name: "駐車場・土間コンクリート工事",
    level2Groups: [
      {
        itemName: "土間コンクリート工事",
        children: [
          {
            itemName: "路盤工事",
            items: [
              { itemName: "鋤取り", specification: "掘削深さ300mm", quantity: 30, unit: "㎡", unitPrice: 2000, costPrice: 1400 },
              { itemName: "砕石敷き", specification: "RC-40 t=100", quantity: 30, unit: "㎡", unitPrice: 2800, costPrice: 1900 },
              { itemName: "転圧", specification: "プレートコンパクター", quantity: 30, unit: "㎡", unitPrice: 800, costPrice: 500 },
            ],
          },
          {
            itemName: "コンクリート打設",
            items: [
              { itemName: "ワイヤーメッシュ", specification: "6φ-150×150", quantity: 30, unit: "㎡", unitPrice: 900, costPrice: 550 },
              { itemName: "コンクリート打設", specification: "t=120 金鏝仕上げ", quantity: 30, unit: "㎡", unitPrice: 6500, costPrice: 4500 },
              { itemName: "型枠", specification: "鋼製型枠", quantity: 24, unit: "m", unitPrice: 1500, costPrice: 1000 },
              { itemName: "伸縮目地", specification: "W20 エラスタイト", quantity: 5, unit: "m", unitPrice: 1200, costPrice: 700 },
            ],
          },
        ],
      },
    ],
  },
  // ── 13. シンボルツリー植栽 ──
  {
    name: "シンボルツリー植栽",
    description: "シンボルツリー（シマトネリコH3.0）の植栽工事一式",
    categoryKey: "植栽・造園",
    level1Name: "植栽・造園工事",
    level2Groups: [
      {
        itemName: "シンボルツリー植栽",
        children: [
          {
            itemName: "植栽材料",
            items: [
              { itemName: "シマトネリコ", specification: "H3.0 C0.3 株立ち", quantity: 1, unit: "本", unitPrice: 35000, costPrice: 22000 },
              { itemName: "客土", specification: "黒土", quantity: 0.5, unit: "㎥", unitPrice: 8000, costPrice: 5000 },
              { itemName: "支柱", specification: "二脚鳥居型 丸太φ75", quantity: 1, unit: "組", unitPrice: 8500, costPrice: 5500 },
              { itemName: "バーク堆肥", specification: "マルチング用", quantity: 2, unit: "袋", unitPrice: 800, costPrice: 450 },
            ],
          },
          {
            itemName: "施工",
            items: [
              { itemName: "植穴掘削", specification: "φ800×H600", quantity: 1, unit: "箇所", unitPrice: 8000, costPrice: 5500 },
              { itemName: "植付・灌水", specification: "水極め", quantity: 1, unit: "本", unitPrice: 5000, costPrice: 3500 },
              { itemName: "人工（造園工）", specification: "", quantity: 1, unit: "人工", unitPrice: 25000, costPrice: 18000 },
            ],
          },
        ],
      },
    ],
  },
  // ── 14. 庭園造園一式 ──
  {
    name: "庭園造園一式",
    description: "芝張り・低木植栽・花壇造成・砂利敷きを含む庭園造園工事一式",
    categoryKey: "植栽・造園",
    level1Name: "植栽・造園工事",
    level2Groups: [
      {
        itemName: "庭園造園工事",
        children: [
          {
            itemName: "芝張り",
            items: [
              { itemName: "高麗芝", specification: "張芝 目地張り", quantity: 20, unit: "㎡", unitPrice: 3500, costPrice: 2200 },
              { itemName: "床土", specification: "山砂 t=50", quantity: 20, unit: "㎡", unitPrice: 1500, costPrice: 900 },
            ],
          },
          {
            itemName: "植栽・花壇",
            items: [
              { itemName: "低木植栽", specification: "オタフクナンテン H0.3", quantity: 15, unit: "本", unitPrice: 2500, costPrice: 1500 },
              { itemName: "花壇造成", specification: "レンガ花壇 W2000×D600×H300", quantity: 1, unit: "箇所", unitPrice: 35000, costPrice: 22000 },
              { itemName: "花壇用土", specification: "培養土", quantity: 0.3, unit: "㎥", unitPrice: 8000, costPrice: 5000 },
            ],
          },
          {
            itemName: "砂利敷き",
            items: [
              { itemName: "防草シート", specification: "ザバーン240G", quantity: 10, unit: "㎡", unitPrice: 1800, costPrice: 1100 },
              { itemName: "化粧砂利", specification: "白玉砂利 20-30mm t=50", quantity: 10, unit: "㎡", unitPrice: 3500, costPrice: 2200 },
              { itemName: "人工（造園工）", specification: "", quantity: 3, unit: "人工", unitPrice: 25000, costPrice: 18000 },
            ],
          },
        ],
      },
    ],
  },
  // ── 15. ガーデンライト設置 ──
  {
    name: "ガーデンライト設置",
    description: "LED庭園灯3基の設置および配線工事一式",
    categoryKey: "照明・電気",
    level1Name: "照明・電気工事",
    level2Groups: [
      {
        itemName: "ガーデンライト工事",
        children: [
          {
            itemName: "照明器具",
            items: [
              { itemName: "LED庭園灯（ポール型）", specification: "H600 電球色 防雨型", quantity: 3, unit: "台", unitPrice: 25000, costPrice: 16000 },
              { itemName: "LEDスポットライト", specification: "樹木用アッパーライト 防雨型", quantity: 2, unit: "台", unitPrice: 15000, costPrice: 9500 },
            ],
          },
          {
            itemName: "配線・施工",
            items: [
              { itemName: "屋外用電線", specification: "VVF2.0-2C PF管入り", quantity: 25, unit: "m", unitPrice: 1200, costPrice: 750 },
              { itemName: "スイッチ・タイマー", specification: "タイマー付屋外スイッチ", quantity: 1, unit: "台", unitPrice: 12000, costPrice: 7500 },
              { itemName: "配管掘削・埋設", specification: "GL-300", quantity: 25, unit: "m", unitPrice: 1500, costPrice: 1000 },
              { itemName: "電気工事施工費", specification: "結線・調整含む", quantity: 1, unit: "式", unitPrice: 35000, costPrice: 25000 },
            ],
          },
        ],
      },
    ],
  },
  // ── 16. 門灯・表札灯設置 ──
  {
    name: "門灯・表札灯設置",
    description: "門灯および表札灯の設置工事一式",
    categoryKey: "照明・電気",
    level1Name: "照明・電気工事",
    level2Groups: [
      {
        itemName: "門灯・表札灯工事",
        children: [
          {
            itemName: "照明器具",
            items: [
              { itemName: "門灯", specification: "LED壁付型 電球色 防雨型", quantity: 1, unit: "台", unitPrice: 22000, costPrice: 14000 },
              { itemName: "表札灯", specification: "LED表札用スポット 防雨型", quantity: 1, unit: "台", unitPrice: 15000, costPrice: 9500 },
              { itemName: "表札", specification: "ステンレスヘアライン W200×H80", quantity: 1, unit: "枚", unitPrice: 18000, costPrice: 11000 },
            ],
          },
          {
            itemName: "配線・施工",
            items: [
              { itemName: "配線工事", specification: "VVF1.6-2C 門柱内配線", quantity: 1, unit: "式", unitPrice: 18000, costPrice: 12000 },
              { itemName: "取付施工費", specification: "器具取付・結線・調整", quantity: 1, unit: "式", unitPrice: 20000, costPrice: 14000 },
            ],
          },
        ],
      },
    ],
  },
  // ── 17. 立水栓設置 ──
  {
    name: "立水栓設置",
    description: "庭用立水栓の設置および給排水管工事一式",
    categoryKey: "排水・給水",
    level1Name: "排水・給水工事",
    level2Groups: [
      {
        itemName: "立水栓工事",
        children: [
          {
            itemName: "本体・材料",
            items: [
              { itemName: "立水栓本体", specification: "陶器製 H800 二口タイプ", quantity: 1, unit: "台", unitPrice: 28000, costPrice: 18000 },
              { itemName: "水受けパン", specification: "陶器製 W400×D350", quantity: 1, unit: "台", unitPrice: 15000, costPrice: 9500 },
              { itemName: "蛇口", specification: "横水栓 十字ハンドル", quantity: 2, unit: "個", unitPrice: 5000, costPrice: 3000 },
            ],
          },
          {
            itemName: "給排水・施工",
            items: [
              { itemName: "給水管", specification: "HIVP20 分岐・接続", quantity: 5, unit: "m", unitPrice: 3500, costPrice: 2200 },
              { itemName: "排水管", specification: "VU50 排水接続", quantity: 3, unit: "m", unitPrice: 3000, costPrice: 1900 },
              { itemName: "掘削・埋戻し", specification: "W300×D600", quantity: 5, unit: "m", unitPrice: 3500, costPrice: 2400 },
              { itemName: "給排水工事施工費", specification: "", quantity: 1, unit: "式", unitPrice: 30000, costPrice: 20000 },
            ],
          },
        ],
      },
    ],
  },
  // ── 18. 排水工事一式 ──
  {
    name: "排水工事一式",
    description: "U字溝・グレーチングによる排水設備工事一式",
    categoryKey: "排水・給水",
    level1Name: "排水・給水工事",
    level2Groups: [
      {
        itemName: "排水設備工事",
        children: [
          {
            itemName: "材料",
            items: [
              { itemName: "U字溝", specification: "W150×H150 コンクリート製", quantity: 8, unit: "m", unitPrice: 4500, costPrice: 2800 },
              { itemName: "グレーチング", specification: "W150 スチール製 受枠付", quantity: 8, unit: "m", unitPrice: 6500, costPrice: 4200 },
              { itemName: "集水桝", specification: "300×300 コンクリート製", quantity: 2, unit: "箇所", unitPrice: 15000, costPrice: 9500 },
              { itemName: "接続管", specification: "VU100 排水本管接続", quantity: 3, unit: "m", unitPrice: 4000, costPrice: 2500 },
            ],
          },
          {
            itemName: "施工",
            items: [
              { itemName: "掘削・床付け", specification: "W400×D400", quantity: 8, unit: "m", unitPrice: 3500, costPrice: 2400 },
              { itemName: "基礎砕石", specification: "RC-40 t=100", quantity: 8, unit: "m", unitPrice: 1200, costPrice: 750 },
              { itemName: "据付施工費", specification: "U字溝据付・目地処理", quantity: 8, unit: "m", unitPrice: 3000, costPrice: 2000 },
              { itemName: "埋戻し・転圧", specification: "", quantity: 8, unit: "m", unitPrice: 1500, costPrice: 1000 },
            ],
          },
        ],
      },
    ],
  },
  // ── 19. 残土処分・整地 ──
  {
    name: "残土処分・整地",
    description: "残土処分（4tダンプ）および整地・転圧工事一式",
    categoryKey: "付帯工事",
    level1Name: "付帯工事",
    level2Groups: [
      {
        itemName: "残土処分・整地",
        children: [
          {
            itemName: "残土処分",
            items: [
              { itemName: "残土積込み", specification: "バックホウ0.1㎥級", quantity: 5, unit: "㎥", unitPrice: 3500, costPrice: 2400 },
              { itemName: "残土運搬処分", specification: "4tダンプ 処分場搬入", quantity: 2, unit: "台", unitPrice: 28000, costPrice: 19000 },
              { itemName: "処分費", specification: "建設発生土", quantity: 5, unit: "㎥", unitPrice: 5000, costPrice: 3500 },
            ],
          },
          {
            itemName: "整地・転圧",
            items: [
              { itemName: "整地", specification: "不陸整正 GL±0", quantity: 50, unit: "㎡", unitPrice: 800, costPrice: 550 },
              { itemName: "転圧", specification: "プレートコンパクター", quantity: 50, unit: "㎡", unitPrice: 500, costPrice: 350 },
              { itemName: "重機回送費", specification: "バックホウ0.1㎥級 往復", quantity: 1, unit: "回", unitPrice: 35000, costPrice: 25000 },
            ],
          },
        ],
      },
    ],
  },
  // ── 20. 既存構造物撤去 ──
  {
    name: "既存構造物撤去",
    description: "既存ブロック塀・フェンスの撤去および残材処分工事一式",
    categoryKey: "付帯工事",
    level1Name: "付帯工事",
    level2Groups: [
      {
        itemName: "撤去工事",
        children: [
          {
            itemName: "撤去",
            items: [
              { itemName: "ブロック塀撤去", specification: "CB120 5段 基礎共", quantity: 10, unit: "m", unitPrice: 8000, costPrice: 5500 },
              { itemName: "フェンス撤去", specification: "アルミフェンス H800 柱共", quantity: 10, unit: "m", unitPrice: 3500, costPrice: 2400 },
              { itemName: "コンクリート基礎撤去", specification: "ハンドブレーカー", quantity: 2, unit: "㎥", unitPrice: 18000, costPrice: 12000 },
            ],
          },
          {
            itemName: "処分・回送",
            items: [
              { itemName: "残材処分（コンクリートガラ）", specification: "4tダンプ 中間処理場搬入", quantity: 3, unit: "㎥", unitPrice: 12000, costPrice: 8000 },
              { itemName: "残材処分（金属くず）", specification: "アルミ・スチール", quantity: 0.5, unit: "㎥", unitPrice: 8000, costPrice: 5000 },
              { itemName: "重機回送費", specification: "バックホウ0.1㎥級 往復", quantity: 1, unit: "回", unitPrice: 35000, costPrice: 25000 },
              { itemName: "人工（土工）", specification: "", quantity: 2, unit: "人工", unitPrice: 22000, costPrice: 16000 },
            ],
          },
        ],
      },
    ],
  },
];

async function main() {
  prisma = await createClient();

  // ── 1. Create system categories ──
  const categories = [
    "門まわり",
    "塀・フェンス",
    "カーポート・ガレージ",
    "テラス・デッキ",
    "アプローチ",
    "駐車場・土間コンクリート",
    "植栽・造園",
    "照明・電気",
    "排水・給水",
    "付帯工事",
  ];

  for (let i = 0; i < categories.length; i++) {
    // Find existing category by name, or create new one
    let cat = await prisma.category.findFirst({
      where: { name: categories[i], isSystem: true },
    });
    if (!cat) {
      cat = await prisma.category.create({
        data: {
          name: categories[i],
          sortOrder: i + 1,
          isSystem: true,
        },
      });
    }
    CAT_IDS[categories[i]] = cat.id;
  }

  console.log("System categories created");

  // ── 2. Create system company and user for template ownership ──
  await prisma.company.upsert({
    where: { id: SYSTEM_COMPANY_ID },
    update: {},
    create: {
      id: SYSTEM_COMPANY_ID,
      name: "システム管理",
      abbreviation: "SYS",
    },
  });

  await prisma.user.upsert({
    where: { email: "system@gaiko-mitsumori.local" },
    update: {},
    create: {
      id: SYSTEM_USER_ID,
      companyId: SYSTEM_COMPANY_ID,
      name: "システム管理者",
      email: "system@gaiko-mitsumori.local",
      role: "admin",
    },
  });

  console.log("System company and user created");

  // ── 3. Check if system templates already exist ──
  const existingCount = await prisma.template.count({
    where: { isSystem: true },
  });

  if (existingCount > 0) {
    console.log(
      `System templates already exist (${existingCount} found). Skipping template creation.`
    );
    console.log("Seed data created successfully");
    return;
  }

  // ── 4. Create 20 system templates with hierarchical items ──
  for (let t = 0; t < templates.length; t++) {
    const tmpl = templates[t];
    const tId = templateId(t + 1);
    const catId = CAT_IDS[tmpl.categoryKey];

    await prisma.template.create({
      data: {
        id: tId,
        companyId: SYSTEM_COMPANY_ID,
        createdBy: SYSTEM_USER_ID,
        name: tmpl.name,
        description: tmpl.description,
        isShared: true,
        isSystem: true,
      },
    });

    // Level 1: 工種
    const l1Id = nextItemId();
    await prisma.templateItem.create({
      data: {
        id: l1Id,
        templateId: tId,
        level: 1,
        sortOrder: 1,
        itemName: tmpl.level1Name,
        categoryId: catId,
      },
    });

    let l2Sort = 0;
    for (const l2Group of tmpl.level2Groups) {
      l2Sort++;
      // Level 2: 大項目
      const l2Id = nextItemId();
      await prisma.templateItem.create({
        data: {
          id: l2Id,
          templateId: tId,
          parentItemId: l1Id,
          level: 2,
          sortOrder: l2Sort,
          itemName: l2Group.itemName,
          categoryId: catId,
        },
      });

      let l3Sort = 0;
      for (const l3Group of l2Group.children) {
        l3Sort++;
        // Level 3: 中項目
        const l3Id = nextItemId();
        await prisma.templateItem.create({
          data: {
            id: l3Id,
            templateId: tId,
            parentItemId: l2Id,
            level: 3,
            sortOrder: l3Sort,
            itemName: l3Group.itemName,
            categoryId: catId,
          },
        });

        let l4Sort = 0;
        for (const item of l3Group.items) {
          l4Sort++;
          // Level 4: 品名（明細）
          const l4Id = nextItemId();
          await prisma.templateItem.create({
            data: {
              id: l4Id,
              templateId: tId,
              parentItemId: l3Id,
              level: 4,
              sortOrder: l4Sort,
              itemName: item.itemName,
              specification: item.specification || null,
              quantity: item.quantity,
              unit: item.unit,
              unitPrice: item.unitPrice,
              costPrice: item.costPrice,
              categoryId: catId,
            },
          });
        }
      }
    }

    console.log(`Template ${t + 1}/20 created: ${tmpl.name}`);
  }

  console.log("Seed data created successfully");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
