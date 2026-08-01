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
  UtensilsCrossed,
  Banknote,
  Wallet as WalletIcon,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  ShoppingCart,
  ClipboardList,
  Settings as SettingsIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { isSameDay, formatCurrency, formatDateTime } from "@/lib/format";
import type { ModuleKey } from "@/lib/types";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

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

  // Données du graphique : CA des 7 derniers jours
  const weekData = useMemo(() => {
    const days: { label: string; revenue: number; expenses: number; date: Date }[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const daySales = data.sales.filter((s) => isSameDay(s.createdAt, d));
      const dayExpenses = data.expenses.filter((e) => isSameDay(e.date, d));
      days.push({
        label: d.toLocaleDateString("fr-FR", { weekday: "short" }).replace(".", ""),
        revenue: daySales.reduce((a, b) => a + b.total, 0),
        expenses: dayExpenses.reduce((a, b) => a + b.amount, 0),
        date: d,
      });
    }
    return days;
  }, [data.sales, data.expenses]);

  const weekRevenue = weekData.reduce((a, b) => a + b.revenue, 0);
  const weekHasData = weekRevenue > 0 || weekData.some((d) => d.expenses > 0);

  // Top 5 produits vendus (tous temps)
  const topProducts = useMemo(() => {
    const counts = new Map<string, { name: string; qty: number; revenue: number }>();
    data.sales.forEach((s) => {
      s.items.forEach((it) => {
        const existing = counts.get(it.productId);
        if (existing) {
          existing.qty += it.quantity;
          existing.revenue += it.total;
        } else {
          counts.set(it.productId, { name: it.productName, qty: it.quantity, revenue: it.total });
        }
      });
    });
    return [...counts.values()].sort((a, b) => b.qty - a.qty).slice(0, 5);
  }, [data.sales]);

  // Détermine si c'est un premier lancement (pas de produits ni ventes)
  const isEmpty = stats.activeProducts === 0 && data.sales.length === 0 && data.expenses.length === 0;

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

      {/* Panneau de bienvenue au premier lancement */}
      {isEmpty ? (
        <WelcomePanel onNavigate={onNavigate} />
      ) : (
        <>
          {/* Barre d'actions rapides */}
          <QuickActionsBar onNavigate={onNavigate} />

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

          {/* Graphique CA 7 jours + Top produits */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
            <Card className="lg:col-span-2 border-border/60">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" /> Revenus des 7 derniers jours
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">
                    Total : <span className="font-semibold text-foreground">{formatCurrency(weekRevenue, currency)}</span>
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => onNavigate("reports")} className="text-xs">
                  Rapports
                </Button>
              </CardHeader>
              <CardContent className="pt-0">
                {weekHasData ? (
                  <div className="h-[220px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={weekData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="oklch(0.62 0.17 45)" stopOpacity={0.35} />
                            <stop offset="95%" stopColor="oklch(0.62 0.17 45)" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="oklch(0.577 0.245 27)" stopOpacity={0.25} />
                            <stop offset="95%" stopColor="oklch(0.577 0.245 27)" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0.01 60)" vertical={false} />
                        <XAxis
                          dataKey="label"
                          tick={{ fontSize: 11, fill: "oklch(0.52 0.02 60)" }}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 11, fill: "oklch(0.52 0.02 60)" }}
                          tickLine={false}
                          axisLine={false}
                          width={48}
                          tickFormatter={(v: number) => (v >= 1000 ? `${Math.round(v / 1000)}k` : `${v}`)}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "var(--popover)",
                            border: "1px solid var(--border)",
                            borderRadius: "8px",
                            fontSize: "12px",
                            color: "var(--popover-foreground)",
                          }}
                          labelStyle={{ color: "var(--muted-foreground)", marginBottom: "4px" }}
                          formatter={(value: number, name: string) => [
                            formatCurrency(value, currency),
                            name === "revenue" ? "Ventes" : "Dépenses",
                          ]}
                        />
                        <Area
                          type="monotone"
                          dataKey="revenue"
                          stroke="oklch(0.62 0.17 45)"
                          strokeWidth={2}
                          fill="url(#colorRevenue)"
                          name="revenue"
                        />
                        <Area
                          type="monotone"
                          dataKey="expenses"
                          stroke="oklch(0.577 0.245 27)"
                          strokeWidth={2}
                          fill="url(#colorExpenses)"
                          name="expenses"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <EmptyState
                    icon={TrendingUp}
                    title="Pas encore de données"
                    description="Les revenus des 7 derniers jours apparaîtront ici dès votre première vente."
                  />
                )}
              </CardContent>
            </Card>

            {/* Top 5 produits */}
            <Card className="border-border/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <UtensilsCrossed className="h-4 w-4 text-primary" /> Top produits
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {topProducts.length === 0 ? (
                  <EmptyState
                    icon={UtensilsCrossed}
                    title="Aucune vente"
                    description="Les produits les plus vendus apparaîtront ici."
                  />
                ) : (
                  <ul className="divide-y divide-border">
                    {topProducts.map((p, i) => (
                      <li key={p.name} className="flex items-center gap-3 px-4 py-3">
                        <span className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold shrink-0 ${
                          i === 0 ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400"
                          : i === 1 ? "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                          : i === 2 ? "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400"
                          : "bg-muted text-muted-foreground"
                        }`}>
                          {i + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{p.name}</p>
                          <p className="text-xs text-muted-foreground">{p.qty} vendu(s)</p>
                        </div>
                        <span className="text-sm font-semibold text-emerald-600 shrink-0">
                          <Money amount={p.revenue} currency={currency} />
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="p-3 border-t">
                  <Button variant="outline" size="sm" className="w-full" onClick={() => onNavigate("reports")}>
                    Voir les rapports
                  </Button>
                </div>
              </CardContent>
            </Card>
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
        </>
      )}
    </div>
  );
}

// ---------- Barre d'actions rapides ----------
function QuickActionsBar({ onNavigate }: { onNavigate: (k: ModuleKey) => void }) {
  const actions: { label: string; icon: typeof Plus; module: ModuleKey; tone: string }[] = [
    { label: "Nouvelle vente", icon: ShoppingCart, module: "sales", tone: "bg-primary text-primary-foreground hover:bg-primary/90" },
    { label: "Nouveau ticket", icon: TicketIcon, module: "tickets", tone: "bg-card border border-border hover:bg-muted" },
    { label: "Ajouter produit", icon: UtensilsCrossed, module: "products", tone: "bg-card border border-border hover:bg-muted" },
    { label: "Dépense", icon: WalletIcon, module: "expenses", tone: "bg-card border border-border hover:bg-muted" },
    { label: "Caisse", icon: Banknote, module: "cash", tone: "bg-card border border-border hover:bg-muted" },
  ];
  return (
    <div className="mb-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
      {actions.map((a) => {
        const Icon = a.icon;
        return (
          <button
            key={a.label}
            onClick={() => onNavigate(a.module)}
            className={`flex items-center gap-2.5 rounded-xl px-3 sm:px-4 py-3 text-sm font-medium transition-all hover:shadow-md ${a.tone}`}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="truncate">{a.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ---------- Panneau de bienvenue (premier lancement) ----------
function WelcomePanel({ onNavigate }: { onNavigate: (k: ModuleKey) => void }) {
  const steps: { num: number; title: string; desc: string; icon: typeof UtensilsCrossed; module: ModuleKey; cta: string }[] = [
    {
      num: 1,
      title: "Ajoutez vos produits",
      desc: "Créez votre carte : plats, boissons, accompagnements avec prix et stock.",
      icon: UtensilsCrossed,
      module: "products",
      cta: "Gérer les produits",
    },
    {
      num: 2,
      title: "Enregistrez une vente",
      desc: "Sélectionnez les produits, choisissez le mode de paiement, validez en un clic.",
      icon: ShoppingCart,
      module: "sales",
      cta: "Nouvelle vente",
    },
    {
      num: 3,
      title: "Suivez votre caisse",
      desc: "Ouvrez la caisse, visualisez entrées/sorties et bénéfice en temps réel.",
      icon: Banknote,
      module: "cash",
      cta: "Ouvrir la caisse",
    },
    {
      num: 4,
      title: "Personnalisez tout",
      desc: "Catégories, tables, zones, modes de paiement, devise, logo du restaurant.",
      icon: SettingsIcon,
      module: "settings",
      cta: "Paramètres",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Hero de bienvenue */}
      <Card className="overflow-hidden border-primary/30 bg-gradient-to-br from-primary/10 via-background to-accent/40">
        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
            <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/30 shrink-0">
              <Sparkles className="h-8 w-8 sm:h-10 sm:w-10" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Badge className="bg-primary/15 text-primary border-0">Bienvenue</Badge>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                Votre restaurant est prêt à démarrer
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground mt-1.5 max-w-xl">
                ELISHAMA est une application simple et légère pour gérer vos ventes, stock, tickets, caisse et dépenses.
                Toutes les données restent sur cet appareil, hors ligne. Commencez par ajouter vos produits.
              </p>
              <div className="flex flex-wrap gap-2 mt-4">
                <Button onClick={() => onNavigate("products")} className="gap-2">
                  <UtensilsCrossed className="h-4 w-4" /> Commencer par les produits
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button variant="outline" onClick={() => onNavigate("settings")}>
                  <SettingsIcon className="h-4 w-4 mr-2" /> Configurer le restaurant
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Étapes de démarrage */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <ClipboardList className="h-5 w-5 text-primary" />
          <h3 className="text-base sm:text-lg font-semibold">Premiers pas</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <button
                key={step.num}
                onClick={() => onNavigate(step.module)}
                className="group flex items-start gap-4 rounded-xl border border-border/60 bg-card p-4 sm:p-5 text-left transition-all hover:border-primary/40 hover:shadow-md"
              >
                <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                  <Icon className="h-5 w-5" />
                  <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                    {step.num}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground">{step.title}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">{step.desc}</p>
                  <span className="inline-flex items-center gap-1 text-sm font-medium text-primary mt-2 group-hover:gap-2 transition-all">
                    {step.cta} <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Rassurances */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { icon: CheckCircle2, title: "100% hors ligne", desc: "Fonctionne sans internet" },
          { icon: CheckCircle2, title: "Données locales", desc: "Tout reste sur votre appareil" },
          { icon: CheckCircle2, title: "Sans abonnement", desc: "Gratuit, à vie" },
        ].map((r) => {
          const Icon = r.icon;
          return (
            <div key={r.title} className="flex items-center gap-3 rounded-lg bg-muted/50 px-4 py-3">
              <Icon className="h-5 w-5 text-emerald-600 shrink-0" />
              <div>
                <p className="text-sm font-medium">{r.title}</p>
                <p className="text-xs text-muted-foreground">{r.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
