// ============================================================
// ELISHAMA — Store central (React Context + LocalStorage)
// ============================================================
"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import type {
  AppData,
  Settings,
  Category,
  Product,
  Sale,
  Ticket,
  Table,
  Zone,
  Expense,
  ExpenseCategory,
  StockMovement,
  CashOperation,
  PaymentMethod,
  HistoryEntry,
  SaleItem,
} from "./types";
import { loadData, saveData, fetchInitialData } from "./storage";
import { defaultData, emptyData, demoData } from "./seed";
import { genId, nowISO, isSameDay } from "./format";

interface StoreContextValue {
  data: AppData;
  // Initialisation
  initializeEmpty: () => void;
  initializeDemo: () => void;
  resetAll: () => void;
  importData: (data: AppData) => void;

  // Settings
  updateSettings: (settings: Settings) => void;

  // Catégories de produits
  addCategory: (name: string) => Category;
  updateCategory: (id: string, patch: Partial<Category>) => void;
  deleteCategory: (id: string) => void;
  reorderCategories: (ids: string[]) => void;

  // Produits
  addProduct: (p: Omit<Product, "id" | "createdAt" | "updatedAt">) => Product;
  updateProduct: (id: string, patch: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  archiveProduct: (id: string, archived: boolean) => void;
  duplicateProduct: (id: string) => void;
  toggleFavorite: (id: string) => void;
  adjustStock: (id: string, delta: number, reason: string, type: "in" | "out" | "adjust", unitPrice?: number) => void;
  setProductStock: (id: string, newStock: number, reason: string) => void;

  // Modes de paiement
  addPaymentMethod: (name: string) => void;
  updatePaymentMethod: (id: string, patch: Partial<PaymentMethod>) => void;
  deletePaymentMethod: (id: string) => void;

  // Catégories de dépenses
  addExpenseCategory: (name: string) => void;
  updateExpenseCategory: (id: string, patch: Partial<ExpenseCategory>) => void;
  deleteExpenseCategory: (id: string) => void;

  // Zones
  addZone: (name: string) => void;
  updateZone: (id: string, patch: Partial<Zone>) => void;
  deleteZone: (id: string) => void;

  // Tables
  addTable: (name: string, zoneId: string) => void;
  updateTable: (id: string, patch: Partial<Table>) => void;
  deleteTable: (id: string) => void;

  // Ventes
  createSale: (sale: { items: SaleItem[]; discount: number; paymentMethodId: string; ticketId?: string; note?: string }) => Sale;
  deleteSale: (id: string) => void;
  updateSale: (id: string, patch: Partial<Sale>) => void;

  // Tickets
  createTicket: (name: string, tableId: string, zoneId: string) => Ticket;
  updateTicket: (id: string, patch: Partial<Ticket>) => void;
  closeTicket: (id: string) => void;
  cancelTicket: (id: string) => void;
  deleteTicket: (id: string) => void;
  addTicketItem: (ticketId: string, item: { productId: string; productName: string; quantity: number; unitPrice: number; note?: string }) => void;
  updateTicketItem: (ticketId: string, itemId: string, patch: Partial<{ quantity: number; unitPrice: number; note: string }>) => void;
  removeTicketItem: (ticketId: string, itemId: string) => void;
  clearTicketItems: (ticketId: string) => void;

  // Dépenses
  addExpense: (e: Omit<Expense, "id" | "createdAt" | "updatedAt">) => void;
  updateExpense: (id: string, patch: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;

  // Stock movements
  addStockMovement: (m: Omit<StockMovement, "id" | "createdAt">) => void;
  deleteStockMovement: (id: string) => void;

  // Caisse
  addCashOperation: (op: Omit<CashOperation, "id" | "createdAt">) => void;
  deleteCashOperation: (id: string) => void;

  // Historique
  addHistory: (entry: Omit<HistoryEntry, "id" | "createdAt">) => void;
  clearHistory: () => void;

  // Utilitaires
  getProduct: (id: string) => Product | undefined;
  getCategory: (id: string) => Category | undefined;
  getCategoryName: (id: string) => string;
  getPaymentMethodName: (id: string) => string;
  getExpenseCategoryName: (id: string) => string;
  getTableName: (id: string) => string;
  getZoneName: (id: string) => string;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppData>(() => loadData());
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Persistance auto (debounced)
  useEffect(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => saveData(data), 150);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [data]);

  // Chargement des données initiales au premier lancement (depuis /initial-data.json)
  useEffect(() => {
    if (!data.settings.initialized) {
      fetchInitialData().then((imported) => {
        if (imported) {
          setData(imported);
          saveData(imported);
        } else {
          // Pas de données initiales → marquer comme initialisé avec l'état vide
          setData((d) => ({ ...d, settings: { ...d.settings, initialized: true } }));
        }
      });
    }
  }, []); // une seule fois au montage

  // Helpers
  const pushHistory = useCallback((entry: Omit<HistoryEntry, "id" | "createdAt">) => {
    setData((d) => ({
      ...d,
      history: [
        { ...entry, id: genId("hist"), createdAt: nowISO() },
        ...d.history,
      ].slice(0, 1000),
    }));
  }, []);

  const pushCash = useCallback((op: Omit<CashOperation, "id" | "createdAt">) => {
    setData((d) => ({
      ...d,
      cashOperations: [{ ...op, id: genId("cash"), createdAt: nowISO() }, ...d.cashOperations],
    }));
  }, []);

  // ---------------- Initialisation ----------------
  const initializeEmpty = useCallback(() => {
    setData(emptyData());
  }, []);
  const initializeDemo = useCallback(() => {
    setData(demoData());
  }, []);
  const resetAll = useCallback(() => {
    const fresh = emptyData();
    setData(fresh);
  }, []);
  const importData = useCallback((imported: AppData) => {
    setData(imported);
  }, []);

  // ---------------- Settings ----------------
  const updateSettings = useCallback((settings: Settings) => {
    setData((d) => ({ ...d, settings }));
  }, []);

  // ---------------- Catégories ----------------
  const addCategory = useCallback((name: string): Category => {
    const cat: Category = {
      id: genId("cat"),
      name,
      order: 0,
      active: true,
      createdAt: nowISO(),
      updatedAt: nowISO(),
    };
    setData((d) => ({ ...d, categories: [...d.categories, cat] }));
    pushHistory({ action: "create", entity: "category", entityId: cat.id, label: `Catégorie ajoutée: ${name}` });
    return cat;
  }, [pushHistory]);

  const updateCategory = useCallback((id: string, patch: Partial<Category>) => {
    setData((d) => ({
      ...d,
      categories: d.categories.map((c) => (c.id === id ? { ...c, ...patch, updatedAt: nowISO() } : c)),
    }));
    pushHistory({ action: "update", entity: "category", entityId: id, label: `Catégorie modifiée` });
  }, [pushHistory]);

  const deleteCategory = useCallback((id: string) => {
    setData((d) => ({
      ...d,
      categories: d.categories.filter((c) => c.id !== id),
      // On réassigne les produits de cette catégorie vers une catégorie "Sans catégorie" (vide)
      products: d.products.map((p) => (p.categoryId === id ? { ...p, categoryId: "" } : p)),
    }));
    pushHistory({ action: "delete", entity: "category", entityId: id, label: `Catégorie supprimée` });
  }, [pushHistory]);

  const reorderCategories = useCallback((ids: string[]) => {
    setData((d) => {
      const map = new Map(d.categories.map((c) => [c.id, c]));
      const reordered = ids.map((id, i) => ({ ...(map.get(id) as Category), order: i }));
      return { ...d, categories: reordered };
    });
  }, []);

  // ---------------- Produits ----------------
  const addProduct = useCallback((p: Omit<Product, "id" | "createdAt" | "updatedAt">): Product => {
    const prod: Product = { ...p, id: genId("prod"), createdAt: nowISO(), updatedAt: nowISO() };
    setData((d) => ({ ...d, products: [...d.products, prod] }));
    pushHistory({ action: "create", entity: "product", entityId: prod.id, label: `Produit ajouté: ${prod.name}` });
    if (prod.stock > 0) {
      setData((d) => ({
        ...d,
        stockMovements: [
          { id: genId("mv"), productId: prod.id, productName: prod.name, type: "in", quantity: prod.stock, reason: "Stock initial", createdAt: nowISO() },
          ...d.stockMovements,
        ],
      }));
    }
    return prod;
  }, [pushHistory]);

  const updateProduct = useCallback((id: string, patch: Partial<Product>) => {
    setData((d) => ({
      ...d,
      products: d.products.map((p) => (p.id === id ? { ...p, ...patch, updatedAt: nowISO() } : p)),
    }));
    pushHistory({ action: "update", entity: "product", entityId: id, label: `Produit modifié` });
  }, [pushHistory]);

  const deleteProduct = useCallback((id: string) => {
    setData((d) => {
      const prod = d.products.find((p) => p.id === id);
      return {
        ...d,
        products: d.products.filter((p) => p.id !== id),
        history: prod ? [{ id: genId("hist"), action: "delete", entity: "product", entityId: id, label: `Produit supprimé: ${prod.name}`, createdAt: nowISO() }, ...d.history].slice(0, 1000) : d.history,
      };
    });
  }, []);

  const archiveProduct = useCallback((id: string, archived: boolean) => {
    setData((d) => ({
      ...d,
      products: d.products.map((p) => (p.id === id ? { ...p, archived, updatedAt: nowISO() } : p)),
    }));
    pushHistory({ action: archived ? "archive" : "restore", entity: "product", entityId: id, label: archived ? `Produit archivé` : `Produit restauré` });
  }, [pushHistory]);

  const duplicateProduct = useCallback((id: string) => {
    setData((d) => {
      const orig = d.products.find((p) => p.id === id);
      if (!orig) return d;
      const copy: Product = { ...orig, id: genId("prod"), name: `${orig.name} (copie)`, stock: 0, createdAt: nowISO(), updatedAt: nowISO() };
      return { ...d, products: [...d.products, copy] };
    });
    pushHistory({ action: "create", entity: "product", entityId: id, label: `Produit dupliqué` });
  }, [pushHistory]);

  const toggleFavorite = useCallback((id: string) => {
    setData((d) => ({
      ...d,
      products: d.products.map((p) =>
        p.id === id ? { ...p, favorite: !p.favorite, updatedAt: nowISO() } : p
      ),
    }));
  }, []);

  const adjustStock = useCallback((id: string, delta: number, reason: string, type: "in" | "out" | "adjust", unitPrice?: number) => {
    setData((d) => {
      const prod = d.products.find((p) => p.id === id);
      if (!prod) return d;
      const newStock = Math.max(0, prod.stock + delta);
      const movement: StockMovement = {
        id: genId("mv"),
        productId: id,
        productName: prod.name,
        type,
        quantity: delta,
        unitPrice: type === "in" ? unitPrice : undefined,
        reason,
        createdAt: nowISO(),
      };
      // Si entrée avec prix d'achat, mettre à jour le prix d'achat du produit
      const updatedProducts = type === "in" && unitPrice !== undefined && unitPrice > 0
        ? d.products.map((p) => (p.id === id ? { ...p, stock: newStock, purchasePrice: unitPrice, updatedAt: nowISO() } : p))
        : d.products.map((p) => (p.id === id ? { ...p, stock: newStock, updatedAt: nowISO() } : p));
      return {
        ...d,
        products: updatedProducts,
        stockMovements: [movement, ...d.stockMovements],
        history: [{ id: genId("hist"), action: "update", entity: "stock", entityId: id, label: `Stock ${type === "in" ? "entrée" : type === "out" ? "sortie" : "ajustement"}: ${prod.name} (${delta > 0 ? "+" : ""}${delta})`, createdAt: nowISO() }, ...d.history].slice(0, 1000),
      };
    });
  }, []);

  const setProductStock = useCallback((id: string, newStock: number, reason: string) => {
    setData((d) => {
      const prod = d.products.find((p) => p.id === id);
      if (!prod) return d;
      const delta = newStock - prod.stock;
      const movement: StockMovement = {
        id: genId("mv"),
        productId: id,
        productName: prod.name,
        type: "adjust",
        quantity: delta,
        reason: reason || "Correction de stock",
        createdAt: nowISO(),
      };
      return {
        ...d,
        products: d.products.map((p) => (p.id === id ? { ...p, stock: Math.max(0, newStock), updatedAt: nowISO() } : p)),
        stockMovements: [movement, ...d.stockMovements],
        history: [{ id: genId("hist"), action: "update", entity: "stock", entityId: id, label: `Stock corrigé: ${prod.name} → ${newStock}`, createdAt: nowISO() }, ...d.history].slice(0, 1000),
      };
    });
  }, []);

  // ---------------- Modes de paiement ----------------
  const addPaymentMethod = useCallback((name: string) => {
    setData((d) => ({
      ...d,
      paymentMethods: [...d.paymentMethods, { id: genId("pm"), name, active: true, order: d.paymentMethods.length, createdAt: nowISO(), updatedAt: nowISO() }],
    }));
    pushHistory({ action: "create", entity: "paymentMethod", entityId: "", label: `Mode de paiement ajouté: ${name}` });
  }, [pushHistory]);

  const updatePaymentMethod = useCallback((id: string, patch: Partial<PaymentMethod>) => {
    setData((d) => ({
      ...d,
      paymentMethods: d.paymentMethods.map((pm) => (pm.id === id ? { ...pm, ...patch, updatedAt: nowISO() } : pm)),
    }));
  }, []);

  const deletePaymentMethod = useCallback((id: string) => {
    setData((d) => ({ ...d, paymentMethods: d.paymentMethods.filter((pm) => pm.id !== id) }));
    pushHistory({ action: "delete", entity: "paymentMethod", entityId: id, label: `Mode de paiement supprimé` });
  }, [pushHistory]);

  // ---------------- Catégories de dépenses ----------------
  const addExpenseCategory = useCallback((name: string) => {
    setData((d) => ({
      ...d,
      expenseCategories: [...d.expenseCategories, { id: genId("ec"), name, order: d.expenseCategories.length, createdAt: nowISO(), updatedAt: nowISO() }],
    }));
    pushHistory({ action: "create", entity: "expenseCategory", entityId: "", label: `Catégorie de dépense ajoutée: ${name}` });
  }, [pushHistory]);

  const updateExpenseCategory = useCallback((id: string, patch: Partial<ExpenseCategory>) => {
    setData((d) => ({
      ...d,
      expenseCategories: d.expenseCategories.map((c) => (c.id === id ? { ...c, ...patch, updatedAt: nowISO() } : c)),
    }));
  }, []);

  const deleteExpenseCategory = useCallback((id: string) => {
    setData((d) => ({
      ...d,
      expenseCategories: d.expenseCategories.filter((c) => c.id !== id),
      expenses: d.expenses.map((e) => (e.categoryId === id ? { ...e, categoryId: "" } : e)),
    }));
    pushHistory({ action: "delete", entity: "expenseCategory", entityId: id, label: `Catégorie de dépense supprimée` });
  }, [pushHistory]);

  // ---------------- Zones ----------------
  const addZone = useCallback((name: string) => {
    setData((d) => ({ ...d, zones: [...d.zones, { id: genId("zone"), name, order: d.zones.length, createdAt: nowISO(), updatedAt: nowISO() }] }));
    pushHistory({ action: "create", entity: "zone", entityId: "", label: `Zone ajoutée: ${name}` });
  }, [pushHistory]);

  const updateZone = useCallback((id: string, patch: Partial<Zone>) => {
    setData((d) => ({ ...d, zones: d.zones.map((z) => (z.id === id ? { ...z, ...patch, updatedAt: nowISO() } : z)) }));
  }, []);

  const deleteZone = useCallback((id: string) => {
    setData((d) => ({
      ...d,
      zones: d.zones.filter((z) => z.id !== id),
      tables: d.tables.filter((t) => t.zoneId !== id),
    }));
    pushHistory({ action: "delete", entity: "zone", entityId: id, label: `Zone supprimée` });
  }, [pushHistory]);

  // ---------------- Tables ----------------
  const addTable = useCallback((name: string, zoneId: string) => {
    setData((d) => ({ ...d, tables: [...d.tables, { id: genId("tbl"), name, zoneId, active: true, order: d.tables.length, createdAt: nowISO(), updatedAt: nowISO() }] }));
    pushHistory({ action: "create", entity: "table", entityId: "", label: `Table ajoutée: ${name}` });
  }, [pushHistory]);

  const updateTable = useCallback((id: string, patch: Partial<Table>) => {
    setData((d) => ({ ...d, tables: d.tables.map((t) => (t.id === id ? { ...t, ...patch, updatedAt: nowISO() } : t)) }));
  }, []);

  const deleteTable = useCallback((id: string) => {
    setData((d) => ({ ...d, tables: d.tables.filter((t) => t.id !== id) }));
    pushHistory({ action: "delete", entity: "table", entityId: id, label: `Table supprimée` });
  }, [pushHistory]);

  // ---------------- Ventes ----------------
  const createSale = useCallback((input: { items: SaleItem[]; discount: number; paymentMethodId: string; ticketId?: string; note?: string }): Sale => {
    const subtotal = input.items.reduce((a, b) => a + b.total, 0);
    const total = Math.max(0, subtotal - input.discount);
    const ticketNumber = `TICKET-${String(Date.now()).slice(-6)}`;
    const sale: Sale = {
      id: genId("sale"),
      ticketNumber,
      items: input.items,
      subtotal,
      discount: input.discount,
      total,
      paymentMethodId: input.paymentMethodId,
      ticketId: input.ticketId,
      note: input.note,
      createdAt: nowISO(),
      updatedAt: nowISO(),
    };
    setData((d) => {
      const newProducts = d.products.map((p) => {
        const it = input.items.find((i) => i.productId === p.id);
        return it ? { ...p, stock: Math.max(0, p.stock - it.quantity), updatedAt: nowISO() } : p;
      });
      const newMovements = input.items.map((it) => ({
        id: genId("mv"),
        productId: it.productId,
        productName: it.productName,
        type: "out" as const,
        quantity: -it.quantity,
        reason: `Vente ${ticketNumber}`,
        createdAt: nowISO(),
      }));
      return {
        ...d,
        products: newProducts,
        sales: [sale, ...d.sales],
        stockMovements: [...newMovements, ...d.stockMovements],
        cashOperations: [{ id: genId("cash"), type: "sale" as const, amount: total, label: `Vente ${ticketNumber}`, createdAt: nowISO() }, ...d.cashOperations],
        history: [{ id: genId("hist"), action: "create", entity: "sale", entityId: sale.id, label: `Vente enregistrée (${ticketNumber}) — ${input.items.map((i) => `${i.quantity}× ${i.productName}`).join(", ")}`, amount: total, createdAt: nowISO() }, ...d.history].slice(0, 1000),
        settings: { ...d.settings, usage: { ...d.settings.usage, ticketNumber: d.settings.usage.ticketNumber + 1 } },
      };
    });
    return sale;
  }, []);

  const deleteSale = useCallback((id: string) => {
    setData((d) => {
      const sale = d.sales.find((s) => s.id === id);
      if (!sale) return d;
      // Restituer le stock
      const newProducts = d.products.map((p) => {
        const it = sale.items.find((i) => i.productId === p.id);
        return it ? { ...p, stock: p.stock + it.quantity, updatedAt: nowISO() } : p;
      });
      const restockMovements = sale.items.map((it) => ({
        id: genId("mv"),
        productId: it.productId,
        productName: it.productName,
        type: "in" as const,
        quantity: it.quantity,
        reason: `Annulation vente ${sale.ticketNumber}`,
        createdAt: nowISO(),
      }));
      return {
        ...d,
        products: newProducts,
        sales: d.sales.filter((s) => s.id !== id),
        stockMovements: [...restockMovements, ...d.stockMovements],
        cashOperations: d.cashOperations.filter((c) => !(c.type === "sale" && c.label.includes(sale.ticketNumber))),
        history: [{ id: genId("hist"), action: "delete", entity: "sale", entityId: id, label: `Vente annulée (${sale.ticketNumber})`, amount: -sale.total, createdAt: nowISO() }, ...d.history].slice(0, 1000),
      };
    });
  }, []);

  const updateSale = useCallback((id: string, patch: Partial<Sale>) => {
    setData((d) => ({ ...d, sales: d.sales.map((s) => (s.id === id ? { ...s, ...patch, updatedAt: nowISO() } : s)) }));
  }, []);

  // ---------------- Tickets ----------------
  const createTicket = useCallback((name: string, tableId: string, zoneId: string): Ticket => {
    const ticket: Ticket = { id: genId("tick"), name, tableId, zoneId, items: [], status: "open", discount: 0, note: "", createdAt: nowISO(), updatedAt: nowISO() };
    setData((d) => ({ ...d, tickets: [ticket, ...d.tickets] }));
    pushHistory({ action: "create", entity: "ticket", entityId: ticket.id, label: `Ticket créé: ${name}` });
    return ticket;
  }, [pushHistory]);

  const updateTicket = useCallback((id: string, patch: Partial<Ticket>) => {
    setData((d) => ({ ...d, tickets: d.tickets.map((t) => (t.id === id ? { ...t, ...patch, updatedAt: nowISO() } : t)) }));
  }, []);

  const closeTicket = useCallback((id: string) => {
    setData((d) => ({ ...d, tickets: d.tickets.map((t) => (t.id === id ? { ...t, status: "closed", closedAt: nowISO(), updatedAt: nowISO() } : t)) }));
    pushHistory({ action: "close", entity: "ticket", entityId: id, label: `Ticket fermé` });
  }, [pushHistory]);

  const cancelTicket = useCallback((id: string) => {
    setData((d) => ({ ...d, tickets: d.tickets.map((t) => (t.id === id ? { ...t, status: "cancelled", closedAt: nowISO(), updatedAt: nowISO() } : t)) }));
    pushHistory({ action: "cancel", entity: "ticket", entityId: id, label: `Ticket annulé` });
  }, [pushHistory]);

  const deleteTicket = useCallback((id: string) => {
    setData((d) => ({ ...d, tickets: d.tickets.filter((t) => t.id !== id) }));
    pushHistory({ action: "delete", entity: "ticket", entityId: id, label: `Ticket supprimé` });
  }, [pushHistory]);

  const addTicketItem = useCallback((ticketId: string, item: { productId: string; productName: string; quantity: number; unitPrice: number; note?: string }) => {
    setData((d) => ({
      ...d,
      tickets: d.tickets.map((t) => (t.id === ticketId ? { ...t, items: [...t.items, { ...item, id: genId("ti") }], updatedAt: nowISO() } : t)),
    }));
  }, []);

  const updateTicketItem = useCallback((ticketId: string, itemId: string, patch: Partial<{ quantity: number; unitPrice: number; note: string }>) => {
    setData((d) => ({
      ...d,
      tickets: d.tickets.map((t) => (t.id === ticketId ? { ...t, items: t.items.map((it) => (it.id === itemId ? { ...it, ...patch } : it)), updatedAt: nowISO() } : t)),
    }));
  }, []);

  const removeTicketItem = useCallback((ticketId: string, itemId: string) => {
    setData((d) => ({
      ...d,
      tickets: d.tickets.map((t) => (t.id === ticketId ? { ...t, items: t.items.filter((it) => it.id !== itemId), updatedAt: nowISO() } : t)),
    }));
  }, []);

  const clearTicketItems = useCallback((ticketId: string) => {
    setData((d) => ({
      ...d,
      tickets: d.tickets.map((t) => (t.id === ticketId ? { ...t, items: [], updatedAt: nowISO() } : t)),
    }));
  }, []);

  // ---------------- Dépenses ----------------
  const addExpense = useCallback((e: Omit<Expense, "id" | "createdAt" | "updatedAt">) => {
    const exp: Expense = { ...e, id: genId("exp"), createdAt: nowISO(), updatedAt: nowISO() };
    setData((d) => ({
      ...d,
      expenses: [exp, ...d.expenses],
      cashOperations: [{ id: genId("cash"), type: "expense", amount: -exp.amount, label: `Dépense: ${exp.label}`, createdAt: nowISO() }, ...d.cashOperations],
      history: [{ id: genId("hist"), action: "create", entity: "expense", entityId: exp.id, label: `Dépense enregistrée — ${exp.label}`, amount: exp.amount, createdAt: nowISO() }, ...d.history].slice(0, 1000),
    }));
  }, []);

  const updateExpense = useCallback((id: string, patch: Partial<Expense>) => {
    setData((d) => ({ ...d, expenses: d.expenses.map((e) => (e.id === id ? { ...e, ...patch, updatedAt: nowISO() } : e)) }));
    pushHistory({ action: "update", entity: "expense", entityId: id, label: `Dépense modifiée` });
  }, [pushHistory]);

  const deleteExpense = useCallback((id: string) => {
    setData((d) => {
      const exp = d.expenses.find((e) => e.id === id);
      return {
        ...d,
        expenses: d.expenses.filter((e) => e.id !== id),
        cashOperations: exp ? d.cashOperations.filter((c) => !(c.type === "expense" && c.label.includes(exp.label))) : d.cashOperations,
        history: [{ id: genId("hist"), action: "delete", entity: "expense", entityId: id, label: `Dépense supprimée — ${exp?.label || ""}`, createdAt: nowISO() }, ...d.history].slice(0, 1000),
      };
    });
  }, []);

  // ---------------- Stock movements ----------------
  const addStockMovement = useCallback((m: Omit<StockMovement, "id" | "createdAt">) => {
    setData((d) => {
      const prod = d.products.find((p) => p.id === m.productId);
      if (!prod) return d;
      const newStock = Math.max(0, prod.stock + m.quantity);
      return {
        ...d,
        products: d.products.map((p) => (p.id === m.productId ? { ...p, stock: newStock, updatedAt: nowISO() } : p)),
        stockMovements: [{ ...m, id: genId("mv"), createdAt: nowISO() }, ...d.stockMovements],
      };
    });
  }, []);

  const deleteStockMovement = useCallback((id: string) => {
    setData((d) => ({ ...d, stockMovements: d.stockMovements.filter((m) => m.id !== id) }));
  }, []);

  // ---------------- Caisse ----------------
  const addCashOperation = useCallback((op: Omit<CashOperation, "id" | "createdAt">) => {
    setData((d) => ({ ...d, cashOperations: [{ ...op, id: genId("cash"), createdAt: nowISO() }, ...d.cashOperations] }));
    pushHistory({ action: "create", entity: "cash", entityId: "", label: `Opération caisse: ${op.label}` });
  }, [pushHistory]);

  const deleteCashOperation = useCallback((id: string) => {
    setData((d) => ({ ...d, cashOperations: d.cashOperations.filter((c) => c.id !== id) }));
  }, []);

  // ---------------- Historique ----------------
  const addHistory = useCallback((entry: Omit<HistoryEntry, "id" | "createdAt">) => {
    setData((d) => ({ ...d, history: [{ ...entry, id: genId("hist"), createdAt: nowISO() }, ...d.history].slice(0, 1000) }));
  }, []);

  const clearHistory = useCallback(() => {
    setData((d) => ({ ...d, history: [] }));
  }, []);

  // ---------------- Utilitaires ----------------
  const getProduct = useCallback((id: string) => data.products.find((p) => p.id === id), [data.products]);
  const getCategory = useCallback((id: string) => data.categories.find((c) => c.id === id), [data.categories]);
  const getCategoryName = useCallback((id: string) => data.categories.find((c) => c.id === id)?.name || "Sans catégorie", [data.categories]);
  const getPaymentMethodName = useCallback((id: string) => data.paymentMethods.find((pm) => pm.id === id)?.name || "—", [data.paymentMethods]);
  const getExpenseCategoryName = useCallback((id: string) => data.expenseCategories.find((c) => c.id === id)?.name || "Autres", [data.expenseCategories]);
  const getTableName = useCallback((id: string) => data.tables.find((t) => t.id === id)?.name || "—", [data.tables]);
  const getZoneName = useCallback((id: string) => data.zones.find((z) => z.id === id)?.name || "—", [data.zones]);

  const value: StoreContextValue = {
    data,
    initializeEmpty,
    initializeDemo,
    resetAll,
    importData,
    updateSettings,
    addCategory,
    updateCategory,
    deleteCategory,
    reorderCategories,
    addProduct,
    updateProduct,
    deleteProduct,
    archiveProduct,
    duplicateProduct,
    toggleFavorite,
    adjustStock,
    setProductStock,
    addPaymentMethod,
    updatePaymentMethod,
    deletePaymentMethod,
    addExpenseCategory,
    updateExpenseCategory,
    deleteExpenseCategory,
    addZone,
    updateZone,
    deleteZone,
    addTable,
    updateTable,
    deleteTable,
    createSale,
    deleteSale,
    updateSale,
    createTicket,
    updateTicket,
    closeTicket,
    cancelTicket,
    deleteTicket,
    addTicketItem,
    updateTicketItem,
    removeTicketItem,
    clearTicketItems,
    addExpense,
    updateExpense,
    deleteExpense,
    addStockMovement,
    deleteStockMovement,
    addCashOperation,
    deleteCashOperation,
    addHistory,
    clearHistory,
    getProduct,
    getCategory,
    getCategoryName,
    getPaymentMethodName,
    getExpenseCategoryName,
    getTableName,
    getZoneName,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}

// Sélecteurs utilitaires
export function useTodaySales() {
  const { data } = useStore();
  return data.sales.filter((s) => isSameDay(s.createdAt));
}
export function useTodayExpenses() {
  const { data } = useStore();
  return data.expenses.filter((e) => isSameDay(e.date));
}
