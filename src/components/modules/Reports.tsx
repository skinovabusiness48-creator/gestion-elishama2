// ============================================================
// ELISHAMA — Module : Rapports
// ============================================================
"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { PageHeader, StatCard, EmptyState, Money } from "@/components/shared";
import {
  BarChart3,
  FileDown,
  Download,
  TrendingUp,
  TrendingDown,
  ShoppingBag,
  PiggyBank,
  Package,
  PackageX,
  AlertTriangle,
  Boxes,
  ArrowUpRight,
  ArrowDownRight,
  Trophy,
  Anchor,
  CreditCard,
  Calendar,
  Clock,
  Receipt,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
  formatCurrency,
  formatDate,
} from "@/lib/format";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

type PeriodKey = "today" | "yesterday" | "week" | "month" | "year" | "custom";

const PERIOD_LABELS: Record<PeriodKey, string> = {
  today: "Aujourd'hui",
  yesterday: "Hier",
  week: "Cette semaine",
  month: "Ce mois",
  year: "Cette année",
  custom: "Date personnalisée",
};

const PIE_COLORS = [
  "oklch(0.62 0.17 45)",
  "oklch(0.55 0.13 230)",
  "oklch(0.65 0.18 145)",
  "oklch(0.62 0.19 350)",
  "oklch(0.62 0.16 90)",
  "oklch(0.55 0.18 290)",
  "oklch(0.7 0.15 25)",
  "oklch(0.6 0.15 195)",
];

