// ============================================================
// ELISHAMA — Module : Tableau de bord
// ============================================================
"use client";

import React, { useMemo } from "react";
import { useStore } from "@/lib/store";
import { PageHeader, StatCard, EmptyState, Money } from "@/components/shared";
import {
  LayoutDashboard,
  TrendingUp,
  Receipt,
  Wallet,
  PiggyBank,
  PackageX,
  AlertTriangle,
  Package,
  Ticket as TicketIcon,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  History as HistoryIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { isSameDay, formatCurrency, formatDateTime } from "@/lib/format";
import type { ModuleKey } from "@/lib/types";

export function Dashboard({ onNavigate }: { onNavigate: (k: ModuleKey) => void }) {
  const { data, getCategoryName } = useStore();
  const currency = data.settings.usage.currency;

  const stats = useMemo(() => {
    const todaySales = data.sales.filter((s) => isSameDay(s.createdAt));
    const todayExpenses = data.expenses.filter((e) => isSameDay(e.date));
    const revenue = todaySales.reduce((a, b) => a + b.total, 0);
    const expensesTotal = todayExpenses.reduce((a, b) => a + b.amount, 0);
    const openTickets = data.tickets.filter((t) => t.status === "open").length;
    const activeProducts = data.products.filter((p) => !p.archived);
    const outOfStock = activeProducts.filter((p) => p.stock <= 0);
    const lowStock = activeProducts.filter((p) => p.stock > 0 && p.stock <= p.minStock);
    const profit = revenue - expensesTotal;
    return {
      revenue,
      salesCount: todaySales.length,
      ordersCount: todaySales.length,
      expensesTotal,
      profit,
      outOfStock,
      lowStock,
      activeProducts: activeProducts.length,
      openTickets,
    };
  }, [data]);

  const recentActivity = useMemo(() => {
    type Item = { id: string; date: string; type: "sale" | "expense" | "product" | "history"; label: string; amount?: number; tone: "success" | "danger" | "primary" | "default" };
    const items: Item[] = [];
    data.sales.slice(0, 5).forEach((s) => {
      items.push({ id: s.id, date: s.createdAt, type: "sale", label: `Vente ${s.ticketNumber}`, amount: s.total, tone: "success" });
    });
    data.expenses.slice(0, 5).forEach((e) => {
      items.push({ id: e.id, date: e.date, type: "expense", label: `Dépense: ${e.label}`, amount: -e.amount, tone: "danger" });
    });
    [...data.products].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 3).forEach((p) => {
      items.push({ id: p.id, date: p.updatedAt, type: "product", label: `Produit: ${p.name}`, tone: "primary" });
    });
    return items.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10);
  }, [data]);

  return (
    <div>
      <PageHeader
        title="Tableau de bord"
        subtitle="Vue d'ensemble de l'activité du jour"
        icon={LayoutDashboard}
        actions={
          <Button onClick={() => onNavigate("sales")} className="gap-2">
            <Plus className="h-4 w-4" /> Nouvelle vente
          </Button>
        }
      />

      {/* Stats principales */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <StatCard
          label="Chiffre d'affaires du jour"
          value={formatCurrency(stats.revenue, currency)}
          icon={TrendingUp}
          tone="success"
          hint={`${stats.salesCount} vente(s)`}
        />
        <StatCard
          label="Dépenses du jour"
          value={formatCurrency(stats.expensesTotal, currency)}
          icon={Wallet}
          tone="danger"
          hint="Total dépensé aujourd'hui"
        />
        <StatCard
          label="Bénéfice estimé"
          value={formatCurrency(stats.profit, currency)}
          icon={PiggyBank}
          tone={stats.profit >= 0 ? "primary" : "danger"}
          hint="Ventes - Dépenses"
        />
        <StatCard
          label="Commandes du jour"
          value={stats.ordersCount}
          icon={Receipt}
          tone="default"
          hint={`${stats.openTickets} ticket(s) ouvert(s)`}
        />
      </div>

      {/* Stats secondaires */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <StatCard label="Produits actifs" value={stats.activeProducts} icon={Package} tone="default" />
        <StatCard label="En rupture" value={stats.outOfStock.length} icon={PackageX} tone="danger" hint={stats.outOfStock.slice(0, 2).map((p) => p.name).join(", ") || "Aucune"} />
        <StatCard label="Stock faible" value={stats.lowStock.length} icon={AlertTriangle} tone="warning" hint={stats.lowStock.slice(0, 2).map((p) => p.name).join(", ") || "Aucun"} />
        <StatCard label="Tickets ouverts" value={stats.openTickets} icon={TicketIcon} tone="primary" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Activité récente */}
        <Card className="lg:col-span-2 border-border/60">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <HistoryIcon className="h-4 w-4 text-primary" /> Activité récente
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => onNavigate("history")} className="text-xs">
              Tout voir
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {recentActivity.length === 0 ? (
              <EmptyState title="Aucune activité" description="Les ventes, dépenses et modifications apparaîtront ici." />
            ) : (
              <ul className="divide-y divide-border max-h-[28rem] overflow-y-auto scrollbar-thin">
                {recentActivity.map((item) => (
                  <li key={`${item.type}-${item.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-lg shrink-0 ${
                        item.tone === "success"
                          ? "bg-emerald-100 text-emerald-700"
                          : item.tone === "danger"
                          ? "bg-red-100 text-red-700"
                          : item.tone === "primary"
                          ? "bg-primary/15 text-primary"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {item.amount !== undefined ? (
                        item.amount >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />
                      ) : (
                        <Package className="h-4 w-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{formatDateTime(item.date)}</p>
                    </div>
                    {item.amount !== undefined && (
                      <span className={`text-sm font-semibold ${item.amount >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                        {item.amount >= 0 ? "+" : ""}
                        <Money amount={item.amount} currency={currency} />
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Alertes stock */}
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" /> Alertes stock
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {stats.outOfStock.length === 0 && stats.lowStock.length === 0 ? (
              <EmptyState title="Tout est en ordre" description="Aucune alerte de stock." />
            ) : (
              <ul className="divide-y divide-border max-h-[28rem] overflow-y-auto scrollbar-thin">
                {stats.outOfStock.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-2 px-4 py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{getCategoryName(p.categoryId)}</p>
                    </div>
                    <Badge variant="destructive" className="shrink-0">🔴 Rupture</Badge>
                  </li>
                ))}
                {stats.lowStock.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-2 px-4 py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{p.name}</p>
                      <p className="text-xs text-muted-foreground">Restant : {p.stock} {p.unit}</p>
                    </div>
                    <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 shrink-0">⚠️ Faible</Badge>
                  </li>
                ))}
              </ul>
            )}
            <div className="p-3 border-t">
              <Button variant="outline" size="sm" className="w-full" onClick={() => onNavigate("stock")}>
                Gérer le stock
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
