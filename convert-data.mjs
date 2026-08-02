import fs from "fs";

const now = new Date().toISOString();
const genId = (p) => p + "_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

// Load extracted data
const cats = JSON.parse(fs.readFileSync("/tmp/db-categories.json", "utf-8"));
const products = JSON.parse(fs.readFileSync("/tmp/db-products.json", "utf-8"));
const dishes = JSON.parse(fs.readFileSync("/tmp/db-dishes.json", "utf-8"));
const drinks = JSON.parse(fs.readFileSync("/tmp/db-drinks.json", "utf-8"));
const sales = JSON.parse(fs.readFileSync("/tmp/db-sales.json", "utf-8"));
const expenses = JSON.parse(fs.readFileSync("/tmp/db-expenses.json", "utf-8"));
const stockEntries = JSON.parse(fs.readFileSync("/tmp/db-stockEntries.json", "utf-8"));

// Build AppData
const data = {
  settings: {
    restaurant: {
      name: "ELISHAMA",
      logo: "",
      phone: "",
      address: "",
      currency: "FCFA",
      ticketMessage: "Merci de votre visite !",
    },
    usage: {
      currency: "FCFA",
      dateFormat: "DD/MM/YYYY",
      ticketPrefix: "TICKET-",
      ticketNumber: 1,
      stockAlertThreshold: 5,
    },
    initialized: true,
    version: 2,
  },
  categories: [],
  products: [],
  sales: [],
  tickets: [],
  tables: [],
  zones: [],
  expenses: [],
  expenseCategories: [],
  stockMovements: [],
  cashOperations: [],
  paymentMethods: [],
  history: [],
};

// 1. Categories — import from db, filter out test ones
cats.forEach((c, i) => {
  data.categories.push({
    id: genId("cat"),
    name: c.name,
    order: i,
    active: true,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  });
});

// 2. Products — import from db Products, Dishes, Drinks
// Map old category IDs to new category IDs
const catIdMap = {};
data.categories.forEach((nc, i) => { catIdMap[cats[i].id] = nc.id; });

products.forEach((p) => {
  data.products.push({
    id: genId("prod"),
    name: p.name,
    categoryId: catIdMap[p.categoryId] || "",
    salePrice: p.salePrice || 0,
    purchasePrice: p.purchasePrice || 0,
    stock: p.quantity || 0,
    minStock: p.minStock || 0,
    unit: p.unit || "unité",
    description: p.description || "",
    image: p.photo || "",
    active: p.available !== false,
    onMenu: true,
    archived: false,
    favorite: false,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  });
});

// Also import dishes and drinks as products (they were separate tables in old app)
const platCat = data.categories.find(c => c.name === "Plats");
dishes.forEach((d) => {
  data.products.push({
    id: genId("prod"),
    name: d.name,
    categoryId: platCat ? platCat.id : "",
    salePrice: d.price || 0,
    purchasePrice: 0,
    stock: 0,
    minStock: 0,
    unit: "portion",
    description: d.description || "",
    image: d.photo || "",
    active: d.available !== false,
    onMenu: true,
    archived: false,
    favorite: false,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  });
});

// Create a "Boissons" category if we have drinks
if (drinks.length > 0) {
  const boissonCat = {
    id: genId("cat"),
    name: "Boissons",
    order: data.categories.length,
    active: true,
    createdAt: now,
    updatedAt: now,
  };
  data.categories.push(boissonCat);
  drinks.forEach((d) => {
    data.products.push({
      id: genId("prod"),
      name: d.name,
      categoryId: boissonCat.id,
      salePrice: d.price || 0,
      purchasePrice: 0,
      stock: 0,
      minStock: 0,
      unit: "bouteille",
      description: d.description || "",
      image: d.photo || "",
      active: d.available !== false,
      onMenu: true,
      archived: false,
      favorite: false,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
    });
  });
}

// 3. Payment methods
data.paymentMethods = [
  { id: genId("pm"), name: "Espèces", active: true, order: 0, createdAt: now, updatedAt: now },
  { id: genId("pm"), name: "Mobile Money", active: true, order: 1, createdAt: now, updatedAt: now },
  { id: genId("pm"), name: "Carte", active: true, order: 2, createdAt: now, updatedAt: now },
];
const pmCash = data.paymentMethods[0].id;

// 4. Expense categories
data.expenseCategories = [
  { id: genId("ec"), name: "Achat de marchandises", order: 0, createdAt: now, updatedAt: now },
  { id: genId("ec"), name: "Transport", order: 1, createdAt: now, updatedAt: now },
  { id: genId("ec"), name: "Électricité", order: 2, createdAt: now, updatedAt: now },
  { id: genId("ec"), name: "Eau", order: 3, createdAt: now, updatedAt: now },
  { id: genId("ec"), name: "Entretien", order: 4, createdAt: now, updatedAt: now },
  { id: genId("ec"), name: "Salaires", order: 5, createdAt: now, updatedAt: now },
  { id: genId("ec"), name: "Autres", order: 6, createdAt: now, updatedAt: now },
];

