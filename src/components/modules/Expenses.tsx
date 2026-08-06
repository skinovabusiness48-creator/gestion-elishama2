// ============================================================
// ELISHAMA — Module : Dépenses
// ============================================================
"use client";

import { useMemo, useState, useCallback } from "react";
import { useStore } from "@/lib/store";
import { useNewActionListener } from "@/hooks/use-new-action-listener";
import {
  PageHeader,
  StatCard,
  EmptyState,
  ConfirmDialog,
  SearchInput,
  Money,
} from "@/components/shared";
import {
  Wallet,
  Plus,
  Pencil,
  Trash2,
  FileDown,
  Download,
  Tag,
  CalendarDays,
  TrendingDown,
  Receipt,
  Layers,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
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
  formatDateTime,
  formatDate,
  isSameDay,
  isThisWeek,
  isThisMonth,
  todayISO,
} from "@/lib/format";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import type { Expense, ExpenseCategory } from "@/lib/types";

type DateFilter = "today" | "yesterday" | "week" | "month" | "all";

const DATE_FILTER_LABELS: Record<DateFilter, string> = {
  today: "Aujourd'hui",
  yesterday: "Hier",
  week: "Cette semaine",
  month: "Ce mois",
  all: "Toutes",
};

function matchesDate(date: string, filter: DateFilter): boolean {
  const d = new Date(date);
  const now = new Date();
  switch (filter) {
    case "today":
      return isSameDay(d, now);
    case "yesterday": {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      return isSameDay(d, y);
    }
    case "week":
      return isThisWeek(d, now);
    case "month":
      return isThisMonth(d, now);
    case "all":
      return true;
  }
}

