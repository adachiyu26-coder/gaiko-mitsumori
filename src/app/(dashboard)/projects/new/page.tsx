"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { createProject } from "@/app/(dashboard)/projects/actions";
import { toast } from "sonner";
import Link from "next/link";

export default function NewProjectPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [siteAddress, setSiteAddress] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState("");
  const [note, setNote] = useState("");

  const handleSave = () => {
    if (!name.trim()) {
      toast.error("工程名を入力してください");
      return;
    }
    startTransition(async () => {
      try {
        await createProject({
          name: name.trim(),
          siteAddress: siteAddress || null,
          startDate: startDate || null,
          endDate: endDate || null,
          note: note || null,
        });
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "作成に失敗しました");
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/projects">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">新規工程作成</h1>
        </div>
        <Button onClick={handleSave} disabled={isPending} className="bg-brand hover:bg-brand-hover">
          {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          {isPending ? "作成中..." : "作成"}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>基本情報</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label>工程名 *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="〇〇様邸 外構工事" />
            </div>
            <div className="space-y-2">
              <Label>現場住所</Label>
              <Input value={siteAddress} onChange={(e) => setSiteAddress(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>開始日</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>終了日</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>備考</Label>
              <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
