// ============================================================
// ELISHAMA — Module : Caisse
// ============================================================
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import {
  PageHeader,
  StatCard,
  EmptyState,
  ConfirmDialog,
  SectionTitle,
  Money,
} from "@/components/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Banknote,
  Plus,
  Minus,
  FileDown,
  Trash2,
  ArrowUpCircle,
  ArrowDownCircle,
  Wallet,
  PiggyBank,
  TrendingUp,
  AlertCircle,
  SlidersHorizontal,
  Receipt,
  CheckCircle2,
} from "lucide-react";
import { isSameDay, formatCurrency, formatDateTime, formatDate } from "@/lib/format";
import { exportTablePdf } from "@/lib/pdf";
import type { CashOperation, CashOperationType } from "@/lib/types";

const TYPE_LABELS: Record<CashOperationType, string> = {
  open: "Ouverture",
  close: "Fermeture",
  in: "Entrée manuelle",
  out: "Sortie manuelle",
  sale: "Vente",
  expense: "Dépense",
  correction: "Correction",
};

const TYPE_BADGE_CLASS: Record<CashOperationType, string> = {
  open: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-400",
  close: "bg-blue-100 text-blue-700 hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-400",
  in: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-400",
  out: "bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-950 dark:text-red-400",
  sale: "bg-primary/15 text-primary hover:bg-primary/15",
  expense: "bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-950 dark:text-red-400",
  correction: "bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-950 dark:text-amber-400",
};

