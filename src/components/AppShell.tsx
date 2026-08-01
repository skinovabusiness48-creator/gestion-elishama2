// ============================================================
// ELISHAMA — Shell de l'application (layout + navigation)
// ============================================================
"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { CommandPalette } from "@/components/CommandPalette";
import { ThemeToggle } from "@/components/theme-toggle";
import { HelpDialog } from "@/components/HelpDialog";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import {
  LayoutDashboard,
  Receipt,
  Ticket,
  UtensilsCrossed,
  Package,
  Wallet,
  Banknote,
  BarChart3,
  History,
  Settings,
  Menu as MenuIcon,
  Flame,
  X,
  Search,
  HelpCircle,
} from "lucide-react";
import type { ModuleKey } from "@/lib/types";
import { useStore } from "@/lib/store";

interface NavItem {
  key: ModuleKey;
  label: string;
  icon: typeof LayoutDashboard;
}

const NAV_ITEMS: NavItem[] = [
  { key: "dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { key: "sales", label: "Ventes", icon: Receipt },
  { key: "tickets", label: "Tickets", icon: Ticket },
  { key: "products", label: "Produits", icon: UtensilsCrossed },
  { key: "stock", label: "Stock", icon: Package },
  { key: "cash", label: "Caisse", icon: Banknote },
  { key: "expenses", label: "Dépenses", icon: Wallet },
  { key: "reports", label: "Rapports", icon: BarChart3 },
  { key: "history", label: "Historique", icon: History },
  { key: "settings", label: "Paramètres", icon: Settings },
];

function SidebarContent({
  current,
  onSelect,
}: {
  current: ModuleKey;
  onSelect: (k: ModuleKey) => void;
}) {
  const { data } = useStore();
  const name = data.settings.restaurant.name || "ELISHAMA";
  const lowStock = data.products.filter((p) => !p.archived && p.stock <= p.minStock).length;

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      {/* Logo / titre */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-sidebar-border">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground shrink-0">
          <Flame className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="font-bold text-base tracking-tight truncate">{name}</p>
          <p className="text-xs text-sidebar-foreground/60 truncate">Gestion du restaurant</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 scrollbar-thin">
        <ul className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const active = current === item.key;
            const Icon = item.icon;
            return (
              <li key={item.key} className="relative">
                <button
                  onClick={() => onSelect(item.key)}
                  className={cn(
                    "w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all text-left group",
                    active
                      ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                      : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:translate-x-0.5"
                  )}
                >
                  <Icon className={cn("h-4.5 w-4.5 shrink-0 transition-transform", !active && "group-hover:scale-110")} />
                  <span className="flex-1 truncate">{item.label}</span>
                  {item.key === "stock" && lowStock > 0 && (
                    <span className={cn(
                      "inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold transition-colors",
                      active ? "bg-white/25 text-white" : "bg-amber-500 text-white"
                    )}>
                      {lowStock}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Pied de sidebar */}
      <div className="border-t border-sidebar-border px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="text-xs text-sidebar-foreground/50 min-w-0">
            <p className="truncate">Données locales</p>
            <p className="mt-0.5">v1.0 — 100% hors ligne</p>
          </div>
          <ThemeToggle className="h-8 w-8 shrink-0 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent" />
        </div>
      </div>
    </div>
  );
}

export function AppShell({
  current,
  onSelect,
  children,
}: {
  current: ModuleKey;
  onSelect: (k: ModuleKey) => void;
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const { data } = useStore();
  const name = data.settings.restaurant.name || "ELISHAMA";

  // Gestionnaire qui ferme le menu mobile avant de sélectionner un module
  const handleSelect = (k: ModuleKey) => {
    setMobileOpen(false);
    onSelect(k);
  };

  // Raccourcis clavier globaux (?, /, chiffres, lettres mnémoniques)
  useKeyboardShortcuts({
    onNavigate: handleSelect,
    onHelp: () => setHelpOpen(true),
    onSearch: () => setSearchOpen(true),
  });

  const currentItem = NAV_ITEMS.find((i) => i.key === current);

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Sidebar desktop */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-sidebar-border">
        <SidebarContent current={current} onSelect={handleSelect} />
      </aside>

      {/* Contenu principal */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Header mobile */}
        <header className="lg:hidden sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/95 backdrop-blur px-4 no-print">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <MenuIcon className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <SidebarContent current={current} onSelect={handleSelect} />
            </SheetContent>
          </Sheet>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Flame className="h-5 w-5 text-primary shrink-0" />
            <span className="font-bold truncate">{name}</span>
          </div>
          <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={() => setSearchOpen(true)} aria-label="Rechercher">
            <Search className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={() => setHelpOpen(true)} aria-label="Aide">
            <HelpCircle className="h-5 w-5" />
          </Button>
          <ThemeToggle className="h-9 w-9 shrink-0" />
        </header>

        {/* Header desktop */}
        <header className="hidden lg:flex sticky top-0 z-30 h-14 items-center justify-between border-b bg-background/95 backdrop-blur px-6 no-print">
          <div className="flex items-center gap-2">
            {currentItem && <currentItem.icon className="h-5 w-5 text-primary" />}
            <h2 className="font-semibold">{currentItem?.label}</h2>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSearchOpen(true)}
              className="gap-2 h-9"
            >
              <Search className="h-4 w-4" />
              <span className="hidden md:inline">Rechercher</span>
              <kbd className="hidden md:inline-flex h-5 items-center rounded border bg-muted px-1.5 text-[10px] font-mono">
                ⌘K
              </kbd>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={() => setHelpOpen(true)}
              aria-label="Aide & raccourcis"
              title="Aide & raccourcis (?)"
            >
              <HelpCircle className="h-[1.15rem] w-[1.15rem]" />
            </Button>
            <ThemeToggle className="h-9 w-9" />
            <span className="hidden sm:inline">
              {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </span>
          </div>
        </header>

        {/* Contenu du module */}
        <main className="flex-1 overflow-x-hidden">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 py-5 sm:py-7 animate-fade-in">{children}</div>
        </main>

        {/* Footer sticky */}
        <footer className="mt-auto border-t bg-background px-4 sm:px-6 py-3 text-xs text-muted-foreground no-print">
          <div className="mx-auto w-full max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="flex items-center gap-1.5">
              <Flame className="h-3.5 w-3.5 text-primary" />
              <span className="font-medium text-foreground">{name}</span> — Gestion simple et efficace du restaurant
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setHelpOpen(true)}
                className="hidden sm:inline-flex items-center gap-1 hover:text-foreground transition-colors"
                title="Afficher l'aide"
              >
                <kbd className="inline-flex h-4 items-center rounded border bg-muted px-1 text-[10px] font-mono">?</kbd>
                <span>Aide</span>
              </button>
              <span className="hidden sm:inline text-border">·</span>
              <p>Données locales · Aucune connexion requise</p>
            </div>
          </div>
        </footer>
      </div>

      {/* Palette de commandes globale (Cmd/Ctrl+K) */}
      <CommandPalette
        open={searchOpen}
        onOpenChange={setSearchOpen}
        onNavigate={handleSelect}
      />

      {/* Dialogue d'aide & raccourcis (?) */}
      <HelpDialog
        open={helpOpen}
        onOpenChange={setHelpOpen}
        onNavigate={handleSelect}
      />
    </div>
  );
}
