// ============================================================
// ELISHAMA — Module : Ventes
// ============================================================
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import {
  PageHeader,
  StatCard,
  EmptyState,
  ConfirmDialog,
  SearchInput,
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Receipt,
  Plus,
  Eye,
  Printer,
  Trash2,
  CreditCard,
  ShoppingCart,
  Minus,
  Tag,
  TrendingUp,
  Wallet,
  X,
  Pencil,
  Check,
  ShoppingBag,
  ListFilter,
} from "lucide-react";
import { isSameDay, formatCurrency, formatDateTime, genId } from "@/lib/format";
import type { Sale, SaleItem, PaymentMethod, Product } from "@/lib/types";

interface CartItem {
  cartId: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  discount: number;
}

function computeItemTotal(item: { quantity: number; unitPrice: number; discount: number }): number {
  return Math.max(0, item.quantity * item.unitPrice - (item.discount || 0));
}

export function Sales() {
  const {
    data,
    createSale,
    deleteSale,
    addPaymentMethod,
    updatePaymentMethod,
    deletePaymentMethod,
    getPaymentMethodName,
  } = useStore();
  const currency = data.settings.usage.currency;

  // ---- Filters ----
  const [dateFilter, setDateFilter] = useState<"today" | "yesterday" | "all">("today");
  const [search, setSearch] = useState("");

  // ---- Dialogs ----
  const [newSaleOpen, setNewSaleOpen] = useState(false);
  const [detailsSale, setDetailsSale] = useState<Sale | null>(null);
  const [cancelSale, setCancelSale] = useState<Sale | null>(null);
  const [payMethodsOpen, setPayMethodsOpen] = useState(false);
  const [recapSale, setRecapSale] = useState<Sale | null>(null);

  // ---- Print state ----
  // printContent: null | { mode: "ticket", sale } | { mode: "list", sales }
  const [printContent, setPrintContent] = useState<
    | { mode: "ticket"; sale: Sale }
    | { mode: "list"; sales: Sale[] }
    | null
  >(null);

  function printTicket(sale: Sale) {
    setPrintContent({ mode: "ticket", sale });
  }
  function printList() {
    setPrintContent({ mode: "list", sales: filteredSales.length > 0 ? filteredSales : data.sales });
  }

  // ---- New sale form ----
  const [cart, setCart] = useState<CartItem[]>([]);
  const [globalDiscount, setGlobalDiscount] = useState(0);
  const [paymentMethodId, setPaymentMethodId] = useState("");
  const [note, setNote] = useState("");
  const [productSearch, setProductSearch] = useState("");

  // ---- Payment method edit ----
  const [editingPm, setEditingPm] = useState<PaymentMethod | null>(null);
  const [pmName, setPmName] = useState("");

  // ---- Stats ----
  const stats = useMemo(() => {
    const todaySales = data.sales.filter((s) => isSameDay(s.createdAt));
    const revenue = todaySales.reduce((a, b) => a + b.total, 0);
    const count = todaySales.length;
    const avg = count > 0 ? revenue / count : 0;
    const totalHistorical = data.sales.length;
    return { revenue, count, avg, totalHistorical };
  }, [data.sales]);

  // ---- Filtered sales ----
  const todayMs = Date.now();
  const today = new Date(todayMs);
  const yesterday = new Date(todayMs - 24 * 60 * 60 * 1000);
  const q = search.trim().toLowerCase();
  const filteredSales = data.sales.filter((s) => {
    if (dateFilter === "today" && !isSameDay(s.createdAt, today)) return false;
    if (dateFilter === "yesterday" && !isSameDay(s.createdAt, yesterday)) return false;
    if (q && !s.ticketNumber.toLowerCase().includes(q)) return false;
    return true;
  });

  // ---- Cart calculations ----
  const cartSubtotal = useMemo(() => cart.reduce((a, b) => a + computeItemTotal(b), 0), [cart]);
  const cartTotal = Math.max(0, cartSubtotal - (globalDiscount || 0));

  const activePaymentMethods = data.paymentMethods.filter((pm) => pm.active);

  // Effective payment method = user choice, or first active by default
  const effectivePaymentMethodId =
    paymentMethodId && activePaymentMethods.some((pm) => pm.id === paymentMethodId)
      ? paymentMethodId
      : activePaymentMethods[0]?.id || "";

  // Trigger print when printContent is set
  useEffect(() => {
    if (printContent) {
      const t = setTimeout(() => {
        window.print();
      }, 80);
      return () => clearTimeout(t);
    }
  }, [printContent]);

  // ---- Cart helpers ----
  function addToCart(p: Product) {
    setCart((c) => {
      const existing = c.find((it) => it.productId === p.id);
      if (existing) {
        return c.map((it) =>
          it.productId === p.id ? { ...it, quantity: it.quantity + 1 } : it
        );
      }
      return [
        ...c,
        {
          cartId: genId("cart"),
          productId: p.id,
          productName: p.name,
          quantity: 1,
          unitPrice: p.salePrice,
          discount: 0,
        },
      ];
    });
  }

  function updateCartItem(cartId: string, patch: Partial<CartItem>) {
    setCart((c) => c.map((it) => (it.cartId === cartId ? { ...it, ...patch } : it)));
  }

  function removeCartItem(cartId: string) {
    setCart((c) => c.filter((it) => it.cartId !== cartId));
  }

  function resetNewSaleForm() {
    setCart([]);
    setGlobalDiscount(0);
    setPaymentMethodId("");
    setNote("");
    setProductSearch("");
  }

  function openNewSale() {
    resetNewSaleForm();
    setNewSaleOpen(true);
  }

  function handleValidateSale() {
    if (cart.length === 0) {
      toast.error("Le panier est vide");
      return;
    }
    if (!effectivePaymentMethodId) {
      toast.error("Veuillez sélectionner un mode de paiement");
      return;
    }
    const items: SaleItem[] = cart.map((c) => ({
      productId: c.productId,
      productName: c.productName,
      quantity: c.quantity,
      unitPrice: c.unitPrice,
      discount: c.discount || 0,
      total: computeItemTotal(c),
    }));
    const sale = createSale({
      items,
      discount: globalDiscount || 0,
      paymentMethodId: effectivePaymentMethodId,
      note: note.trim() || undefined,
    });
    toast.success("✅ Vente enregistrée");
    setNewSaleOpen(false);
    setRecapSale(sale);
  }

  function handleDeleteSale() {
    if (!cancelSale) return;
    deleteSale(cancelSale.id);
    toast.success("Vente annulée et stock restitué");
    setCancelSale(null);
  }

  // ---- Payment method management ----
  function openEditPm(pm: PaymentMethod) {
    setEditingPm(pm);
    setPmName(pm.name);
  }

  function handleSavePm() {
    if (!editingPm) return;
    if (!pmName.trim()) {
      toast.error("Nom requis");
      return;
    }
    updatePaymentMethod(editingPm.id, { name: pmName.trim() });
    toast.success("Mode de paiement mis à jour");
    setEditingPm(null);
    setPmName("");
  }

  function handleAddPm() {
    if (!pmName.trim()) {
      toast.error("Nom requis");
      return;
    }
    addPaymentMethod(pmName.trim());
    toast.success("Mode de paiement ajouté");
    setPmName("");
  }

  const printableProducts = data.products.filter(
    (p) => p.active && !p.archived && (!productSearch.trim() || p.name.toLowerCase().includes(productSearch.trim().toLowerCase()))
  );

  return (
    <div className="space-y-5">
      <div className="no-print space-y-5">
        <PageHeader
          title="Ventes"
          subtitle="Enregistrez et suivez les ventes du restaurant"
          icon={Receipt}
          actions={
            <>
              <Button variant="outline" onClick={() => setPayMethodsOpen(true)} className="gap-2">
                <CreditCard className="h-4 w-4" /> Modes de paiement
              </Button>
              <Button variant="outline" onClick={printList} className="gap-2">
                <Printer className="h-4 w-4" /> Imprimer la liste
              </Button>
              <Button onClick={openNewSale} className="gap-2">
                <Plus className="h-4 w-4" /> Nouvelle vente
              </Button>
            </>
          }
        />

        {/* StatCards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatCard
            label="CA du jour"
            value={formatCurrency(stats.revenue, currency)}
            icon={TrendingUp}
            tone="success"
            hint={`${stats.count} vente(s)`}
          />
          <StatCard
            label="Ventes du jour"
            value={stats.count}
            icon={Receipt}
            tone="primary"
            hint="Nombre de transactions"
          />
          <StatCard
            label="Panier moyen"
            value={formatCurrency(stats.avg, currency)}
            icon={ShoppingBag}
            tone="default"
            hint="Sur les ventes du jour"
          />
          <StatCard
            label="Total historique"
            value={stats.totalHistorical}
            icon={Wallet}
            tone="default"
            hint="Toutes ventes confondues"
          />
        </div>

        {/* Filters + Sales list */}
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Receipt className="h-4 w-4 text-primary" /> Ventes enregistrées
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
              <div className="flex items-center gap-2">
                <ListFilter className="h-4 w-4 text-muted-foreground" />
                <Select value={dateFilter} onValueChange={(v) => setDateFilter(v as typeof dateFilter)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Aujourd'hui</SelectItem>
                    <SelectItem value="yesterday">Hier</SelectItem>
                    <SelectItem value="all">Toutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Rechercher par numéro de ticket..."
                className="flex-1"
              />
            </div>

            {filteredSales.length === 0 ? (
              <EmptyState
                icon={Receipt}
                title="Aucune vente"
                description="Aucune vente ne correspond à votre filtre. Cliquez sur « Nouvelle vente » pour enregistrer une transaction."
                action={
                  <Button onClick={openNewSale} className="gap-2">
                    <Plus className="h-4 w-4" /> Nouvelle vente
                  </Button>
                }
              />
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden md:block border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 text-muted-foreground">
                      <tr>
                        <th className="text-left font-medium px-3 py-2.5">Ticket</th>
                        <th className="text-left font-medium px-3 py-2.5">Date / Heure</th>
                        <th className="text-right font-medium px-3 py-2.5">Articles</th>
                        <th className="text-right font-medium px-3 py-2.5">Total</th>
                        <th className="text-left font-medium px-3 py-2.5">Paiement</th>
                        <th className="text-right font-medium px-3 py-2.5">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {filteredSales.map((s) => (
                        <tr key={s.id} className="hover:bg-muted/40 transition-colors">
                          <td className="px-3 py-2.5 font-medium">{s.ticketNumber}</td>
                          <td className="px-3 py-2.5 text-muted-foreground">{formatDateTime(s.createdAt)}</td>
                          <td className="px-3 py-2.5 text-right">{s.items.reduce((a, b) => a + b.quantity, 0)}</td>
                          <td className="px-3 py-2.5 text-right font-semibold">
                            <Money amount={s.total} currency={currency} />
                          </td>
                          <td className="px-3 py-2.5">
                            <Badge variant="secondary">{getPaymentMethodName(s.paymentMethodId)}</Badge>
                          </td>
                          <td className="px-3 py-2.5">
                            <div className="flex items-center justify-end gap-1">
                              <Button size="icon" variant="ghost" onClick={() => setDetailsSale(s)} title="Voir détails">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button size="icon" variant="ghost" onClick={() => printTicket(s)} title="Imprimer le ticket">
                                <Printer className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => setCancelSale(s)}
                                title="Annuler la vente"
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards */}
                <div className="md:hidden space-y-3 max-h-[32rem] overflow-y-auto scrollbar-thin">
                  {filteredSales.map((s) => (
                    <Card key={s.id} className="border-border/60">
                      <CardContent className="p-3 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-semibold truncate">{s.ticketNumber}</p>
                            <p className="text-xs text-muted-foreground">{formatDateTime(s.createdAt)}</p>
                          </div>
                          <Badge variant="secondary" className="shrink-0">
                            {getPaymentMethodName(s.paymentMethodId)}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            {s.items.reduce((a, b) => a + b.quantity, 0)} article(s)
                          </span>
                          <span className="font-bold text-primary">
                            <Money amount={s.total} currency={currency} />
                          </span>
                        </div>
                        <div className="flex items-center gap-1 pt-1 border-t">
                          <Button size="sm" variant="outline" onClick={() => setDetailsSale(s)} className="flex-1 gap-1">
                            <Eye className="h-4 w-4" /> Détails
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => printTicket(s)} className="flex-1 gap-1">
                            <Printer className="h-4 w-4" /> Imprimer
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setCancelSale(s)}
                            className="text-destructive hover:text-destructive"
                            title="Annuler"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
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

      {/* ============ DIALOG : Nouvelle vente ============ */}
      <Dialog open={newSaleOpen} onOpenChange={setNewSaleOpen}>
        <DialogContent className="sm:max-w-5xl max-h-[92vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-primary" /> Nouvelle vente
            </DialogTitle>
            <DialogDescription>
              Sélectionnez les produits, ajustez les quantités et validez la vente.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 overflow-y-auto scrollbar-thin pr-1 -mr-1">
            {/* Products selection */}
            <div className="space-y-3">
              <SectionTitle>Produits disponibles</SectionTitle>
              <SearchInput value={productSearch} onChange={setProductSearch} placeholder="Rechercher un produit..." />
              {printableProducts.length === 0 ? (
                <EmptyState icon={ShoppingBag} title="Aucun produit" description="Aucun produit actif trouvé." />
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-72 overflow-y-auto scrollbar-thin p-1">
                  {printableProducts.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => addToCart(p)}
                      className="flex flex-col items-start gap-1 p-2 rounded-md border border-border hover:border-primary hover:bg-primary/5 transition-colors text-left"
                    >
                      <span className="text-sm font-medium line-clamp-1">{p.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatCurrency(p.salePrice, currency)}
                      </span>
                      <span className="text-[10px] text-muted-foreground">Stock: {p.stock} {p.unit}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Cart */}
            <div className="space-y-3">
              <SectionTitle action={
                cart.length > 0 ? (
                  <Button size="sm" variant="ghost" onClick={() => setCart([])} className="text-destructive hover:text-destructive gap-1">
                    <X className="h-4 w-4" /> Vider
                  </Button>
                ) : undefined
              }>
                Panier ({cart.length})
              </SectionTitle>

              {cart.length === 0 ? (
                <EmptyState icon={ShoppingCart} title="Panier vide" description="Cliquez sur un produit pour l'ajouter." />
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto scrollbar-thin p-1">
                  {cart.map((item) => (
                    <div key={item.cartId} className="rounded-md border p-2.5 space-y-2 bg-muted/30">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-sm truncate flex-1">{item.productName}</span>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-destructive hover:text-destructive shrink-0"
                          onClick={() => removeCartItem(item.cartId)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Quantity */}
                        <div className="flex items-center gap-1">
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-7 w-7"
                            onClick={() => updateCartItem(item.cartId, { quantity: Math.max(1, item.quantity - 1) })}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <Input
                            type="number"
                            value={item.quantity}
                            min={1}
                            onChange={(e) => updateCartItem(item.cartId, { quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                            className="w-14 h-7 text-center px-1"
                          />
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-7 w-7"
                            onClick={() => updateCartItem(item.cartId, { quantity: item.quantity + 1 })}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        {/* Unit price */}
                        <div className="flex items-center gap-1 flex-1 min-w-[110px]">
                          <Label className="text-xs text-muted-foreground whitespace-nowrap">P.U.</Label>
                          <Input
                            type="number"
                            value={item.unitPrice}
                            min={0}
                            onChange={(e) => updateCartItem(item.cartId, { unitPrice: Math.max(0, parseFloat(e.target.value) || 0) })}
                            className="h-7 text-sm px-2"
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Discount */}
                        <div className="flex items-center gap-1 flex-1 min-w-[110px]">
                          <Label className="text-xs text-muted-foreground whitespace-nowrap">Remise</Label>
                          <Input
                            type="number"
                            value={item.discount}
                            min={0}
                            onChange={(e) => updateCartItem(item.cartId, { discount: Math.max(0, parseFloat(e.target.value) || 0) })}
                            className="h-7 text-sm px-2"
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">→</span>
                        <span className="font-semibold text-primary text-sm">
                          {formatCurrency(computeItemTotal(item), currency)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {cart.length > 0 && (
                <div className="space-y-2 rounded-md border bg-muted/30 p-3">
                  {/* Global discount */}
                  <div className="flex items-center gap-2">
                    <Label className="text-sm flex items-center gap-1 w-28 shrink-0">
                      <Tag className="h-4 w-4" /> Remise globale
                    </Label>
                    <Input
                      type="number"
                      value={globalDiscount}
                      min={0}
                      onChange={(e) => setGlobalDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                      className="h-8 flex-1"
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Sous-total</span>
                    <span>{formatCurrency(cartSubtotal, currency)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Remise</span>
                    <span className="text-destructive">- {formatCurrency(globalDiscount || 0, currency)}</span>
                  </div>
                  <div className="flex items-center justify-between font-bold text-base">
                    <span>Total</span>
                    <span className="text-primary">{formatCurrency(cartTotal, currency)}</span>
                  </div>
                </div>
              )}

              {/* Payment method */}
              <div className="space-y-2">
                <Label className="text-sm flex items-center gap-1">
                  <CreditCard className="h-4 w-4" /> Mode de paiement
                </Label>
                {activePaymentMethods.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Aucun mode de paiement actif.{" "}
                    <Button variant="link" className="h-auto p-0" onClick={() => setPayMethodsOpen(true)}>
                      En ajouter
                    </Button>
                  </p>
                ) : (
                  <RadioGroup
                    value={effectivePaymentMethodId}
                    onValueChange={setPaymentMethodId}
                    className="grid grid-cols-2 sm:grid-cols-3 gap-2"
                  >
                    {activePaymentMethods.map((pm) => (
                      <Label
                        key={pm.id}
                        htmlFor={`pm-${pm.id}`}
                        className="flex items-center gap-2 p-2 rounded-md border cursor-pointer hover:bg-muted/40 has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                      >
                        <RadioGroupItem id={`pm-${pm.id}`} value={pm.id} />
                        <span className="text-sm">{pm.name}</span>
                      </Label>
                    ))}
                  </RadioGroup>
                )}
              </div>

              {/* Note */}
              <div className="space-y-2">
                <Label htmlFor="sale-note" className="text-sm">Note (optionnel)</Label>
                <Textarea
                  id="sale-note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Client, table, remarque..."
                  className="resize-none"
                  rows={2}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="border-t pt-4">
            <Button variant="outline" onClick={() => setNewSaleOpen(false)}>Annuler</Button>
            <Button onClick={handleValidateSale} disabled={cart.length === 0 || !effectivePaymentMethodId} className="gap-2">
              <Check className="h-4 w-4" /> Valider la vente — {formatCurrency(cartTotal, currency)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============ DIALOG : Détails d'une vente ============ */}
      <Dialog open={!!detailsSale} onOpenChange={(o) => !o && setDetailsSale(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" /> Détails de la vente
            </DialogTitle>
            {detailsSale && (
              <DialogDescription>
                {detailsSale.ticketNumber} — {formatDateTime(detailsSale.createdAt)}
              </DialogDescription>
            )}
          </DialogHeader>
          {detailsSale && (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2 text-sm">
                <Badge variant="secondary">{getPaymentMethodName(detailsSale.paymentMethodId)}</Badge>
                <Badge variant="outline">{detailsSale.items.reduce((a, b) => a + b.quantity, 0)} article(s)</Badge>
              </div>
              <div className="border rounded-md divide-y max-h-72 overflow-y-auto scrollbar-thin">
                {detailsSale.items.map((it, i) => (
                  <div key={i} className="flex items-center justify-between p-2.5 text-sm">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{it.quantity} × {it.productName}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(it.unitPrice, currency)}
                        {it.discount > 0 && <span className="text-destructive"> − {formatCurrency(it.discount, currency)}</span>}
                      </p>
                    </div>
                    <span className="font-semibold shrink-0">{formatCurrency(it.total, currency)}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sous-total</span>
                  <span>{formatCurrency(detailsSale.subtotal, currency)}</span>
                </div>
                {detailsSale.discount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Remise</span>
                    <span className="text-destructive">- {formatCurrency(detailsSale.discount, currency)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-base border-t pt-2">
                  <span>Total</span>
                  <span className="text-primary">{formatCurrency(detailsSale.total, currency)}</span>
                </div>
              </div>
              {detailsSale.note && (
                <div className="text-sm bg-muted/40 p-2 rounded-md">
                  <span className="text-xs text-muted-foreground">Note : </span>
                  {detailsSale.note}
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => detailsSale && printTicket(detailsSale)} className="gap-2">
              <Printer className="h-4 w-4" /> Imprimer
            </Button>
            <Button onClick={() => setDetailsSale(null)}>Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============ DIALOG : Récap après validation ============ */}
      <Dialog open={!!recapSale} onOpenChange={(o) => !o && setRecapSale(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-600">
              <Check className="h-5 w-5" /> Vente enregistrée !
            </DialogTitle>
            <DialogDescription>
              La vente a été enregistrée avec succès. Le stock a été mis à jour.
            </DialogDescription>
          </DialogHeader>
          {recapSale && (
            <div className="space-y-3 text-center">
              <p className="text-sm text-muted-foreground">Numéro de ticket</p>
              <p className="text-xl font-bold text-primary">{recapSale.ticketNumber}</p>
              <p className="text-2xl font-bold">{formatCurrency(recapSale.total, currency)}</p>
              <p className="text-sm text-muted-foreground">
                {recapSale.items.reduce((a, b) => a + b.quantity, 0)} article(s) — {getPaymentMethodName(recapSale.paymentMethodId)}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => recapSale && printTicket(recapSale)}
              className="gap-2"
            >
              <Printer className="h-4 w-4" /> Imprimer le ticket
            </Button>
            <Button onClick={() => setRecapSale(null)}>Terminer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============ DIALOG : Gestion des modes de paiement ============ */}
      <Dialog open={payMethodsOpen} onOpenChange={setPayMethodsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" /> Modes de paiement
            </DialogTitle>
            <DialogDescription>Gérez les modes de paiement disponibles à l'encaissement.</DialogDescription>
          </DialogHeader>

          <div className="space-y-3 max-h-72 overflow-y-auto scrollbar-thin">
            {data.paymentMethods.length === 0 ? (
              <EmptyState icon={CreditCard} title="Aucun mode de paiement" description="Ajoutez-en un ci-dessous." />
            ) : (
              <div className="space-y-2">
                {data.paymentMethods.map((pm) => (
                  <div key={pm.id} className="flex items-center gap-2 p-2 rounded-md border">
                    <div className="flex-1 min-w-0">
                      {editingPm?.id === pm.id ? (
                        <Input
                          value={pmName}
                          onChange={(e) => setPmName(e.target.value)}
                          className="h-8"
                          autoFocus
                        />
                      ) : (
                        <p className="font-medium text-sm truncate">{pm.name}</p>
                      )}
                      <p className="text-xs text-muted-foreground">{pm.active ? "Actif" : "Désactivé"}</p>
                    </div>
                    <Switch
                      checked={pm.active}
                      onCheckedChange={(v) => updatePaymentMethod(pm.id, { active: v })}
                    />
                    {editingPm?.id === pm.id ? (
                      <>
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleSavePm}>
                          <Check className="h-4 w-4 text-emerald-600" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => {
                            setEditingPm(null);
                            setPmName("");
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEditPm(pm)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => {
                            deletePaymentMethod(pm.id);
                            toast.success("Mode de paiement supprimé");
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <Separator />

          <div className="space-y-2">
            <Label className="text-sm">Ajouter un mode de paiement</Label>
            <div className="flex gap-2">
              <Input
                value={pmName}
                onChange={(e) => setPmName(e.target.value)}
                placeholder="Ex : Chèque, Virement..."
                className="flex-1"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddPm();
                }}
              />
              <Button onClick={handleAddPm} className="gap-2">
                <Plus className="h-4 w-4" /> Ajouter
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPayMethodsOpen(false)}>Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============ CONFIRM : Annulation vente ============ */}
      <ConfirmDialog
        open={!!cancelSale}
        onOpenChange={(o) => !o && setCancelSale(null)}
        title="Annuler cette vente ?"
        description={
          cancelSale
            ? `La vente ${cancelSale.ticketNumber} sera supprimée et le stock de ${cancelSale.items.length} article(s) sera restitué.`
            : ""
        }
        confirmLabel="Annuler la vente"
        cancelLabel="Conserver"
        destructive
        onConfirm={handleDeleteSale}
      />

      {/* ============ PRINT AREA ============ */}
      {printContent?.mode === "ticket" && (
        <div className="print-area hidden print:block print-ticket">
          <PrintableTicket
            sale={printContent.sale}
            currency={currency}
            restaurantName={data.settings.restaurant.name}
            paymentName={getPaymentMethodName(printContent.sale.paymentMethodId)}
            ticketMessage={data.settings.restaurant.ticketMessage}
          />
        </div>
      )}
      {printContent?.mode === "list" && (
        <div className="print-area hidden print:block">
          <PrintableSalesList
            sales={printContent.sales}
            currency={currency}
            restaurantName={data.settings.restaurant.name}
            getPaymentMethodName={getPaymentMethodName}
          />
        </div>
      )}
    </div>
  );
}

// ============================================================
// Ticket imprimable
// ============================================================
function PrintableTicket({
  sale,
  currency,
  restaurantName,
  paymentName,
  ticketMessage,
}: {
  sale: Sale;
  currency: string;
  restaurantName: string;
  paymentName: string;
  ticketMessage: string;
}) {
  return (
    <div className="font-mono text-[12px]">
      <div className="text-center mb-2">
        <p className="font-bold text-base">{restaurantName}</p>
        <p>================================</p>
      </div>
      <div className="mb-2">
        <p>Ticket : {sale.ticketNumber}</p>
        <p>Date   : {formatDateTime(sale.createdAt)}</p>
        <p>Paiement: {paymentName}</p>
      </div>
      <p>--------------------------------</p>
      <div className="mb-2">
        {sale.items.map((it, i) => (
          <div key={i} className="mb-1">
            <p>{it.quantity} × {it.productName}</p>
            <p className="pl-4">
              {formatCurrency(it.unitPrice, currency)}
              {it.discount > 0 ? ` - ${formatCurrency(it.discount, currency)}` : ""}
              {" = "}
              <strong>{formatCurrency(it.total, currency)}</strong>
            </p>
          </div>
        ))}
      </div>
      <p>--------------------------------</p>
      <div>
        <p>Sous-total : {formatCurrency(sale.subtotal, currency)}</p>
        {sale.discount > 0 && <p>Remise     : - {formatCurrency(sale.discount, currency)}</p>}
        <p className="font-bold text-base">TOTAL : {formatCurrency(sale.total, currency)}</p>
      </div>
      {sale.note && (
        <>
          <p>--------------------------------</p>
          <p>Note : {sale.note}</p>
        </>
      )}
      <p>================================</p>
      {ticketMessage && <p className="text-center mt-2">{ticketMessage}</p>}
      <p className="text-center mt-2 text-[10px]">Merci de votre visite !</p>
    </div>
  );
}

// ============================================================
// Liste des ventes imprimable
// ============================================================
function PrintableSalesList({
  sales,
  currency,
  restaurantName,
  getPaymentMethodName,
}: {
  sales: Sale[];
  currency: string;
  restaurantName: string;
  getPaymentMethodName: (id: string) => string;
}) {
  const total = sales.reduce((a, b) => a + b.total, 0);
  return (
    <div className="font-mono text-[11px] p-2">
      <div className="text-center mb-3">
        <p className="font-bold text-base">{restaurantName}</p>
        <p>Liste des ventes</p>
        <p>{sales.length} vente(s) — Total : {formatCurrency(total, currency)}</p>
      </div>
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-black">
            <th className="text-left py-1">Ticket</th>
            <th className="text-left py-1">Date</th>
            <th className="text-right py-1">Articles</th>
            <th className="text-left py-1 px-2">Paiement</th>
            <th className="text-right py-1">Total</th>
          </tr>
        </thead>
        <tbody>
          {sales.map((s) => (
            <tr key={s.id} className="border-b border-gray-300">
              <td className="py-1">{s.ticketNumber}</td>
              <td className="py-1">{formatDateTime(s.createdAt)}</td>
              <td className="py-1 text-right">{s.items.reduce((a, b) => a + b.quantity, 0)}</td>
              <td className="py-1 px-2">{getPaymentMethodName(s.paymentMethodId)}</td>
              <td className="py-1 text-right">{formatCurrency(s.total, currency)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-black font-bold">
            <td colSpan={4} className="py-2 text-right">TOTAL</td>
            <td className="py-2 text-right">{formatCurrency(total, currency)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