// 5. Zones and tables
const zoneInterieur = { id: genId("zone"), name: "Intérieur", order: 0, createdAt: now, updatedAt: now };
const zonePleinAir = { id: genId("zone"), name: "Plein air", order: 1, createdAt: now, updatedAt: now };
const zoneComptoir = { id: genId("zone"), name: "Comptoir", order: 2, createdAt: now, updatedAt: now };
data.zones = [zoneInterieur, zonePleinAir, zoneComptoir];
data.tables = [
  { id: genId("tbl"), name: "Table 1", zoneId: zoneInterieur.id, active: true, order: 0, createdAt: now, updatedAt: now },
  { id: genId("tbl"), name: "Table 2", zoneId: zoneInterieur.id, active: true, order: 1, createdAt: now, updatedAt: now },
  { id: genId("tbl"), name: "Table 3", zoneId: zoneInterieur.id, active: true, order: 2, createdAt: now, updatedAt: now },
  { id: genId("tbl"), name: "Terrasse 1", zoneId: zonePleinAir.id, active: true, order: 0, createdAt: now, updatedAt: now },
  { id: genId("tbl"), name: "Terrasse 2", zoneId: zonePleinAir.id, active: true, order: 1, createdAt: now, updatedAt: now },
  { id: genId("tbl"), name: "Comptoir", zoneId: zoneComptoir.id, active: true, order: 0, createdAt: now, updatedAt: now },
  { id: genId("tbl"), name: "À emporter", zoneId: zoneComptoir.id, active: true, order: 1, createdAt: now, updatedAt: now },
];

// 6. Sales
sales.forEach((s, i) => {
  const items = s.SaleItem.map(it => ({
    productId: it.productId || it.dishId || it.drinkId || "",
    productName: it.itemName,
    quantity: it.quantity,
    unitPrice: it.unitPrice,
    discount: 0,
    total: it.total,
  }));
  const subtotal = items.reduce((a, b) => a + b.total, 0);
  const ticketNum = `TICKET-${String(i + 1).padStart(4, "0")}`;
  const sale = {
    id: genId("sale"),
    ticketNumber: ticketNum,
    items,
    subtotal,
    discount: 0,
    total: s.totalAmount,
    paymentMethodId: pmCash,
    ticketId: undefined,
    note: s.note || "",
    createdAt: s.date,
    updatedAt: s.createdAt,
  };
  data.sales.push(sale);
  // Cash operation for each sale
  data.cashOperations.push({
    id: genId("cash"),
    type: "sale",
    amount: s.totalAmount,
    label: `Vente ${ticketNum}`,
    createdAt: s.date,
  });
  // History
  data.history.push({
    id: genId("hist"),
    action: "create",
    entity: "sale",
    entityId: sale.id,
    label: `Vente enregistrée (${ticketNum}) — ${items.map(it => `${it.quantity}× ${it.productName}`).join(", ")}`,
    amount: s.totalAmount,
    createdAt: s.date,
  });
});

// 7. Expenses
expenses.forEach((e) => {
  data.expenses.push({
    id: genId("exp"),
    date: e.date,
    label: e.name,
    categoryId: data.expenseCategories[data.expenseCategories.length - 1].id, // "Autres"
    amount: e.amount,
    note: e.description || "",
    createdAt: e.createdAt,
    updatedAt: e.updatedAt,
  });
  data.cashOperations.push({
    id: genId("cash"),
    type: "expense",
    amount: -e.amount,
    label: `Dépense: ${e.name}`,
    createdAt: e.date,
  });
  data.history.push({
    id: genId("hist"),
    action: "create",
    entity: "expense",
    entityId: e.id,
    label: `Dépense enregistrée — ${e.name}`,
    amount: e.amount,
    createdAt: e.createdAt,
  });
});

// 8. Stock movements from StockEntry
stockEntries.forEach((se) => {
  const prod = data.products.find(p => p.name === se.productName);
  data.stockMovements.push({
    id: genId("mv"),
    productId: prod ? prod.id : "",
    productName: se.productName,
    type: "in",
    quantity: se.quantity,
    unitPrice: se.unitPrice,
    reason: "Entrée de stock (importée)",
    createdAt: se.createdAt,
  });
});

// History: initialization
data.history.push({
  id: genId("hist"),
  action: "create",
  entity: "system",
  entityId: "init",
  label: "Données importées depuis la base SQLite ELISHAMA",
  createdAt: now,
});

// Sort history by date desc
data.history.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

fs.writeFileSync("/tmp/elishama-import.json", JSON.stringify(data, null, 2));
console.log("Conversion terminée. Stats:");
console.log("- Categories:", data.categories.length);
console.log("- Products:", data.products.length);
console.log("- Sales:", data.sales.length);
console.log("- Expenses:", data.expenses.length);
console.log("- Stock movements:", data.stockMovements.length);
console.log("- Cash operations:", data.cashOperations.length);
console.log("- History:", data.history.length);
console.log("Fichier: /tmp/elishama-import.json");
