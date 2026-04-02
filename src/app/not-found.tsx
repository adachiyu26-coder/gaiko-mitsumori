import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4 px-4">
        <FileQuestion className="mx-auto h-16 w-16 text-muted-foreground" />
        <h1 className="text-4xl font-bold">404</h1>
        <p className="text-muted-foreground">ページが見つかりませんでした</p>
        <Link href="/dashboard">
          <Button className="bg-brand hover:bg-brand-hover">
            ダッシュボードに戻る
          </Button>
        </Link>
      </div>
    </div>
  );
}
