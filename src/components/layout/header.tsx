"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LogOut, Menu, UserCog } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { createClient } from "@/lib/supabase/client";
import { MobileNav } from "./mobile-nav";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface HeaderProps {
  userName: string;
  companyName: string;
}

export function Header({ userName, companyName }: HeaderProps) {
  const router = useRouter();
  const supabase = createClient();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-background px-4 md:px-6">
      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetTrigger className="md:hidden inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
          <Menu className="h-5 w-5" />
          <span className="sr-only">メニューを開く</span>
        </SheetTrigger>
        <SheetContent side="left" className="w-60 p-0">
          <MobileNav onClose={() => setMobileNavOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex-1" />

      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground hidden sm:inline">
          {companyName}
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger className={cn(
            "inline-flex items-center gap-2 rounded-md px-2 py-1.5 text-sm",
            "hover:bg-accent hover:text-foreground transition-colors outline-none"
          )}>
            <div className="h-7 w-7 rounded-full bg-brand flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-medium">
                {userName.charAt(0)}
              </span>
            </div>
            <span className="hidden sm:inline text-sm">{userName}</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem render={<Link href="/settings" />}>
              <UserCog className="mr-2 h-4 w-4" />
              プロフィール設定
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              ログアウト
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
