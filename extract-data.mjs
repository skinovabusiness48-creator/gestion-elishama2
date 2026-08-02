import { PrismaClient } from "@prisma/client";
import fs from "fs";

const prisma = new PrismaClient();

async function main() {
  const [categories, products, dishes, drinks, sales, saleItems, expenses, expenseCats, suppliers, stockEntries, feedback] = await Promise.all([
    prisma.category.findMany(),
    prisma.product.findMany(),
    prisma.dish.findMany(),
    prisma.drink.findMany(),
    prisma.sale.findMany({ include: { SaleItem: true } }),
    prisma.saleItem.findMany(),
    prisma.expense.findMany(),
    prisma.expenseCategory.findMany(),
    prisma.supplier.findMany(),
    prisma.stockEntry.findMany(),
    prisma.customerFeedback.findMany(),
  ]);

  console.log("Counts:", {
    categories: categories.length,
    products: products.length,
    dishes: dishes.length,
    drinks: drinks.length,
    sales: sales.length,
    saleItems: saleItems.length,
    expenses: expenses.length,
    expenseCategories: expenseCats.length,
    suppliers: suppliers.length,
    stockEntries: stockEntries.length,
    feedback: feedback.length,
  });

  fs.writeFileSync("/tmp/db-counts.json", JSON.stringify({
    categories: categories.length,
    products: products.length,
    dishes: dishes.length,
    drinks: drinks.length,
    sales: sales.length,
    saleItems: saleItems.length,
    expenses: expenses.length,
    expenseCategories: expenseCats.length,
    suppliers: suppliers.length,
    stockEntries: stockEntries.length,
    feedback: feedback.length,
  }, null, 2));

  // Export raw data for inspection
  fs.writeFileSync("/tmp/db-categories.json", JSON.stringify(categories, null, 2));
  fs.writeFileSync("/tmp/db-products.json", JSON.stringify(products, null, 2));
  fs.writeFileSync("/tmp/db-sales.json", JSON.stringify(sales, null, 2));
  fs.writeFileSync("/tmp/db-expenses.json", JSON.stringify(expenses, null, 2));
  fs.writeFileSync("/tmp/db-expenseCats.json", JSON.stringify(expenseCats, null, 2));
  fs.writeFileSync("/tmp/db-stockEntries.json", JSON.stringify(stockEntries, null, 2));
  fs.writeFileSync("/tmp/db-suppliers.json", JSON.stringify(suppliers, null, 2));
  fs.writeFileSync("/tmp/db-dishes.json", JSON.stringify(dishes, null, 2));
  fs.writeFileSync("/tmp/db-drinks.json", JSON.stringify(drinks, null, 2));
  fs.writeFileSync("/tmp/db-feedback.json", JSON.stringify(feedback, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
