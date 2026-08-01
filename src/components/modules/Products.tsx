// ============================================================
// ELISHAMA — Module : Produits & Catégories
// ============================================================
"use client";

import React, { useMemo, useState, useRef, useCallback } from "react";
import { useStore } from "@/lib/store";
import { useNewActionListener } from "@/hooks/use-new-action-listener";
import {
  PageHeader,
  StatCard,
  EmptyState,
  ConfirmDialog,
  SearchInput,
  SectionTitle,
  StockBadge,
  Money,
} from "@/components/shared";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  UtensilsCrossed,
  Printer,
  Plus,
  Eye,
  Pencil,
  Copy,
  Archive,
  ArchiveRestore,
  Power,
  Menu as MenuIcon,
  PackagePlus,
  PackageMinus,
  SlidersHorizontal,
  Trash2,
  MoreVertical,
  ArrowUp,
  ArrowDown,
  Tag,
  ImageIcon,
  X,
  Star,
} from "lucide-react";
import { formatCurrency, formatDateTime } from "@/lib/format";
import type { Product, Category } from "@/lib/types";

// ---------- Helpers locaux ----------

type StatusFilter = "all" | "active" | "inactive" | "archived";

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  active: { label: "Actif", className: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-400" },
  inactive: { label: "Inactif", className: "bg-muted text-muted-foreground hover:bg-muted" },
  archived: { label: "Archivé", className: "bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-950 dark:text-red-400" },
};

function getProductStatus(p: Product): "active" | "inactive" | "archived" {
  if (p.archived) return "archived";
  return p.active ? "active" : "inactive";
}

// Formulaire produit vide par défaut
function emptyProductForm(categoryId: string = "") {
  return {
    name: "",
    categoryId,
    salePrice: 0,
    purchasePrice: 0,
    stock: 0,
    minStock: 0,
    unit: "unité",
    description: "",
    image: "",
    active: true,
    onMenu: true,
    archived: false,
  };
}

