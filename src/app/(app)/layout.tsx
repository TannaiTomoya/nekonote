import { Suspense } from "react";
import AppShell from "@/components/app-shell";
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<p className="loading">ひらいています…</p>}>
      <AppShell>{children}</AppShell>
    </Suspense>
  );
}