export function Reports() {
  const { data, getExpenseCategoryName, getPaymentMethodName } = useStore();
  const currency = data.settings.usage.currency;
  const dateFormat = data.settings.usage.dateFormat;

  const [period, setPeriod] = useState<PeriodKey>("month");
  const [customStart, setCustomStart] = useState<string>(
    new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10),
  );
  const [customEnd, setCustomEnd] = useState<string>(new Date().toISOString().slice(0, 10));

  const dateRange = useMemo(() => {
    const now = new Date();
    let start: Date;
    let end: Date = new Date(now);
    end.setHours(23, 59, 59, 999);
    switch (period) {
      case "today":
        start = new Date(now);
        start.setHours(0, 0, 0, 0);
        break;
      case "yesterday": {
        start = new Date(now);
        start.setDate(start.getDate() - 1);
        start.setHours(0, 0, 0, 0);
        end = new Date(start);
        end.setHours(23, 59, 59, 999);
        break;
      }
      case "week": {
        start = new Date(now);
        const day = start.getDay();
        const diff = start.getDate() - day + (day === 0 ? -6 : 1);
        start.setDate(diff);
        start.setHours(0, 0, 0, 0);
        break;
      }
      case "month":
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "year":
        start = new Date(now.getFullYear(), 0, 1);
        break;
      case "custom": {
        start = new Date(`${customStart}T00:00:00`);
        end = new Date(`${customEnd}T23:59:59`);
        break;
      }
    }
    return { start, end };
  }, [period, customStart, customEnd]);

  function inRange(dateStr: string): boolean {
    const d = new Date(dateStr);
    return d >= dateRange.start && d <= dateRange.end;
  }

  // -------- Sales stats --------
  const sales = useMemo(() => data.sales.filter((s) => inRange(s.createdAt)), [data.sales, dateRange.start, dateRange.end]);
  const salesStats = useMemo(() => {
    const revenue = sales.reduce((a, b) => a + b.total, 0);
    const count = sales.length;
    const avg = count > 0 ? revenue / count : 0;

    // Quantité par produit
    const productQty = new Map<string, { name: string; qty: number; revenue: number }>();
    sales.forEach((s) => {
      s.items.forEach((it) => {
        const cur = productQty.get(it.productId) || { name: it.productName, qty: 0, revenue: 0 };
        cur.qty += it.quantity;
        cur.revenue += it.total;
        productQty.set(it.productId, cur);
      });
    });
    const productsByQty = Array.from(productQty.values()).sort((a, b) => b.qty - a.qty);
    const top5 = productsByQty.slice(0, 5);
    const best = productsByQty[0];
    const worst = productsByQty[productsByQty.length - 1];

    // Répartition par mode de paiement
    const pmMap = new Map<string, number>();
    sales.forEach((s) => {
      pmMap.set(s.paymentMethodId, (pmMap.get(s.paymentMethodId) || 0) + s.total);
    });
    const byPayment = Array.from(pmMap.entries()).map(([id, value]) => ({
      name: getPaymentMethodName(id),
      value,
    }));

    // Ventes par jour (graphique)
    const byDay = new Map<string, { day: string; revenue: number; count: number }>();
    sales.forEach((s) => {
      const d = new Date(s.createdAt);
      const key = formatDate(d, dateFormat);
      const cur = byDay.get(key) || { day: key, revenue: 0, count: 0 };
      cur.revenue += s.total;
      cur.count += 1;
      byDay.set(key, cur);
    });
    const dailyChart = Array.from(byDay.values()).sort((a, b) => a.day.localeCompare(b.day));

    // Ventes par jour de la semaine (lundi-dimanche)
    const dayNames = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
    const byWeekday = new Map<string, number>();
    sales.forEach((s) => {
      const d = new Date(s.createdAt).getDay();
      const name = dayNames[d];
      byWeekday.set(name, (byWeekday.get(name) || 0) + s.total);
    });
    const weekdayChart = dayNames.slice(1).concat(dayNames[0]).map((name) => ({
      name: name.slice(0, 3),
      revenue: byWeekday.get(name) || 0,
    }));
    const bestWeekday = weekdayChart.reduce((best, d) => (d.revenue > best.revenue ? d : best), weekdayChart[0]);

    // Ventes par heure (0-23)
    const byHour = new Array(24).fill(0);
    sales.forEach((s) => {
      const h = new Date(s.createdAt).getHours();
      byHour[h] += s.total;
    });
    const hourlyChart = byHour.map((revenue, h) => ({ hour: `${h}h`, revenue })).filter((d) => d.revenue > 0);
    const peakHour = hourlyChart.reduce((best, d) => (d.revenue > best.revenue ? d : best), hourlyChart[0] || { hour: "—", revenue: 0 });

    return { revenue, count, avg, top5, best, worst, byPayment, dailyChart, weekdayChart, bestWeekday, hourlyChart, peakHour };
  }, [sales, currency, dateFormat, getPaymentMethodName]);

  // -------- Expense stats --------
  const expenses = useMemo(() => data.expenses.filter((e) => inRange(e.date)), [data.expenses, dateRange.start, dateRange.end]);
  const expenseStats = useMemo(() => {
    const total = expenses.reduce((a, b) => a + b.amount, 0);
    const byCat = new Map<string, number>();
    expenses.forEach((e) => {
      byCat.set(e.categoryId, (byCat.get(e.categoryId) || 0) + e.amount);
    });
    const chart = Array.from(byCat.entries())
      .map(([id, value]) => ({ name: getExpenseCategoryName(id), value }))
      .sort((a, b) => b.value - a.value);
    return { total, count: expenses.length, chart };
  }, [expenses, getExpenseCategoryName]);

  // -------- Stock stats --------
  const stockStats = useMemo(() => {
    const active = data.products.filter((p) => !p.archived);
    const outOfStock = active.filter((p) => p.stock <= 0);
    const lowStock = active.filter((p) => p.stock > 0 && p.stock <= p.minStock);
    const stockValue = active.reduce(
      (a, b) => a + b.stock * (b.purchasePrice || 0),
      0,
    );
    const movements = data.stockMovements.filter((m) => inRange(m.createdAt));
    const inQty = movements.filter((m) => m.type === "in").reduce((a, b) => a + Math.abs(b.quantity), 0);
    const outQty = movements.filter((m) => m.type === "out").reduce((a, b) => a + Math.abs(b.quantity), 0);
    return {
      available: active.length,
      outOfStock: outOfStock.length,
      lowStock: lowStock.length,
      stockValue,
      movementsIn: inQty,
      movementsOut: outQty,
      movementsCount: movements.length,
    };
  }, [data.products, data.stockMovements, dateRange.start, dateRange.end]);

  // -------- Profit --------
  const profit = salesStats.revenue - expenseStats.total;
  const margin = salesStats.revenue > 0 ? (profit / salesStats.revenue) * 100 : 0;

  // -------- Période précédente (comparaison) --------
  const previousPeriod = useMemo(() => {
    const duration = dateRange.end.getTime() - dateRange.start.getTime();
    const prevEnd = new Date(dateRange.start.getTime() - 1); // jour avant le début
    const prevStart = new Date(prevEnd.getTime() - duration);
    const prevSales = data.sales.filter((s) => {
      const d = new Date(s.createdAt);
      return d >= prevStart && d <= prevEnd;
    });
    const prevExpenses = data.expenses.filter((e) => {
      const d = new Date(e.date);
      return d >= prevStart && d <= prevEnd;
    });
    const prevRevenue = prevSales.reduce((a, b) => a + b.total, 0);
    const prevExpensesTotal = prevExpenses.reduce((a, b) => a + b.amount, 0);
    const prevProfit = prevRevenue - prevExpensesTotal;
    return {
      revenue: prevRevenue,
      expenses: prevExpensesTotal,
      profit: prevProfit,
      salesCount: prevSales.length,
      start: prevStart,
      end: prevEnd,
    };
  }, [data.sales, data.expenses, dateRange.start, dateRange.end]);

  const hasPreviousData = previousPeriod.revenue > 0 || previousPeriod.expenses > 0;
  const revenueDiff = salesStats.revenue - previousPeriod.revenue;
  const profitDiff = profit - previousPeriod.profit;

  // -------- Export --------
  function exportJSON() {
    const payload = {
      exportedAt: new Date().toISOString(),
      period: {
        key: period,
        label: PERIOD_LABELS[period],
        start: dateRange.start.toISOString(),
        end: dateRange.end.toISOString(),
      },
      currency,
      sales: {
        revenue: salesStats.revenue,
        count: salesStats.count,
        averageBasket: salesStats.avg,
        top5: salesStats.top5,
        byPayment: salesStats.byPayment,
        byDay: salesStats.dailyChart,
      },
      expenses: {
        total: expenseStats.total,
        count: expenseStats.count,
        byCategory: expenseStats.chart,
      },
      stock: {
        available: stockStats.available,
        outOfStock: stockStats.outOfStock,
        lowStock: stockStats.lowStock,
        stockValue: stockStats.stockValue,
        movementsIn: stockStats.movementsIn,
        movementsOut: stockStats.movementsOut,
      },
      profit: {
        revenue: salesStats.revenue,
        expenses: expenseStats.total,
        result: profit,
        marginPercent: margin,
      },
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `elishama-rapport-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Rapport exporté");
  }

  const periodLabel = useMemo(() => {
    if (period === "custom") {
      return `${formatDate(dateRange.start, dateFormat)} → ${formatDate(dateRange.end, dateFormat)}`;
    }
    return PERIOD_LABELS[period];
  }, [period, dateRange, dateFormat]);

  function handleExportPdf() {
    const rows = [
      ["Période", periodLabel],
      ["Ventes", `${formatCurrency(stats.revenue, currency)}`],
      ["Dépenses", `${formatCurrency(stats.expenses, currency)}`],
      ["Bénéfice", `${formatCurrency(stats.profit, currency)}`],
      ["Produits vendus", `${stats.itemsSold}`],
      ["Produits en stock", `${stats.activeProducts}`],
    ];
    exportTablePdf({
      title: "Rapports",
      subtitle: `Exporté le ${formatDateTime(new Date().toISOString())}`,
      columns: ["Indicateur", "Valeur"],
      rows,
      filename: "rapports.pdf",
    });
    toast.success("PDF exporté");
  }

  return (
    <div className="print-area">
      <PageHeader
        title="Rapports"
        subtitle="Analyse des ventes, dépenses, stock et bénéfices"
        icon={BarChart3}
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              className="no-print gap-2"
              onClick={handleExportPdf}
            >
              <FileDown className="h-4 w-4" /> Exporter en PDF
            </Button>
            <Button variant="outline" size="sm" className="no-print gap-2" onClick={exportJSON}>
              <Download className="h-4 w-4" /> Exporter
            </Button>
          </>
        }
      />

      {/* Period selector */}
      <Card className="border-border/60 mb-4 no-print">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-2">
            {(Object.keys(PERIOD_LABELS) as PeriodKey[]).map((k) => (
              <Button
                key={k}
                size="sm"
                variant={period === k ? "default" : "outline"}
                onClick={() => setPeriod(k)}
              >
                {PERIOD_LABELS[k]}
              </Button>
            ))}
          </div>
          {period === "custom" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              <div className="grid gap-1.5">
                <Label htmlFor="rpt-from">Du</Label>
                <Input
                  id="rpt-from"
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="rpt-to">Au</Label>
                <Input
                  id="rpt-to"
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                />
              </div>
            </div>
          )}
          <p className="text-xs text-muted-foreground mt-3">
            Période analysée : <span className="font-medium">{periodLabel}</span>
          </p>
        </CardContent>
      </Card>

      <Tabs defaultValue="sales">
        <TabsList className="mb-4 no-print">
          <TabsTrigger value="sales">Ventes</TabsTrigger>
          <TabsTrigger value="expenses">Dépenses</TabsTrigger>
          <TabsTrigger value="stock">Stock</TabsTrigger>
          <TabsTrigger value="profit">Bénéfice</TabsTrigger>
        </TabsList>

        {/* SALES TAB */}
        <TabsContent value="sales">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4">
            <StatCard
              label="Chiffre d'affaires"
              value={formatCurrency(salesStats.revenue, currency)}
              icon={TrendingUp}
              tone="success"
            />
            <StatCard
              label="Nombre de ventes"
              value={salesStats.count}
              icon={Receipt}
              tone="default"
            />
            <StatCard
              label="Panier moyen"
              value={formatCurrency(salesStats.avg, currency)}
              icon={ShoppingBag}
              tone="primary"
            />
            <StatCard
              label="Produits distincts vendus"
              value={salesStats.top5.length > 0 ? (salesStats.top5.length > 5 ? "5+" : salesStats.top5.length) : 0}
              icon={Boxes}
              tone="warning"
            />
          </div>

          {/* Best / Worst */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            <Card className="border-border/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-amber-500" /> Produit le plus vendu
                </CardTitle>
              </CardHeader>
              <CardContent>
                {salesStats.best ? (
                  <div>
                    <p className="text-lg font-bold">{salesStats.best.name}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {salesStats.best.qty} unité(s) vendue(s) —{" "}
                      <Money amount={salesStats.best.revenue} currency={currency} />
                    </p>
                  </div>
                ) : (
                  <EmptyState icon={Receipt} title="Aucune vente sur la période" />
                )}
              </CardContent>
            </Card>
            <Card className="border-border/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Anchor className="h-4 w-4 text-muted-foreground" /> Produit le moins vendu
                </CardTitle>
              </CardHeader>
              <CardContent>
                {salesStats.worst ? (
                  <div>
                    <p className="text-lg font-bold">{salesStats.worst.name}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {salesStats.worst.qty} unité(s) vendue(s) —{" "}
                      <Money amount={salesStats.worst.revenue} currency={currency} />
                    </p>
                  </div>
                ) : (
                  <EmptyState icon={Receipt} title="Aucune vente sur la période" />
                )}
              </CardContent>
            </Card>
          </div>

          {/* Daily chart */}
          <Card className="border-border/60 mb-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Ventes par jour</CardTitle>
            </CardHeader>
            <CardContent>
              {salesStats.dailyChart.length === 0 ? (
                <EmptyState icon={BarChart3} title="Pas de données à afficher" />
              ) : (
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={salesStats.dailyChart} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip
                        formatter={(value: number, name: string) =>
                          name === "revenue"
                            ? [formatCurrency(value, currency), "CA"]
                            : [String(value), "Ventes"]
                        }
                        contentStyle={{ fontSize: 12, borderRadius: 8 }}
                      />
                      <Bar dataKey="revenue" fill="oklch(0.62 0.17 45)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top 5 + payment split */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="border-border/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Top 5 produits</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {salesStats.top5.length === 0 ? (
                  <EmptyState icon={Boxes} title="Aucune vente" />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>#</TableHead>
                        <TableHead>Produit</TableHead>
                        <TableHead className="text-right">Qté</TableHead>
                        <TableHead className="text-right">CA</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {salesStats.top5.map((p, i) => (
                        <TableRow key={`${p.name}-${i}`}>
                          <TableCell className="font-semibold">{i + 1}</TableCell>
                          <TableCell className="font-medium">{p.name}</TableCell>
                          <TableCell className="text-right">{p.qty}</TableCell>
                          <TableCell className="text-right font-semibold">
                            <Money amount={p.revenue} currency={currency} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            <Card className="border-border/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-primary" /> Modes de paiement
                </CardTitle>
              </CardHeader>
              <CardContent>
                {salesStats.byPayment.length === 0 ? (
                  <EmptyState icon={CreditCard} title="Aucun paiement" />
                ) : salesStats.byPayment.length === 1 ? (
                  <div className="py-6 text-center">
                    <p className="text-lg font-bold">{salesStats.byPayment[0].name}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      100% — <Money amount={salesStats.byPayment[0].value} currency={currency} />
                    </p>
                  </div>
                ) : (
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={salesStats.byPayment}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label={(entry) => `${entry.name}`}
                          labelLine={false}
                        >
                          {salesStats.byPayment.map((_, i) => (
                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: number) => [formatCurrency(value, currency), "Montant"]}
                          contentStyle={{ fontSize: 12, borderRadius: 8 }}
                        />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Statistiques avancées */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Ventes par jour de la semaine */}
            <Card className="border-border/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" /> Ventes par jour de la semaine
                </CardTitle>
                {salesStats.bestWeekday && salesStats.bestWeekday.revenue > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Meilleur jour : <span className="font-semibold text-foreground">{salesStats.bestWeekday.name}</span> ({formatCurrency(salesStats.bestWeekday.revenue, currency)})
                  </p>
                )}
              </CardHeader>
              <CardContent>
                {salesStats.weekdayChart.some((d) => d.revenue > 0) ? (
                  <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={salesStats.weekdayChart} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0.01 60)" vertical={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 11, fill: "oklch(0.52 0.02 60)" }} tickLine={false} axisLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: "oklch(0.52 0.02 60)" }} tickLine={false} axisLine={false} width={48} tickFormatter={(v: number) => (v >= 1000 ? `${Math.round(v / 1000)}k` : `${v}`)} />
                        <Tooltip
                          contentStyle={{ backgroundColor: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12, color: "var(--popover-foreground)" }}
                          formatter={(value: number) => [formatCurrency(value, currency), "CA"]}
                        />
                        <Bar dataKey="revenue" fill="oklch(0.62 0.17 45)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">Aucune vente sur la période</p>
                )}
              </CardContent>
            </Card>

            {/* Ventes par heure */}
            <Card className="border-border/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" /> Ventes par heure
                </CardTitle>
                {salesStats.peakHour && salesStats.peakHour.revenue > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Heure de pointe : <span className="font-semibold text-foreground">{salesStats.peakHour.hour}</span> ({formatCurrency(salesStats.peakHour.revenue, currency)})
                  </p>
                )}
              </CardHeader>
              <CardContent>
                {salesStats.hourlyChart.length > 0 ? (
                  <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={salesStats.hourlyChart} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0.01 60)" vertical={false} />
                        <XAxis dataKey="hour" tick={{ fontSize: 11, fill: "oklch(0.52 0.02 60)" }} tickLine={false} axisLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: "oklch(0.52 0.02 60)" }} tickLine={false} axisLine={false} width={48} tickFormatter={(v: number) => (v >= 1000 ? `${Math.round(v / 1000)}k` : `${v}`)} />
                        <Tooltip
                          contentStyle={{ backgroundColor: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12, color: "var(--popover-foreground)" }}
                          formatter={(value: number) => [formatCurrency(value, currency), "CA"]}
                        />
                        <Bar dataKey="revenue" fill="oklch(0.6 0.13 150)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">Aucune vente sur la période</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* EXPENSES TAB */}
        <TabsContent value="expenses">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-4">
            <StatCard
              label="Total dépenses"
              value={formatCurrency(expenseStats.total, currency)}
              icon={TrendingDown}
              tone="danger"
            />
            <StatCard
              label="Nombre de dépenses"
              value={expenseStats.count}
              icon={Receipt}
              tone="default"
            />
            <StatCard
              label="Dépense moyenne"
              value={formatCurrency(
                expenseStats.count > 0 ? expenseStats.total / expenseStats.count : 0,
                currency,
              )}
              icon={ShoppingBag}
              tone="warning"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="border-border/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Répartition par catégorie</CardTitle>
              </CardHeader>
              <CardContent>
                {expenseStats.chart.length === 0 ? (
                  <EmptyState icon={TrendingDown} title="Aucune dépense" />
                ) : (
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={expenseStats.chart}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label={(entry) => `${entry.name}`}
                          labelLine={false}
                        >
                          {expenseStats.chart.map((_, i) => (
                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: number) => [formatCurrency(value, currency), "Montant"]}
                          contentStyle={{ fontSize: 12, borderRadius: 8 }}
                        />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-border/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Détail par catégorie</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {expenseStats.chart.length === 0 ? (
                  <EmptyState icon={TrendingDown} title="Aucune dépense" />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Catégorie</TableHead>
                        <TableHead className="text-right">Montant</TableHead>
                        <TableHead className="text-right">%</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {expenseStats.chart.map((c) => {
                        const pct = expenseStats.total > 0 ? (c.value / expenseStats.total) * 100 : 0;
                        return (
                          <TableRow key={c.name}>
                            <TableCell className="font-medium">{c.name}</TableCell>
                            <TableCell className="text-right font-semibold">
                              <Money amount={c.value} currency={currency} />
                            </TableCell>
                            <TableCell className="text-right text-muted-foreground">
                              {pct.toFixed(1)}%
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* STOCK TAB */}
        <TabsContent value="stock">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4">
            <StatCard
              label="Produits actifs"
              value={stockStats.available}
              icon={Package}
              tone="default"
            />
            <StatCard
              label="Stock faible"
              value={stockStats.lowStock}
              icon={AlertTriangle}
              tone="warning"
            />
            <StatCard
              label="Ruptures"
              value={stockStats.outOfStock}
              icon={PackageX}
              tone="danger"
            />
            <StatCard
              label="Valeur du stock"
              value={formatCurrency(stockStats.stockValue, currency)}
              icon={Boxes}
              tone="primary"
              hint="Stock × prix d'achat"
            />
          </div>

          <Card className="border-border/60 mb-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Mouvements de stock (période)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
                    <ArrowDownRight className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Entrées</p>
                    <p className="text-lg font-bold">{stockStats.movementsIn}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-950/30">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300">
                    <ArrowUpRight className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Sorties</p>
                    <p className="text-lg font-bold">{stockStats.movementsOut}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
                    <Boxes className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total mouvements</p>
                    <p className="text-lg font-bold">{stockStats.movementsCount}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Alertes stock</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {stockStats.outOfStock === 0 && stockStats.lowStock === 0 ? (
                <EmptyState icon={Package} title="Tout est en ordre" description="Aucune alerte de stock." />
              ) : (
                <ul className="divide-y divide-border max-h-96 overflow-y-auto scrollbar-thin">
                  {data.products
                    .filter((p) => !p.archived && (p.stock <= 0 || (p.stock > 0 && p.stock <= p.minStock)))
                    .map((p) => (
                      <li key={p.id} className="flex items-center justify-between gap-2 px-4 py-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{p.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Stock: {p.stock} {p.unit} • Min: {p.minStock} {p.unit}
                          </p>
                        </div>
                        {p.stock <= 0 ? (
                          <Badge variant="destructive">Rupture</Badge>
                        ) : (
                          <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Faible</Badge>
                        )}
                      </li>
                    ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* PROFIT TAB */}
        <TabsContent value="profit">
          <Card className="border-border/60 mb-4 bg-gradient-to-br from-primary/5 to-transparent">
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center">
                <p className="text-sm text-muted-foreground">Résultat estimé de la période</p>
                <p
                  className={`text-3xl sm:text-4xl font-bold mt-2 ${
                    profit >= 0 ? "text-emerald-600" : "text-red-600"
                  }`}
                >
                  {profit >= 0 ? "+" : "−"}
                  <Money amount={Math.abs(profit)} currency={currency} />
                </p>
                <div className="flex items-center gap-3 mt-4 text-sm">
                  <span className="font-semibold text-emerald-600">
                    <Money amount={salesStats.revenue} currency={currency} />
                  </span>
                  <span className="text-muted-foreground">−</span>
                  <span className="font-semibold text-red-600">
                    <Money amount={expenseStats.total} currency={currency} />
                  </span>
                  <span className="text-muted-foreground">=</span>
                  <span className={`font-bold ${profit >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                    <Money amount={profit} currency={currency} />
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  Marge nette : <span className="font-semibold">{margin.toFixed(1)}%</span>
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <StatCard
              label="Chiffre d'affaires"
              value={formatCurrency(salesStats.revenue, currency)}
              icon={TrendingUp}
              tone="success"
            />
            <StatCard
              label="Dépenses"
              value={formatCurrency(expenseStats.total, currency)}
              icon={TrendingDown}
              tone="danger"
            />
            <StatCard
              label="Résultat"
              value={formatCurrency(profit, currency)}
              icon={PiggyBank}
              tone={profit >= 0 ? "primary" : "danger"}
            />
            <StatCard
              label="Marge %"
              value={`${margin.toFixed(1)}%`}
              icon={BarChart3}
              tone={margin >= 0 ? "success" : "danger"}
            />
          </div>

          {/* Comparaison avec la période précédente */}
          {hasPreviousData && (
            <Card className="border-border/60 mt-4">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-primary" /> Comparaison avec la période précédente
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  Du {formatDate(previousPeriod.start, dateFormat)} au {formatDate(previousPeriod.end, dateFormat)}
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* CA */}
                  <div className="rounded-lg border border-border/60 p-4">
                    <p className="text-xs text-muted-foreground">Chiffre d'affaires</p>
                    <p className="text-lg font-bold mt-1">
                      <Money amount={previousPeriod.revenue} currency={currency} />
                    </p>
                    <p className={`text-xs font-medium mt-1 ${revenueDiff >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                      {revenueDiff >= 0 ? "↑" : "↓"} {revenueDiff >= 0 ? "+" : "−"}
                      <Money amount={Math.abs(revenueDiff)} currency={currency} />
                    </p>
                  </div>
                  {/* Dépenses */}
                  <div className="rounded-lg border border-border/60 p-4">
                    <p className="text-xs text-muted-foreground">Dépenses</p>
                    <p className="text-lg font-bold mt-1">
                      <Money amount={previousPeriod.expenses} currency={currency} />
                    </p>
                    <p className={`text-xs font-medium mt-1 ${previousPeriod.expenses - expenseStats.total >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                      {previousPeriod.expenses - expenseStats.total >= 0 ? "↓" : "↑"}
                      {previousPeriod.expenses - expenseStats.total >= 0 ? " −" : " +"}
                      <Money amount={Math.abs(previousPeriod.expenses - expenseStats.total)} currency={currency} />
                    </p>
                  </div>
                  {/* Résultat */}
                  <div className="rounded-lg border border-border/60 p-4">
                    <p className="text-xs text-muted-foreground">Résultat</p>
                    <p className={`text-lg font-bold mt-1 ${previousPeriod.profit >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                      <Money amount={previousPeriod.profit} currency={currency} />
                    </p>
                    <p className={`text-xs font-medium mt-1 ${profitDiff >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                      {profitDiff >= 0 ? "↑" : "↓"} {profitDiff >= 0 ? "+" : "−"}
                      <Money amount={Math.abs(profitDiff)} currency={currency} />
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