export function Expenses() {
  const {
    data,
    addExpense,
    updateExpense,
    deleteExpense,
    addExpenseCategory,
    updateExpenseCategory,
    deleteExpenseCategory,
    getExpenseCategoryName,
  } = useStore();
  const currency = data.settings.usage.currency;
  const dateFormat = data.settings.usage.dateFormat;

  // --- UI state ---
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");

  // expense form dialog
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);

  // Raccourci "N" → ouvre le dialog nouvelle dépense
  const handleNewExpense = useCallback(() => {
    setEditing(null);
    setFormOpen(true);
  }, []);
  useNewActionListener(handleNewExpense);

  // category management dialog
  const [catOpen, setCatOpen] = useState(false);

  // confirm delete expense
  const [delId, setDelId] = useState<string | null>(null);

  // confirm delete category
  const [delCatId, setDelCatId] = useState<string | null>(null);

  // form state
  const [fDate, setFDate] = useState<string>(todayISO().slice(0, 10));
  const [fLabel, setFLabel] = useState("");
  const [fCategory, setFCategory] = useState<string>("");
  const [fAmount, setFAmount] = useState<string>("");
  const [fNote, setFNote] = useState("");

  // category form state
  const [newCatName, setNewCatName] = useState("");
  const [editingCat, setEditingCat] = useState<ExpenseCategory | null>(null);
  const [editCatName, setEditCatName] = useState("");

  // ---------- Derived data ----------
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.expenses
      .filter((e) => matchesDate(e.date, dateFilter))
      .filter((e) => (categoryFilter === "all" ? true : e.categoryId === categoryFilter))
      .filter((e) =>
        q ? e.label.toLowerCase().includes(q) || (e.note || "").toLowerCase().includes(q) : true,
      )
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [data.expenses, search, categoryFilter, dateFilter]);

  const stats = useMemo(() => {
    const todayList = data.expenses.filter((e) => isSameDay(e.date));
    const monthList = data.expenses.filter((e) => isThisMonth(e.date));
    const todayTotal = todayList.reduce((a, b) => a + b.amount, 0);
    const monthTotal = monthList.reduce((a, b) => a + b.amount, 0);
    const allTotal = data.expenses.reduce((a, b) => a + b.amount, 0);
    const count = data.expenses.length;
    const avg = count > 0 ? allTotal / count : 0;
    return { todayTotal, monthTotal, count, avg };
  }, [data.expenses]);

  const byCategory = useMemo(() => {
    const map = new Map<string, number>();
    filtered.forEach((e) => {
      map.set(e.categoryId, (map.get(e.categoryId) || 0) + e.amount);
    });
    return Array.from(map.entries())
      .map(([catId, value]) => ({
        name: getExpenseCategoryName(catId),
        value,
      }))
      .sort((a, b) => b.value - a.value);
  }, [filtered, getExpenseCategoryName]);

  // ---------- Handlers ----------
  function openCreate() {
    setEditing(null);
    setFDate(todayISO().slice(0, 10));
    setFLabel("");
    setFCategory(data.expenseCategories[0]?.id || "");
    setFAmount("");
    setFNote("");
    setFormOpen(true);
  }

  function openEdit(exp: Expense) {
    setEditing(exp);
    setFDate(exp.date.slice(0, 10));
    setFLabel(exp.label);
    setFCategory(exp.categoryId);
    setFAmount(String(exp.amount));
    setFNote(exp.note || "");
    setFormOpen(true);
  }

  function submitForm() {
    const label = fLabel.trim();
    const amount = parseFloat(fAmount);
    if (!label) {
      toast.error("Le libellé est obligatoire");
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Le montant doit être un nombre positif");
      return;
    }
    if (!fCategory) {
      toast.error("Veuillez sélectionner une catégorie");
      return;
    }
    // Build ISO date from yyyy-mm-dd input, preserving local time
    const dateIso = new Date(`${fDate}T12:00:00`).toISOString();
    const payload = {
      date: dateIso,
      label,
      categoryId: fCategory,
      amount,
      note: fNote.trim() || undefined,
    };
    if (editing) {
      updateExpense(editing.id, payload);
      toast.success("Dépense modifiée");
    } else {
      addExpense(payload);
      toast.success("Dépense ajoutée");
    }
    setFormOpen(false);
  }

  function exportCSV() {
    const headers = ["Date", "Libellé", "Catégorie", "Montant", "Note"];
    const rows = filtered.map((e) => [
      formatDate(e.date, dateFormat),
      e.label.replace(/"/g, '""'),
      getExpenseCategoryName(e.categoryId).replace(/"/g, '""'),
      String(e.amount),
      (e.note || "").replace(/"/g, '""'),
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((c) => `"${c}"`).join(","))
      .join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `elishama-depenses-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Export CSV téléchargé");
  }

  function exportJSON() {
    const payload = {
      exportedAt: new Date().toISOString(),
      currency,
      expenses: filtered.map((e) => ({
        ...e,
        categoryName: getExpenseCategoryName(e.categoryId),
      })),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `elishama-depenses-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Export JSON téléchargé");
  }

  // Category handlers
  function addCat() {
    const name = newCatName.trim();
    if (!name) {
      toast.error("Le nom de la catégorie est obligatoire");
      return;
    }
    addExpenseCategory(name);
    setNewCatName("");
    toast.success("Catégorie ajoutée");
  }

  function startEditCat(cat: ExpenseCategory) {
    setEditingCat(cat);
    setEditCatName(cat.name);
  }

  function handleExportPdf() {
    const rows = filteredExpenses.map((e) => [formatDate(e.date), e.label, getExpenseCategoryName(e.categoryId), `${formatCurrency(e.amount, currency)}`, e.note || ""]);
    exportTablePdf({
      title: "Dépenses",
      subtitle: `Exporté le ${formatDateTime(new Date().toISOString())}`,
      columns: ["Date", "Libellé", "Catégorie", "Montant", "Note"],
      rows,
      filename: "depenses.pdf",
    });
    toast.success("PDF exporté");
  }

  function saveEditCat() {
    if (!editingCat) return;
    const name = editCatName.trim();
    if (!name) {
      toast.error("Le nom ne peut pas être vide");
      return;
    }
    updateExpenseCategory(editingCat.id, { name });
    toast.success("Catégorie modifiée");
    setEditingCat(null);
  }

  return (
    <div className="print-area">
      <PageHeader
        title="Dépenses"
        subtitle="Suivi de toutes les sorties d'argent du restaurant"
        icon={Wallet}
        actions={
          <>
            <Button variant="outline" size="sm" className="no-print gap-2" onClick={handleExportPdf}>
              <FileDown className="h-4 w-4" /> Exporter en PDF
            </Button>
            <Button variant="outline" size="sm" className="no-print gap-2" onClick={exportCSV}>
              <Download className="h-4 w-4" /> CSV
            </Button>
            <Button variant="outline" size="sm" className="no-print gap-2" onClick={exportJSON}>
              <Download className="h-4 w-4" /> JSON
            </Button>
            <Button variant="outline" size="sm" className="no-print gap-2" onClick={() => setCatOpen(true)}>
              <Tag className="h-4 w-4" /> Catégories
            </Button>
            <Button size="sm" className="no-print gap-2" onClick={openCreate}>
              <Plus className="h-4 w-4" /> Ajouter une dépense
              <kbd className="hidden sm:inline-flex h-5 items-center rounded border border-white/30 bg-white/10 px-1.5 text-[10px] font-mono">N</kbd>
            </Button>
          </>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <StatCard
          label="Dépenses du jour"
          value={formatCurrency(stats.todayTotal, currency)}
          icon={CalendarDays}
          tone="danger"
          hint="Aujourd'hui"
        />
        <StatCard
          label="Dépenses du mois"
          value={formatCurrency(stats.monthTotal, currency)}
          icon={TrendingDown}
          tone="warning"
          hint="Mois en cours"
        />
        <StatCard
          label="Nombre de dépenses"
          value={stats.count}
          icon={Receipt}
          tone="default"
          hint="Total cumulé"
        />
        <StatCard
          label="Dépense moyenne"
          value={formatCurrency(stats.avg, currency)}
          icon={Layers}
          tone="primary"
          hint="Sur toutes les dépenses"
        />
      </div>

      {/* Filters */}
      <Card className="border-border/60 mb-4 no-print">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="lg:col-span-2">
              <Label className="mb-1.5 block">Recherche</Label>
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Libellé, note..."
                className="w-full"
              />
            </div>
            <div>
              <Label className="mb-1.5 block">Catégorie</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Toutes les catégories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les catégories</SelectItem>
                  {data.expenseCategories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1.5 block">Période</Label>
              <Select
                value={dateFilter}
                onValueChange={(v) => setDateFilter(v as DateFilter)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(DATE_FILTER_LABELS) as DateFilter[]).map((k) => (
                    <SelectItem key={k} value={k}>
                      {DATE_FILTER_LABELS[k]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chart by category */}
      {byCategory.length > 0 && (
        <Card className="border-border/60 mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" /> Répartition par catégorie
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={byCategory} layout="vertical" margin={{ left: 8, right: 16 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 12 }} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={130}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip
                      formatter={(value: number) => [formatCurrency(value, currency), "Montant"]}
                      contentStyle={{ fontSize: 12, borderRadius: 8 }}
                    />
                    <Bar
                      dataKey="value"
                      fill="oklch(0.62 0.17 45)"
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-col justify-center gap-2">
                {byCategory.map((c) => {
                  const total = byCategory.reduce((a, b) => a + b.value, 0);
                  const pct = total > 0 ? Math.round((c.value / total) * 100) : 0;
                  return (
                    <div key={c.name} className="flex items-center justify-between gap-2 py-1.5 border-b last:border-0">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{c.name}</p>
                        <p className="text-xs text-muted-foreground">{pct}% du total filtré</p>
                      </div>
                      <span className="text-sm font-semibold whitespace-nowrap">
                        <Money amount={c.value} currency={currency} />
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Table (desktop) */}
      <Card className="border-border/60 hidden md:block">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            Dépenses ({filtered.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <EmptyState
              icon={Wallet}
              title="Aucune dépense"
              description="Commencez par ajouter une dépense ou modifiez vos filtres."
              action={
                <Button size="sm" className="gap-2 no-print" onClick={openCreate}>
                  <Plus className="h-4 w-4" /> Ajouter une dépense
                </Button>
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Libellé</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                  <TableHead>Note</TableHead>
                  <TableHead className="text-right no-print">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="text-sm">{formatDate(e.date, dateFormat)}</TableCell>
                    <TableCell className="text-sm font-medium">{e.label}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{getExpenseCategoryName(e.categoryId)}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold text-red-600">
                      −<Money amount={e.amount} currency={currency} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                      {e.note || "—"}
                    </TableCell>
                    <TableCell className="text-right no-print">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEdit(e)}
                          aria-label="Modifier"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => setDelId(e.id)}
                          aria-label="Supprimer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Cards (mobile) */}
      <div className="md:hidden grid grid-cols-1 gap-3 no-print">
        {filtered.length === 0 ? (
          <Card className="border-border/60">
            <CardContent>
              <EmptyState
                icon={Wallet}
                title="Aucune dépense"
                description="Commencez par ajouter une dépense."
                action={
                  <Button size="sm" className="gap-2" onClick={openCreate}>
                    <Plus className="h-4 w-4" /> Ajouter
                  </Button>
                }
              />
            </CardContent>
          </Card>
        ) : (
          filtered.map((e) => (
            <Card key={e.id} className="border-border/60">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{e.label}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(e.date, dateFormat)}</p>
                    <Badge variant="secondary" className="mt-1">
                      {getExpenseCategoryName(e.categoryId)}
                    </Badge>
                  </div>
                  <span className="font-semibold text-red-600 whitespace-nowrap">
                    −<Money amount={e.amount} currency={currency} />
                  </span>
                </div>
                {e.note && <p className="text-xs text-muted-foreground mt-2">{e.note}</p>}
                <div className="flex items-center gap-2 mt-3">
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={() => openEdit(e)}>
                    <Pencil className="h-3.5 w-3.5" /> Modifier
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 text-destructive"
                    onClick={() => setDelId(e.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Supprimer
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Expense form dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Modifier la dépense" : "Nouvelle dépense"}</DialogTitle>
            <DialogDescription>
              {editing
                ? "Mettez à jour les informations de la dépense."
                : "Renseignez les détails de la dépense."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="exp-date">Date</Label>
              <Input
                id="exp-date"
                type="date"
                value={fDate}
                onChange={(e) => setFDate(e.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="exp-label">Libellé *</Label>
              <Input
                id="exp-label"
                value={fLabel}
                placeholder="Ex: Achat de riz"
                onChange={(e) => setFLabel(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="exp-cat">Catégorie *</Label>
                <Select value={fCategory} onValueChange={setFCategory}>
                  <SelectTrigger id="exp-cat" className="w-full">
                    <SelectValue placeholder="Choisir..." />
                  </SelectTrigger>
                  <SelectContent>
                    {data.expenseCategories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="exp-amount">Montant *</Label>
                <Input
                  id="exp-amount"
                  type="number"
                  min="0"
                  step="any"
                  value={fAmount}
                  placeholder="0"
                  onChange={(e) => setFAmount(e.target.value)}
                />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="exp-note">Note</Label>
              <Textarea
                id="exp-note"
                value={fNote}
                placeholder="Informations complémentaires (optionnel)"
                onChange={(e) => setFNote(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              Annuler
            </Button>
            <Button onClick={submitForm}>
              {editing ? "Enregistrer" : "Ajouter"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Category management dialog */}
      <Dialog open={catOpen} onOpenChange={setCatOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Catégories de dépenses</DialogTitle>
            <DialogDescription>
              Gérez les catégories utilisées pour classer les dépenses.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="flex gap-2">
              <Input
                value={newCatName}
                placeholder="Nouvelle catégorie..."
                onChange={(e) => setNewCatName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addCat();
                  }
                }}
              />
              <Button onClick={addCat} className="gap-2 shrink-0">
                <Plus className="h-4 w-4" /> Ajouter
              </Button>
            </div>
            <div className="max-h-72 overflow-y-auto scrollbar-thin divide-y rounded-md border">
              {data.expenseCategories.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  Aucune catégorie pour le moment.
                </p>
              ) : (
                data.expenseCategories.map((cat) => (
                  <div key={cat.id} className="flex items-center justify-between gap-2 px-3 py-2">
                    {editingCat?.id === cat.id ? (
                      <>
                        <Input
                          value={editCatName}
                          onChange={(e) => setEditCatName(e.target.value)}
                          className="h-8"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              saveEditCat();
                            }
                          }}
                        />
                        <div className="flex gap-1">
                          <Button size="sm" onClick={saveEditCat}>
                            OK
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingCat(null)}
                          >
                            Annuler
                          </Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <span className="text-sm font-medium truncate">{cat.name}</span>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => startEditCat(cat)}
                            aria-label="Modifier"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => setDelCatId(cat.id)}
                            aria-label="Supprimer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCatOpen(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm delete expense */}
      <ConfirmDialog
        open={delId !== null}
        onOpenChange={(v) => !v && setDelId(null)}
        title="Supprimer la dépense ?"
        description="Cette action est irréversible."
        confirmLabel="Supprimer"
        onConfirm={() => {
          if (delId) {
            deleteExpense(delId);
            toast.success("Dépense supprimée");
          }
          setDelId(null);
        }}
      />

      {/* Confirm delete category */}
      <ConfirmDialog
        open={delCatId !== null}
        onOpenChange={(v) => !v && setDelCatId(null)}
        title="Supprimer la catégorie ?"
        description="Les dépenses liées seront reclassées en « Autres ». Cette action est irréversible."
        confirmLabel="Supprimer"
        onConfirm={() => {
          if (delCatId) {
            deleteExpenseCategory(delCatId);
            toast.success("Catégorie supprimée");
          }
          setDelCatId(null);
        }}
      />
    </div>
  );
}
