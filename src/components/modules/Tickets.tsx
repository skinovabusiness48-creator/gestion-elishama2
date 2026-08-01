// ============================================================
// ELISHAMA — Module : Tickets / Commandes
// ============================================================
"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useStore } from "@/lib/store";
import { useNewActionListener } from "@/hooks/use-new-action-listener";
import {
  PageHeader,
  EmptyState,
  ConfirmDialog,
  SearchInput,
  SectionTitle,
  Money,
} from "@/components/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Ticket as TicketIcon,
  Plus,
  Trash2,
  Minus,
  Printer,
  X,
  Check,
  Pencil,
  MapPin,
  LayoutGrid,
  Send,
  Ban,
  Eraser,
  Save,
  GitMerge,
  ShoppingCart,
  Utensils,
} from "lucide-react";
import { formatCurrency, formatDateTime } from "@/lib/format";
import type { Ticket, SaleItem, TicketItem, Table, Zone } from "@/lib/types";

function computeTicketSubtotal(items: TicketItem[]): number {
  return items.reduce((a, b) => a + b.quantity * b.unitPrice, 0);
}
function computeTicketTotal(t: Ticket): number {
  return Math.max(0, computeTicketSubtotal(t.items) - (t.discount || 0));
}

const STATUS_LABELS: Record<Ticket["status"], string> = {
  open: "Ouvert",
  closed: "Fermé",
  cancelled: "Annulé",
};
const STATUS_BADGE_CLASS: Record<Ticket["status"], string> = {
  open: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-400",
  closed: "bg-blue-100 text-blue-700 hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-400",
  cancelled: "bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-950 dark:text-red-400",
};

