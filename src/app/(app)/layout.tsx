import { AppShell } from "@/components/AppShell";
import { HydrationGate } from "@/components/HydrationGate";
import { Providers } from "@/components/Providers";
import { RequireAuth } from "@/components/RequireAuth";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <HydrationGate>
      <Providers>
        <RequireAuth>
          <AppShell>{children}</AppShell>
        </RequireAuth>
      </Providers>
    </HydrationGate>
  );
}
