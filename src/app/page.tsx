"use client";

import { useState } from "react";
import { StoreProvider, useStore } from "@/lib/store";
import { AppShell } from "@/components/AppShell";
import { Dashboard } from "@/components/modules/Dashboard";
import { Products } from "@/components/modules/Products";
import { Stock } from "@/components/modules/Stock";
import { Sales } from "@/components/modules/Sales";
import { Tickets } from "@/components/modules/Tickets";
import { Cash } from "@/components/modules/Cash";
import { Expenses } from "@/components/modules/Expenses";
import { Reports } from "@/components/modules/Reports";
import { HistoryModule } from "@/components/modules/HistoryModule";
import { SettingsModule } from "@/components/modules/SettingsModule";
import type { ModuleKey } from "@/lib/types";
import { Flame } from "lucide-react";

function AppContent() {
  const { data } = useStore();
  const [current, setCurrent] = useState<ModuleKey>("dashboard");
  const handleNavigate = (k: ModuleKey) => setCurrent(k);

  // Écran de chargement pendant le fetch des données initiales
  if (!data.settings.initialized) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/30">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/30 animate-pulse">
            <Flame className="h-8 w-8" />
          </div>
          <div className="text-center">
            <p className="font-bold text-lg">ELISHAMA</p>
            <p className="text-sm text-muted-foreground mt-1">Chargement des données...</p>
          </div>
          <div className="flex gap-1.5 mt-2">
            <div className="h-2 w-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: "0ms" }} />
            <div className="h-2 w-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "150ms" }} />
            <div className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <AppShell current={current} onSelect={handleNavigate}>
      {current === "dashboard" && <Dashboard onNavigate={handleNavigate} />}
      {current === "products" && <Products />}
      {current === "stock" && <Stock />}
      {current === "sales" && <Sales />}
      {current === "tickets" && <Tickets />}
      {current === "cash" && <Cash />}
      {current === "expenses" && <Expenses />}
      {current === "reports" && <Reports />}
      {current === "history" && <HistoryModule />}
      {current === "settings" && <SettingsModule />}
    </AppShell>
  );
}

export default function Home() {
  return (
    <StoreProvider>
      <AppContent />
    </StoreProvider>
  );
}
