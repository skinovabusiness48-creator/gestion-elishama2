// ============================================================
// ELISHAMA — Données de démonstration
// ============================================================
import type { AppData } from "./types";
import { genId, nowISO } from "./format";

export function defaultData(): AppData {
  return {
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
      initialized: false,
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
}

export function emptyData(): AppData {
  const data = defaultData();
  const now = nowISO();
  data.settings.initialized = true;
  data.settings.version = 2;

  // Modes de paiement de base (configurables par l'utilisateur ensuite)
  data.paymentMethods = [
    { id: genId("pm"), name: "Espèces", active: true, order: 0, createdAt: now, updatedAt: now },
    { id: genId("pm"), name: "Mobile Money", active: true, order: 1, createdAt: now, updatedAt: now },
    { id: genId("pm"), name: "Carte", active: true, order: 2, createdAt: now, updatedAt: now },
  ];

  // Catégories de dépenses de base (configurables)
  data.expenseCategories = [
    { id: genId("ec"), name: "Achat de marchandises", order: 0, createdAt: now, updatedAt: now },
    { id: genId("ec"), name: "Transport", order: 1, createdAt: now, updatedAt: now },
    { id: genId("ec"), name: "Électricité", order: 2, createdAt: now, updatedAt: now },
    { id: genId("ec"), name: "Eau", order: 3, createdAt: now, updatedAt: now },
    { id: genId("ec"), name: "Entretien", order: 4, createdAt: now, updatedAt: now },
    { id: genId("ec"), name: "Salaires", order: 5, createdAt: now, updatedAt: now },
    { id: genId("ec"), name: "Autres", order: 6, createdAt: now, updatedAt: now },
  ];

  // Quelques zones et tables de base (configurables)
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

  // Historique initial
  data.history = [
    {
      id: genId("hist"),
      action: "create",
      entity: "system",
      entityId: "init",
      label: "Application initialisée — données propres prêtes à l'emploi",
      createdAt: now,
    },
  ];

  return data;
}

export function demoData(): AppData {
  const data = emptyData();
  const now = nowISO();

  // Catégories de produits
  const catPlats = { id: genId("cat"), name: "Plats", order: 0, active: true, createdAt: now, updatedAt: now };
  const catAccomp = { id: genId("cat"), name: "Accompagnements", order: 1, active: true, createdAt: now, updatedAt: now };
  const catBoissons = { id: genId("cat"), name: "Boissons", order: 2, active: true, createdAt: now, updatedAt: now };
  const catCocktails = { id: genId("cat"), name: "Cocktails", order: 3, active: true, createdAt: now, updatedAt: now };
  data.categories = [catPlats, catAccomp, catBoissons, catCocktails];

  // Produits
  const products = [
    { name: "Poulet braisé", cat: catPlats.id, price: 2500, purchase: 1500, stock: 20, min: 5, unit: "portion" },
    { name: "Poisson braisé", cat: catPlats.id, price: 3000, purchase: 1800, stock: 15, min: 5, unit: "portion" },
    { name: "Attiéké poisson", cat: catPlats.id, price: 2000, purchase: 1000, stock: 25, min: 5, unit: "part" },
    { name: "Riz sauce", cat: catPlats.id, price: 1500, purchase: 700, stock: 30, min: 8, unit: "part" },
    { name: "Frites", cat: catAccomp.id, price: 1000, purchase: 400, stock: 40, min: 10, unit: "portion" },
    { name: "Plantain frit", cat: catAccomp.id, price: 1000, purchase: 350, stock: 35, min: 10, unit: "portion" },
    { name: "Eau minérale", cat: catBoissons.id, price: 500, purchase: 250, stock: 60, min: 15, unit: "bouteille" },
    { name: "Coca-Cola", cat: catBoissons.id, price: 700, purchase: 350, stock: 48, min: 12, unit: "bouteille" },
    { name: "Bière Castel", cat: catBoissons.id, price: 1000, purchase: 600, stock: 4, min: 12, unit: "bouteille" },
    { name: "Jus de bissap", cat: catBoissons.id, price: 800, purchase: 300, stock: 0, min: 10, unit: "verre" },
    { name: "Cocktail maison", cat: catCocktails.id, price: 2500, purchase: 1200, stock: 99, min: 5, unit: "verre" },
    { name: "Mojito", cat: catCocktails.id, price: 3000, purchase: 1500, stock: 99, min: 5, unit: "verre" },
  ];

  data.products = products.map((p, i) => ({
    id: genId("prod"),
    name: p.name,
    categoryId: p.cat,
    salePrice: p.price,
    purchasePrice: p.purchase,
    stock: p.stock,
    minStock: p.min,
    unit: p.unit,
    description: "",
    image: "",
    active: true,
    onMenu: true,
    archived: false,
    createdAt: now,
    updatedAt: now,
  }));

  // Zones et tables
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

  // Quelques ventes du jour
  const pmCash = data.paymentMethods[0].id;
  const pmMomo = data.paymentMethods[1].id;
  const todaySales = [
    { items: [["Poulet braisé", 1], ["Frites", 1], ["Coca-Cola", 2]], pm: pmCash, hour: 12 },
    { items: [["Attiéké poisson", 2], ["Eau minérale", 2]], pm: pmMomo, hour: 13 },
    { items: [["Poisson braisé", 1], ["Plantain frit", 1], ["Bière Castel", 2]], pm: pmCash, hour: 14 },
    { items: [["Riz sauce", 3], ["Jus de bissap", 2]], pm: pmCash, hour: 19 },
  ];

  let ticketNum = 1;
  todaySales.forEach((s) => {
    const items = s.items.map(([name, qty]) => {
      const prod = data.products.find((p) => p.name === name)!;
      return {
        productId: prod.id,
        productName: prod.name,
        quantity: qty as number,
        unitPrice: prod.salePrice,
        discount: 0,
        total: prod.salePrice * (qty as number),
      };
    });
    const subtotal = items.reduce((a, b) => a + b.total, 0);
    const d = new Date();
    d.setHours(s.hour, Math.floor(Math.random() * 50), 0, 0);
    const sale = {
      id: genId("sale"),
      ticketNumber: `TICKET-${String(ticketNum).padStart(4, "0")}`,
      items,
      subtotal,
      discount: 0,
      total: subtotal,
      paymentMethodId: s.pm,
      note: "",
      createdAt: d.toISOString(),
      updatedAt: d.toISOString(),
    };
    ticketNum++;
    data.sales.push(sale);
    data.cashOperations.push({
      id: genId("cash"),
      type: "sale" as const,
      amount: subtotal,
      label: `Vente ${sale.ticketNumber}`,
      createdAt: d.toISOString(),
    });
    // diminuer le stock
    items.forEach((it) => {
      const prod = data.products.find((p) => p.id === it.productId);
      if (prod) prod.stock = Math.max(0, prod.stock - it.quantity);
      data.stockMovements.push({
        id: genId("mv"),
        productId: it.productId,
        productName: it.productName,
        type: "out" as const,
        quantity: -it.quantity,
        reason: `Vente ${sale.ticketNumber}`,
        createdAt: d.toISOString(),
      });
    });
    data.history.push({
      id: genId("hist"),
      action: "create",
      entity: "sale",
      entityId: sale.id,
      label: `Vente enregistrée (${sale.ticketNumber}) — ${it_label(items)}`,
      amount: subtotal,
      createdAt: d.toISOString(),
    });
  });
  data.settings.usage.ticketNumber = ticketNum;

  // Quelques dépenses du jour
  const todayExpenses = [
    { label: "Achat de poissons", cat: data.expenseCategories[0].id, amount: 15000, hour: 9 },
    { label: "Transport marché", cat: data.expenseCategories[1].id, amount: 2000, hour: 10 },
    { label: "Facture électricité", cat: data.expenseCategories[2].id, amount: 8000, hour: 11 },
  ];
  todayExpenses.forEach((e) => {
    const d = new Date();
    d.setHours(e.hour, 0, 0, 0);
    const exp = {
      id: genId("exp"),
      date: d.toISOString(),
      label: e.label,
      categoryId: e.cat,
      amount: e.amount,
      note: "",
      createdAt: d.toISOString(),
      updatedAt: d.toISOString(),
    };
    data.expenses.push(exp);
    data.cashOperations.push({
      id: genId("cash"),
      type: "expense" as const,
      amount: -e.amount,
      label: `Dépense: ${e.label}`,
      createdAt: d.toISOString(),
    });
    data.history.push({
      id: genId("hist"),
      action: "create",
      entity: "expense",
      entityId: exp.id,
      label: `Dépense enregistrée — ${e.label}`,
      amount: e.amount,
      createdAt: d.toISOString(),
    });
  });

  // Un ticket ouvert
  const openTable = data.tables[0];
  const poulet = data.products[0];
  const openTicket = {
    id: genId("tick"),
    name: "Table 1",
    tableId: openTable.id,
    zoneId: openTable.zoneId,
    items: [
      {
        id: genId("ti"),
        productId: poulet.id,
        productName: poulet.name,
        quantity: 2,
        unitPrice: poulet.salePrice,
        note: "",
      },
    ],
    status: "open" as const,
    discount: 0,
    note: "",
    createdAt: now,
    updatedAt: now,
  };
  data.tickets.push(openTicket);

  // Historique initial
  data.history.push({
    id: genId("hist"),
    action: "create",
    entity: "system",
    entityId: "init",
    label: "Application initialisée avec les données de démonstration",
    createdAt: now,
  });

  return data;
}

function it_label(items: { productName: string; quantity: number }[]): string {
  return items.map((i) => `${i.quantity}× ${i.productName}`).join(", ");
}
