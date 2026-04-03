import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FileText, Users, Database, FolderOpen, BarChart3, Share2,
  Sparkles, ShoppingCart, Hammer, Shield, Bell, BookOpen,
  ChevronRight, HelpCircle, Lightbulb, AlertTriangle,
} from "lucide-react";

function Section({ id, icon: Icon, title, children }: { id: string; icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <Card id={id}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Icon className="h-5 w-5 text-brand" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="prose prose-sm max-w-none space-y-4 text-sm">
        {children}
      </CardContent>
    </Card>
  );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand text-white text-xs font-bold shrink-0 mt-0.5">{n}</div>
      <div className="flex-1">{children}</div>
    </div>
  );
}

function FAQ({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <details className="group border rounded-lg">
      <summary className="flex items-center gap-2 cursor-pointer px-4 py-3 text-sm font-medium hover:bg-muted/50">
        <ChevronRight className="h-4 w-4 transition-transform group-open:rotate-90 shrink-0 text-muted-foreground" />
        {q}
      </summary>
      <div className="px-4 pb-3 pt-0 text-sm text-muted-foreground">
        {children}
      </div>
    </details>
  );
}

export default function HelpPage() {
  const sections = [
    { id: "getting-started", label: "はじめに", icon: Lightbulb },
    { id: "estimates", label: "見積の作成", icon: FileText },
    { id: "share", label: "顧客への共有", icon: Share2 },
    { id: "documents", label: "帳票管理", icon: ShoppingCart },
    { id: "projects", label: "工程管理", icon: Hammer },
    { id: "ai", label: "AI機能", icon: Sparkles },
    { id: "roles", label: "ロールと権限", icon: Shield },
    { id: "integrations", label: "外部連携", icon: Bell },
    { id: "faq", label: "よくある質問", icon: HelpCircle },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">ヘルプ・操作ガイド</h1>
        <p className="text-sm text-muted-foreground mt-1">システムの使い方やよくある質問をまとめています</p>
      </div>

      {/* Table of contents */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-2 md:grid-cols-3">
            {sections.map((s) => (
              <a key={s.id} href={`#${s.id}`} className="flex items-center gap-2 rounded-lg border p-3 text-sm hover:bg-muted/50 transition-colors">
                <s.icon className="h-4 w-4 text-brand shrink-0" />
                <span>{s.label}</span>
                <ChevronRight className="h-3 w-3 ml-auto text-muted-foreground" />
              </a>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── はじめに ── */}
      <Section id="getting-started" icon={Lightbulb} title="はじめに">
        <p>外構見積もりシステムへようこそ。初めてお使いの方は、以下の手順でセットアップしてください。</p>

        <h4 className="font-semibold mt-4">初期セットアップ</h4>
        <div className="space-y-3">
          <Step n={1}>
            <p><strong>会社情報を設定</strong>：サイドバーの「設定」→「会社設定」から、会社名・住所・ロゴなどを入力します。ここで設定した情報が見積書PDFに表示されます。</p>
          </Step>
          <Step n={2}>
            <p><strong>デフォルト設定を確認</strong>：消費税率（デフォルト10%）、諸経費率、見積有効期限日数を確認・変更します。</p>
          </Step>
          <Step n={3}>
            <p><strong>単価マスタを登録</strong>：よく使う品名と単価を「単価マスタ」に登録しておくと、見積作成が効率化されます。CSVインポートで一括登録も可能です。</p>
          </Step>
          <Step n={4}>
            <p><strong>顧客を登録</strong>：「顧客管理」から取引先を登録します。見積作成時に顧客を紐付けできます。</p>
          </Step>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4 flex items-start gap-2">
          <Lightbulb className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
          <p className="text-blue-800">システムテンプレート（20種）がプリセットされています。新規見積作成時に「テンプレートから作成」ボタンから選択できます。</p>
        </div>
      </Section>

      {/* ── 見積の作成 ── */}
      <Section id="estimates" icon={FileText} title="見積の作成方法">
        <p>見積の作成方法は3つあります。</p>

        <h4 className="font-semibold">方法1：手動で作成</h4>
        <div className="space-y-2">
          <Step n={1}><p>「見積一覧」→「新規見積」をクリック</p></Step>
          <Step n={2}><p>件名・顧客・現場住所などの基本情報を入力</p></Step>
          <Step n={3}><p>「+ 工種を追加」ボタンで明細を追加。4階層（工種→大項目→中項目→品名）で構成されます</p></Step>
          <Step n={4}><p>品名（レベル4）に数量・単位・単価を入力すると金額が自動計算されます</p></Step>
          <Step n={5}><p>諸経費率・値引き・消費税率を設定し、「保存」をクリック</p></Step>
        </div>

        <h4 className="font-semibold mt-6">方法2：テンプレートから作成</h4>
        <div className="space-y-2">
          <Step n={1}><p>「新規見積」画面で「テンプレートから作成」ボタンをクリック</p></Step>
          <Step n={2}><p>システムテンプレート（20種）や自分で保存したテンプレートを選択</p></Step>
          <Step n={3}><p>明細が一括で入力されるので、数量・単価を修正して保存</p></Step>
        </div>

        <h4 className="font-semibold mt-6">方法3：AI自動生成</h4>
        <div className="space-y-2">
          <Step n={1}><p>「新規見積」画面で「AI生成」ボタンをクリック</p></Step>
          <Step n={2}><p>工事内容をテキストで説明（例：「駐車場2台分、フェンス20m、門柱設置」）</p></Step>
          <Step n={3}><p>必要に応じて現場写真を添付</p></Step>
          <Step n={4}><p>AIが4階層の見積明細を自動生成。内容を確認して修正・保存</p></Step>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-4 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
          <p className="text-amber-800">AI生成には ANTHROPIC_API_KEY の設定が必要です。設定方法は「外部連携」セクションを参照してください。</p>
        </div>

        <h4 className="font-semibold mt-6">見積のステータス</h4>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">作成中</Badge>
          <span>→</span>
          <Badge variant="default">提出済</Badge>
          <span>→</span>
          <Badge variant="outline">受注</Badge>
          <span>or</span>
          <Badge variant="destructive">失注</Badge>
        </div>
        <p className="mt-2">「提出済」にした見積は、顧客に共有して承認を受けることができます。</p>

        <h4 className="font-semibold mt-6">バージョン管理</h4>
        <p>見積詳細ページの「新バージョン」ボタンで、同じ見積番号の新バージョンを作成できます。改訂履歴が自動管理されます。</p>

        <h4 className="font-semibold mt-6">モバイル対応</h4>
        <p>スマートフォンでは、明細編集がカード型のドリルダウンUIに自動切替されます。現場からでも見積を作成・編集できます。</p>
      </Section>

      {/* ── 顧客への共有 ── */}
      <Section id="share" icon={Share2} title="顧客への共有・電子承認">
        <p>見積を顧客にオンラインで共有し、承認・お断り・質問を受け付けることができます。顧客はログイン不要です。</p>

        <h4 className="font-semibold">共有手順</h4>
        <div className="space-y-2">
          <Step n={1}><p>見積のステータスを「提出済」に変更</p></Step>
          <Step n={2}><p>見積詳細ページの「顧客に共有」ボタンをクリック</p></Step>
          <Step n={3}><p>共有URLが生成されるので、コピーしてメールやLINEで顧客に送付</p></Step>
        </div>

        <h4 className="font-semibold mt-4">顧客側でできること</h4>
        <ul className="list-disc list-inside space-y-1">
          <li>見積内容の閲覧（明細・金額・備考・支払条件）</li>
          <li>ワンタップで <strong>承認</strong> または <strong>お断り</strong></li>
          <li>質問やコメントの送信</li>
        </ul>
        <p className="mt-2">顧客が承認/お断りすると、見積のステータスが自動的に「受注」または「失注」に変更されます。通知設定が有効な場合、メール/LINEで通知されます。</p>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4 flex items-start gap-2">
          <Lightbulb className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
          <p className="text-blue-800">有効期限が切れた見積は承認できません。有効期限のカウントダウンがポータル上に表示されます。</p>
        </div>
      </Section>

      {/* ── 帳票管理 ── */}
      <Section id="documents" icon={ShoppingCart} title="帳票管理（発注書・請求書）">
        <p>受注した見積から、発注書と請求書をワンクリックで作成できます。</p>

        <h4 className="font-semibold">発注書の作成</h4>
        <div className="space-y-2">
          <Step n={1}><p>受注済みの見積詳細ページを開く</p></Step>
          <Step n={2}><p>「帳票を作成」セクションの「発注書を作成」をクリック</p></Step>
          <Step n={3}><p>発注先名・納品希望日を入力して作成</p></Step>
        </div>
        <p className="mt-2">見積明細の原価単価で発注書が自動作成されます。</p>

        <h4 className="font-semibold mt-4">請求書の作成</h4>
        <div className="space-y-2">
          <Step n={1}><p>受注済みの見積詳細ページで「請求書を作成」をクリック</p></Step>
          <Step n={2}><p>支払期限を設定して作成</p></Step>
        </div>
        <p className="mt-2">見積の合計金額で請求書が作成されます。</p>

        <h4 className="font-semibold mt-4">ステータス管理</h4>
        <table className="w-full text-xs border">
          <thead><tr className="bg-muted"><th className="border p-2 text-left">帳票</th><th className="border p-2 text-left">ステータス遷移</th></tr></thead>
          <tbody>
            <tr><td className="border p-2">発注書</td><td className="border p-2">下書き → 発注済 → 納品済</td></tr>
            <tr><td className="border p-2">請求書</td><td className="border p-2">下書き → 送付済 → 入金済（全額/一部入金）</td></tr>
          </tbody>
        </table>
        <p className="mt-2">請求書の詳細ページで「入金記録」ボタンから入金額を記録できます。全額/半額のクイック入力にも対応しています。</p>
      </Section>

      {/* ── 工程管理 ── */}
      <Section id="projects" icon={Hammer} title="工程管理（ガントチャート）">
        <p>受注した見積から工程を作成し、ガントチャートで進捗を管理できます。</p>

        <h4 className="font-semibold">工程の作成</h4>
        <div className="space-y-2">
          <Step n={1}><p>受注済みの見積詳細ページで「工程を作成」ボタンをクリック</p></Step>
          <Step n={2}><p>見積の工種（レベル1）が自動的にタスクとして登録されます</p></Step>
          <Step n={3}><p>各タスクの開始日・終了日をガントチャート上で設定</p></Step>
        </div>

        <h4 className="font-semibold mt-4">進捗の入力</h4>
        <ul className="list-disc list-inside space-y-1">
          <li><strong>スライダー</strong>：ドラッグで進捗率を調整（5%刻み）</li>
          <li><strong>クイックボタン</strong>：0% / 25% / 50% / 75% / 100% をワンタップで設定</li>
        </ul>

        <h4 className="font-semibold mt-4">タスクの追加・削除</h4>
        <p>ガントチャートの右上にある入力欄にタスク名を入力し、「+」ボタンまたはEnterキーで追加。各タスクのゴミ箱アイコンで削除できます。</p>
      </Section>

      {/* ── AI機能 ── */}
      <Section id="ai" icon={Sparkles} title="AI機能">
        <h4 className="font-semibold">AI見積自動生成</h4>
        <p>工事内容のテキスト説明と現場写真から、4階層の見積明細をAIが自動生成します。自社の単価マスタに登録されている品名がある場合は、その単価が自動的に適用されます。</p>

        <h4 className="font-semibold mt-4">AI価格インテリジェンス</h4>
        <p>見積編集画面で品名（レベル4）の単価を入力すると、過去の見積実績に基づく価格ベンチマークが色付きドットで表示されます。</p>
        <div className="flex items-center gap-4 mt-2">
          <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-500 inline-block" /> <span>適正（平均±10%以内）</span></div>
          <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-amber-500 inline-block" /> <span>注意（10〜25%乖離）</span></div>
          <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-500 inline-block" /> <span>要確認（25%以上乖離）</span></div>
        </div>
        <p className="mt-2 text-muted-foreground">※ 同じ品名で2件以上の見積実績がある場合に表示されます</p>

        <h4 className="font-semibold mt-4">AI受注確率予測</h4>
        <p>見積詳細ページで、作成中/提出済の見積に対して受注確率を予測表示します（オーナー/マネージャーのみ）。以下の3要因を分析します。</p>
        <ul className="list-disc list-inside space-y-1">
          <li><strong>金額</strong>：過去の受注金額平均との比較</li>
          <li><strong>粗利率</strong>：過去の受注粗利率との比較</li>
          <li><strong>顧客実績</strong>：その顧客との過去の受注率</li>
        </ul>
        <p className="mt-2 text-muted-foreground">※ 最低5件の受注/失注データが必要です</p>
      </Section>

      {/* ── ロールと権限 ── */}
      <Section id="roles" icon={Shield} title="ロールと権限">
        <p>ユーザーには4つのロールがあり、それぞれ操作できる範囲が異なります。</p>

        <div className="overflow-x-auto mt-4">
          <table className="w-full text-xs border">
            <thead>
              <tr className="bg-muted">
                <th className="border p-2 text-left">機能</th>
                <th className="border p-2 text-center">オーナー</th>
                <th className="border p-2 text-center">マネージャー</th>
                <th className="border p-2 text-center">スタッフ</th>
                <th className="border p-2 text-center">閲覧者</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["見積の閲覧", true, true, true, true],
                ["見積の作成・編集", true, true, true, false],
                ["見積の削除", true, true, false, false],
                ["原価・粗利の閲覧", true, true, false, false],
                ["単価マスタの編集", true, true, false, false],
                ["テンプレートの管理", true, true, false, false],
                ["顧客の登録・編集", true, true, true, false],
                ["顧客の削除", true, true, false, false],
                ["会社設定の変更", true, false, false, false],
                ["ユーザー管理", true, false, false, false],
                ["AI受注予測の表示", true, true, false, false],
              ].map(([feature, ...roles], i) => (
                <tr key={i}>
                  <td className="border p-2">{feature as string}</td>
                  {(roles as boolean[]).map((can, j) => (
                    <td key={j} className="border p-2 text-center">{can ? "○" : "×"}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h4 className="font-semibold mt-4">承認ワークフロー</h4>
        <p>スタッフ・マネージャーは「作成中」の見積に対して承認申請を送信できます。承認者（オーナー/マネージャー）が承認または差戻しを行います。多段階承認（複数ステップ）にも対応しています。</p>
      </Section>

      {/* ── 外部連携 ── */}
      <Section id="integrations" icon={Bell} title="外部連携の設定">
        <p>以下のサービスと連携することで、機能を拡張できます。すべて任意の設定です。</p>

        <h4 className="font-semibold mt-4">AI見積生成（Anthropic Claude API）</h4>
        <div className="bg-muted rounded-lg p-3 font-mono text-xs">ANTHROPIC_API_KEY=sk-ant-xxxxx</div>
        <p className="mt-1">Anthropicのアカウントを作成し、APIキーを取得して .env ファイルに設定します。従量課金です。</p>

        <h4 className="font-semibold mt-4">メール通知（Resend）</h4>
        <div className="bg-muted rounded-lg p-3 font-mono text-xs space-y-1">
          <div>RESEND_API_KEY=re_xxxxx</div>
          <div>EMAIL_FROM=noreply@your-domain.com</div>
        </div>
        <p className="mt-1">Resend（resend.com）でアカウントを作成し、APIキーを取得します。月100通まで無料です。設定後、「設定」→「通知設定」でメール通知をONにしてください。</p>

        <h4 className="font-semibold mt-4">LINE通知（LINE Messaging API）</h4>
        <div className="bg-muted rounded-lg p-3 font-mono text-xs">LINE_CHANNEL_ACCESS_TOKEN=xxxxx</div>
        <ol className="list-decimal list-inside space-y-1 mt-2">
          <li>LINE Developers（developers.line.biz）でチャネルを作成</li>
          <li>チャネルアクセストークンを取得して .env に設定</li>
          <li>通知を受けるユーザーがLINE公式アカウントと友だち追加</li>
          <li>「設定」→「通知設定」でLINE通知をONにし、LINE User IDを入力</li>
        </ol>

        <h4 className="font-semibold mt-4">メーカーカタログ</h4>
        <p>「カタログ」ページからCSVファイルでメーカー製品データをインポートできます。必須列は「メーカー」「製品名」「定価」の3つです。サンプルCSVは <code className="bg-muted px-1 rounded text-xs">/sample-catalog.csv</code> からダウンロードできます。</p>
      </Section>

      {/* ── FAQ ── */}
      <Section id="faq" icon={HelpCircle} title="よくある質問">
        <div className="space-y-2">
          <FAQ q="見積を間違えて削除してしまいました。復元できますか？">
            <p>申し訳ありませんが、削除した見積は復元できません。削除前に確認ダイアログが表示されますので、内容をご確認ください。重要な見積は「複製」で控えを作成しておくことをお勧めします。</p>
          </FAQ>

          <FAQ q="受注済みの見積を修正したいのですが、できますか？">
            <p>受注済みの見積も編集できますが、編集画面に警告バナーが表示されます。改訂が必要な場合は「新バージョン」ボタンで新しいバージョンを作成することをお勧めします。</p>
          </FAQ>

          <FAQ q="PDFの見積書にロゴが表示されません。">
            <p>「設定」→「会社設定」でロゴ画像をアップロードしてください。対応形式はPNG、JPEG、WebP（2MB以下）です。SVGには対応していません。</p>
          </FAQ>

          <FAQ q="顧客に共有したURLが開けないと言われました。">
            <p>見積のステータスが「提出済」になっているか確認してください。また、有効期限が切れている場合は「有効期限が切れています」と表示されます。</p>
          </FAQ>

          <FAQ q="AI生成ボタンが表示されません。">
            <p>AI見積生成には ANTHROPIC_API_KEY の設定が必要です。.env ファイルにキーが設定されているか確認し、サーバーを再起動してください。</p>
          </FAQ>

          <FAQ q="単価を一括で値上げする方法はありますか？">
            <p>「単価マスタ」ページのツールバーにある「一括調整」ボタンから、カテゴリ別・%指定で一括変更できます。見積単価のみ、原価のみ、両方の3つのモードがあります。</p>
          </FAQ>

          <FAQ q="他のユーザーと同時に同じ見積を編集するとどうなりますか？">
            <p>楽観的ロック機能により、先に保存したユーザーの変更が反映されます。後から保存しようとするユーザーには「他のユーザーが変更を保存しています。ページを再読み込みしてください。」というエラーが表示されます。</p>
          </FAQ>

          <FAQ q="メール通知が届きません。">
            <p>以下を確認してください：①RESEND_API_KEYが.envに設定されているか ②「設定」→「通知設定」でメール通知がONになっているか ③各通知項目（有効期限・ステータス変更・顧客アクション）が有効になっているか</p>
          </FAQ>

          <FAQ q="スマートフォンから見積を作成できますか？">
            <p>はい。ブラウザからアクセスすれば、スマートフォンに最適化されたカード型UIで見積明細を編集できます。テンプレートやAI生成も利用可能です。</p>
          </FAQ>

          <FAQ q="データのバックアップはどうすればいいですか？">
            <p>データはSupabase（クラウド）に保存されており、自動的にバックアップされます。単価マスタのデータは「CSVエクスポート」機能でローカルにバックアップすることもできます。</p>
          </FAQ>

          <FAQ q="見積番号の形式を変更できますか？">
            <p>見積番号は「会社略称-年月-連番」（例：SMP-202604-0001）の形式で自動採番されます。会社略称は「設定」→「会社設定」の「略称」フィールドで変更できます。</p>
          </FAQ>

          <FAQ q="価格インテリジェンスの色付きドットが表示されません。">
            <p>同じ品名で2件以上の見積実績（提出済/受注済）が必要です。実績が蓄積されると自動的に表示されます。</p>
          </FAQ>
        </div>
      </Section>
    </div>
  );
}
