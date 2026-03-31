export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";

export default async function Home() {
  if (process.env.DEV_BYPASS_AUTH === "true") {
    redirect("/dashboard");
  }

  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  } else {
    redirect("/login");
  }
}
