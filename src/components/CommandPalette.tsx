// ============================================================
// ELISHAMA — Palette de commandes globale (Cmd/Ctrl+K)
// ============================================================
"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useStore } from "@/lib/store";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ModuleKey } from "@/lib/types";
import type { LucideIcon } from "lucide-react";
import {
  Search,
  ChevronRight,
  LayoutDashboard,
  Receipt,
  Ticket as TicketIcon,
  UtensilsCrossed,
  Package,
  Banknote,
  Wallet,
  BarChart3,
  History,
  Settings,
  Tag,
  Tags,
  Table as TableIcon,
  Download,
  FileDown,
  CornerDownLeft,
} from "lucide-react";

interface ResultItem {
  id: string;
  label: string;
  sublabel?: string;
  icon: LucideIcon;
  module?: ModuleKey;
  action?: () => void;
}

interface ResultGroup {
  title: string;
  items: ResultItem[];
}

const NAV_ITEMS_LIST: { key: ModuleKey; label: string; icon: LucideIcon }[] = [
  { key: "dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { key: "sales", label: "Ventes", icon: Receipt },
  { key: "tickets", label: "Tickets", icon: TicketIcon },
  { key: "products", label: "Produits", icon: UtensilsCrossed },
  { key: "stock", label: "Stock", icon: Package },
  { key: "cash", label: "Caisse", icon: Banknote },
  { key: "expenses", label: "Dépenses", icon: Wallet },
  { key: "reports", label: "Rapports", icon: BarChart3 },
  { key: "history", label: "Historique", icon: History },
  { key: "settings", label: "Paramètres", icon: Settings },
];

export function CommandPalette({
  open,
  onOpenChange,
  onNavigate,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onNavigate: (k: ModuleKey) => void;
}) {
  const { data } = useStore();
  const currency = data.settings.usage.currency;
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [prevOpen, setPrevOpen] = useState(open);
  const inputRef = useRef<HTMLInputElement>(null);
  const openRef = useRef(open);

  // Maintient un ref de l'état ouvert pour éviter les stale closures dans le listener global
  useEffect(() => {
    openRef.current = open;
  }, [open]);

  // Reset query + sélection à l'ouverture (derived state pattern, sans setState-in-effect)
  // https://react.dev/reference/react/useState#storing-information-from-previous-renders
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setQuery("");
      setActiveIndex(0);
    }
  }

  // Raccourci Cmd/Ctrl+K — toggle depuis n'importe où
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(!openRef.current);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onOpenChange]);

  // Focus à l'ouverture
  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 60);
      return () => clearTimeout(t);
    }
  }, [open]);

  // Construction des résultats groupés (mémoïsée)
  const groups = useMemo<ResultGroup[]>(() => {
    const q = query.toLowerCase().trim();
    const matchStr = (s?: string | null): boolean =>
      !q || (s != null && s.toLowerCase().includes(q));

    // 1. Navigation
    const navItems: ResultItem[] = NAV_ITEMS_LIST.filter((it) =>
      matchStr(it.label)
    ).map((it) => ({
      id: `nav-${it.key}`,
      label: it.label,
      sublabel: "Aller au module",
      icon: it.icon,
      module: it.key,
    }));

    // 2. Produits
    const productItems: ResultItem[] = data.products
      .filter((p) => !p.archived)
      .filter(
        (p) => matchStr(p.name) || matchStr(p.description) || matchStr(p.unit)
      )
      .slice(0, 5)
      .map((p) => ({
        id: `product-${p.id}`,
        label: p.name,
        sublabel: `${formatCurrency(p.salePrice, currency)} · Stock ${p.stock} ${p.unit}`,
        icon: UtensilsCrossed,
        module: "products" as ModuleKey,
      }));

    // 3. Ventes
    const saleItems: ResultItem[] = data.sales
      .filter((s) => matchStr(s.ticketNumber) || matchStr(s.note))
      .slice(0, 5)
      .map((s) => ({
        id: `sale-${s.id}`,
        label: `Vente ${s.ticketNumber}`,
        sublabel: `${formatCurrency(s.total, currency)} · ${formatDateTime(s.createdAt)}`,
        icon: Receipt,
        module: "sales" as ModuleKey,
      }));

    // 4. Tickets
    const ticketItems: ResultItem[] = data.tickets
      .filter((t) => matchStr(t.name) || matchStr(t.note))
      .slice(0, 5)
      .map((t) => {
        const total =
          t.items.reduce((a, b) => a + b.unitPrice * b.quantity, 0) - t.discount;
        const statusLabel =
          t.status === "open" ? "Ouvert" : t.status === "closed" ? "Fermé" : "Annulé";
        return {
          id: `ticket-${t.id}`,
          label: t.name,
          sublabel: `${statusLabel} · ${formatCurrency(total, currency)}`,
          icon: TicketIcon,
          module: "tickets" as ModuleKey,
        };
      });

    // 5. Dépenses
    const expenseItems: ResultItem[] = data.expenses
      .filter((e) => matchStr(e.label) || matchStr(e.note))
      .slice(0, 5)
      .map((e) => ({
        id: `expense-${e.id}`,
        label: e.label,
        sublabel: `${formatCurrency(e.amount, currency)} · ${formatDateTime(e.date)}`,
        icon: Wallet,
        module: "expenses" as ModuleKey,
      }));

    // 6. Tables
    const tableItems: ResultItem[] = data.tables
      .filter((t) => matchStr(t.name))
      .slice(0, 5)
      .map((t) => {
        const zone = data.zones.find((z) => z.id === t.zoneId);
        return {
          id: `table-${t.id}`,
          label: t.name,
          sublabel: zone ? `Zone ${zone.name}` : "Sans zone",
          icon: TableIcon,
          module: "tickets" as ModuleKey,
        };
      });

    // 7. Catégories (produits + dépenses)
    const categoryItems: ResultItem[] = [];
    data.categories
      .filter((c) => matchStr(c.name))
      .slice(0, 5)
      .forEach((c) => {
        categoryItems.push({
          id: `cat-${c.id}`,
          label: c.name,
          sublabel: "Catégorie de produits",
          icon: Tag,
          module: "products" as ModuleKey,
        });
      });
    data.expenseCategories
      .filter((c) => matchStr(c.name))
      .slice(0, 5)
      .forEach((c) => {
        categoryItems.push({
          id: `ecat-${c.id}`,
          label: c.name,
          sublabel: "Catégorie de dépenses",
          icon: Tags,
          module: "expenses" as ModuleKey,
        });
      });

    // 8. Actions rapides
    const handleExport = () => {
      try {
        const blob = new Blob([JSON.stringify(data, null, 2)], {
          type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `elishama-export-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (err) {
        console.error("Export failed", err);
      }
    };

    const quickActions = (
      [
        {
          id: "qa-new-sale",
          label: "Nouvelle vente",
          sublabel: "Ouvrir le module Ventes",
          icon: Receipt,
          module: "sales",
        },
        {
          id: "qa-new-product",
          label: "Nouveau produit",
          sublabel: "Ouvrir le module Produits",
          icon: UtensilsCrossed,
          module: "products",
        },
        {
          id: "qa-new-expense",
          label: "Nouvelle dépense",
          sublabel: "Ouvrir le module Dépenses",
          icon: Wallet,
          module: "expenses",
        },
        {
          id: "qa-export",
          label: "Exporter les données",
          sublabel: "Télécharger un fichier JSON",
          icon: Download,
          action: handleExport,
        },
        {
          id: "qa-print",
          label: "Exporter en PDF",
          sublabel: "Exporter la page courante en PDF",
          icon: FileDown,
          action: () => window.print(),
        },
      ] as ResultItem[]
    ).filter((qa) => matchStr(qa.label));

    const allGroups: ResultGroup[] = [
      { title: "Navigation", items: navItems },
      { title: "Actions rapides", items: quickActions },
      { title: "Produits", items: productItems },
      { title: "Ventes", items: saleItems },
      { title: "Tickets", items: ticketItems },
      { title: "Dépenses", items: expenseItems },
      { title: "Tables", items: tableItems },
      { title: "Catégories", items: categoryItems },
    ];

    return allGroups.filter((g) => g.items.length > 0);
  }, [query, data, currency]);

  const flatItems = useMemo(
    () => groups.flatMap((g) => g.items),
    [groups]
  );
  const safeActiveIndex =
    flatItems.length === 0 ? 0 : Math.min(activeIndex, flatItems.length - 1);

  // Scroll l'élément actif dans la vue
  useEffect(() => {
    if (!open) return;
    const el = document.querySelector(`[data-cp-idx="${safeActiveIndex}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [safeActiveIndex, open]);

  const handleActivate = (item: ResultItem) => {
    if (item.action) item.action();
    else if (item.module) onNavigate(item.module);
    onOpenChange(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, Math.max(0, flatItems.length - 1)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = flatItems[safeActiveIndex];
      if (item) handleActivate(item);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="max-w-2xl p-0 gap-0 overflow-hidden top-[15%] left-1/2 -translate-x-1/2 translate-y-0 rounded-xl data-[state=open]:slide-in-from-top-3 data-[state=open]:duration-200 sm:max-w-2xl"
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Recherche globale</DialogTitle>
        </DialogHeader>

        {/* Input de recherche */}
        <div className="flex items-center gap-3 border-b px-4 py-3">
          <Search className="h-5 w-5 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Rechercher ou exécuter une commande…"
            aria-label="Recherche globale"
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            className="flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
          />
          <kbd className="hidden sm:inline-flex h-5 items-center rounded border bg-muted px-1.5 text-[10px] text-muted-foreground">
            Échap
          </kbd>
        </div>

        {/* Résultats */}
        <div className="max-h-[60vh] overflow-y-auto scrollbar-thin p-2">
          {flatItems.length === 0 ? (
            <div className="py-10 px-4 text-center">
              <Search className="h-8 w-8 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">
                {query.trim() ? (
                  <>
                    Aucun résultat pour «{" "}
                    <span className="font-medium text-foreground">{query}</span>
                    »
                  </>
                ) : (
                  "Commencez à taper pour rechercher à travers l'application"
                )}
              </p>
            </div>
          ) : (
            groups.map((group) => (
              <div key={group.title} className="mb-2 last:mb-0">
                <p className="px-2 py-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                  {group.title}
                </p>
                {group.items.map((item) => {
                  const idx = flatItems.indexOf(item);
                  const isActive = idx === safeActiveIndex;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      data-cp-idx={idx}
                      onMouseEnter={() => setActiveIndex(idx)}
                      onClick={() => handleActivate(item)}
                      className={cn(
                        "w-full flex items-center gap-3 rounded-lg px-2 py-2 text-left text-sm transition-colors",
                        isActive
                          ? "bg-accent text-accent-foreground"
                          : "hover:bg-muted/60"
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="flex-1 truncate font-medium">
                        {item.label}
                      </span>
                      {item.sublabel && (
                        <span className="text-xs text-muted-foreground truncate max-w-[55%]">
                          {item.sublabel}
                        </span>
                      )}
                      <ChevronRight className="h-4 w-4 text-muted-foreground/50 shrink-0" />
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer astuces clavier */}
        <div className="border-t px-4 py-2 flex items-center justify-between text-[11px] text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="inline-flex h-4 items-center rounded border bg-muted px-1">
                ↑
              </kbd>
              <kbd className="inline-flex h-4 items-center rounded border bg-muted px-1">
                ↓
              </kbd>
              <span className="hidden sm:inline">Naviguer</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="inline-flex h-4 items-center rounded border bg-muted px-1">
                ↵
              </kbd>
              <span className="hidden sm:inline">Sélectionner</span>
            </span>
          </div>
          <span className="hidden sm:flex items-center gap-1">
            <CornerDownLeft className="h-3 w-3" />
            Entrée pour valider
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
