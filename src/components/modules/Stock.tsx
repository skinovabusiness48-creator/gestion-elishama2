// ============================================================
// ELISHAMA — Module : Stock & Mouvements
// ============================================================
"use client";

import React, { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import {
  PageHeader,
  StatCard,
  EmptyState,
  ConfirmDialog,
  SearchInput,
  SectionTitle,
  StockBadge,
} from "@/components/shared";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Package,
  FileDown,
  PackagePlus,
  PackageMinus,
  SlidersHorizontal,
  History as HistoryIcon,
  Trash2,
  AlertTriangle,
  PackageX,
  Boxes,
  TrendingUp,
  ArrowDownRight,
  ArrowUpRight,
  Info,
} from "lucide-react";
import { formatCurrency, formatDateTime } from "@/lib/format";
import type { Product, StockMovement } from "@/lib/types";

type StockFilter = "all" | "low" | "out";

// ============================================================
// Composant principal
// ============================================================
export function Stock() {
  const {
    data,
    adjustStock,
    setProductStock,
    deleteStockMovement,
    getCategoryName,
    getProduct,
  } = useStore();
  const currency = data.settings.usage.currency;

  // ---- Filtres ----
  const [search, setSearch] = useState("");
  const [stockFilter, setStockFilter] = useState<StockFilter>("all");

  // ---- Dialog stock ----
  const [stockProductId, setStockProductId] = useState<string | null>(null);
  const [stockMode, setStockMode] = useState<"in" | "out" | "adjust">("in");
  const [stockQty, setStockQty] = useState<number>(0);
  const [stockUnitPrice, setStockUnitPrice] = useState<number>(0);
  const [stockReason, setStockReason] = useState<string>("");

  // ---- Dialog historique ----
  const [historyProductId, setHistoryProductId] = useState<string | null>(null);

  // ---- Confirm suppression mouvement ----
  const [deleteMovementId, setDeleteMovementId] = useState<string | null>(null);

  // ---- Produits actifs (non archivés) ----
  const activeProducts = useMemo(
    () => data.products.filter((p) => !p.archived),
    [data.products]
  );

  // ---- Stats ----
  const stats = useMemo(() => {
    const outOfStock = activeProducts.filter((p) => p.stock <= 0);
    const lowStock = activeProducts.filter((p) => p.stock > 0 && p.stock <= p.minStock);
    const available = activeProducts.filter((p) => p.stock > p.minStock);
    // Valeur du stock : on utilise le prix d'achat si dispo, sinon prix de vente
    const stockValue = activeProducts.reduce((sum, p) => {
      const price = p.purchasePrice && p.purchasePrice > 0 ? p.purchasePrice : p.salePrice;
      return sum + p.stock * price;
    }, 0);
    return {
      total: activeProducts.length,
      available: available.length,
      low: lowStock.length,
      out: outOfStock.length,
      stockValue,
    };
  }, [activeProducts]);

  // ---- Produits filtrés ----
  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return activeProducts.filter((p) => {
      if (q && !p.name.toLowerCase().includes(q)) return false;
      if (stockFilter === "low" && !(p.stock > 0 && p.stock <= p.minStock)) return false;
      if (stockFilter === "out" && p.stock > 0) return false;
      return true;
    });
  }, [activeProducts, search, stockFilter]);

  // ---- Mouvements récents ----
  const recentMovements = useMemo(
    () => [...data.stockMovements].slice(0, 50),
    [data.stockMovements]
  );

  // ============================================================
  // Handlers
  // ============================================================
  function openStockDialog(p: Product, mode: "in" | "out" | "adjust") {
    setStockProductId(p.id);
    setStockMode(mode);
    setStockQty(mode === "adjust" ? p.stock : 0);
    setStockUnitPrice(p.purchasePrice || 0);
    setStockReason("");
  }

  function handleSaveStock() {
    if (!stockProductId) return;
    const p = getProduct(stockProductId);
    if (!p) return;
    const qty = Number(stockQty) || 0;
    if (stockMode !== "adjust" && qty <= 0) {
      toast.error("Quantité invalide", { description: "Saisissez une quantité supérieure à 0." });
      return;
    }
    if (stockMode === "in") {
      const price = Number(stockUnitPrice) || 0;
      adjustStock(p.id, qty, stockReason || "Entrée de stock", "in", price > 0 ? price : undefined);
      toast.success("Entrée enregistrée", { description: `${p.name} : +${qty} ${p.unit}${price > 0 ? ` à ${formatCurrency(price, currency)}/${p.unit}` : ""}` });
    } else if (stockMode === "out") {
      adjustStock(p.id, -qty, stockReason || "Sortie de stock", "out");
      toast.success("Sortie enregistrée", { description: `${p.name} : -${qty} ${p.unit}` });
    } else {
      if (qty < 0) {
        toast.error("Stock invalide", { description: "Le stock ne peut pas être négatif." });
        return;
      }
      setProductStock(p.id, qty, stockReason || "Correction de stock");
      toast.success("Stock corrigé", { description: `${p.name} → ${qty} ${p.unit}` });
    }
    setStockProductId(null);
  }

  function handleConfirmDeleteMovement() {
    if (!deleteMovementId) return;
    deleteStockMovement(deleteMovementId);
    toast.success("Mouvement supprimé", { description: "Le stock n'a pas été recalculé automatiquement." });
    setDeleteMovementId(null);
  }

  // ---- Données dérivées pour dialogs ----
  const stockProduct = stockProductId ? getProduct(stockProductId) : null;
  const historyProduct = historyProductId ? getProduct(historyProductId) : null;
  const historyMovements = useMemo(
    () => (historyProduct ? data.stockMovements.filter((m) => m.productId === historyProduct.id) : []),
    [historyProduct, data.stockMovements]
  );
  const deleteMovement = deleteMovementId ? data.stockMovements.find((m) => m.id === deleteMovementId) : null;

  return (
    <div>
      <PageHeader
        title="Stock"
        subtitle="Suivez vos quantités, approvisionnez et corrigez votre inventaire."
        icon={Package}
        actions={
          <Button variant="outline" className="gap-2 no-print" onClick={() => window.print()}>
            <FileDown className="h-4 w-4" /> Exporter en PDF
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <StatCard label="Produits suivis" value={stats.total} icon={Boxes} tone="primary" hint={`${stats.available} bien approvisionnés`} />
        <StatCard label="Stock faible" value={stats.low} icon={AlertTriangle} tone="warning" hint="À réapprovisionner bientôt" />
        <StatCard label="Ruptures" value={stats.out} icon={PackageX} tone="danger" hint="Produits épuisés" />
        <StatCard label="Valeur du stock" value={formatCurrency(stats.stockValue, currency)} icon={TrendingUp} tone="success" hint="Stock × prix d'achat" />
      </div>

      {/* Alertes globales */}
      {(stats.out > 0 || stats.low > 0) && (
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-900 mb-4 no-print">
          <CardContent className="p-3 sm:p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-amber-900 dark:text-amber-200">
                {stats.out > 0 && `${stats.out} produit(s) en rupture`}
                {stats.out > 0 && stats.low > 0 && " · "}
                {stats.low > 0 && `${stats.low} produit(s) en stock faible`}
              </p>
              <p className="text-amber-700 dark:text-amber-300 mt-0.5">Pensez à réapprovisionner ces produits pour éviter les ruptures de service.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Liste des produits */}
      <SectionTitle>État du stock</SectionTitle>
      <Card className="border-border/60 mb-6">
        <CardContent className="p-3 sm:p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <SearchInput value={search} onChange={setSearch} placeholder="Rechercher un produit..." className="sm:col-span-2" />
            <Select value={stockFilter} onValueChange={(v) => setStockFilter(v as StockFilter)}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Filtrer..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les produits</SelectItem>
                <SelectItem value="low">Stock faible ⚠️</SelectItem>
                <SelectItem value="out">Ruptures 🔴</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {filteredProducts.length === 0 ? (
        <Card className="border-border/60 mb-6">
          <CardContent className="p-0">
            <EmptyState
              icon={Package}
              title="Aucun produit"
              description={activeProducts.length === 0 ? "Ajoutez des produits depuis le module Produits." : "Aucun produit ne correspond à vos filtres."}
            />
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Tableau desktop */}
          <Card className="border-border/60 hidden md:block mb-6">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produit</TableHead>
                    <TableHead>Catégorie</TableHead>
                    <TableHead className="text-right">Prix achat</TableHead>
                    <TableHead className="text-right">Prix vente</TableHead>
                    <TableHead className="text-right">Marge/unité</TableHead>
                    <TableHead className="text-center">Stock actuel</TableHead>
                    <TableHead className="text-center">Minimum</TableHead>
                    <TableHead className="text-center">État</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((p) => {
                    const margin = (p.salePrice || 0) - (p.purchasePrice || 0);
                    return (
                    <TableRow key={p.id} className="hover:bg-muted/40">
                      <TableCell>
                        <p className="font-medium">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{p.unit}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{getCategoryName(p.categoryId) || "—"}</Badge>
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {p.purchasePrice ? formatCurrency(p.purchasePrice, currency) : <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell className="text-right text-sm font-medium">
                        {formatCurrency(p.salePrice, currency)}
                      </TableCell>
                      <TableCell className={`text-right text-sm font-medium ${margin >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                        {p.purchasePrice ? formatCurrency(margin, currency) : "—"}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={`font-semibold ${p.stock <= 0 ? "text-red-600" : p.stock <= p.minStock ? "text-amber-600" : ""}`}>
                          {p.stock}
                        </span>
                      </TableCell>
                      <TableCell className="text-center text-muted-foreground">{p.minStock}</TableCell>
                      <TableCell className="text-center">
                        <StockBadge stock={p.stock} minStock={p.minStock} />
                      </TableCell>
                      <TableCell className="text-right">
                        <StockActions
                          onIn={() => openStockDialog(p, "in")}
                          onOut={() => openStockDialog(p, "out")}
                          onAdjust={() => openStockDialog(p, "adjust")}
                          onHistory={() => setHistoryProductId(p.id)}
                        />
                      </TableCell>
                    </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Cartes mobile */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:hidden mb-6">
            {filteredProducts.map((p) => {
              const margin = (p.salePrice || 0) - (p.purchasePrice || 0);
              return (
              <Card key={p.id} className={`border-border/60 ${p.stock <= 0 ? "border-red-300 dark:border-red-900" : p.stock <= p.minStock ? "border-amber-300 dark:border-amber-900" : ""}`}>
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{getCategoryName(p.categoryId) || "Sans catégorie"} · {p.unit}</p>
                    </div>
                    <StockBadge stock={p.stock} minStock={p.minStock} />
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-3 mb-2 text-sm">
                    <span className="text-muted-foreground">Stock : <span className={`font-semibold ${p.stock <= 0 ? "text-red-600" : p.stock <= p.minStock ? "text-amber-600" : ""}`}>{p.stock}</span></span>
                    <span className="text-muted-foreground">Min : {p.minStock}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2 mb-2 text-xs">
                    <span className="text-muted-foreground">
                      Achat : {p.purchasePrice ? formatCurrency(p.purchasePrice, currency) : "—"}
                    </span>
                    <span className="text-muted-foreground">
                      Vente : {formatCurrency(p.salePrice, currency)}
                    </span>
                    <span className={`font-medium ${margin >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                      Marge : {p.purchasePrice ? formatCurrency(margin, currency) : "—"}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-1">
                    <Button size="sm" variant="outline" className="gap-1" onClick={() => openStockDialog(p, "in")}>
                      <PackagePlus className="h-3.5 w-3.5 text-emerald-600" />
                    </Button>
                    <Button size="sm" variant="outline" className="gap-1" onClick={() => openStockDialog(p, "out")}>
                      <PackageMinus className="h-3.5 w-3.5 text-red-600" />
                    </Button>
                    <Button size="sm" variant="outline" className="gap-1" onClick={() => openStockDialog(p, "adjust")}>
                      <SlidersHorizontal className="h-3.5 w-3.5 text-amber-600" />
                    </Button>
                    <Button size="sm" variant="outline" className="gap-1" onClick={() => setHistoryProductId(p.id)}>
                      <HistoryIcon className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
              );
            })}
          </div>
        </>
      )}

      {/* ============================== MOUVEMENTS RÉCENTS ============================== */}
      <SectionTitle>Mouvements récents</SectionTitle>
      <Card className="border-border/60">
        <CardContent className="p-0">
          {recentMovements.length === 0 ? (
            <EmptyState
              icon={HistoryIcon}
              title="Aucun mouvement"
              description="Les entrées, sorties et corrections de stock apparaîtront ici."
            />
          ) : (
            <>
              {/* Avertissement suppression */}
              <div className="p-3 sm:p-4 border-b bg-muted/30 flex items-start gap-2 no-print">
                <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground">
                  Supprimer un mouvement ne recalcule <strong>pas</strong> le stock automatiquement. Pour ajuster le stock, utilisez « Corriger le stock » sur le produit concerné.
                </p>
              </div>

              {/* Tableau desktop */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produit</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Quantité</TableHead>
                      <TableHead>Raison</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentMovements.map((m) => (
                      <MovementRow key={m.id} movement={m} onDelete={() => setDeleteMovementId(m.id)} />
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Cartes mobile */}
              <ul className="divide-y divide-border md:hidden">
                {recentMovements.map((m) => (
                  <MovementCard key={m.id} movement={m} onDelete={() => setDeleteMovementId(m.id)} />
                ))}
              </ul>
            </>
          )}
        </CardContent>
      </Card>

      {/* ============================== DIALOG : STOCK ============================== */}
      <Dialog open={!!stockProduct} onOpenChange={(v) => !v && setStockProductId(null)}>
        <DialogContent className="sm:max-w-md">
          {stockProduct && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {stockMode === "in" && <PackagePlus className="h-5 w-5 text-emerald-600" />}
                  {stockMode === "out" && <PackageMinus className="h-5 w-5 text-red-600" />}
                  {stockMode === "adjust" && <SlidersHorizontal className="h-5 w-5 text-amber-600" />}
                  {stockMode === "in" ? "Entrée de stock" : stockMode === "out" ? "Sortie de stock" : "Correction de stock"}
                </DialogTitle>
                <DialogDescription>{stockProduct.name} — Stock actuel : {stockProduct.stock} {stockProduct.unit}</DialogDescription>
              </DialogHeader>

              <div className="space-y-3 py-2">
                <div>
                  <Label htmlFor="s-qty">
                    {stockMode === "adjust" ? "Nouveau stock" : "Quantité"}
                  </Label>
                  <Input
                    id="s-qty"
                    type="number"
                    min={0}
                    value={stockQty}
                    onChange={(e) => setStockQty(Number(e.target.value))}
                    className="mt-1"
                  />
                  {stockMode !== "adjust" && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Stock résultant : <span className="font-medium">{Math.max(0, stockProduct.stock + (stockMode === "in" ? stockQty : -stockQty))} {stockProduct.unit}</span>
                    </p>
                  )}
                </div>
                {stockMode === "in" && (
                  <div>
                    <Label htmlFor="s-price">Prix d'achat unitaire (optionnel)</Label>
                    <Input
                      id="s-price"
                      type="number"
                      min={0}
                      value={stockUnitPrice}
                      onChange={(e) => setStockUnitPrice(Number(e.target.value))}
                      placeholder="0"
                      className="mt-1"
                    />
                    {stockUnitPrice > 0 && stockQty > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Total achat : <span className="font-medium">{formatCurrency(stockUnitPrice * stockQty, currency)}</span>
                      </p>
                    )}
                  </div>
                )}
                <div>
                  <Label htmlFor="s-reason">Raison</Label>
                  <Input
                    id="s-reason"
                    value={stockReason}
                    onChange={(e) => setStockReason(e.target.value)}
                    placeholder={stockMode === "in" ? "Réapprovisionnement..." : stockMode === "out" ? "Casse, perte, vente..." : "Inventaire..."}
                    className="mt-1"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setStockProductId(null)}>Annuler</Button>
                <Button onClick={handleSaveStock}>Enregistrer</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ============================== DIALOG : HISTORIQUE ============================== */}
      <Dialog open={!!historyProduct} onOpenChange={(v) => !v && setHistoryProductId(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          {historyProduct && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <HistoryIcon className="h-5 w-5 text-primary" />
                  Historique de stock
                </DialogTitle>
                <DialogDescription>
                  {historyProduct.name} — Stock actuel : <strong>{historyProduct.stock} {historyProduct.unit}</strong>
                </DialogDescription>
              </DialogHeader>

              {historyMovements.length === 0 ? (
                <EmptyState icon={HistoryIcon} title="Aucun mouvement" description="Ce produit n'a aucun mouvement enregistré." />
              ) : (
                <div className="max-h-96 overflow-y-auto scrollbar-thin rounded-md border">
                  <ul className="divide-y divide-border">
                    {historyMovements.map((m) => (
                      <MovementRowInline key={m.id} movement={m} unit={historyProduct.unit} />
                    ))}
                  </ul>
                </div>
              )}

              <DialogFooter>
                <Button variant="outline" onClick={() => setHistoryProductId(null)}>Fermer</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ============================== CONFIRM : SUPPRIMER MOUVEMENT ============================== */}
      <ConfirmDialog
        open={!!deleteMovementId}
        onOpenChange={(v) => !v && setDeleteMovementId(null)}
        title="Supprimer ce mouvement ?"
        description={
          deleteMovement
            ? `« ${deleteMovement.productName} » (${deleteMovement.quantity > 0 ? "+" : ""}${deleteMovement.quantity}). ⚠️ Le stock ne sera PAS recalculé automatiquement.`
            : ""
        }
        confirmLabel="Supprimer"
        onConfirm={handleConfirmDeleteMovement}
      />
    </div>
  );
}

// ============================================================
// Sous-composant : actions stock (desktop)
// ============================================================
function StockActions({
  onIn,
  onOut,
  onAdjust,
  onHistory,
}: {
  onIn: () => void;
  onOut: () => void;
  onAdjust: () => void;
  onHistory: () => void;
}) {
  return (
    <div className="flex items-center justify-end gap-1">
      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={onIn} title="Entrée de stock">
        <PackagePlus className="h-4 w-4 text-emerald-600" />
      </Button>
      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={onOut} title="Sortie de stock">
        <PackageMinus className="h-4 w-4 text-red-600" />
      </Button>
      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={onAdjust} title="Corriger le stock">
        <SlidersHorizontal className="h-4 w-4 text-amber-600" />
      </Button>
      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={onHistory} title="Historique">
        <HistoryIcon className="h-4 w-4" />
      </Button>
    </div>
  );
}

// ============================================================
// Sous-composant : ligne de mouvement (tableau desktop)
// ============================================================
function MovementRow({ movement, onDelete }: { movement: StockMovement; onDelete: () => void }) {
  const isIn = movement.type === "in";
  const isOut = movement.type === "out";
  return (
    <TableRow className="hover:bg-muted/40">
      <TableCell className="font-medium">{movement.productName}</TableCell>
      <TableCell>
        <Badge variant="outline" className={isIn ? "border-emerald-300 text-emerald-700 dark:border-emerald-800 dark:text-emerald-400" : isOut ? "border-red-300 text-red-700 dark:border-red-800 dark:text-red-400" : "border-amber-300 text-amber-700 dark:border-amber-800 dark:text-amber-400"}>
          {isIn ? "Entrée" : isOut ? "Sortie" : "Ajustement"}
        </Badge>
      </TableCell>
      <TableCell className="text-right">
        <span className={`inline-flex items-center gap-1 font-semibold ${isIn ? "text-emerald-600" : isOut ? "text-red-600" : "text-amber-600"}`}>
          {isIn ? <ArrowUpRight className="h-3.5 w-3.5" /> : isOut ? <ArrowDownRight className="h-3.5 w-3.5" /> : <SlidersHorizontal className="h-3.5 w-3.5" />}
          {movement.quantity > 0 ? "+" : ""}{movement.quantity}
        </span>
      </TableCell>
      <TableCell className="text-sm text-muted-foreground max-w-[14rem] truncate">{movement.reason || "—"}</TableCell>
      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{formatDateTime(movement.createdAt)}</TableCell>
      <TableCell className="text-right">
        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={onDelete} title="Supprimer">
          <Trash2 className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
}

// ============================================================
// Sous-composant : carte de mouvement (mobile)
// ============================================================
function MovementCard({ movement, onDelete }: { movement: StockMovement; onDelete: () => void }) {
  const isIn = movement.type === "in";
  const isOut = movement.type === "out";
  return (
    <li className="p-3 flex items-start gap-3">
      <div className={`flex h-9 w-9 items-center justify-center rounded-lg shrink-0 ${isIn ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400" : isOut ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400" : "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400"}`}>
        {isIn ? <ArrowUpRight className="h-4 w-4" /> : isOut ? <ArrowDownRight className="h-4 w-4" /> : <SlidersHorizontal className="h-4 w-4" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="font-medium truncate">{movement.productName}</p>
          <span className={`font-semibold text-sm ${isIn ? "text-emerald-600" : isOut ? "text-red-600" : "text-amber-600"}`}>
            {movement.quantity > 0 ? "+" : ""}{movement.quantity}
          </span>
        </div>
        <p className="text-xs text-muted-foreground truncate">{movement.reason || "—"}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{formatDateTime(movement.createdAt)}</p>
      </div>
      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:bg-destructive/10 shrink-0" onClick={onDelete} title="Supprimer">
        <Trash2 className="h-4 w-4" />
      </Button>
    </li>
  );
}

// ============================================================
// Sous-composant : ligne de mouvement (dialog historique)
// ============================================================
function MovementRowInline({ movement, unit }: { movement: StockMovement; unit: string }) {
  const isIn = movement.type === "in";
  const isOut = movement.type === "out";
  return (
    <li className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
      <div className="min-w-0">
        <p className="truncate">
          <span className={`font-medium ${isIn ? "text-emerald-600" : isOut ? "text-red-600" : "text-amber-600"}`}>
            {isIn ? "Entrée" : isOut ? "Sortie" : "Ajustement"}
          </span>
          {" · "}
          {movement.quantity > 0 ? "+" : ""}{movement.quantity} {unit}
        </p>
        <p className="text-xs text-muted-foreground truncate">{movement.reason || "—"} · {formatDateTime(movement.createdAt)}</p>
      </div>
    </li>
  );
}