export function Tickets() {
  const {
    data,
    createTicket,
    updateTicket,
    closeTicket,
    cancelTicket,
    deleteTicket,
    addTicketItem,
    updateTicketItem,
    removeTicketItem,
    clearTicketItems,
    createSale,
    addZone,
    updateZone,
    deleteZone,
    addTable,
    updateTable,
    deleteTable,
    getTableName,
    getZoneName,
  } = useStore();
  const currency = data.settings.usage.currency;

  // ---- UI State ----
  const [tab, setTab] = useState<"open" | "closed" | "cancelled" | "all">("open");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Dialogs
  const [newTicketOpen, setNewTicketOpen] = useState(false);
  const [tablesOpen, setTablesOpen] = useState(false);
  const [addItemOpen, setAddItemOpen] = useState(false);
  const [editItemOpen, setEditItemOpen] = useState<TicketItem | null>(null);
  const [closeFlowTicket, setCloseFlowTicket] = useState<Ticket | null>(null);
  const [transferTicket, setTransferTicket] = useState<Ticket | null>(null);
  const [cancelTicketState, setCancelTicketState] = useState<Ticket | null>(null);
  const [clearTicketState, setClearTicketState] = useState<Ticket | null>(null);
  const [mergeMode, setMergeMode] = useState(false);

  // Raccourci "N" → ouvre le dialog nouveau ticket
  const handleNewTicket = useCallback(() => setNewTicketOpen(true), []);
  useNewActionListener(handleNewTicket);

  const [mergeSelection, setMergeSelection] = useState<string[]>([]);
  const [printTicket, setPrintTicket] = useState<Ticket | null>(null);

  // New ticket form
  const [newName, setNewName] = useState("");
  const [newTableId, setNewTableId] = useState("");
  const [newZoneId, setNewZoneId] = useState("");

  // Add item form
  const [addItemProductId, setAddItemProductId] = useState("");
  const [addItemQty, setAddItemQty] = useState(1);
  const [addItemPrice, setAddItemPrice] = useState(0);
  const [addItemNote, setAddItemNote] = useState("");
  const [productSearch, setProductSearch] = useState("");

  // Edit item form
  const [editQty, setEditQty] = useState(1);
  const [editPrice, setEditPrice] = useState(0);
  const [editNote, setEditNote] = useState("");

  // Close flow form
  const [closePaymentId, setClosePaymentId] = useState("");
  const [closeNote, setCloseNote] = useState("");
  const [closeDiscount, setCloseDiscount] = useState(0);

  // Transfer form
  const [transferTableId, setTransferTableId] = useState("");

  // Zones / Tables management
  const [newZoneName, setNewZoneName] = useState("");
  const [newTableName, setNewTableName] = useState("");
  const [newTableZoneId, setNewTableZoneId] = useState("");
  const [editingZone, setEditingZone] = useState<Zone | null>(null);
  const [editingZoneName, setEditingZoneName] = useState("");
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [editingTableName, setEditingTableName] = useState("");

  const activePaymentMethods = data.paymentMethods.filter((pm) => pm.active);
  const effectiveClosePaymentId =
    closePaymentId && activePaymentMethods.some((pm) => pm.id === closePaymentId)
      ? closePaymentId
      : activePaymentMethods[0]?.id || "";

  // ---- Filtered tickets ----
  const filteredTickets = data.tickets.filter((t) => {
    if (tab !== "all" && t.status !== tab) return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      if (
        !t.name.toLowerCase().includes(q) &&
        !getTableName(t.tableId).toLowerCase().includes(q) &&
        !getZoneName(t.zoneId).toLowerCase().includes(q)
      )
        return false;
    }
    return true;
  });

  const openTicketsCount = data.tickets.filter((t) => t.status === "open").length;

  const selectedTicket = selectedId
    ? data.tickets.find((t) => t.id === selectedId) || null
    : null;

  // Trigger print
  useEffect(() => {
    if (printTicket) {
      const t = setTimeout(() => window.print(), 80);
      return () => clearTimeout(t);
    }
  }, [printTicket]);

  // ---- Handlers ----
  function handleCreateTicket() {
    if (!newName.trim()) {
      toast.error("Veuillez saisir un nom de ticket");
      return;
    }
    if (!newTableId) {
      toast.error("Veuillez sélectionner une table");
      return;
    }
    const t = createTicket(newName.trim(), newTableId, newZoneId);
    toast.success("Ticket créé");
    setNewTicketOpen(false);
    setNewName("");
    setNewTableId("");
    setNewZoneId("");
    setSelectedId(t.id);
    setTab("open");
  }

  function handleOpenAddItem() {
    setAddItemProductId("");
    setAddItemQty(1);
    setAddItemPrice(0);
    setAddItemNote("");
    setProductSearch("");
    setAddItemOpen(true);
  }

  function handleAddItem() {
    if (!selectedTicket) return;
    if (!addItemProductId) {
      toast.error("Sélectionnez un produit");
      return;
    }
    const prod = data.products.find((p) => p.id === addItemProductId);
    if (!prod) return;
    addTicketItem(selectedTicket.id, {
      productId: prod.id,
      productName: prod.name,
      quantity: addItemQty,
      unitPrice: addItemPrice || prod.salePrice,
      note: addItemNote.trim() || undefined,
    });
    toast.success("Article ajouté");
    setAddItemOpen(false);
  }

  function openEditItem(item: TicketItem) {
    setEditItemOpen(item);
    setEditQty(item.quantity);
    setEditPrice(item.unitPrice);
    setEditNote(item.note || "");
  }

  function handleSaveItem() {
    if (!selectedTicket || !editItemOpen) return;
    updateTicketItem(selectedTicket.id, editItemOpen.id, {
      quantity: Math.max(1, editQty),
      unitPrice: Math.max(0, editPrice),
      note: editNote.trim(),
    });
    toast.success("Article modifié");
    setEditItemOpen(null);
  }

  function handleCloseTicket() {
    if (!closeFlowTicket) return;
    if (!effectiveClosePaymentId) {
      toast.error("Sélectionnez un mode de paiement");
      return;
    }
    const items: SaleItem[] = closeFlowTicket.items.map((it) => ({
      productId: it.productId,
      productName: it.productName,
      quantity: it.quantity,
      unitPrice: it.unitPrice,
      discount: 0,
      total: it.quantity * it.unitPrice,
    }));
    createSale({
      items,
      discount: closeDiscount || closeFlowTicket.discount || 0,
      paymentMethodId: effectiveClosePaymentId,
      ticketId: closeFlowTicket.id,
      note: closeNote.trim() || closeFlowTicket.note || undefined,
    });
    closeTicket(closeFlowTicket.id);
    toast.success("✅ Ticket fermé — vente enregistrée");
    setCloseFlowTicket(null);
    setClosePaymentId("");
    setCloseNote("");
    setCloseDiscount(0);
  }

  function handleTransfer() {
    if (!transferTicket) return;
    if (!transferTableId) {
      toast.error("Sélectionnez une table de destination");
      return;
    }
    const tbl = data.tables.find((t) => t.id === transferTableId);
    if (!tbl) return;
    updateTicket(transferTicket.id, { tableId: tbl.id, zoneId: tbl.zoneId });
    toast.success("Ticket transféré");
    setTransferTicket(null);
    setTransferTableId("");
  }

  function handleCancelTicket() {
    if (!cancelTicketState) return;
    cancelTicket(cancelTicketState.id);
    toast.success("Ticket annulé");
    setCancelTicketState(null);
    if (selectedId === cancelTicketState.id) setSelectedId(null);
  }

  function handleClearTicket() {
    if (!clearTicketState) return;
    clearTicketItems(clearTicketState.id);
    toast.success("Articles supprimés");
    setClearTicketState(null);
  }

  function handleStartMerge() {
    setMergeMode(true);
    setMergeSelection([]);
  }

  function toggleMergeSelection(id: string) {
    setMergeSelection((s) =>
      s.includes(id) ? s.filter((x) => x !== id) : s.length < 2 ? [...s, id] : (toast.error("Sélectionnez 2 tickets maximum"), s)
    );
  }

  function handleMergeConfirm() {
    if (mergeSelection.length !== 2) {
      toast.error("Sélectionnez exactement 2 tickets");
      return;
    }
    const [aId, bId] = mergeSelection;
    const a = data.tickets.find((t) => t.id === aId);
    const b = data.tickets.find((t) => t.id === bId);
    if (!a || !b) return;
    // Add all b's items to a, then delete b
    b.items.forEach((it) => {
      addTicketItem(a.id, {
        productId: it.productId,
        productName: it.productName,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        note: it.note,
      });
    });
    deleteTicket(b.id);
    toast.success("Tickets fusionnés");
    setMergeMode(false);
    setMergeSelection([]);
    setSelectedId(a.id);
  }

  // ---- Zone/Table handlers ----
  function handleAddZone() {
    if (!newZoneName.trim()) {
      toast.error("Nom de zone requis");
      return;
    }
    addZone(newZoneName.trim());
    toast.success("Zone ajoutée");
    setNewZoneName("");
  }
  function handleAddTable() {
    if (!newTableName.trim()) {
      toast.error("Nom de table requis");
      return;
    }
    if (!newTableZoneId) {
      toast.error("Sélectionnez une zone");
      return;
    }
    addTable(newTableName.trim(), newTableZoneId);
    toast.success("Table ajoutée");
    setNewTableName("");
  }
  function handleSaveZone() {
    if (!editingZone) return;
    if (!editingZoneName.trim()) {
      toast.error("Nom requis");
      return;
    }
    updateZone(editingZone.id, { name: editingZoneName.trim() });
    toast.success("Zone modifiée");
    setEditingZone(null);
    setEditingZoneName("");
  }
  function handleSaveTable() {
    if (!editingTable) return;
    if (!editingTableName.trim()) {
      toast.error("Nom requis");
      return;
    }
    updateTable(editingTable.id, { name: editingTableName.trim() });
    toast.success("Table modifiée");
    setEditingTable(null);
    setEditingTableName("");
  }

  const printableProducts = data.products.filter(
    (p) =>
      p.active &&
      !p.archived &&
      p.onMenu &&
      (!productSearch.trim() || p.name.toLowerCase().includes(productSearch.trim().toLowerCase()))
  );

  const groupedTables = data.zones
    .map((z) => ({ zone: z, tables: data.tables.filter((t) => t.zoneId === z.id) }))
    .filter((g) => g.tables.length > 0);
  const ungroupedTables = data.tables.filter((t) => !data.zones.some((z) => z.id === t.zoneId));

  return (
    <div className="space-y-5">
      <div className="no-print space-y-5">
        <PageHeader
          title="Tickets"
          subtitle="Gérez les commandes en cours et les tables du restaurant"
          icon={TicketIcon}
          actions={
            <>
              <Button variant="outline" onClick={() => setTablesOpen(true)} className="gap-2">
                <LayoutGrid className="h-4 w-4" /> Gérer les tables
              </Button>
              {mergeMode ? (
                <>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setMergeMode(false);
                      setMergeSelection([]);
                    }}
                    className="gap-2"
                  >
                    <X className="h-4 w-4" /> Annuler fusion
                  </Button>
                  <Button
                    onClick={handleMergeConfirm}
                    disabled={mergeSelection.length !== 2}
                    className="gap-2"
                  >
                    <GitMerge className="h-4 w-4" /> Fusionner ({mergeSelection.length}/2)
                  </Button>
                </>
              ) : (
                <Button variant="outline" onClick={handleStartMerge} className="gap-2">
                  <GitMerge className="h-4 w-4" /> Fusionner
                </Button>
              )}
              <Button onClick={() => setNewTicketOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" /> Nouveau ticket
              </Button>
            </>
          }
        />

        {/* Layout 2 colonnes */}
        <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-4">
          {/* ---- Liste des tickets ---- */}
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between gap-2">
                <span className="flex items-center gap-2">
                  <TicketIcon className="h-4 w-4 text-primary" /> Tickets
                </span>
                <Badge className="bg-primary/15 text-primary hover:bg-primary/15">{openTicketsCount} ouverts</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
                <TabsList className="w-full grid grid-cols-4">
                  <TabsTrigger value="open">Ouverts</TabsTrigger>
                  <TabsTrigger value="closed">Fermés</TabsTrigger>
                  <TabsTrigger value="cancelled">Annulés</TabsTrigger>
                  <TabsTrigger value="all">Tous</TabsTrigger>
                </TabsList>
              </Tabs>
              <SearchInput value={search} onChange={setSearch} placeholder="Rechercher ticket, table, zone..." />
              <div className="space-y-2 max-h-[28rem] overflow-y-auto scrollbar-thin pr-1 -mr-1">
                {filteredTickets.length === 0 ? (
                  <EmptyState icon={TicketIcon} title="Aucun ticket" description="Créez un nouveau ticket pour commencer." />
                ) : (
                  filteredTickets.map((t) => {
                    const isSelected = selectedId === t.id;
                    const isMergeSelected = mergeSelection.includes(t.id);
                    const canMerge = t.status === "open";
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          if (mergeMode) {
                            if (canMerge) toggleMergeSelection(t.id);
                            else toast.error("Seuls les tickets ouverts peuvent être fusionnés");
                          } else {
                            setSelectedId(t.id);
                          }
                        }}
                        className={`w-full text-left p-3 rounded-md border transition-colors ${
                          mergeMode && isMergeSelected
                            ? "border-primary bg-primary/10"
                            : isSelected
                            ? "border-primary bg-primary/5"
                            : "border-border hover:bg-muted/40"
                        } ${mergeMode && !canMerge ? "opacity-50" : ""}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">{t.name}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {getTableName(t.tableId)} — {getZoneName(t.zoneId)}
                            </p>
                          </div>
                          <Badge className={STATUS_BADGE_CLASS[t.status]}>{STATUS_LABELS[t.status]}</Badge>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs text-muted-foreground">
                            {t.items.length} article(s)
                          </span>
                          <span className="text-sm font-semibold text-primary">
                            {formatCurrency(computeTicketTotal(t), currency)}
                          </span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
              {mergeMode && (
                <p className="text-xs text-muted-foreground bg-muted/40 p-2 rounded-md">
                  Sélectionnez 2 tickets ouverts à fusionner. Les articles du 2e seront ajoutés au 1er.
                </p>
              )}
            </CardContent>
          </Card>

          {/* ---- Détail du ticket ---- */}
          <Card className="border-border/60">
            {!selectedTicket ? (
              <CardContent className="py-12">
                <EmptyState
                  icon={TicketIcon}
                  title="Aucun ticket sélectionné"
                  description="Sélectionnez un ticket dans la liste pour voir ses détails ou créez un nouveau ticket."
                  action={
                    <Button onClick={() => setNewTicketOpen(true)} className="gap-2">
                      <Plus className="h-4 w-4" /> Nouveau ticket
                    </Button>
                  }
                />
              </CardContent>
            ) : (
              <>
                {/* Header */}
                <CardHeader className="pb-3 border-b">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div className="min-w-0">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <span className="truncate">{selectedTicket.name}</span>
                        <Badge className={STATUS_BADGE_CLASS[selectedTicket.status]}>
                          {STATUS_LABELS[selectedTicket.status]}
                        </Badge>
                      </CardTitle>
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-2 flex-wrap">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {getTableName(selectedTicket.tableId)} — {getZoneName(selectedTicket.zoneId)}
                        </span>
                        <span>•</span>
                        <span>{formatDateTime(selectedTicket.createdAt)}</span>
                      </p>
                    </div>
                    {selectedTicket.status === "open" && (
                      <Button variant="ghost" size="icon" onClick={() => setPrintTicket(selectedTicket)} title="Imprimer">
                        <Printer className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                  {/* Items */}
                  <div className="space-y-2">
                    <SectionTitle
                      action={
                        selectedTicket.status === "open" && (
                          <Button size="sm" variant="outline" onClick={handleOpenAddItem} className="gap-1">
                            <Plus className="h-4 w-4" /> Ajouter
                          </Button>
                        )
                      }
                    >
                      Articles ({selectedTicket.items.length})
                    </SectionTitle>
                    {selectedTicket.items.length === 0 ? (
                      <EmptyState
                        icon={ShoppingCart}
                        title="Aucun article"
                        description="Ajoutez des produits à ce ticket."
                        action={
                          selectedTicket.status === "open" ? (
                            <Button size="sm" onClick={handleOpenAddItem} className="gap-1">
                              <Plus className="h-4 w-4" /> Ajouter un produit
                            </Button>
                          ) : undefined
                        }
                      />
                    ) : (
                      <div className="space-y-2 max-h-80 overflow-y-auto scrollbar-thin pr-1 -mr-1">
                        {selectedTicket.items.map((it) => (
                          <div key={it.id} className="rounded-md border p-2.5 bg-muted/20">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-sm truncate">{it.productName}</p>
                                <p className="text-xs text-muted-foreground">
                                  {it.quantity} × {formatCurrency(it.unitPrice, currency)} ={" "}
                                  <span className="font-semibold">{formatCurrency(it.quantity * it.unitPrice, currency)}</span>
                                </p>
                                {it.note && (
                                  <p className="text-xs text-amber-700 dark:text-amber-400 italic mt-0.5">Note : {it.note}</p>
                                )}
                              </div>
                              {selectedTicket.status === "open" && (
                                <div className="flex items-center gap-1 shrink-0">
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-7 w-7"
                                    onClick={() =>
                                      updateTicketItem(selectedTicket.id, it.id, {
                                        quantity: Math.max(1, it.quantity - 1),
                                      })
                                    }
                                  >
                                    <Minus className="h-3 w-3" />
                                  </Button>
                                  <span className="w-6 text-center text-sm font-medium">{it.quantity}</span>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-7 w-7"
                                    onClick={() =>
                                      updateTicketItem(selectedTicket.id, it.id, { quantity: it.quantity + 1 })
                                    }
                                  >
                                    <Plus className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-7 w-7"
                                    onClick={() => openEditItem(it)}
                                    title="Modifier"
                                  >
                                    <Pencil className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-7 w-7 text-destructive hover:text-destructive"
                                    onClick={() => {
                                      removeTicketItem(selectedTicket.id, it.id);
                                      toast.success("Article supprimé");
                                    }}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Discount + Note (editable when open) */}
                  {selectedTicket.status === "open" && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-sm">Remise sur le ticket</Label>
                        <Input
                          type="number"
                          value={selectedTicket.discount}
                          min={0}
                          onChange={(e) =>
                            updateTicket(selectedTicket.id, {
                              discount: Math.max(0, parseFloat(e.target.value) || 0),
                            })
                          }
                          className="h-8"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-sm">Note du ticket</Label>
                        <Textarea
                          value={selectedTicket.note || ""}
                          onChange={(e) => updateTicket(selectedTicket.id, { note: e.target.value })}
                          rows={1}
                          className="resize-none min-h-[2.25rem]"
                          placeholder="Note..."
                        />
                      </div>
                    </div>
                  )}

                  {/* Total */}
                  <div className="rounded-md border bg-muted/30 p-3 space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Sous-total</span>
                      <span>{formatCurrency(computeTicketSubtotal(selectedTicket.items), currency)}</span>
                    </div>
                    {selectedTicket.discount > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Remise</span>
                        <span className="text-destructive">- {formatCurrency(selectedTicket.discount, currency)}</span>
                      </div>
                    )}
                    <Separator className="my-1" />
                    <div className="flex justify-between font-bold text-base">
                      <span>Total</span>
                      <span className="text-primary">{formatCurrency(computeTicketTotal(selectedTicket), currency)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  {selectedTicket.status === "open" ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setClearTicketState(selectedTicket)}
                        disabled={selectedTicket.items.length === 0}
                        className="gap-1"
                      >
                        <Eraser className="h-4 w-4" /> Vider
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          updateTicket(selectedTicket.id, {});
                          toast.success("Ticket enregistré");
                        }}
                        className="gap-1"
                      >
                        <Save className="h-4 w-4" /> Enregistrer
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setTransferTicket(selectedTicket)}
                        className="gap-1"
                      >
                        <Send className="h-4 w-4" /> Transférer
                      </Button>
                      <Button
                        onClick={() => {
                          setCloseFlowTicket(selectedTicket);
                          setCloseDiscount(selectedTicket.discount || 0);
                          setCloseNote(selectedTicket.note || "");
                        }}
                        disabled={selectedTicket.items.length === 0}
                        className="gap-1 sm:col-span-1"
                      >
                        <Check className="h-4 w-4" /> Fermer
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setPrintTicket(selectedTicket)}
                        className="gap-1"
                      >
                        <Printer className="h-4 w-4" /> Imprimer
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setCancelTicketState(selectedTicket)}
                        className="gap-1 text-destructive hover:text-destructive"
                      >
                        <Ban className="h-4 w-4" /> Annuler
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => setPrintTicket(selectedTicket)} className="gap-2 flex-1">
                        <Printer className="h-4 w-4" /> Imprimer
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setCancelTicketState(selectedTicket)}
                        className="gap-2 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" /> Supprimer
                      </Button>
                    </div>
                  )}
                </CardContent>
              </>
            )}
          </Card>
        </div>
      </div>

      {/* ============ DIALOG : Nouveau ticket ============ */}
      <Dialog open={newTicketOpen} onOpenChange={setNewTicketOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" /> Nouveau ticket
            </DialogTitle>
            <DialogDescription>Choisissez une table et donnez un nom au ticket.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="ticket-name">Nom du ticket</Label>
              <Input
                id="ticket-name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ex : Table 4, Client Dupont..."
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label>Table</Label>
              {groupedTables.length === 0 && ungroupedTables.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Aucune table configurée.{" "}
                  <Button variant="link" className="h-auto p-0" onClick={() => setTablesOpen(true)}>
                    En ajouter
                  </Button>
                </p>
              ) : (
                <Select
                  value={newTableId}
                  onValueChange={(v) => {
                    setNewTableId(v);
                    const tbl = data.tables.find((t) => t.id === v);
                    if (tbl) setNewZoneId(tbl.zoneId);
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sélectionner une table..." />
                  </SelectTrigger>
                  <SelectContent>
                    {groupedTables.map((g) => (
                      <div key={g.zone.id}>
                        <p className="text-xs text-muted-foreground px-2 pt-1.5 pb-0.5">{g.zone.name}</p>
                        {g.tables.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.name}
                          </SelectItem>
                        ))}
                      </div>
                    ))}
                    {ungroupedTables.length > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground px-2 pt-1.5 pb-0.5">Sans zone</p>
                        {ungroupedTables.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.name}
                          </SelectItem>
                        ))}
                      </div>
                    )}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewTicketOpen(false)}>Annuler</Button>
            <Button onClick={handleCreateTicket} className="gap-2">
              <Check className="h-4 w-4" /> Créer le ticket
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============ DIALOG : Ajouter un produit ============ */}
      <Dialog open={addItemOpen} onOpenChange={setAddItemOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" /> Ajouter un produit
            </DialogTitle>
            <DialogDescription>Sélectionnez un produit du menu et la quantité souhaitée.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <SearchInput value={productSearch} onChange={setProductSearch} placeholder="Rechercher un produit..." />
            {printableProducts.length === 0 ? (
              <EmptyState icon={Utensils} title="Aucun produit" description="Aucun produit actif au menu." />
            ) : (
              <div className="max-h-60 overflow-y-auto scrollbar-thin border rounded-md divide-y">
                {printableProducts.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setAddItemProductId(p.id);
                      setAddItemPrice(p.salePrice);
                    }}
                    className={`w-full text-left p-2.5 hover:bg-muted/50 transition-colors ${
                      addItemProductId === p.id ? "bg-primary/10 border-l-4 border-primary" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{p.name}</p>
                        <p className="text-xs text-muted-foreground">Stock : {p.stock} {p.unit}</p>
                      </div>
                      <span className="text-sm font-semibold">{formatCurrency(p.salePrice, currency)}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
            {addItemProductId && (
              <div className="grid grid-cols-2 gap-3 p-3 rounded-md border bg-muted/30">
                <div className="space-y-1.5">
                  <Label className="text-sm">Quantité</Label>
                  <div className="flex items-center gap-1">
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8"
                      onClick={() => setAddItemQty((q) => Math.max(1, q - 1))}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <Input
                      type="number"
                      value={addItemQty}
                      min={1}
                      onChange={(e) => setAddItemQty(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-16 text-center"
                    />
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8"
                      onClick={() => setAddItemQty((q) => q + 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Prix unitaire</Label>
                  <Input
                    type="number"
                    value={addItemPrice}
                    min={0}
                    onChange={(e) => setAddItemPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                  />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label className="text-sm">Note (optionnel)</Label>
                  <Input
                    value={addItemNote}
                    onChange={(e) => setAddItemNote(e.target.value)}
                    placeholder="Cuisson, sauce, sans oignon..."
                  />
                </div>
                <div className="col-span-2 flex items-center justify-between text-sm font-semibold border-t pt-2">
                  <span>Total ligne</span>
                  <span className="text-primary">{formatCurrency(addItemQty * addItemPrice, currency)}</span>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddItemOpen(false)}>Annuler</Button>
            <Button onClick={handleAddItem} disabled={!addItemProductId} className="gap-2">
              <Check className="h-4 w-4" /> Ajouter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============ DIALOG : Modifier un item ============ */}
      <Dialog open={!!editItemOpen} onOpenChange={(o) => !o && setEditItemOpen(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5 text-primary" /> Modifier l'article
            </DialogTitle>
            {editItemOpen && <DialogDescription>{editItemOpen.productName}</DialogDescription>}
          </DialogHeader>
          {editItemOpen && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-sm">Quantité</Label>
                  <Input
                    type="number"
                    value={editQty}
                    min={1}
                    onChange={(e) => setEditQty(Math.max(1, parseInt(e.target.value) || 1))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Prix unitaire</Label>
                  <Input
                    type="number"
                    value={editPrice}
                    min={0}
                    onChange={(e) => setEditPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Note</Label>
                <Textarea
                  value={editNote}
                  onChange={(e) => setEditNote(e.target.value)}
                  rows={2}
                  className="resize-none"
                />
              </div>
              <div className="flex items-center justify-between text-sm font-semibold border-t pt-2">
                <span>Total ligne</span>
                <span className="text-primary">{formatCurrency(editQty * editPrice, currency)}</span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditItemOpen(null)}>Annuler</Button>
            <Button onClick={handleSaveItem} className="gap-2">
              <Check className="h-4 w-4" /> Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============ DIALOG : Fermer le ticket ============ */}
      <Dialog open={!!closeFlowTicket} onOpenChange={(o) => !o && setCloseFlowTicket(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Check className="h-5 w-5 text-emerald-600" /> Fermer le ticket
            </DialogTitle>
            <DialogDescription>
              Validez la vente pour fermer ce ticket. Le stock sera décrémenté automatiquement.
            </DialogDescription>
          </DialogHeader>
          {closeFlowTicket && (
            <div className="space-y-3">
              <div className="rounded-md border bg-muted/30 p-3 text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ticket</span>
                  <span className="font-medium">{closeFlowTicket.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Articles</span>
                  <span>{closeFlowTicket.items.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sous-total</span>
                  <span>{formatCurrency(computeTicketSubtotal(closeFlowTicket.items), currency)}</span>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Mode de paiement</Label>
                {activePaymentMethods.length === 0 ? (
                  <p className="text-sm text-destructive">Aucun mode de paiement actif.</p>
                ) : (
                  <RadioGroup
                    value={effectiveClosePaymentId}
                    onValueChange={setClosePaymentId}
                    className="grid grid-cols-2 sm:grid-cols-3 gap-2"
                  >
                    {activePaymentMethods.map((pm) => (
                      <Label
                        key={pm.id}
                        htmlFor={`cpm-${pm.id}`}
                        className="flex items-center gap-2 p-2 rounded-md border cursor-pointer hover:bg-muted/40 has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                      >
                        <RadioGroupItem id={`cpm-${pm.id}`} value={pm.id} />
                        <span className="text-sm">{pm.name}</span>
                      </Label>
                    ))}
                  </RadioGroup>
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Remise appliquée</Label>
                <Input
                  type="number"
                  value={closeDiscount}
                  min={0}
                  onChange={(e) => setCloseDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Note (optionnel)</Label>
                <Textarea
                  value={closeNote}
                  onChange={(e) => setCloseNote(e.target.value)}
                  rows={2}
                  className="resize-none"
                />
              </div>
              <div className="rounded-md border bg-primary/5 p-3 flex items-center justify-between font-bold">
                <span>Total à encaisser</span>
                <span className="text-primary">
                  {formatCurrency(
                    Math.max(0, computeTicketSubtotal(closeFlowTicket.items) - (closeDiscount || 0)),
                    currency
                  )}
                </span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setCloseFlowTicket(null)}>Annuler</Button>
            <Button onClick={handleCloseTicket} disabled={!effectiveClosePaymentId} className="gap-2">
              <Check className="h-4 w-4" /> Valider et fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============ DIALOG : Transférer ============ */}
      <Dialog open={!!transferTicket} onOpenChange={(o) => !o && setTransferTicket(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-primary" /> Transférer le ticket
            </DialogTitle>
            {transferTicket && (
              <DialogDescription>
                Transférer « {transferTicket.name} » vers une autre table.
              </DialogDescription>
            )}
          </DialogHeader>
          <div className="space-y-1.5">
            <Label>Table de destination</Label>
            <Select value={transferTableId} onValueChange={setTransferTableId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Sélectionner une table..." />
              </SelectTrigger>
              <SelectContent>
                {groupedTables.map((g) => (
                  <div key={g.zone.id}>
                    <p className="text-xs text-muted-foreground px-2 pt-1.5 pb-0.5">{g.zone.name}</p>
                    {g.tables
                      .filter((t) => t.id !== transferTicket?.tableId)
                      .map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name}
                        </SelectItem>
                      ))}
                  </div>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTransferTicket(null)}>Annuler</Button>
            <Button onClick={handleTransfer} disabled={!transferTableId} className="gap-2">
              <Check className="h-4 w-4" /> Transférer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============ DIALOG : Gérer les tables/zones ============ */}
      <Dialog open={tablesOpen} onOpenChange={setTablesOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LayoutGrid className="h-5 w-5 text-primary" /> Gestion des tables et zones
            </DialogTitle>
            <DialogDescription>Organisez les zones et tables de votre restaurant.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 overflow-y-auto scrollbar-thin pr-1 -mr-1">
            {/* Zones */}
            <div className="space-y-3">
              <SectionTitle>Zones ({data.zones.length})</SectionTitle>
              <div className="flex gap-2">
                <Input
                  value={newZoneName}
                  onChange={(e) => setNewZoneName(e.target.value)}
                  placeholder="Nouvelle zone..."
                  className="h-8"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddZone();
                  }}
                />
                <Button size="sm" onClick={handleAddZone} className="gap-1">
                  <Plus className="h-4 w-4" /> Ajouter
                </Button>
              </div>
              <div className="space-y-2 max-h-72 overflow-y-auto scrollbar-thin">
                {data.zones.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Aucune zone.</p>
                ) : (
                  data.zones.map((z) => (
                    <div key={z.id} className="flex items-center gap-2 p-2 rounded-md border">
                      {editingZone?.id === z.id ? (
                        <>
                          <Input
                            value={editingZoneName}
                            onChange={(e) => setEditingZoneName(e.target.value)}
                            className="h-8"
                            autoFocus
                          />
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleSaveZone}>
                            <Check className="h-4 w-4 text-emerald-600" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => {
                              setEditingZone(null);
                              setEditingZoneName("");
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <span className="font-medium text-sm flex-1">{z.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {data.tables.filter((t) => t.zoneId === z.id).length} tables
                          </span>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => {
                              setEditingZone(z);
                              setEditingZoneName(z.name);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => {
                              deleteZone(z.id);
                              toast.success("Zone supprimée");
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Tables */}
            <div className="space-y-3">
              <SectionTitle>Tables ({data.tables.length})</SectionTitle>
              <div className="space-y-2">
                <Select
                  value={newTableZoneId}
                  onValueChange={setNewTableZoneId}
                >
                  <SelectTrigger className="h-8 w-full">
                    <SelectValue placeholder="Zone..." />
                  </SelectTrigger>
                  <SelectContent>
                    {data.zones.length === 0 ? (
                      <SelectItem value="" disabled>Aucune zone</SelectItem>
                    ) : (
                      data.zones.map((z) => (
                        <SelectItem key={z.id} value={z.id}>
                          {z.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <div className="flex gap-2">
                  <Input
                    value={newTableName}
                    onChange={(e) => setNewTableName(e.target.value)}
                    placeholder="Nouvelle table..."
                    className="h-8"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddTable();
                    }}
                  />
                  <Button size="sm" onClick={handleAddTable} className="gap-1">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2 max-h-72 overflow-y-auto scrollbar-thin">
                {data.tables.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Aucune table.</p>
                ) : (
                  data.tables.map((t) => {
                    const zName = getZoneName(t.zoneId);
                    return (
                      <div key={t.id} className="flex items-center gap-2 p-2 rounded-md border">
                        {editingTable?.id === t.id ? (
                          <>
                            <Input
                              value={editingTableName}
                              onChange={(e) => setEditingTableName(e.target.value)}
                              className="h-8"
                              autoFocus
                            />
                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleSaveTable}>
                              <Check className="h-4 w-4 text-emerald-600" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              onClick={() => {
                                setEditingTable(null);
                                setEditingTableName("");
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{t.name}</p>
                              <p className="text-xs text-muted-foreground">{zName}</p>
                            </div>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              onClick={() => {
                                setEditingTable(t);
                                setEditingTableName(t.name);
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => {
                                deleteTable(t.id);
                                toast.success("Table supprimée");
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
          <DialogFooter className="border-t pt-4">
            <Button variant="outline" onClick={() => setTablesOpen(false)}>Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============ CONFIRM dialogs ============ */}
      <ConfirmDialog
        open={!!cancelTicketState}
        onOpenChange={(o) => !o && setCancelTicketState(null)}
        title={cancelTicketState?.status === "open" ? "Annuler ce ticket ?" : "Supprimer ce ticket ?"}
        description={
          cancelTicketState
            ? cancelTicketState.status === "open"
              ? `Le ticket « ${cancelTicketState.name} » sera marqué comme annulé.`
              : `Le ticket « ${cancelTicketState.name} » sera définitivement supprimé.`
            : ""
        }
        confirmLabel={cancelTicketState?.status === "open" ? "Annuler le ticket" : "Supprimer"}
        cancelLabel="Conserver"
        destructive
        onConfirm={handleCancelTicket}
      />
      <ConfirmDialog
        open={!!clearTicketState}
        onOpenChange={(o) => !o && setClearTicketState(null)}
        title="Vider les articles du ticket ?"
        description={
          clearTicketState
            ? `Tous les articles du ticket « ${clearTicketState.name} » seront supprimés.`
            : ""
        }
        confirmLabel="Vider"
        cancelLabel="Conserver"
        destructive
        onConfirm={handleClearTicket}
      />

      {/* ============ PRINT AREA ============ */}
      {printTicket && (
        <div className="print-area hidden print:block print-ticket">
          <PrintableTicketDoc
            ticket={printTicket}
            currency={currency}
            restaurantName={data.settings.restaurant.name}
            tableName={getTableName(printTicket.tableId)}
            zoneName={getZoneName(printTicket.zoneId)}
            ticketMessage={data.settings.restaurant.ticketMessage}
          />
        </div>
      )}
    </div>
  );
}

// ============================================================
// Ticket imprimable
// ============================================================
function PrintableTicketDoc({
  ticket,
  currency,
  restaurantName,
  tableName,
  zoneName,
  ticketMessage,
}: {
  ticket: Ticket;
  currency: string;
  restaurantName: string;
  tableName: string;
  zoneName: string;
  ticketMessage: string;
}) {
  const subtotal = computeTicketSubtotal(ticket.items);
  const total = computeTicketTotal(ticket);
  return (
    <div className="font-mono text-[12px]">
      <div className="text-center mb-2">
        <p className="font-bold text-base">{restaurantName}</p>
        <p>================================</p>
      </div>
      <div className="mb-2">
        <p>Ticket : {ticket.name}</p>
        <p>Table  : {tableName} ({zoneName})</p>
        <p>Date   : {formatDateTime(ticket.createdAt)}</p>
        <p>Statut : {STATUS_LABELS[ticket.status]}</p>
      </div>
      <p>--------------------------------</p>
      <div className="mb-2">
        {ticket.items.length === 0 ? (
          <p className="italic">Aucun article</p>
        ) : (
          ticket.items.map((it, i) => (
            <div key={i} className="mb-1">
              <p>
                {it.quantity} × {it.productName} = <strong>{formatCurrency(it.quantity * it.unitPrice, currency)}</strong>
              </p>
              <p className="pl-4 text-[11px]">P.U. {formatCurrency(it.unitPrice, currency)}</p>
              {it.note && <p className="pl-4 text-[11px] italic">Note : {it.note}</p>}
            </div>
          ))
        )}
      </div>
      <p>--------------------------------</p>
      <div>
        <p>Sous-total : {formatCurrency(subtotal, currency)}</p>
        {ticket.discount > 0 && <p>Remise     : - {formatCurrency(ticket.discount, currency)}</p>}
        <p className="font-bold text-base">TOTAL : {formatCurrency(total, currency)}</p>
      </div>
      {ticket.note && (
        <>
          <p>--------------------------------</p>
          <p>Note : {ticket.note}</p>
        </>
      )}
      <p>================================</p>
      {ticketMessage && <p className="text-center mt-2">{ticketMessage}</p>}
      <p className="text-center mt-2 text-[10px]">Merci de votre visite !</p>
    </div>
  );
}