// ============================================================
// Composant principal
// ============================================================
export function Products() {
  const {
    data,
    addProduct,
    updateProduct,
    deleteProduct,
    archiveProduct,
    duplicateProduct,
    toggleFavorite,
    adjustStock,
    setProductStock,
    addCategory,
    updateCategory,
    deleteCategory,
    reorderCategories,
    getCategoryName,
    getProduct,
  } = useStore();
  const currency = data.settings.usage.currency;

  // ---- Filtres ----
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [favoritesOnly, setFavoritesOnly] = useState(false);

  // ---- Dialog Produit (ajout/édition) ----
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyProductForm());
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Raccourci "N" → ouvre le dialog nouveau produit
  const handleNewProduct = useCallback(() => {
    setEditingProductId(null);
    setForm(emptyProductForm());
    setProductDialogOpen(true);
  }, []);
  useNewActionListener(handleNewProduct);

  // ---- Dialog Voir détails ----
  const [viewProductId, setViewProductId] = useState<string | null>(null);

  // ---- Dialog Stock ----
  const [stockProductId, setStockProductId] = useState<string | null>(null);
  const [stockMode, setStockMode] = useState<"in" | "out" | "adjust">("in");
  const [stockQty, setStockQty] = useState<number>(0);
  const [stockReason, setStockReason] = useState<string>("");

  // ---- Confirm suppression produit ----
  const [deleteProductId, setDeleteProductId] = useState<string | null>(null);

  // ---- Dialog Catégorie ----
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [categoryName, setCategoryName] = useState("");
  const [categoryActive, setCategoryActive] = useState(true);

  // ---- Confirm suppression catégorie ----
  const [deleteCategoryId, setDeleteCategoryId] = useState<string | null>(null);

  // ---- Catégories triées ----
  const sortedCategories = useMemo(
    () => [...data.categories].sort((a, b) => a.order - b.order),
    [data.categories]
  );

  // ---- Produits filtrés ----
  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.products
      .filter((p) => {
        if (q && !p.name.toLowerCase().includes(q)) return false;
        if (categoryFilter !== "all" && p.categoryId !== categoryFilter) return false;
        if (statusFilter !== "all" && getProductStatus(p) !== statusFilter) return false;
        if (favoritesOnly && !p.favorite) return false;
        return true;
      })
      .sort((a, b) => {
        // Favoris en premier
        const af = a.favorite ? 1 : 0;
        const bf = b.favorite ? 1 : 0;
        if (af !== bf) return bf - af;
        // Puis par nom
        return a.name.localeCompare(b.name);
      });
  }, [data.products, search, categoryFilter, statusFilter, favoritesOnly]);

  // ---- Stats ----
  const stats = useMemo(() => {
    const active = data.products.filter((p) => !p.archived && p.active);
    const inactive = data.products.filter((p) => !p.archived && !p.active);
    const archived = data.products.filter((p) => p.archived);
    const onMenu = data.products.filter((p) => p.onMenu && !p.archived);
    const favorites = data.products.filter((p) => p.favorite && !p.archived);
    return {
      total: data.products.length,
      active: active.length,
      inactive: inactive.length,
      archived: archived.length,
      onMenu: onMenu.length,
      favorites: favorites.length,
      categories: data.categories.length,
    };
  }, [data.products, data.categories]);

  // ============================================================
  // Handlers Produits
  // ============================================================

  function openAddProduct() {
    setEditingProductId(null);
    const defaultCat = data.categories.find((c) => c.active)?.id ?? "";
    setForm(emptyProductForm(defaultCat));
    setProductDialogOpen(true);
  }

  function openEditProduct(p: Product) {
    setEditingProductId(p.id);
    setForm({
      name: p.name,
      categoryId: p.categoryId,
      salePrice: p.salePrice,
      purchasePrice: p.purchasePrice ?? 0,
      stock: p.stock,
      minStock: p.minStock,
      unit: p.unit,
      description: p.description ?? "",
      image: p.image ?? "",
      active: p.active,
      onMenu: p.onMenu,
      archived: p.archived,
    });
    setProductDialogOpen(true);
  }

  function handleImageFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 500 * 1024) {
      toast.error("Image trop lourde", { description: "Maximum 500 Ko." });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setForm((f) => ({ ...f, image: String(reader.result) }));
    };
    reader.readAsDataURL(file);
  }

  function handleSaveProduct() {
    if (!form.name.trim()) {
      toast.error("Nom requis", { description: "Veuillez saisir un nom de produit." });
      return;
    }
    if (!form.categoryId) {
      toast.error("Catégorie requise", { description: "Veuillez sélectionner une catégorie." });
      return;
    }
    if (form.salePrice < 0 || form.stock < 0 || form.minStock < 0) {
      toast.error("Valeurs invalides", { description: "Les prix et quantités doivent être positifs." });
      return;
    }

    const payload = {
      name: form.name.trim(),
      categoryId: form.categoryId,
      salePrice: Number(form.salePrice) || 0,
      purchasePrice: Number(form.purchasePrice) || 0,
      stock: Number(form.stock) || 0,
      minStock: Number(form.minStock) || 0,
      unit: form.unit.trim() || "unité",
      description: form.description.trim() || undefined,
      image: form.image || undefined,
      active: form.active,
      onMenu: form.onMenu,
      archived: form.archived,
    };

    if (editingProductId) {
      updateProduct(editingProductId, payload);
      toast.success("Produit modifié", { description: payload.name });
    } else {
      addProduct(payload);
      toast.success("Produit ajouté", { description: payload.name });
    }
    setProductDialogOpen(false);
  }

  function handleDuplicate(id: string) {
    duplicateProduct(id);
    const p = getProduct(id);
    toast.success("Produit dupliqué", { description: p ? `${p.name} (copie)` : undefined });
  }

  function handleToggleActive(p: Product) {
    updateProduct(p.id, { active: !p.active });
    toast.success(!p.active ? "Produit activé" : "Produit désactivé", { description: p.name });
  }

  function handleToggleMenu(p: Product) {
    updateProduct(p.id, { onMenu: !p.onMenu });
    toast.success(!p.onMenu ? "Ajouté au menu" : "Retiré du menu", { description: p.name });
  }

  function handleToggleArchive(p: Product) {
    archiveProduct(p.id, !p.archived);
    toast.success(!p.archived ? "Produit archivé" : "Produit restauré", { description: p.name });
  }

  function handleConfirmDeleteProduct() {
    if (!deleteProductId) return;
    const p = getProduct(deleteProductId);
    deleteProduct(deleteProductId);
    toast.success("Produit supprimé", { description: p?.name });
    setDeleteProductId(null);
  }

  // ---- Stock ----
  function openStockDialog(p: Product, mode: "in" | "out" | "adjust") {
    setStockProductId(p.id);
    setStockMode(mode);
    setStockQty(mode === "adjust" ? p.stock : 0);
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
      adjustStock(p.id, qty, stockReason || "Entrée de stock", "in");
      toast.success("Entrée enregistrée", { description: `${p.name} : +${qty} ${p.unit}` });
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

  // ============================================================
  // Handlers Catégories
  // ============================================================
  function openAddCategory() {
    setEditingCategoryId(null);
    setCategoryName("");
    setCategoryActive(true);
    setCategoryDialogOpen(true);
  }

  function openEditCategory(c: Category) {
    setEditingCategoryId(c.id);
    setCategoryName(c.name);
    setCategoryActive(c.active);
    setCategoryDialogOpen(true);
  }

  function handleSaveCategory() {
    if (!categoryName.trim()) {
      toast.error("Nom requis", { description: "Veuillez saisir un nom de catégorie." });
      return;
    }
    if (editingCategoryId) {
      updateCategory(editingCategoryId, { name: categoryName.trim(), active: categoryActive });
      toast.success("Catégorie modifiée", { description: categoryName.trim() });
    } else {
      addCategory(categoryName.trim());
      toast.success("Catégorie ajoutée", { description: categoryName.trim() });
    }
    setCategoryDialogOpen(false);
  }

  function handleConfirmDeleteCategory() {
    if (!deleteCategoryId) return;
    const c = data.categories.find((x) => x.id === deleteCategoryId);
    deleteCategory(deleteCategoryId);
    toast.success("Catégorie supprimée", { description: c?.name });
    setDeleteCategoryId(null);
  }

  function moveCategory(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= sortedCategories.length) return;
    const ids = sortedCategories.map((c) => c.id);
    [ids[index], ids[target]] = [ids[target], ids[index]];
    reorderCategories(ids);
  }

  // ---- Produit visualisé ----
  const viewedProduct = viewProductId ? getProduct(viewProductId) : null;
  const viewedProductMovements = useMemo(
    () => (viewedProduct ? data.stockMovements.filter((m) => m.productId === viewedProduct.id).slice(0, 30) : []),
    [viewedProduct, data.stockMovements]
  );

  // ---- Produit stock dialog ----
  const stockProduct = stockProductId ? getProduct(stockProductId) : null;

  // ---- Produit à supprimer ----
  const deleteProductObj = deleteProductId ? getProduct(deleteProductId) : null;

  return (
    <div>
      <PageHeader
        title="Produits"
        subtitle="Gérez votre carte : produits, prix, stock et catégories."
        icon={UtensilsCrossed}
        actions={
          <>
            <Button variant="outline" className="gap-2 no-print" onClick={() => window.print()}>
              <Printer className="h-4 w-4" /> Imprimer
            </Button>
            <Button className="gap-2 no-print" onClick={openAddProduct}>
              <Plus className="h-4 w-4" /> Ajouter un produit
              <kbd className="hidden sm:inline-flex h-5 items-center rounded border border-white/30 bg-white/10 px-1.5 text-[10px] font-mono">N</kbd>
            </Button>
          </>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-6">
        <StatCard label="Produits actifs" value={stats.active} icon={UtensilsCrossed} tone="success" hint={`${stats.total} au total`} />
        <StatCard label="Au menu" value={stats.onMenu} icon={MenuIcon} tone="primary" hint="Disponibles à la vente" />
        <StatCard label="Favoris" value={stats.favorites} icon={Star} tone="warning" hint="Accès rapide" />
        <StatCard label="Inactifs" value={stats.inactive} icon={Power} tone="default" />
        <StatCard label="Catégories" value={stats.categories} icon={Tag} tone="default" hint={`${stats.archived} archivé(s)`} />
      </div>

      <Tabs defaultValue="products" className="space-y-4">
        <TabsList>
          <TabsTrigger value="products" className="gap-2"><UtensilsCrossed className="h-4 w-4" /> Produits</TabsTrigger>
          <TabsTrigger value="categories" className="gap-2"><Tag className="h-4 w-4" /> Catégories</TabsTrigger>
        </TabsList>

        {/* ============================== ONGLET PRODUITS ============================== */}
        <TabsContent value="products" className="space-y-4">
          {/* Filtres */}
          <Card className="border-border/60">
            <CardContent className="p-3 sm:p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <SearchInput value={search} onChange={setSearch} placeholder="Rechercher un produit..." className="lg:col-span-2" />
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Catégorie" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les catégories</SelectItem>
                    {sortedCategories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Statut" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="active">Actifs</SelectItem>
                    <SelectItem value="inactive">Inactifs</SelectItem>
                    <SelectItem value="archived">Archivés</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {/* Bouton Favoris */}
              <div className="mt-3 flex items-center gap-2">
                <Button
                  variant={favoritesOnly ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFavoritesOnly((v) => !v)}
                  className="gap-1.5"
                >
                  <Star className={cn("h-3.5 w-3.5", favoritesOnly && "fill-current")} />
                  Favoris
                  {stats.favorites > 0 && (
                    <Badge variant={favoritesOnly ? "secondary" : "outline"} className="ml-1 px-1.5 py-0 text-[10px]">
                      {stats.favorites}
                    </Badge>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Liste */}
          {filteredProducts.length === 0 ? (
            <Card className="border-border/60">
              <CardContent className="p-0">
                <EmptyState
                  icon={UtensilsCrossed}
                  title="Aucun produit"
                  description={data.products.length === 0 ? "Commencez par ajouter votre premier produit." : "Aucun produit ne correspond à vos filtres."}
                  action={<Button className="gap-2" onClick={openAddProduct}><Plus className="h-4 w-4" /> Ajouter</Button>}
                />
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Tableau desktop */}
              <Card className="border-border/60 hidden md:block">
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produit</TableHead>
                        <TableHead>Catégorie</TableHead>
                        <TableHead className="text-right">Prix vente</TableHead>
                        <TableHead className="text-center">Stock</TableHead>
                        <TableHead className="text-center">Statut</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProducts.map((p) => {
                        const status = getProductStatus(p);
                        return (
                          <TableRow key={p.id} className="hover:bg-muted/40">
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="relative shrink-0">
                                  {p.image ? (
                                    <img src={p.image} alt={p.name} className="h-10 w-10 rounded-md object-cover border" />
                                  ) : (
                                    <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center">
                                      <UtensilsCrossed className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                  )}
                                  <button
                                    onClick={() => toggleFavorite(p.id)}
                                    className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-card border border-border shadow-sm hover:scale-110 transition-transform"
                                    title={p.favorite ? "Retirer des favoris" : "Ajouter aux favoris"}
                                    aria-label={p.favorite ? "Retirer des favoris" : "Ajouter aux favoris"}
                                  >
                                    <Star className={cn("h-3 w-3", p.favorite ? "fill-amber-400 text-amber-400" : "text-muted-foreground")} />
                                  </button>
                                </div>
                                <div className="min-w-0">
                                  <p className="font-medium truncate flex items-center gap-1.5">
                                    {p.name}
                                    {p.favorite && <Star className="h-3 w-3 fill-amber-400 text-amber-400 shrink-0" />}
                                  </p>
                                  <p className="text-xs text-muted-foreground">{p.unit}{p.onMenu ? " · 📋 Menu" : ""}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{getCategoryName(p.categoryId) || "—"}</Badge>
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              <Money amount={p.salePrice} currency={currency} />
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex flex-col items-center gap-1">
                                <span className="font-medium">{p.stock} {p.unit}</span>
                                <StockBadge stock={p.stock} minStock={p.minStock} />
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge className={STATUS_BADGE[status].className}>{STATUS_BADGE[status].label}</Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <ProductActions
                                product={p}
                                onView={() => setViewProductId(p.id)}
                                onEdit={() => openEditProduct(p)}
                                onDuplicate={() => handleDuplicate(p.id)}
                                onToggleFavorite={() => toggleFavorite(p.id)}
                                onToggleActive={() => handleToggleActive(p)}
                                onToggleMenu={() => handleToggleMenu(p)}
                                onToggleArchive={() => handleToggleArchive(p)}
                                onStockIn={() => openStockDialog(p, "in")}
                                onStockOut={() => openStockDialog(p, "out")}
                                onStockAdjust={() => openStockDialog(p, "adjust")}
                                onDelete={() => setDeleteProductId(p.id)}
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:hidden">
                {filteredProducts.map((p) => {
                  const status = getProductStatus(p);
                  return (
                    <Card key={p.id} className="border-border/60">
                      <CardContent className="p-3">
                        <div className="flex items-start gap-3">
                          <div className="relative shrink-0">
                            {p.image ? (
                              <img src={p.image} alt={p.name} className="h-12 w-12 rounded-md object-cover border" />
                            ) : (
                              <div className="h-12 w-12 rounded-md bg-muted flex items-center justify-center">
                                <UtensilsCrossed className="h-5 w-5 text-muted-foreground" />
                              </div>
                            )}
                            <button
                              onClick={() => toggleFavorite(p.id)}
                              className="absolute -top-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-card border border-border shadow-sm hover:scale-110 transition-transform"
                              title={p.favorite ? "Retirer des favoris" : "Ajouter aux favoris"}
                              aria-label={p.favorite ? "Retirer des favoris" : "Ajouter aux favoris"}
                            >
                              <Star className={cn("h-3.5 w-3.5", p.favorite ? "fill-amber-400 text-amber-400" : "text-muted-foreground")} />
                            </button>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className="font-semibold truncate flex items-center gap-1.5">
                                {p.name}
                                {p.favorite && <Star className="h-3 w-3 fill-amber-400 text-amber-400 shrink-0" />}
                              </p>
                              <ProductActions
                                product={p}
                                onView={() => setViewProductId(p.id)}
                                onEdit={() => openEditProduct(p)}
                                onDuplicate={() => handleDuplicate(p.id)}
                                onToggleFavorite={() => toggleFavorite(p.id)}
                                onToggleActive={() => handleToggleActive(p)}
                                onToggleMenu={() => handleToggleMenu(p)}
                                onToggleArchive={() => handleToggleArchive(p)}
                                onStockIn={() => openStockDialog(p, "in")}
                                onStockOut={() => openStockDialog(p, "out")}
                                onStockAdjust={() => openStockDialog(p, "adjust")}
                                onDelete={() => setDeleteProductId(p.id)}
                              />
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">{getCategoryName(p.categoryId) || "Sans catégorie"}</p>
                            <div className="flex items-center justify-between gap-2 mt-2">
                              <Money amount={p.salePrice} currency={currency} className="font-semibold text-sm" />
                              <StockBadge stock={p.stock} minStock={p.minStock} />
                            </div>
                            <div className="flex items-center justify-between gap-2 mt-2">
                              <Badge className={STATUS_BADGE[status].className}>{STATUS_BADGE[status].label}</Badge>
                              <span className="text-xs text-muted-foreground">Stock: {p.stock} {p.unit}</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </>
          )}
        </TabsContent>

        {/* ============================== ONGLET CATÉGORIES ============================== */}
        <TabsContent value="categories" className="space-y-4">
          <SectionTitle action={
            <Button className="gap-2" onClick={openAddCategory}>
              <Plus className="h-4 w-4" /> Ajouter une catégorie
            </Button>
          }>
            Catégories de produits
          </SectionTitle>

          {sortedCategories.length === 0 ? (
            <Card className="border-border/60">
              <CardContent className="p-0">
                <EmptyState
                  icon={Tag}
                  title="Aucune catégorie"
                  description="Les catégories permettent d'organiser vos produits dans le menu."
                  action={<Button className="gap-2" onClick={openAddCategory}><Plus className="h-4 w-4" /> Ajouter</Button>}
                />
              </CardContent>
            </Card>
          ) : (
            <Card className="border-border/60">
              <CardContent className="p-0">
                <ul className="divide-y divide-border">
                  {sortedCategories.map((c, idx) => {
                    const count = data.products.filter((p) => p.categoryId === c.id).length;
                    return (
                      <li key={c.id} className="flex items-center gap-3 px-3 sm:px-4 py-3 hover:bg-muted/40">
                        <div className="flex flex-col gap-0.5">
                          <Button size="icon" variant="ghost" className="h-6 w-6" disabled={idx === 0} onClick={() => moveCategory(idx, -1)}>
                            <ArrowUp className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-6 w-6" disabled={idx === sortedCategories.length - 1} onClick={() => moveCategory(idx, 1)}>
                            <ArrowDown className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                          <Tag className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{c.name}</p>
                          <p className="text-xs text-muted-foreground">{count} produit(s)</p>
                        </div>
                        <Badge variant={c.active ? "default" : "secondary"} className={c.active ? "" : "bg-muted text-muted-foreground"}>
                          {c.active ? "Active" : "Inactive"}
                        </Badge>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="icon" variant="ghost"><MoreVertical className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditCategory(c)}>
                              <Pencil className="h-4 w-4" /> Modifier
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateCategory(c.id, { active: !c.active })}>
                              <Power className="h-4 w-4" /> {c.active ? "Désactiver" : "Activer"}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem variant="destructive" onClick={() => setDeleteCategoryId(c.id)}>
                              <Trash2 className="h-4 w-4" /> Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </li>
                    );
                  })}
                </ul>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* ============================== DIALOG : AJOUT/MODIF PRODUIT ============================== */}
      <Dialog open={productDialogOpen} onOpenChange={setProductDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProductId ? "Modifier le produit" : "Nouveau produit"}</DialogTitle>
            <DialogDescription>
              {editingProductId ? "Mettez à jour les informations du produit." : "Renseignez les informations du nouveau produit."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-2">
            {/* Nom */}
            <div className="sm:col-span-2">
              <Label htmlFor="p-name">Nom *</Label>
              <Input id="p-name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Ex: Poulet braisé" className="mt-1" />
            </div>

            {/* Catégorie */}
            <div>
              <Label>Catégorie *</Label>
              <Select value={form.categoryId} onValueChange={(v) => setForm((f) => ({ ...f, categoryId: v }))}>
                <SelectTrigger className="w-full mt-1"><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
                <SelectContent>
                  {data.categories.length === 0 ? (
                    <SelectItem value="" disabled>Aucune catégorie — créez-en une</SelectItem>
                  ) : (
                    data.categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Unité */}
            <div>
              <Label htmlFor="p-unit">Unité</Label>
              <Input id="p-unit" value={form.unit} onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))} placeholder="portion, bouteille..." className="mt-1" />
            </div>

            {/* Prix vente */}
            <div>
              <Label htmlFor="p-sale">Prix de vente *</Label>
              <Input id="p-sale" type="number" min={0} value={form.salePrice} onChange={(e) => setForm((f) => ({ ...f, salePrice: Number(e.target.value) }))} className="mt-1" />
            </div>

            {/* Prix achat */}
            <div>
              <Label htmlFor="p-buy">Prix d'achat</Label>
              <Input id="p-buy" type="number" min={0} value={form.purchasePrice} onChange={(e) => setForm((f) => ({ ...f, purchasePrice: Number(e.target.value) }))} className="mt-1" />
            </div>

            {/* Stock */}
            <div>
              <Label htmlFor="p-stock">Stock initial / actuel</Label>
              <Input id="p-stock" type="number" min={0} value={form.stock} onChange={(e) => setForm((f) => ({ ...f, stock: Number(e.target.value) }))} className="mt-1" />
            </div>

            {/* Stock min */}
            <div>
              <Label htmlFor="p-min">Stock minimum</Label>
              <Input id="p-min" type="number" min={0} value={form.minStock} onChange={(e) => setForm((f) => ({ ...f, minStock: Number(e.target.value) }))} className="mt-1" />
            </div>

            {/* Description */}
            <div className="sm:col-span-2">
              <Label htmlFor="p-desc">Description</Label>
              <Textarea id="p-desc" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Description courte, ingrédients..." className="mt-1" rows={2} />
            </div>

            {/* Image */}
            <div className="sm:col-span-2">
              <Label>Image du produit</Label>
              <div className="flex items-center gap-3 mt-1">
                {form.image ? (
                  <div className="relative">
                    { }
                    <img src={form.image} alt="Aperçu" className="h-16 w-16 rounded-md object-cover border" />
                    <Button size="icon" variant="destructive" className="h-5 w-5 absolute -top-1 -right-1" onClick={() => setForm((f) => ({ ...f, image: "" }))}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="h-16 w-16 rounded-md bg-muted flex items-center justify-center border">
                    <ImageIcon className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                <Input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageFile} className="flex-1" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">Optionnel — max 500 Ko (converti en base64).</p>
            </div>

            {/* Switchs */}
            <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t">
              <div className="flex items-center justify-between rounded-md border p-3">
                <div>
                  <Label className="cursor-pointer">Actif</Label>
                  <p className="text-xs text-muted-foreground">Produit vendable</p>
                </div>
                <Switch checked={form.active} onCheckedChange={(v) => setForm((f) => ({ ...f, active: v }))} />
              </div>
              <div className="flex items-center justify-between rounded-md border p-3">
                <div>
                  <Label className="cursor-pointer">Au menu</Label>
                  <p className="text-xs text-muted-foreground">Affiché à la carte</p>
                </div>
                <Switch checked={form.onMenu} onCheckedChange={(v) => setForm((f) => ({ ...f, onMenu: v }))} />
              </div>
              {editingProductId && (
                <div className="flex items-center justify-between rounded-md border p-3">
                  <div>
                    <Label className="cursor-pointer">Archivé</Label>
                    <p className="text-xs text-muted-foreground">Masqué partout</p>
                  </div>
                  <Switch checked={form.archived} onCheckedChange={(v) => setForm((f) => ({ ...f, archived: v }))} />
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setProductDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleSaveProduct}>{editingProductId ? "Mettre à jour" : "Ajouter"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============================== DIALOG : VOIR DÉTAILS ============================== */}
      <Dialog open={!!viewedProduct} onOpenChange={(v) => !v && setViewProductId(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          {viewedProduct && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {viewedProduct.name}
                  <Badge className={STATUS_BADGE[getProductStatus(viewedProduct)].className}>
                    {STATUS_BADGE[getProductStatus(viewedProduct)].label}
                  </Badge>
                </DialogTitle>
                <DialogDescription>Créé le {formatDateTime(viewedProduct.createdAt)}</DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <DetailRow label="Catégorie" value={getCategoryName(viewedProduct.categoryId) || "—"} />
                <DetailRow label="Unité" value={viewedProduct.unit} />
                <DetailRow label="Prix de vente" value={formatCurrency(viewedProduct.salePrice, currency)} />
                <DetailRow label="Prix d'achat" value={viewedProduct.purchasePrice ? formatCurrency(viewedProduct.purchasePrice, currency) : "—"} />
                <DetailRow label="Stock actuel" value={`${viewedProduct.stock} ${viewedProduct.unit}`} />
                <DetailRow label="Stock minimum" value={`${viewedProduct.minStock} ${viewedProduct.unit}`} />
                <DetailRow label="Au menu" value={viewedProduct.onMenu ? "Oui" : "Non"} />
                <DetailRow label="Actif" value={viewedProduct.active ? "Oui" : "Non"} />
                {viewedProduct.description && (
                  <div className="sm:col-span-2">
                    <p className="text-xs text-muted-foreground mb-1">Description</p>
                    <p className="text-sm">{viewedProduct.description}</p>
                  </div>
                )}
              </div>

              {/* Historique stock */}
              <div className="pt-2 border-t mt-2">
                <SectionTitle>Mouvements de stock récents</SectionTitle>
                {viewedProductMovements.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-3">Aucun mouvement enregistré.</p>
                ) : (
                  <div className="max-h-60 overflow-y-auto scrollbar-thin rounded-md border">
                    <ul className="divide-y divide-border">
                      {viewedProductMovements.map((m) => (
                        <li key={m.id} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
                          <div className="min-w-0">
                            <p className="truncate">
                              <span className={m.type === "in" ? "text-emerald-600 font-medium" : m.type === "out" ? "text-red-600 font-medium" : "text-amber-600 font-medium"}>
                                {m.type === "in" ? "Entrée" : m.type === "out" ? "Sortie" : "Ajustement"}
                              </span>
                              {" · "}
                              {m.quantity > 0 ? "+" : ""}{m.quantity} {viewedProduct.unit}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">{m.reason || "—"} · {formatDateTime(m.createdAt)}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setViewProductId(null)}>Fermer</Button>
                <Button className="gap-2" onClick={() => { openEditProduct(viewedProduct); setViewProductId(null); }}>
                  <Pencil className="h-4 w-4" /> Modifier
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

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
                <div>
                  <Label htmlFor="s-reason">Raison</Label>
                  <Input
                    id="s-reason"
                    value={stockReason}
                    onChange={(e) => setStockReason(e.target.value)}
                    placeholder={stockMode === "in" ? "Réapprovisionnement..." : stockMode === "out" ? "Casse, perte..." : "Inventaire..."}
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

      {/* ============================== DIALOG : CATÉGORIE ============================== */}
      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCategoryId ? "Modifier la catégorie" : "Nouvelle catégorie"}</DialogTitle>
            <DialogDescription>
              {editingCategoryId ? "Mettez à jour les informations de la catégorie." : "Ajoutez une catégorie pour organiser vos produits."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label htmlFor="c-name">Nom *</Label>
              <Input id="c-name" value={categoryName} onChange={(e) => setCategoryName(e.target.value)} placeholder="Ex: Boissons" className="mt-1" />
            </div>
            <div className="flex items-center justify-between rounded-md border p-3">
              <div>
                <Label className="cursor-pointer">Catégorie active</Label>
                <p className="text-xs text-muted-foreground">Les catégories inactives n'apparaissent pas au menu</p>
              </div>
              <Switch checked={categoryActive} onCheckedChange={setCategoryActive} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCategoryDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleSaveCategory}>{editingCategoryId ? "Mettre à jour" : "Ajouter"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============================== CONFIRM : SUPPRIMER PRODUIT ============================== */}
      <ConfirmDialog
        open={!!deleteProductId}
        onOpenChange={(v) => !v && setDeleteProductId(null)}
        title="Supprimer le produit ?"
        description={deleteProductObj ? `« ${deleteProductObj.name} » sera définitivement supprimé. Cette action est irréversible.` : ""}
        confirmLabel="Supprimer"
        onConfirm={handleConfirmDeleteProduct}
      />

      {/* ============================== CONFIRM : SUPPRIMER CATÉGORIE ============================== */}
      <ConfirmDialog
        open={!!deleteCategoryId}
        onOpenChange={(v) => !v && setDeleteCategoryId(null)}
        title="Supprimer la catégorie ?"
        description="Les produits de cette catégorie seront réaffectés en « Sans catégorie ». Cette action est irréversible."
        confirmLabel="Supprimer"
        onConfirm={handleConfirmDeleteCategory}
      />
    </div>
  );
}

// ============================================================
// Sous-composant : ligne d'actions produit
// ============================================================
function ProductActions({
  product,
  onView,
  onEdit,
  onDuplicate,
  onToggleFavorite,
  onToggleActive,
  onToggleMenu,
  onToggleArchive,
  onStockIn,
  onStockOut,
  onStockAdjust,
  onDelete,
}: {
  product: Product;
  onView: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onToggleFavorite: () => void;
  onToggleActive: () => void;
  onToggleMenu: () => void;
  onToggleArchive: () => void;
  onStockIn: () => void;
  onStockOut: () => void;
  onStockAdjust: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center justify-end gap-1">
      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={onStockIn} title="Entrée stock">
        <PackagePlus className="h-4 w-4 text-emerald-600" />
      </Button>
      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={onStockOut} title="Sortie stock">
        <PackageMinus className="h-4 w-4 text-red-600" />
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="icon" variant="ghost" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem onClick={onView}><Eye className="h-4 w-4" /> Voir détails</DropdownMenuItem>
          <DropdownMenuItem onClick={onEdit}><Pencil className="h-4 w-4" /> Modifier</DropdownMenuItem>
          <DropdownMenuItem onClick={onDuplicate}><Copy className="h-4 w-4" /> Dupliquer</DropdownMenuItem>
          <DropdownMenuItem onClick={onToggleFavorite}>
            <Star className={cn("h-4 w-4", product.favorite && "fill-amber-400 text-amber-400")} />
            {product.favorite ? "Retirer des favoris" : "Ajouter aux favoris"}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onStockAdjust}><SlidersHorizontal className="h-4 w-4" /> Corriger le stock</DropdownMenuItem>
          <DropdownMenuItem onClick={onToggleMenu}>
            <MenuIcon className="h-4 w-4" /> {product.onMenu ? "Retirer du menu" : "Ajouter au menu"}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onToggleActive}>
            <Power className="h-4 w-4" /> {product.active ? "Désactiver" : "Activer"}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onToggleArchive}>
            {product.archived ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
            {product.archived ? "Désarchiver" : "Archiver"}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={onDelete}>
            <Trash2 className="h-4 w-4" /> Supprimer
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

// ============================================================
// Sous-composant : ligne de détail (Dialog voir)
// ============================================================
function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}
