"use client";

import type { ReactNode } from "react";
import { AuthProvider } from "@/lib/auth";
import { SyncManager } from "./SyncManager";
import { SpendDiagnosisSync } from "./SpendDiagnosisSync";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <SyncManager />
      <SpendDiagnosisSync />
      {children}
    </AuthProvider>
  );
}
