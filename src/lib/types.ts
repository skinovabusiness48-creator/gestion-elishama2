// ============================================================
// ELISHAMA — Gestion : Types de données
// ============================================================

export interface Settings {
  restaurant: {
    name: string;
    logo: string; // base64 ou URL
    phone: string;
    address: string;
    currency: string; // ex: "FCFA"
    ticketMessage: string;
  };
  usage: {
    currency: string;
    dateFormat: string; // ex: "DD/MM/YYYY"
    ticketPrefix: string; // ex: "TICKET-"
    ticketNumber: number; // prochain numéro
    stockAlertThreshold: number; // seuil global par défaut
  };
  initialized: boolean; // prompt de données démo déjà affiché
  version: number;
}

export interface Category {
  id: string;
  name: string;
  order: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  name: string;
  categoryId: string;
  salePrice: number;
  purchasePrice?: number;
  stock: number;
  minStock: number;
  unit: string;
  description?: string;
  image?: string;
  active: boolean;
  onMenu: boolean;
  archived: boolean;
  favorite?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SaleItem {
  productId: string;
  productName: string; // snapshot
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
}

export interface Sale {
  id: string;
  ticketNumber: string;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethodId: string;
  ticketId?: string; // ticket lié si applicable
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TicketItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  note?: string;
}

export interface Ticket {
  id: string;
  name: string;
  tableId: string;
  zoneId: string;
  items: TicketItem[];
  status: "open" | "closed" | "cancelled";
  discount: number;
  note?: string;
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
}

export interface Table {
  id: string;
  name: string;
  zoneId: string;
  active: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface Zone {
  id: string;
  name: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface Expense {
  id: string;
  date: string;
  label: string;
  categoryId: string;
  amount: number;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  productName: string; // snapshot
  type: "in" | "out" | "adjust";
  quantity: number; // positif pour entrée, négatif pour sortie/ajustement
  reason?: string;
  createdAt: string;
}

export type CashOperationType =
  | "open"
  | "close"
  | "in"
  | "out"
  | "sale"
  | "expense"
  | "correction";

export interface CashOperation {
  id: string;
  type: CashOperationType;
  amount: number; // positif = entrée, négatif = sortie
  label: string;
  createdAt: string;
}

export interface PaymentMethod {
  id: string;
  name: string;
  active: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface HistoryEntry {
  id: string;
  action: string; // 'create' | 'update' | 'delete' | 'archive' | 'restore' | 'close' | 'cancel'
  entity: string; // 'product' | 'sale' | 'ticket' | 'expense' | 'stock' | ...
  entityId: string;
  label: string;
  amount?: number;
  createdAt: string;
}

// Structure globale des données (stockée sous une seule clé)
export interface AppData {
  settings: Settings;
  categories: Category[];
  products: Product[];
  sales: Sale[];
  tickets: Ticket[];
  tables: Table[];
  zones: Zone[];
  expenses: Expense[];
  expenseCategories: ExpenseCategory[];
  stockMovements: StockMovement[];
  cashOperations: CashOperation[];
  paymentMethods: PaymentMethod[];
  history: HistoryEntry[];
}

export type ModuleKey =
  | "dashboard"
  | "sales"
  | "tickets"
  | "products"
  | "stock"
  | "cash"
  | "expenses"
  | "reports"
  | "history"
  | "settings";
