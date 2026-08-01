"use client";

import { useState } from "react";
import { StoreProvider, useStore } from "@/lib/store";
import { AppShell } from "@/components/AppShell";
import { Onboarding } from "@/components/Onboarding";
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

function AppContent() {
  const { data } = useStore();
  const [current, setCurrent] = useState<ModuleKey>("dashboard");

  // Onboarding au premier lancement
  if (!data.settings.initialized) {
    return <Onboarding />;
  }

  const handleNavigate = (k: ModuleKey) => setCurrent(k);

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
