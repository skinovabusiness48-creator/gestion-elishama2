// ============================================================
// ELISHAMA — Module : Historique
// ============================================================
"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { PageHeader, EmptyState, ConfirmDialog, SearchInput } from "@/components/shared";
import {
  History,
  Trash2,
  Printer,
  Plus,
  Pencil,
  Archive,
  ArchiveRestore,
  XCircle,
  CheckCircle2,
  Activity,
  Layers,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { formatDateTime, isSameDay, isThisWeek, formatCurrency } from "@/lib/format";
import type { HistoryEntry } from "@/lib/types";

type DateFilter = "today" | "week" | "all";

const DATE_FILTERS: Record<DateFilter, string> = {
  today: "Aujourd'hui",
  week: "Cette semaine",
  all: "Toutes",
};

// Action colors
const ACTION_STYLES: Record<string, string> = {
  create: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
  update: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
  delete: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
  archive: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
  restore: "bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-400",
  close: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400",
  cancel: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400",
};

const ACTION_LABELS: Record<string, string> = {
  create: "Création",
  update: "Modification",
  delete: "Suppression",
  archive: "Archivage",
  restore: "Restauration",
  close: "Fermeture",
  cancel: "Annulation",
};

const ENTITY_LABELS: Record<string, string> = {
  product: "Produit",
  sale: "Vente",
  ticket: "Ticket",
  expense: "Dépense",
  stock: "Stock",
  cash: "Caisse",
  category: "Catégorie",
  paymentMethod: "Mode de paiement",
  expenseCategory: "Catégorie de dépense",
  zone: "Zone",
  table: "Table",
  system: "Système",
};

function ActionIcon({ action }: { action: string }) {
  switch (action) {
    case "create":
      return <Plus className="h-4 w-4" />;
    case "update":
      return <Pencil className="h-4 w-4" />;
    case "delete":
      return <Trash2 className="h-4 w-4" />;
    case "archive":
      return <Archive className="h-4 w-4" />;
    case "restore":
      return <ArchiveRestore className="h-4 w-4" />;
    case "close":
      return <CheckCircle2 className="h-4 w-4" />;
    case "cancel":
      return <XCircle className="h-4 w-4" />;
    default:
      return <Activity className="h-4 w-4" />;
  }
}

export function HistoryModule() {
  const { data, clearHistory } = useStore();
  const currency = data.settings.usage.currency;

  const [search, setSearch] = useState("");
  const [entityFilter, setEntityFilter] = useState<string>("all");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [confirmClear, setConfirmClear] = useState(false);
  const [detail, setDetail] = useState<HistoryEntry | null>(null);

  // Entités présentes dans l'historique
  const availableEntities = useMemo(() => {
    const set = new Set<string>();
    data.history.forEach((h) => set.add(h.entity));
    return Array.from(set).sort();
  }, [data.history]);

  const availableActions = useMemo(() => {
    const set = new Set<string>();
    data.history.forEach((h) => set.add(h.action));
    return Array.from(set).sort();
  }, [data.history]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.history.filter((h) => {
      if (entityFilter !== "all" && h.entity !== entityFilter) return false;
      if (actionFilter !== "all" && h.action !== actionFilter) return false;
      if (dateFilter === "today" && !isSameDay(h.createdAt)) return false;
      if (dateFilter === "week" && !isThisWeek(h.createdAt)) return false;
      if (q && !h.label.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [data.history, search, entityFilter, actionFilter, dateFilter]);

  const stats = useMemo(() => {
    const total = data.history.length;
    const byAction = new Map<string, number>();
    const byEntity = new Map<string, number>();
    data.history.forEach((h) => {
      byAction.set(h.action, (byAction.get(h.action) || 0) + 1);
      byEntity.set(h.entity, (byEntity.get(h.entity) || 0) + 1);
    });
    return {
      total,
      byAction: Array.from(byAction.entries()).sort((a, b) => b[1] - a[1]),
      byEntity: Array.from(byEntity.entries()).sort((a, b) => b[1] - a[1]),
    };
  }, [data.history]);

  return (
    <div className="print-area">
      <PageHeader
        title="Historique"
        subtitle="Journal complet des actions effectuées dans l'application"
        icon={History}
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              className="no-print gap-2"
              onClick={() => window.print()}
            >
              <Printer className="h-4 w-4" /> Imprimer
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="no-print gap-2 text-destructive hover:text-destructive"
              onClick={() => setConfirmClear(true)}
              disabled={data.history.length === 0}
            >
              <Trash2 className="h-4 w-4" /> Vider
            </Button>
          </>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 no-print">
        <Card className="border-border/60">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total entrées</p>
              <p className="text-xl font-bold">{stats.total}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Entités distinctes</p>
              <p className="text-xl font-bold">{stats.byEntity.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
              <Plus className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Créations</p>
              <p className="text-xl font-bold">
                {stats.byAction.find(([k]) => k === "create")?.[1] || 0}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400">
              <Trash2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Suppressions</p>
              <p className="text-xl font-bold">
                {stats.byAction.find(([k]) => k === "delete")?.[1] || 0}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-border/60 mb-4 no-print">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="lg:col-span-1">
              <label className="text-sm font-medium mb-1.5 block">Recherche</label>
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Rechercher dans le label..."
                className="w-full"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Entité</label>
              <Select value={entityFilter} onValueChange={setEntityFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Toutes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les entités</SelectItem>
                  {availableEntities.map((e) => (
                    <SelectItem key={e} value={e}>
                      {ENTITY_LABELS[e] || e}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Action</label>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Toutes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les actions</SelectItem>
                  {availableActions.map((a) => (
                    <SelectItem key={a} value={a}>
                      {ACTION_LABELS[a] || a}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Période</label>
              <Select
                value={dateFilter}
                onValueChange={(v) => setDateFilter(v as DateFilter)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(DATE_FILTERS) as DateFilter[]).map((k) => (
                    <SelectItem key={k} value={k}>
                      {DATE_FILTERS[k]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats breakdown */}
      {(stats.byAction.length > 0 || stats.byEntity.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4 no-print">
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Par action</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {stats.byAction.map(([action, count]) => (
                  <Badge
                    key={action}
                    className={ACTION_STYLES[action] || "bg-muted text-muted-foreground"}
                  >
                    {ACTION_LABELS[action] || action} : {count}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Par entité</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {stats.byEntity.map(([entity, count]) => (
                  <Badge key={entity} variant="secondary">
                    {ENTITY_LABELS[entity] || entity} : {count}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* List */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center justify-between">
            <span>Événements ({filtered.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <EmptyState
              icon={History}
              title="Aucun événement"
              description="L'historique est vide ou votre filtrage ne renvoie rien."
            />
          ) : (
            <ul className="divide-y divide-border max-h-[60vh] overflow-y-auto scrollbar-thin">
              {filtered.map((h) => (
                <li
                  key={h.id}
                  className="flex items-start gap-3 px-4 py-3 hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => setDetail(h)}
                >
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-lg shrink-0 ${
                      ACTION_STYLES[h.action] || "bg-muted text-muted-foreground"
                    }`}
                  >
                    <ActionIcon action={h.action} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-0.5">
                      <Badge
                        className={`text-[10px] px-1.5 py-0 ${
                          ACTION_STYLES[h.action] || "bg-muted text-muted-foreground"
                        }`}
                      >
                        {ACTION_LABELS[h.action] || h.action}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                        {ENTITY_LABELS[h.entity] || h.entity}
                      </Badge>
                    </div>
                    <p className="text-sm font-medium truncate">{h.label}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Clock className="h-3 w-3" /> {formatDateTime(h.createdAt)}
                    </p>
                  </div>
                  {h.amount !== undefined && (
                    <span
                      className={`text-sm font-semibold whitespace-nowrap ${
                        h.amount >= 0 ? "text-emerald-600" : "text-red-600"
                      }`}
                    >
                      {h.amount >= 0 ? "+" : ""}
                      {formatCurrency(h.amount, currency)}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Detail dialog */}
      <Dialog open={detail !== null} onOpenChange={(v) => !v && setDetail(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Détail de l'événement</DialogTitle>
            <DialogDescription>Informations complètes de l'entrée d'historique.</DialogDescription>
          </DialogHeader>
          {detail && (
            <div className="grid gap-3 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Action :</span>
                <Badge
                  className={ACTION_STYLES[detail.action] || "bg-muted text-muted-foreground"}
                >
                  {ACTION_LABELS[detail.action] || detail.action}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Entité :</span>
                <Badge variant="outline">{ENTITY_LABELS[detail.entity] || detail.entity}</Badge>
              </div>
              <div>
                <span className="text-muted-foreground block mb-0.5">Label :</span>
                <p className="font-medium">{detail.label}</p>
              </div>
              {detail.amount !== undefined && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Montant :</span>
                  <span
                    className={`font-semibold ${
                      detail.amount >= 0 ? "text-emerald-600" : "text-red-600"
                    }`}
                  >
                    {detail.amount >= 0 ? "+" : ""}
                    {formatCurrency(detail.amount, currency)}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Date :</span>
                <span className="font-medium">{formatDateTime(detail.createdAt)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">ID entité :</span>
                <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{detail.entityId || "—"}</code>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">ID entrée :</span>
                <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{detail.id}</code>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetail(null)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm clear */}
      <ConfirmDialog
        open={confirmClear}
        onOpenChange={setConfirmClear}
        title="Vider tout l'historique ?"
        description="Cette action est irréversible. Tous les événements enregistrés seront définitivement supprimés. Continuer ?"
        confirmLabel="Vider l'historique"
        cancelLabel="Annuler"
        onConfirm={() => {
          clearHistory();
          toast.success("Historique vidé");
        }}
      />
    </div>
  );
}
