"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function ImportCatalogButton() {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    startTransition(async () => {
      try {
        const text = await file.text();
        const res = await fetch("/api/master/catalog/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ csvText: text }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        toast.success(`${data.count}件のカタログを登録しました`);
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "インポートに失敗しました");
      }
    });
    e.target.value = "";
  };

  return (
    <>
      <Button variant="outline" disabled={isPending} onClick={() => document.getElementById("catalog-csv")?.click()}>
        <Upload className="mr-2 h-4 w-4" />
        {isPending ? "インポート中..." : "CSVインポート"}
      </Button>
      <input id="catalog-csv" type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
    </>
  );
}