export function Cash() {
  const { data, addCashOperation, deleteCashOperation } = useStore();
  const currency = data.settings.usage.currency;

  // ---- Dialogs ----
  const [inOpen, setInOpen] = useState(false);
  const [outOpen, setOutOpen] = useState(false);
  const [correctionOpen, setCorrectionOpen] = useState(false);
  const [deleteOp, setDeleteOp] = useState<CashOperation | null>(null);
  const [printMode, setPrintMode] = useState(false);

  // ---- Forms ----
  const [inAmount, setInAmount] = useState(0);
  const [inLabel, setInLabel] = useState("");
  const [outAmount, setOutAmount] = useState(0);
  const [outLabel, setOutLabel] = useState("");
  const [correctionAmount, setCorrectionAmount] = useState(0);
  const [correctionLabel, setCorrectionLabel] = useState("");

  // ---- Filter ----
  const [typeFilter, setTypeFilter] = useState<"all" | CashOperationType>("all");

  // ---- Today's operations ----
  const todayOps = data.cashOperations.filter((o) => isSameDay(o.createdAt));

  // ---- Stats ----
  const stats = useMemo(() => {
    let sales = 0;
    let expenses = 0;
    let manualIn = 0;
    let manualOut = 0;
    let opening = 0;
    let solde = 0;
    let salesCount = 0;
    for (const o of todayOps) {
      solde += o.amount;
      if (o.type === "sale") { sales += o.amount; salesCount++; }
      else if (o.type === "expense") expenses += -o.amount; // stored negative
      else if (o.type === "in") manualIn += o.amount;
      else if (o.type === "out") manualOut += -o.amount; // stored negative
      else if (o.type === "open") opening += o.amount;
    }
    const profit = sales - expenses;
    return { sales, expenses, manualIn, manualOut, solde, opening, profit, salesCount };
  }, [todayOps]);

  // ---- Filter operations ----
  const filteredOps = todayOps.filter((o) => typeFilter === "all" || o.type === typeFilter);

  function handleExportPdf() {
    const rows = filteredOps.map((op) => [formatDateTime(op.createdAt), TYPE_LABELS[op.type], `${formatCurrency(op.amount, currency)}`, op.label]);
    exportTablePdf({
      title: "Caisse",
      subtitle: `Exporté le ${formatDateTime(new Date().toISOString())}`,
      columns: ["Date", "Type", "Montant", "Libellé"],
      rows,
      filename: "caisse.pdf",
    });
    toast.success("PDF exporté");
  }

  // ---- Handlers ----
  function handleAddIn() {
    if (inAmount <= 0) {
      toast.error("Montant invalide");
      return;
    }
    if (!inLabel.trim()) {
      toast.error("Libellé requis");
      return;
    }
    addCashOperation({ type: "in", amount: inAmount, label: inLabel.trim() });
    toast.success("Entrée manuelle enregistrée");
    setInOpen(false);
    setInAmount(0);
    setInLabel("");
  }

  function handleAddOut() {
    if (outAmount <= 0) {
      toast.error("Montant invalide");
      return;
    }
    if (!outLabel.trim()) {
      toast.error("Libellé requis");
      return;
    }
    addCashOperation({ type: "out", amount: -outAmount, label: outLabel.trim() });
    toast.success("Sortie manuelle enregistrée");
    setOutOpen(false);
    setOutAmount(0);
    setOutLabel("");
  }

  function handleAddCorrection() {
    if (!correctionLabel.trim()) {
      toast.error("Libellé requis");
      return;
    }
    if (correctionAmount === 0) {
      toast.error("Montant non nul requis");
      return;
    }
    addCashOperation({
      type: "correction",
      amount: correctionAmount,
      label: correctionLabel.trim(),
    });
    toast.success("Correction enregistrée");
    setCorrectionOpen(false);
    setCorrectionAmount(0);
    setCorrectionLabel("");
  }

  function handleDeleteOp() {
    if (!deleteOp) return;
    deleteCashOperation(deleteOp.id);
    toast.success("Opération supprimée");
    setDeleteOp(null);
  }

  return (
    <div className="space-y-5">
      <div className="no-print space-y-5">
        <PageHeader
          title="Caisse"
          subtitle={`Suivi des flux financiers du ${formatDate(new Date())}`}
          icon={Banknote}
          actions={
            <>
              <Button variant="outline" onClick={handleExportPdf} className="gap-2">
                <FileDown className="h-4 w-4" /> Exporter en PDF
              </Button>
            </>
          }
        />

        {/* StatCards */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <StatCard
            label="Ventes du jour"
            value={formatCurrency(stats.sales, currency)}
            icon={TrendingUp}
            tone="success"
          />
          <StatCard
            label="Dépenses du jour"
            value={formatCurrency(stats.expenses, currency)}
            icon={Wallet}
            tone="danger"
          />
          <StatCard
            label="Bénéfice estimé"
            value={formatCurrency(stats.profit, currency)}
            icon={PiggyBank}
            tone={stats.profit >= 0 ? "primary" : "danger"}
            hint="Ventes - Dépenses"
          />
          <StatCard
            label="Entrées manuelles"
            value={formatCurrency(stats.manualIn, currency)}
            icon={ArrowUpCircle}
            tone="success"
          />
          <StatCard
            label="Sorties manuelles"
            value={formatCurrency(stats.manualOut, currency)}
            icon={ArrowDownCircle}
            tone="danger"
          />
          <StatCard
            label="Solde caisse"
            value={formatCurrency(stats.solde, currency)}
            icon={Banknote}
            tone={stats.solde >= 0 ? "primary" : "danger"}
            hint={`Fond d'ouverture : ${formatCurrency(stats.opening, currency)}`}
          />
        </div>

        {/* Actions rapides */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <Button variant="outline" onClick={() => setInOpen(true)} className="gap-2 justify-start">
            <ArrowUpCircle className="h-4 w-4 text-emerald-600" /> Entrée manuelle
          </Button>
          <Button variant="outline" onClick={() => setOutOpen(true)} className="gap-2 justify-start">
            <ArrowDownCircle className="h-4 w-4 text-red-600" /> Sortie manuelle
          </Button>
          <Button variant="outline" onClick={() => setCorrectionOpen(true)} className="gap-2 justify-start">
            <SlidersHorizontal className="h-4 w-4 text-amber-600" /> Correction
          </Button>
        </div>

        {/* Historique des opérations */}
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center justify-between gap-2 flex-wrap">
              <span className="flex items-center gap-2">
                <Receipt className="h-4 w-4 text-primary" /> Opérations du jour
              </span>
              <div className="flex items-center gap-2">
                <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as typeof typeFilter)}>
                  <SelectTrigger className="h-8 w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les types</SelectItem>
                    <SelectItem value="open">Ouvertures</SelectItem>
                    <SelectItem value="close">Fermetures</SelectItem>
                    <SelectItem value="in">Entrées manuelles</SelectItem>
                    <SelectItem value="out">Sorties manuelles</SelectItem>
                    <SelectItem value="sale">Ventes</SelectItem>
                    <SelectItem value="expense">Dépenses</SelectItem>
                    <SelectItem value="correction">Corrections</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredOps.length === 0 ? (
              <EmptyState
                icon={Banknote}
                title="Aucune opération"
                description="Les opérations de caisse du jour apparaîtront ici."
              />
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden md:block border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 text-muted-foreground">
                      <tr>
                        <th className="text-left font-medium px-3 py-2.5">Type</th>
                        <th className="text-left font-medium px-3 py-2.5">Libellé</th>
                        <th className="text-left font-medium px-3 py-2.5">Heure</th>
                        <th className="text-right font-medium px-3 py-2.5">Montant</th>
                        <th className="text-right font-medium px-3 py-2.5">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {filteredOps.map((o) => (
                        <tr key={o.id} className="hover:bg-muted/40 transition-colors">
                          <td className="px-3 py-2.5">
                            <Badge className={TYPE_BADGE_CLASS[o.type]}>{TYPE_LABELS[o.type]}</Badge>
                          </td>
                          <td className="px-3 py-2.5">{o.label}</td>
                          <td className="px-3 py-2.5 text-muted-foreground">{formatDateTime(o.createdAt)}</td>
                          <td className={`px-3 py-2.5 text-right font-semibold ${o.amount >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                            {o.amount >= 0 ? "+" : ""}
                            <Money amount={o.amount} currency={currency} />
                          </td>
                          <td className="px-3 py-2.5 text-right">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-destructive hover:text-destructive"
                              onClick={() => setDeleteOp(o)}
                              title="Supprimer"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards */}
                <div className="md:hidden space-y-2 max-h-[32rem] overflow-y-auto scrollbar-thin">
                  {filteredOps.map((o) => (
                    <Card key={o.id} className="border-border/60">
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <Badge className={TYPE_BADGE_CLASS[o.type]}>{TYPE_LABELS[o.type]}</Badge>
                            <p className="text-sm font-medium mt-1.5 break-words">{o.label}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{formatDateTime(o.createdAt)}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className={`font-bold ${o.amount >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                              {o.amount >= 0 ? "+" : ""}
                              <Money amount={o.amount} currency={currency} />
                            </p>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-destructive hover:text-destructive mt-1"
                              onClick={() => setDeleteOp(o)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ============ DIALOG : Entrée manuelle ============ */}
      <Dialog open={inOpen} onOpenChange={setInOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowUpCircle className="h-5 w-5 text-emerald-600" /> Entrée manuelle
            </DialogTitle>
            <DialogDescription>Enregistrer une entrée d'argent dans la caisse.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="in-amount">Montant</Label>
              <Input
                id="in-amount"
                type="number"
                value={inAmount}
                min={0}
                onChange={(e) => setInAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="in-label">Libellé</Label>
              <Textarea
                id="in-label"
                value={inLabel}
                onChange={(e) => setInLabel(e.target.value)}
                rows={2}
                placeholder="Apport personnel, remboursement..."
                className="resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInOpen(false)}>Annuler</Button>
            <Button onClick={handleAddIn} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
              <CheckCircle2 className="h-4 w-4" /> Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============ DIALOG : Sortie manuelle ============ */}
      <Dialog open={outOpen} onOpenChange={setOutOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowDownCircle className="h-5 w-5 text-red-600" /> Sortie manuelle
            </DialogTitle>
            <DialogDescription>Enregistrer une sortie d'argent de la caisse.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="out-amount">Montant</Label>
              <Input
                id="out-amount"
                type="number"
                value={outAmount}
                min={0}
                onChange={(e) => setOutAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="out-label">Libellé</Label>
              <Textarea
                id="out-label"
                value={outLabel}
                onChange={(e) => setOutLabel(e.target.value)}
                rows={2}
                placeholder="Achat petite fourniture, livraison..."
                className="resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOutOpen(false)}>Annuler</Button>
            <Button onClick={handleAddOut} variant="destructive" className="gap-2">
              <CheckCircle2 className="h-4 w-4" /> Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============ DIALOG : Correction ============ */}
      <Dialog open={correctionOpen} onOpenChange={setCorrectionOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600" /> Correction de caisse
            </DialogTitle>
            <DialogDescription>
              Saisissez un montant positif (entrée) ou négatif (sortie) pour corriger le solde.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="corr-amount">Montant (peut être négatif)</Label>
              <Input
                id="corr-amount"
                type="number"
                value={correctionAmount}
                onChange={(e) => setCorrectionAmount(parseFloat(e.target.value) || 0)}
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                Exemple : -500 pour une perte, +200 pour un excédent.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="corr-label">Motif de la correction</Label>
              <Textarea
                id="corr-label"
                value={correctionLabel}
                onChange={(e) => setCorrectionLabel(e.target.value)}
                rows={2}
                placeholder="Écart de caisse, erreur de saisie..."
                className="resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCorrectionOpen(false)}>Annuler</Button>
            <Button onClick={handleAddCorrection} className="gap-2">
              <CheckCircle2 className="h-4 w-4" /> Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============ CONFIRM : Suppression opération ============ */}
      <ConfirmDialog
        open={!!deleteOp}
        onOpenChange={(o) => !o && setDeleteOp(null)}
        title="Supprimer cette opération ?"
        description={
          deleteOp
            ? `L'opération « ${deleteOp.label} » (${formatCurrency(deleteOp.amount, currency)}) sera supprimée.`
            : ""
        }
        confirmLabel="Supprimer"
        cancelLabel="Conserver"
        destructive
        onConfirm={handleDeleteOp}
      />

      {/* ============ PRINT AREA ============ */}
      {printMode && (
        <div className="print-area hidden print:block">
          <PrintableCashReport
            operations={todayOps}
            currency={currency}
            restaurantName={data.settings.restaurant.name}
            stats={stats}
            isOpen={true}
          />
        </div>
      )}
    </div>
  );
}

// ============================================================
// Rapport de caisse imprimable
// ============================================================
function PrintableCashReport({
  operations,
  currency,
  restaurantName,
  stats,
  isOpen,
}: {
  operations: CashOperation[];
  currency: string;
  restaurantName: string;
  stats: {
    sales: number;
    expenses: number;
    manualIn: number;
    manualOut: number;
    solde: number;
    opening: number;
    profit: number;
  };
  isOpen: boolean;
}) {
  return (
    <div className="font-mono text-[12px] p-4">
      <div className="text-center mb-3">
        <p className="font-bold text-base">{restaurantName}</p>
        <p>Rapport de caisse</p>
        <p>{formatDate(new Date(), "DD/MM/YYYY")}</p>
        <p>État : {isOpen ? "CAISSE OUVERTE" : "CAISSE FERMÉE"}</p>
      </div>
      <p>================================</p>
      <div className="mb-2">
        <p>Ventes du jour       : {formatCurrency(stats.sales, currency)}</p>
        <p>Dépenses du jour     : - {formatCurrency(stats.expenses, currency)}</p>
        <p>Entrées manuelles    : {formatCurrency(stats.manualIn, currency)}</p>
        <p>Sorties manuelles    : - {formatCurrency(stats.manualOut, currency)}</p>
        <p>Fond d'ouverture     : {formatCurrency(stats.opening, currency)}</p>
      </div>
      <p>--------------------------------</p>
      <p className="font-bold">Bénéfice estimé : {formatCurrency(stats.profit, currency)}</p>
      <p className="font-bold">Solde caisse    : {formatCurrency(stats.solde, currency)}</p>
      <p>================================</p>
      <p className="mt-3 mb-1 font-bold">Détail des opérations ({operations.length})</p>
      <p>--------------------------------</p>
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-black">
            <th className="text-left py-1">Heure</th>
            <th className="text-left py-1">Type</th>
            <th className="text-left py-1 px-2">Libellé</th>
            <th className="text-right py-1">Montant</th>
          </tr>
        </thead>
        <tbody>
          {operations.map((o) => (
            <tr key={o.id} className="border-b border-gray-300">
              <td className="py-1">{formatDateTime(o.createdAt)}</td>
              <td className="py-1">{TYPE_LABELS[o.type]}</td>
              <td className="py-1 px-2">{o.label}</td>
              <td className={`py-1 text-right ${o.amount >= 0 ? "text-emerald-700" : "text-red-700"}`}>
                {o.amount >= 0 ? "+" : ""}
                {formatCurrency(o.amount, currency)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-4 text-center text-[10px]">Rapport généré le {formatDateTime(new Date())}</p>
    </div>
  );
}
