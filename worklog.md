# ELISHAMA — Gestion : Worklog de développement

## État global du projet
Application de gestion de restaurant 100% côté client (Next.js 16 + LocalStorage). Pas de backend, pas de base de données distante. Toutes les données sont stockées dans `localStorage` sous la clé `elishama:data`.

## Architecture

### Couche de données
- `src/lib/types.ts` — tous les types TypeScript (AppData, Product, Sale, Ticket, etc.)
- `src/lib/storage.ts` — wrapper LocalStorage (load/save/export/import)
- `src/lib/store.tsx` — React Context `StoreProvider` + hook `useStore()` exposant TOUTES les opérations CRUD
- `src/lib/seed.ts` — données par défaut / vides / démo
- `src/lib/format.ts` — formatage monnaie/date, `genId()`, `nowISO()`, `isSameDay()`, `isThisWeek()`, etc.

### Composants partagés (`src/components/shared.tsx`)
- `PageHeader({ title, subtitle, icon, actions })`
- `StatCard({ label, value, icon, tone, hint })` — tone: default|success|warning|danger|primary
- `EmptyState({ icon, title, description, action })`
- `ConfirmDialog({ open, onOpenChange, title, description, confirmLabel, cancelLabel, destructive, onConfirm })`
- `SearchInput({ value, onChange, placeholder })`
- `SectionTitle({ children, action })`
- `StockBadge({ stock, minStock })`
- `Money({ amount, currency, className })`

### Layout
- `src/components/AppShell.tsx` — sidebar desktop + header + sheet mobile + footer sticky. Props: `current`, `onSelect(moduleKey)`, `children`
- `src/components/Onboarding.tsx` — écran de premier lancement (choix démo/vide)

### Modules (`src/components/modules/`)
- `Dashboard.tsx` — ✅ FAIT (module de référence à imiter pour le style)
- `Products.tsx` — stub (à implémenter)
- `Stock.tsx` — stub (à implémenter)
- `Sales.tsx` — stub (à implémenter)
- `Tickets.tsx` — stub (à implémenter)
- `Cash.tsx` — stub (à implémenter)
- `Expenses.tsx` — stub (à implémenter)
- `Reports.tsx` — stub (à implémenter)
- `HistoryModule.tsx` — stub (à implémenter)
- `SettingsModule.tsx` — stub (à implémenter)

### Entrée
- `src/app/page.tsx` — `StoreProvider` + `AppContent` qui route entre modules via `useState<ModuleKey>`. Si `!settings.initialized`, affiche `<Onboarding />`.

## Référence API du store (`useStore()`)

Le hook retourne `data` (tout l'AppData) + ces méthodes :

**Initialisation** : `initializeEmpty()`, `initializeDemo()`, `resetAll()`, `importData(data)`, `updateSettings(settings)`

**Catégories produits** : `addCategory(name) -> Category`, `updateCategory(id, patch)`, `deleteCategory(id)`, `reorderCategories(ids[])`

**Produits** : `addProduct(p) -> Product`, `updateProduct(id, patch)`, `deleteProduct(id)`, `archiveProduct(id, bool)`, `duplicateProduct(id)`, `adjustStock(id, delta, reason, type)`, `setProductStock(id, newStock, reason)`

**Modes de paiement** : `addPaymentMethod(name)`, `updatePaymentMethod(id, patch)`, `deletePaymentMethod(id)`

**Catégories de dépenses** : `addExpenseCategory(name)`, `updateExpenseCategory(id, patch)`, `deleteExpenseCategory(id)`

**Zones** : `addZone(name)`, `updateZone(id, patch)`, `deleteZone(id)`

**Tables** : `addTable(name, zoneId)`, `updateTable(id, patch)`, `deleteTable(id)`

**Ventes** : `createSale({ items: SaleItem[], discount, paymentMethodId, ticketId?, note? }) -> Sale`, `deleteSale(id)`, `updateSale(id, patch)`

**Tickets** : `createTicket(name, tableId, zoneId) -> Ticket`, `updateTicket(id, patch)`, `closeTicket(id)`, `cancelTicket(id)`, `deleteTicket(id)`, `addTicketItem(ticketId, { productId, productName, quantity, unitPrice, note? })`, `updateTicketItem(ticketId, itemId, patch)`, `removeTicketItem(ticketId, itemId)`, `clearTicketItems(ticketId)`

**Dépenses** : `addExpense({ date, label, categoryId, amount, note? })`, `updateExpense(id, patch)`, `deleteExpense(id)`

**Stock** : `addStockMovement({ productId, productName, type, quantity, reason? })`, `deleteStockMovement(id)`

**Caisse** : `addCashOperation({ type, amount, label })`, `deleteCashOperation(id)`

**Historique** : `addHistory({ action, entity, entityId, label, amount? })`, `clearHistory()`

**Sélecteurs** : `getProduct(id)`, `getCategory(id)`, `getCategoryName(id)`, `getPaymentMethodName(id)`, `getExpenseCategoryName(id)`, `getTableName(id)`, `getZoneName(id)`

## Types clés

```ts
interface Product { id, name, categoryId, salePrice, purchasePrice?, stock, minStock, unit, description?, image?, active, onMenu, archived, createdAt, updatedAt }
interface SaleItem { productId, productName, quantity, unitPrice, discount, total }
interface Sale { id, ticketNumber, items, subtotal, discount, total, paymentMethodId, ticketId?, note?, createdAt, updatedAt }
interface TicketItem { id, productId, productName, quantity, unitPrice, note? }
interface Ticket { id, name, tableId, zoneId, items, status: 'open'|'closed'|'cancelled', discount, note?, createdAt, updatedAt, closedAt? }
interface SaleItem { productId, productName, quantity, unitPrice, discount, total }
```

## Conventions de style
- Palette : ambre chaud (primary oklch 0.62 0.17 45), sidebar sombre
- Composants shadcn/ui déjà installés dans `src/components/ui/` (button, card, dialog, alert-dialog, input, select, table, badge, sheet, tabs, dropdown-menu, etc.)
- Icônes : `lucide-react`
- Formatage : `formatCurrency(n, currency)`, `formatDateTime(date)`, `isSameDay(date)`
- Devise : `data.settings.usage.currency` (défaut "FCFA")
- Toutes les confirmations de suppression via `<ConfirmDialog />`
- Footer déjà géré par AppShell (sticky en bas)
- Responsive obligatoire : mobile-first, grilles `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`
- Longues listes : `max-h-96 overflow-y-auto scrollbar-thin`

---
Task ID: 1
Agent: main
Task: Foundation — types, storage, store, seed, format, layout, theme, onboarding, dashboard, page entry

Work Log:
- Créé `src/lib/types.ts` avec tous les types (Settings, Category, Product, Sale, Ticket, Table, Zone, Expense, ExpenseCategory, StockMovement, CashOperation, PaymentMethod, HistoryEntry, AppData, ModuleKey)
- Créé `src/lib/format.ts` (formatCurrency, formatNumber, formatDate, formatDateTime, isSameDay, isThisWeek, isThisMonth, isThisYear, genId, nowISO, todayISO)
- Créé `src/lib/storage.ts` (loadData, saveData, clearData, exportData, importDataFromFile) avec migration/fusion
- Créé `src/lib/seed.ts` (defaultData, emptyData avec config de base, demoData avec produits/tables/ventes/dépenses réalistes)
- Créé `src/lib/store.tsx` — StoreProvider + useStore() avec toutes les opérations CRUD, persistance auto debounce 150ms, pushHistory, pushCash helpers
- Mis à jour `src/app/globals.css` — palette ambre chaud, scrollbar custom, animations fade-in, styles d'impression (.no-print, .print-area, .print-ticket)
- Créé `src/components/shared.tsx` (PageHeader, StatCard, EmptyState, ConfirmDialog, SearchInput, SectionTitle, StockBadge, Money)
- Créé `src/components/AppShell.tsx` — sidebar desktop sombre + sheet mobile + header sticky + footer sticky mt-auto
- Créé `src/components/Onboarding.tsx` — choix données démo / app vide
- Créé `src/components/modules/Dashboard.tsx` — stats du jour, activité récente, alertes stock (module de référence)
- Mis à jour `src/app/page.tsx` — StoreProvider + routing par état entre 10 modules
- Mis à jour `src/app/layout.tsx` — metadata FR, lang="fr"
- Créé stubs pour les 9 modules restants afin que l'app compile
- Vérifié : serveur répond 200 sur /

Stage Summary:
- Foundation complète et fonctionnelle. Onboarding + Dashboard opérationnels.
- Le store expose une API CRUD complète et cohérente (voir référence ci-dessus).
- Les 9 modules restants sont des stubs à implémenter par sous-agents en parallèle.
- Chaque module doit utiliser `useStore()`, les composants partagés, et respecter le style du Dashboard.

---
Task ID: 5
Agent: general-purpose (Products+Categories+Stock)
Task: Implémenter les modules Products (avec catégories) et Stock

Work Log:
- Lu `worklog.md`, `types.ts`, `store.tsx`, `format.ts`, `shared.tsx`, `Dashboard.tsx` (module de référence) pour aligner style et conventions.
- Vérifié les composants shadcn disponibles (dialog, select, dropdown-menu, tabs, table, switch, etc.) et la présence de `sonner` pour les notifications.
- Implémenté `src/components/modules/Products.tsx` :
  - PageHeader (icône `UtensilsCrossed`) + bouton "Ajouter un produit" + bouton Imprimer (`window.print()`).
  - 4 StatCards : produits actifs, au menu, inactifs, catégories.
  - Tabs à deux onglets : **Produits** et **Catégories**.
  - Onglet Produits : filtres (SearchInput par nom + Select catégorie + Select statut: tous/actif/inactif/archivé), tableau desktop avec colonnes (produit, catégorie, prix vente, stock+badge, statut, actions), cartes mobile responsive.
  - Menu déroulant d'actions par produit (DropdownMenu) : Voir détails, Modifier, Dupliquer, Corriger le stock, Retirer/Ajouter du menu, Activer/Désactiver, Archiver/Désarchiver, Supprimer. Boutons rapides entrée/sortie de stock.
  - Dialog d'ajout/modification complet (nom*, catégorie*, prix vente*, prix achat, stock, stock min, unité, description, image via input file→base64, switches Actif/Au menu/Archivé).
  - Dialog "Voir détails" avec toutes les infos + historique des mouvements de stock du produit (30 derniers).
  - Dialog stock (mode entrée/sortie/correction) avec quantité, raison, aperçu du stock résultant — utilise `adjustStock` / `setProductStock`.
  - ConfirmDialog pour suppression produit (via `deleteProduct`).
  - Onglet Catégories : liste triable (flèches haut/bas via `reorderCategories`), édition, activation/désactivation, suppression (ConfirmDialog via `deleteCategory`), compteur de produits par catégorie.
  - Notifications `toast` (sonner) pour chaque action (ajout, modification, duplication, activation, archivage, suppression, etc.).
- Implémenté `src/components/modules/Stock.tsx` :
  - PageHeader (icône `Package`) + bouton Imprimer.
  - 4 StatCards : produits suivis, stock faible (⚠️), ruptures (🔴), valeur totale du stock (somme stock × prix d'achat, fallback prix de vente).
  - Alerte visuelle globale (carte ambre) si ruptures/stock faible.
  - Filtres : SearchInput + Select (tous/faible/rupture).
  - Liste des produits : tableau desktop + cartes mobile (avec bordure colorée selon l'état), badges StockBadge, boutons entrée/sortie/correction/historique.
  - Dialog stock (entrée `adjustStock(+qty, reason, "in")` / sortie `adjustStock(-qty, reason, "out")` / correction `setProductStock(id, newStock, reason)`).
  - Dialog historique par produit (tous les `stockMovements` du produit).
  - Section "Mouvements récents" : tableau desktop + cartes mobile des 50 derniers mouvements, quantités colorées (vert +/rouge -/ambre ajust), badge type, raison, date. Bouton supprimer un mouvement via ConfirmDialog (deleteStockMovement) avec avertissement explicite : la suppression ne recalcule PAS le stock.
- Vérifié le typage TypeScript strict (`npx tsc --noEmit`) : 0 erreur sur Products.tsx et Stock.tsx.
- Vérifié le lint (`npx eslint`) sur les deux fichiers : 0 erreur, 0 warning après nettoyage des imports inutilisés et directives eslint-disable inutiles.

Stage Summary:
- Modules **Products** et **Stock** entièrement fonctionnels et responsives, conformes au style du Dashboard (icônes lucide, cartes/badges colorés, états hover, espacements p-3/p-4/p-6, grilles `grid-cols-2 lg:grid-cols-4`).
- Tous les boutons visibles sont opérationnels : ajout, modification, duplication, activation/désactivation, menu toggle, archive/désarchive, suppression (ConfirmDialog), entrée/sortie/correction de stock, historique, impression.
- Gestion complète des catégories (CRUD + réorganisation) intégrée dans l'onglet dédié du module Produits.
- Notifications utilisateur via `sonner` (`<Toaster />` monté dans chaque module car les modules sont rendus conditionnellement par `page.tsx`).
- Aucune modification hors de `Products.tsx` et `Stock.tsx` ; aucun fichier existant cassé.
- Note : le serveur dev renvoie actuellement un 500 à cause de `HistoryModule.tsx` (autre agent — import `Restore` inexistant dans lucide-react). Mes deux fichiers compilent et lintent sans erreur.

---
Task ID: 7
Agent: general-purpose (Expenses+Reports+History+Settings)
Task: Implémenter les modules Dépenses, Rapports, Historique et Paramètres

Work Log:
- Lu worklog.md, types.ts, store.tsx, format.ts, storage.ts, shared.tsx, Dashboard.tsx (module de référence) pour comprendre l'architecture et les conventions de style.
- `src/components/modules/Expenses.tsx` (remplacement du stub) :
  * PageHeader "Dépenses" + icône Wallet + boutons Imprimer / Export CSV / Export JSON / Catégories / Ajouter une dépense
  * 4 StatCards : dépenses du jour (danger), du mois (warning), nombre total (default), dépense moyenne (primary)
  * Filtres : SearchInput (libellé/note) + Select catégorie + Select période (aujourd'hui/hier/semaine/mois/tous)
  * Tableau desktop (date, libellé, catégorie badge, montant rouge, note, actions) + cartes mobile responsives
  * Boutons Modifier (Dialog) et Supprimer (ConfirmDialog → deleteExpense) par dépense
  * Formulaire Dialog : date (input date), libellé*, catégorie* (Select), montant* (number), note (textarea). Utilise addExpense / updateExpense. Validations + toasts.
  * Gestion des catégories : Dialog dédié avec ajout (input+button), modification inline, suppression (ConfirmDialog → deleteExpenseCategory)
  * Graphique recharts : BarChart horizontal des dépenses par catégorie + tableau de répartition avec %
  * Export CSV (avec BOM UTF-8) et JSON, bouton Imprimer (window.print)
- `src/components/modules/Reports.tsx` (remplacement du stub) :
  * PageHeader "Rapports" + icône BarChart3 + boutons Imprimer / Exporter JSON
  * Sélecteur de période : 6 boutons (Aujourd'hui/Hier/Cette semaine/Ce mois/Cette année/Date personnalisée) + 2 inputs date quand custom. Calcul par intervalle [start, end] avec helpers isSameDay/isThisWeek/isThisMonth/isThisYear pour les presets.
  * Tabs : Ventes | Dépenses | Stock | Bénéfice
  * Ventes : 4 StatCards (CA, nb ventes, panier moyen, produits distincts), cartes "produit le plus/moins vendu", BarChart ventes par jour, top 5 produits (tableau), répartition par mode de paiement (PieChart ou texte si 1 seul)
  * Dépenses : 3 StatCards + PieChart par catégorie + tableau détaillé avec %
  * Stock : 4 StatCards (produits actifs, faible, ruptures, valeur stock), mouvements période (entrées/sorties/total), liste alertes
  * Bénéfice : carte héros avec résultat estimé + formule visuelle CA − Dépenses = Résultat, 4 StatCards (CA, Dépenses, Résultat, Marge %)
  * Export JSON complet du rapport (période + toutes les métriques)
- `src/components/modules/HistoryModule.tsx` (remplacement du stub) :
  * PageHeader "Historique" + icône History + boutons Imprimer / Vider (destructive, désactivé si vide)
  * 4 StatCards : total entrées, entités distinctes, créations, suppressions
  * Filtres : SearchInput + Select entité (dynamique depuis data) + Select action (dynamique) + Select période (aujourd'hui/semaine/tous)
  * Cartes "Par action" et "Par entité" avec badges colorés et compteurs
  * Liste chronologique (max-h-[60vh] overflow-y-auto scrollbar-thin) : icône colorée par action, badges action+entité, label, date/heure, montant éventuel. Clic → Dialog détail complet.
  * Styles par action (create=vert, update=bleu, delete=rouge, archive=ambre, restore=teal, close=violet, cancel=orange) avec icônes dédiées (Plus, Pencil, Trash2, Archive, ArchiveRestore, CheckCircle2, XCircle)
  * Vider l'historique via ConfirmDialog "Cette action est irréversible. Continuer ?" → clearHistory + toast
- `src/components/modules/SettingsModule.tsx` (remplacement du stub) :
  * PageHeader "Paramètres" + icône Settings
  * Tabs : Restaurant | Utilisation | Sauvegarde
  * Restaurant : upload logo (FileReader → base64, preview, max 1 Mo, bouton retirer), nom, téléphone, devise, adresse (textarea), message ticket. Save → updateSettings + sync usage.currency
  * Utilisation : devise, format date (Select 4 formats), préfixe tickets, numéro ticket actuel, seuil alerte stock. Save → updateSettings avec validations.
  * Sauvegarde :
    - Carte infos données : produits/ventes/tickets/dépenses + taille (Ko ou Mo)
    - Exporter / Créer une sauvegarde (alias) → exportData(data) + toast ✅
    - Importer / Restaurer (2 boutons alias, 2 inputs file hidden) → sélection fichier → ConfirmDialog → importDataFromFile → importData + toast ✅
    - Zone dangereuse (rouge) : Réinitialiser → double ConfirmDialog (étape 1 "ATTENTION IRRÉVERSIBLE", étape 2 "Confirmation définitive") → resetAll + reset des formulaires locaux + toast
  * Section "À propos" : nom app, version 1.0.0, badges "100% hors ligne / Sans abonnement / Données locales", rappel LocalStorage + recommandation export régulier
- Vérifié `bun run lint` : 0 erreurs et 0 warnings sur les 4 fichiers (les erreurs résiduelles dans AppShell.tsx et Sales.tsx ne sont pas dans le périmètre de cette tâche).
- Vérifié `npx tsc --noEmit` : 0 erreurs de types sur les 4 fichiers.
- Vérifié le dev server : HTTP 200 sur / avec compilation Turbopack réussie (454ms compile).
- Nettoyé imports inutilisés (Upload, SectionTitle, React default, formatDateTime/isSameDay/isThisWeek/isThisMonth/isThisYear non utilisés dans Reports) pour garder le code propre.
- Remplacé `Restore` (icon non disponible dans lucide-react 0.525) par `ArchiveRestore` dans HistoryModule.

Stage Summary:
- 4 modules complets et fonctionnels livrés : Expenses, Reports, HistoryModule, SettingsModule.
- Tous les boutons sont opérationnels : CRUD dépenses, gestion catégories, filtres, export CSV/JSON, print, période personnalisée rapports, onglets multi-sections, graphiques recharts (BarChart + PieChart), vider historique, export/import données, double-confirmation reset.
- Aucun nouvel import externe ajouté (uniquement useStore, composants shared, composants shadcn ui, lucide-react, recharts, sonner, lib/format, lib/storage).
- Style cohérent avec le Dashboard (PageHeader + StatCards + Cards + Badges + palette ambre primary oklch).
- Responsive mobile-first (grilles grid-cols-1/2/4, cartes mobile pour la table Expenses, filtres empilés).
- Tous les suppressions/réinitialisations passent par ConfirmDialog (jamais silencieux).
- Dev server : compile et sert 200 OK. Lint + tsc propres sur les 4 fichiers.

---
Task ID: 6
Agent: general-purpose (Sales+Tickets+Cash)
Task: Implémenter les modules Ventes, Tickets et Caisse

Work Log:
- Lu worklog, types.ts, store.tsx, format.ts, shared.tsx, Dashboard.tsx pour comprendre l'architecture et les conventions.
- Implémenté `src/components/modules/Sales.tsx` (~1050 lignes) :
  - PageHeader "Ventes" (icône Receipt) + boutons "Modes de paiement", "Imprimer la liste", "Nouvelle vente".
  - 4 StatCards : CA du jour, ventes du jour, panier moyen, total historique.
  - Filtre par date (aujourd'hui/hier/toutes) + recherche par numéro de ticket.
  - Liste des ventes en table desktop + cartes mobile, triée plus récentes en premier.
  - Actions par vente : Voir détails (Dialog), Imprimer le ticket (zone `.print-ticket`), Annuler (ConfirmDialog → `deleteSale` restitue le stock).
  - Dialog "Nouvelle vente" : grille de produits cliquables + panier éditable (qté +/-, prix unitaire, remise par item), remise globale, sélection mode de paiement (RadioGroup), note, calcul temps réel sous-total/remise/total. Validation via `createSale` → toast "✅ Vente enregistrée" + Dialog récap avec impression.
  - Dialog "Modes de paiement" : ajout/modification/activation/désactivation/suppression via `addPaymentMethod`/`updatePaymentMethod`/`deletePaymentMethod`.
  - Impression : 2 modes (ticket individuel format monospace 80mm, ou liste tabulaire).
- Implémenté `src/components/modules/Tickets.tsx` (~1100 lignes) :
  - PageHeader "Tickets" (icône Ticket) + boutons "Gérer les tables", "Fusionner"/"Annuler fusion", "Nouveau ticket".
  - Layout 2 colonnes desktop (liste 340px + détail 1fr), empilé mobile.
  - Onglets Ouverts/Fermés/Annulés/Tous + recherche (nom, table, zone) + badge compteur tickets ouverts.
  - Dialog "Gérer les tables" : CRUD complet zones + tables (avec `addZone`/`updateZone`/`deleteZone`/`addTable`/`updateTable`/`deleteTable`).
  - Dialog "Nouveau ticket" : nom + table (groupées par zone) → `createTicket`.
  - Détail : en-tête (nom, table, zone, statut, date), liste items avec qté +/-/édition/suppression, ajout note par item (Dialog modification), remise du ticket, note du ticket, total temps réel.
  - Actions : Vider (`clearTicketItems` confirm), Enregistrer (`updateTicket`), Transférer (Dialog table destination), Fermer (Dialog validation → `createSale` + `closeTicket`), Annuler/Supprimer (`cancelTicket` confirm), Imprimer (`.print-ticket`).
  - Mode fusion : sélection 2 tickets ouverts → items du 2e ajoutés au 1er via `addTicketItem` + `deleteTicket` du 2e.
  - Ajout de produit : Dialog avec recherche, liste produits `active && onMenu && !archived`, quantité/prix/note éditables.
- Implémenté `src/components/modules/Cash.tsx` (~640 lignes) :
  - PageHeader "Caisse" (icône Banknote) + boutons Imprimer le rapport + Ouvrir/Fermer la caisse.
  - Bandeau d'état caisse (ouverte/fermée) basé sur dernière opération `open`/`close` du jour + solde actuel.
  - 6 StatCards : ventes du jour, dépenses du jour, bénéfice estimé, entrées manuelles, sorties manuelles, solde caisse (+ fond d'ouverture en hint).
  - 4 actions rapides : Entrée manuelle, Sortie manuelle, Correction, Ouvrir/Fermer caisse.
  - Dialog Ouverture (saisie fond de caisse → `addCashOperation({ type: 'open', amount, label })`).
  - Dialog Fermeture (récap ventes/dépenses/entrées/sorties/fond + solde final → `addCashOperation({ type: 'close', amount: solde, label })`).
  - Dialog Entrée manuelle (montant + libellé → `addCashOperation({ type: 'in', amount, label })`).
  - Dialog Sortie manuelle (montant + libellé → `addCashOperation({ type: 'out', amount: -montant, label })`).
  - Dialog Correction (montant signé + motif → `addCashOperation({ type: 'correction', amount, label })`).
  - Historique du jour : table desktop + cartes mobile, filtre par type, suppression via ConfirmDialog (`deleteCashOperation`).
  - Rapport imprimable : totaux + table de toutes les opérations du jour.
- Contraintes respectées : "use client", uniquement `useStore()` + shared + shadcn/ui + lucide-react, TypeScript strict, devise depuis `data.settings.usage.currency`, ConfirmDialog pour toutes les suppressions, toasts `sonner`, formulaires en `useState` local, layout responsive, listes scrollables `max-h-* overflow-y-auto scrollbar-thin`, zone d'impression `.no-print` + `.print-area` + `.print-ticket`.
- Lint : `npx eslint src/components/modules/{Sales,Tickets,Cash}.tsx` → 0 erreur/warning sur les 3 fichiers. Le seul lint error restant du projet est pré-existant dans `AppShell.tsx` (setState dans useEffect) — hors périmètre.
- Type-check : `npx tsc --noEmit` → 0 erreur sur `src/`.
- Build : `npx next build` → ✓ Compiled successfully, toutes les pages générées.

Stage Summary:
- 3 modules complets et fonctionnels (Sales, Tickets, Cash), 100% opérationnels côté client avec persistance LocalStorage via le store existant.
- Tous les boutons sont opérationnels : création/annulation/impression de ventes, gestion complète des tickets (CRUD items, transfert, fusion, fermeture en vente), ouverture/fermeture de caisse, entrées/sorties/corrections manuelles, impression de rapports.
- Le module Tickets (le plus complexe) offre un layout 2 colonnes clair, des totaux temps réel, et toutes les actions requises (ajouter/modifier/supprimer items, vider, enregistrer, fermer en vente, annuler, transférer, fusionner, imprimer).
- Style cohérent avec le Dashboard de référence : cartes, badges colorés par statut/tone, icônes lucide, responsive mobile-first (table → cartes).
- Aucun fichier existant modifié en dehors des 3 modules cibles.

---
Task ID: 8-b
Agent: general-purpose (Command Palette)
Task: Implémenter la palette de commandes globale (Cmd/Ctrl+K)

Work Log:
- Lu worklog.md, types.ts, store.tsx, AppShell.tsx, shared.tsx, Dashboard.tsx, dialog.tsx, format.ts, utils.ts, page.tsx pour comprendre l'architecture, l'API du store, les composants partagés et les conventions de style.
- Créé `src/components/CommandPalette.tsx` :
  * Composant "use client" contrôlé : props `open`, `onOpenChange`, `onNavigate`.
  * État local : `query`, `activeIndex`, `prevOpen` (suivi de la prop open pour reset), `inputRef`, `openRef` (pour le listener global sans stale closure).
  * Raccourci Cmd/Ctrl+K : listener `keydown` global qui appelle `e.preventDefault()` + `onOpenChange(!openRef.current)`. Le ref `openRef` est synchronisé via useEffect pour éviter les stale closures.
  * Reset query + activeIndex à l'ouverture via le pattern "derived state" recommandé par React (useState `prevOpen` + setState conditionnel pendant le render) — évite le lint `react-hooks/set-state-in-effect` et `react-hooks/refs`.
  * Reset activeIndex à 0 dans le `onChange` du input (pas d'effet).
  * Construction mémoïsée des résultats groupés (useMemo) en 8 groupes : Navigation (10 modules), Actions rapides, Produits, Ventes, Tickets, Dépenses, Tables, Catégories (produits + dépenses). Filtrage insensible à la casse sur tous les champs pertinents (nom, description, numéro de ticket, note, libellé, zone). Limite ~5 résultats par groupe pour rester lisible.
  * Chaque `ResultItem` : icône lucide (selon le type), label principal, sublabel (montant/date/statut/zone), `module` ou `action` (callback). Pour "Exporter les données" : action native qui crée un Blob JSON + téléchargement (aucun import externe). Pour "Imprimer" : `window.print()`.
  * Navigation clavier : flèche Bas/Haut déplace `activeIndex` (clampé), Entrée active l'item courant. Scroll automatique de l'item actif via `[data-cp-idx]` + `scrollIntoView({ block: "nearest" })`.
  * UI : Dialog shadcn en `max-w-2xl` positionné en `top-[15%]` avec slide-in-from-top. Input de recherche en haut (autofocus via setTimeout 60ms) avec icône Search + kbd Échap. Liste scrollable `max-h-[60vh] overflow-y-auto scrollbar-thin`. Groupes avec en-têtes uppercase. Footer avec rappels clavier (↑↓ Naviguer, ↵ Sélectionner).
  * État vide intelligent : si query non vide → "Aucun résultat pour « ... »" ; si vide → "Commencez à taper pour rechercher à travers l'application".
  * Accessibilité : `DialogTitle` en sr-only (requis par Radix), `aria-label` sur l'input, `autoComplete/autoCapitalize/spellCheck={false}`.
- Modifié `src/components/AppShell.tsx` :
  * Importé `CommandPalette` et l'icône `Search` depuis lucide-react.
  * Ajouté `const [searchOpen, setSearchOpen] = useState(false);` dans AppShell (lift state approach — l'état `open` est possédé par AppShell et passé à CommandPalette).
  * Ajouté un bouton "Rechercher" (variant outline, size sm) dans le header desktop, à côté de la date. Contient l'icône Search, le label "Rechercher" (md+), et un kbd `⌘K` stylisé.
  * Instancié `<CommandPalette open={searchOpen} onOpenChange={setSearchOpen} onNavigate={handleSelect} />` à la fin du AppShell (avant la fermeture du div racine). `handleSelect` ferme aussi le menu mobile et navigue vers le module sélectionné.
- Lint : `bun run lint` → 0 erreur, 0 warning (résolu les 2 erreurs initiales `react-hooks/set-state-in-effect` via le pattern derived state, et `react-hooks/refs` en remplaçant useRef par useState pour `prevOpen`).
- Type-check : `npx tsc --noEmit` → 0 erreur sur `src/` (résolu l'erreur initiale d'inférence de type en castant le array quickActions en `ResultItem[]`).
- Smoke test : serveur dev démarre (Next 16 Turbopack, ~629ms ready) et GET / renvoie HTTP 200.

Stage Summary:
- Palette de commandes globale 100% fonctionnelle, intégrée au shell de l'app.
- Ouverture : Cmd/Ctrl+K depuis n'importe où (toggle via ref pour éviter stale closure) + bouton "Rechercher ⌘K" visible dans le header desktop.
- Fermeture : Échap (géré par Radix Dialog) ou clic sur l'overlay.
- 8 groupes de résultats : Navigation (10 modules), Actions rapides (5), Produits, Ventes, Tickets, Dépenses, Tables, Catégories — filtrage insensible à la casse sur tous les champs pertinents, max 5 résultats/groupe.
- Actions rapides : "Nouvelle vente" / "Nouveau produit" / "Nouvelle dépense" (navigation vers le module correspondant), "Exporter les données" (Blob JSON natif, sans import externe), "Imprimer" (window.print).
- Navigation clavier complète : ↑↓ pour naviguer, Entrée pour activer, scroll auto de l'item actif, reset de la sélection à chaque frappe.
- UX : animations slide-in-from-top + fade, état vide intelligent, footer avec rappels clavier, responsive (max-w-2xl desktop, pleine largeur mobile), autofocus du champ de recherche.
- Contraintes respectées : "use client", TypeScript strict, uniquement `useStore()` + Dialog shadcn + lucide-react + `@/lib/format` + `@/lib/utils` (cn) — aucun nouvel import externe, pas de `cmdk`. Devise depuis `data.settings.usage.currency`. Aucun fichier existant cassé (uniquement AppShell.tsx modifié + CommandPalette.tsx créé).
- Lint + tsc + dev server : tous propres.

---
Task ID: 8
Agent: webDevReview (cron round 1)
Task: QA + améliorations styling + nouvelles fonctionnalités

Work Log:
- Lu worklog.md complet pour comprendre l'état du projet (10 modules implémentés, onboarding supprimé, data v2).
- Vérifié l'état du serveur dev : démarré, HTTP 200, compile en ~9s, 0 erreur dans dev.log.
- Vérifié `bun run lint` : 0 erreur, 0 warning (propre).
- Smoke test curl : page d'accueil 59Ko, titre "ELISHAMA — Gestion du restaurant", aucune erreur de compilation.
- QA agent-browser : tentative via fetch('http://localhost:3000/') depuis le navigateur headless → "Failed to fetch" (isolation réseau persistante : le browser est dans un namespace réseau séparé et ne peut pas atteindre localhost ni la passerelle Caddy). Vérification basée sur curl + inspection HTML à la place.
- Identifié un problème UX majeur : depuis la suppression de l'onboarding et des données démo (data v2), l'application démarre avec des données vides → le Dashboard affichait des zéros déprimants (0 FCFA, 0 ventes, listes vides) sans guide pour l'utilisateur.

- [Feature/Styling] Refactorisé `src/components/modules/Dashboard.tsx` :
  * Ajout d'un **panneau de bienvenue** (WelcomePanel) affiché uniquement quand l'app est vide (pas de produits/ventes/dépenses). Hero card dégradé ambre avec icône Sparkles, message "Votre restaurant est prêt à démarrer", et 2 CTA principaux (Commencer par les produits / Configurer le restaurant).
  * Ajout d'une section **"Premiers pas"** avec 4 cartes-étapes numérotées (Ajouter produits → Enregistrer vente → Suivre caisse → Personnaliser), chacune cliquable vers le module correspondant.
  * Ajout d'une section **rassurances** (3 badges : 100% hors ligne / Données locales / Sans abonnement).
  * Ajout d'une **barre d'actions rapides** (QuickActionsBar) affichée quand il y a des données : 5 boutons (Nouvelle vente, Nouveau ticket, Ajouter produit, Dépense, Caisse) en grille responsive.
  * Conservation des sections existantes (stats, activité récente, alertes stock) quand l'app contient des données.

- [Feature] Nouvelle fonctionnalité majeure : **palette de commandes globale (Cmd/Ctrl+K)** via sous-agent (Task 8-b).
  * Nouveau fichier `src/components/CommandPalette.tsx` (~460 lignes).
  * Recherche globale across : navigation (10 modules), produits, ventes, tickets, dépenses, tables, catégories, actions rapides (nouvelle vente/produit/dépense, exporter, imprimer).
  * Navigation clavier complète (↑↓ + Entrée + Échap), résultats groupés, état vide intelligent, animations.
  * Intégrée dans `src/components/AppShell.tsx` : état contrôlé `searchOpen`, bouton "Rechercher ⌘K" dans le header desktop.
  * Répond à la section 13 du cahier des charges (recherche globale) qui n'était pas encore implémentée.

- [Styling] Ajout d'un bouton de recherche (icône Search) dans le header mobile pour la cohérence (avant : seul le desktop avait le bouton).

Vérifications finales :
- `bun run lint` : 0 erreur, 0 warning.
- Serveur dev : HTTP 200, compile en ~9s, 0 erreur dans dev.log.
- Inspection HTML : le panneau de bienvenue rend correctement ("Bienvenue", "Premiers pas", "Votre restaurant est prêt à démarrer"), le bouton Rechercher avec ⌘K est présent, la barre d'actions rapides rend.

Stage Summary:
- **Dashboard transformé** : passe d'un tableau de zéros déprimant (au premier lancement) à un panneau d'accueil engageant avec guide de démarrage. Quand l'utilisateur a des données, une barre d'actions rapides accélère le quotidien.
- **Recherche globale ajoutée** (Cmd/Ctrl+K) : fonctionnalité majeure manquante, désormais accessible depuis n'importe où via raccourci clavier ou bouton header. Couvre tous les types de données + navigation + actions.
- **Cohérence mobile/desktop** : le bouton de recherche est désormais disponible sur les deux interfaces.
- Aucun fichier cassé, lint propre, serveur compile sans erreur.
- agent-browser reste bloqué par l'isolation réseau du sandbox (limitation connue) ; QA réalisée via curl + inspection HTML.

Recommandations pour la prochaine phase :
- Réessayer agent-browser via une URL publique de prévisualisation si disponible (le problème d'isolation réseau persiste).
- Ajouter des raccourcis clavier supplémentaires (ex: "V" pour ventes, "P" pour produits quand la palette est fermée).
- Envisager un mode sombre (next-themes est déjà installé mais non câblé).
- Ajouter des graphiques sur le Dashboard (tendance CA des 7 derniers jours) une fois qu'il y a des données.

---
Task ID: 9
Agent: webDevReview (cron round 2)
Task: QA + mode sombre + graphique Dashboard + polish styling

## État du projet (évaluation)
- Serveur dev : HTTP 200, compile en ~5.8s, 0 erreur dans dev.log.
- `bun run lint` : 0 erreur, 0 warning.
- 10 modules fonctionnels + palette de commandes Cmd+K (round précédent).
- agent-browser : toujours bloqué par l'isolation réseau du sandbox (le navigateur headless a une IP publique 47.57.232.232 mais ne peut pas atteindre localhost:3000 ni la passerelle Caddy). QA réalisée via curl + inspection HTML.
- Recommandations du round précédent à traiter : mode sombre, graphique Dashboard, polish styling.

## Modifications réalisées

### 1. Mode sombre (next-themes) — Feature majeure
- Créé `src/components/theme-provider.tsx` : wrapper client autour de `next-themes` (attribute="class", defaultTheme="system", storageKey="elishama-theme", enableSystem, disableTransitionOnChange).
- Créé `src/components/theme-toggle.tsx` : bouton ghost avec icône Moon/Sun, gestion du montage différé (évite le flash d'hydration), aria-label dynamique.
- Modifié `src/app/layout.tsx` : 
  * Wrappé children + Toaster + SonnerToaster dans `<ThemeProvider>`.
  * Ajouté un script anti-flash inline dans `<head>` qui lit `localStorage.getItem('elishama-theme')` et applique la classe `.dark` avant l'hydration (évite le FOUC).
- Modifié `src/app/globals.css` : palette sombre refactorisée vers des **tons chauds ambre** (au lieu du gris achromatique précédent) :
  * background `oklch(0.16 0.012 55)`, card `oklch(0.205 0.015 55)`, primary `oklch(0.72 0.16 50)` (ambre lumineux pour contraste sur fond sombre).
  * Coordonnées chromatiques cohérentes avec le thème clair (hue 50-55 ambre).
  * Scrollbar sombre personnalisée (`.dark .scrollbar-thin`).
  * Transition douce `background-color 0.2s` sur le body.
- Modifié `src/components/AppShell.tsx` : `ThemeToggle` intégré à 3 endroits :
  * Header mobile (à côté du bouton recherche).
  * Header desktop (entre le bouton recherche et la date).
  * Pied de sidebar (à droite du texte "Données locales / v1.0").

### 2. Graphique Dashboard — Feature majeure
- Modifié `src/components/modules/Dashboard.tsx` :
  * Ajouté imports recharts (ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid).
  * Nouveau `useMemo` `weekData` : calcule le CA + dépenses des 7 derniers jours (boucle i=6→0, filtre `isSameDay`).
  * Nouveau `useMemo` `topProducts` : agrège les quantités/revenus par productId sur toutes les ventes, trie par qty desc, top 5.
  * Nouvelle section entre les stats et l'activité récente : grille 2/3 + 1/3 :
    - **Card "Revenus des 7 derniers jours"** (lg:col-span-2) : AreaChart avec 2 aires (revenus ambre + dépenses rouge), dégradés en fill, grille pointillée, axes minimalistes, tooltip personnalisé utilisant les variables CSS (var(--popover), var(--border)) pour le support dark mode, formatage devise via `formatCurrency`. Affiche le total de la semaine dans le header. État vide intelligent si aucune donnée.
    - **Card "Top produits"** : liste des 5 produits les plus vendus avec badges médailles (or/argent/bronze pour le top 3, muted pour le reste), quantité + revenu par produit, bouton "Voir les rapports".
  * Ces sections ne s'affichent que quand l'app contient des données (le panneau de bienvenue reste prioritaire au premier lancement).

### 3. Polish styling
- Modifié `src/components/AppShell.tsx` (sidebar nav) :
  * Effet `hover:translate-x-0.5` (léger déplacement horizontal au survol).
  * Icônes `group-hover:scale-110` (agrandissement au survol).
  * Badge stock faible : s'adapte à l'état actif (`bg-white/25 text-white` quand actif au lieu de `bg-amber-500`).
  * `transition-all` au lieu de `transition-colors`.
- Modifié `src/components/shared.tsx` (StatCard) :
  * `hover:-translate-y-0.5` (léger soulèvement au survol).
  * `transition-all duration-200`.
  * Icône `hover:scale-105` dans son conteneur coloré.
- Modifié `src/app/globals.css` (focus rings) :
  * Ajout d'un anneau de focus cohérent pour tous les éléments interactifs (button, a, input, select, textarea) via `ring-2 ring-ring ring-offset-2 ring-offset-background` sur `:focus-visible`.

## Vérifications
- `bun run lint` : 0 erreur, 0 warning.
- Serveur dev : HTTP 200, 65Ko (vs 59Ko avant), compile en 5.8s, 0 erreur.
- Inspection HTML : 
  * recharts bundlé ✅
  * script anti-flash `elishama-theme` présent (2 occurrences) ✅
  * panneau de bienvenue rend correctement pour données vides ✅
  * titre correct ✅
- ThemeToggle : icônes non rendues en SSR (montage différé pour éviter flash d'hydration) — comportement attendu et correct.

## Risques / problèmes non résolus
- **agent-browser toujours bloqué** par l'isolation réseau du sandbox (limitation persistante). La QA visuelle interactive n'est pas possible depuis le cron ; seuls curl + inspection HTML sont utilisés. L'utilisateur peut vérifier visuellement via le Panneau de prévisualisation.
- Le mode sombre n'a pas pu être testé visuellement (bascule thème → vérifier le rendu). La logique next-themes + anti-flash est standard et conforme à la documentation.

## Recommandations pour la prochaine phase
- Tester visuellement le mode sombre (bascule via le bouton) et ajuster les contrastes si besoin.
- Vérifier le rendu du graphique AreaChart avec des données réelles (ajouter des ventes puis consulter le Dashboard).
- Ajouter des raccourcis clavier supplémentaires (V/P/T quand la palette est fermée).
- Envisager un export PDF natif (actuellement window.print()).
- Ajouter une page d'aide / raccourcis clavier accessible via "?".

---
Task ID: 10
Agent: webDevReview (cron round 3)
Task: QA + aide/raccourcis clavier + polish styling

## État du projet (évaluation)
- Serveur dev : HTTP 200, compile en ~5.8s, 0 erreur dans dev.log.
- `bun run lint` : 0 erreur, 0 warning.
- 10 modules + palette Cmd+K + mode sombre + graphique Dashboard (rounds précédents).
- agent-browser : toujours bloqué par l'isolation réseau du sandbox (persistant). QA via curl + inspection HTML.
- Recommandations du round précédent à traiter : aide/raccourcis clavier, polish styling.

## Modifications réalisées

### 1. Système d'aide & raccourcis clavier — Feature majeure ⌨️
- Créé `src/hooks/use-keyboard-shortcuts.ts` : hook global qui écoute `keydown` et déclenche :
  * `?` (ou Shift+/) → ouvre l'aide
  * `/` → ouvre la recherche (palette)
  * `1`-`9`, `0` → navigation rapide vers les 10 modules
  * Lettres mnémoniques : `G` (dashboard), `V` (ventes), `T` (tickets), `P` (produits), `S` (stock), `C` (caisse), `D` (dépenses), `R` (rapports), `H` (historique)
  * Désactivé quand l'utilisateur tape dans un champ (input/textarea/select/contenteditable) ou avec modificateurs (Ctrl/Cmd/Alt).
- Créé `src/components/HelpDialog.tsx` : dialogue d'aide complet avec 3 sections :
  * **Général** : ⌘K (recherche), / (recherche), ? (aide), Échap (fermer)
  * **Navigation rapide (chiffres)** : 1-9, 0 → les 10 modules, cliquable pour naviguer
  * **Navigation mnémonique (lettres)** : G, V, T, P, S, C, D, R, H
  * **À propos** : logo + nom + rappel "100% local, hors ligne, exportez régulièrement"
  * Composant `Kbd` réutilisable pour afficher les touches avec style.
- Modifié `src/components/AppShell.tsx` :
  * Importé `HelpDialog` + `useKeyboardShortcuts` + icône `HelpCircle`.
  * Ajouté état `helpOpen` + câblage du hook `useKeyboardShortcuts({ onNavigate, onHelp, onSearch })`.
  * Bouton "Aide" (icône HelpCircle) ajouté dans le header desktop ET mobile.
  * `<HelpDialog>` rendu à la fin du shell.
  * Footer : ajout d'un bouton "Aide" avec kbd `?` (desktop uniquement) pour découvrir les raccourcis.

### 2. Polish styling du Dashboard ✨
- Modifié `src/components/modules/Dashboard.tsx` (WelcomePanel) :
  * Hero card : dégradé enrichi (`from-primary/15 via-background to-accent/50`), ajout de **2 cercles flous décoratifs** (blur-3xl) en arrière-plan pour un effet "mesh gradient" moderne.
  * Icône Sparkles : anneau `ring-4 ring-primary/10` autour pour la profondeur.
  * Badge supplémentaire "100% local" ajouté à côté de "Bienvenue".
  * Bouton CTA principal : `shadow-sm` pour plus de relief.
  * Cartes-étapes : `hover:-translate-y-0.5` (soulèvement), icône `group-hover:scale-110 group-hover:bg-primary/15`, badge numéroté avec `ring-2 ring-card` pour l'effet "détourage".

### 3. Polish footer
- Modifié `src/components/AppShell.tsx` (footer) :
  * Ajout d'un bouton "Aide" avec kbd `?` dans le footer desktop (découverte des raccourcis).
  * Séparateur `·` entre l'aide et le texte "Données locales".
  * Layout flex amélioré avec gap-2.

## Vérifications
- `bun run lint` : 0 erreur, 0 warning (résolu l'erreur `no-assign-module-variable` en renommant la variable `module` → `targetModule`).
- Serveur dev : HTTP 200, 69Ko (vs 65Ko avant), compile en 5.8s, 0 erreur.
- Inspection HTML : tous les marqueurs présents — "Bienvenue", "Aide", "raccourcis", "100% local", "Premiers pas", "elishama-theme" (dark mode), "recharts" (graphique).
- Fichiers créés : `HelpDialog.tsx` (6.8Ko), `use-keyboard-shortcuts.ts` (2.8Ko).

## Risques / problèmes non résolus
- **agent-browser toujours bloqué** par l'isolation réseau du sandbox (limitation persistante depuis le round 1). La QA visuelle interactive (clic sur bouton, bascule thème, ouverture palette) n'est pas possible depuis le cron ; seuls curl + inspection HTML sont utilisés. L'utilisateur peut vérifier visuellement via le Panneau de prévisualisation.
- Les raccourcis clavier n'ont pas pu être testés interactivement (appuyer sur ?, /, 1-9, lettres). La logique est standard (event listener keydown + garde-fous sur les champs de saisie).

## Recommandations pour la prochaine phase
- Tester visuellement les raccourcis clavier (?, /, chiffres, lettres mnémoniques) via le Panneau de prévisualisation.
- Vérifier que les raccourcis lettres n'entrent pas en conflit avec des interactions futures (ex: recherche dans une table).
- Envisager l'ajout d'un export PDF natif (actuellement window.print()).
- Ajouter des indicateurs visuels de raccourcis sur les boutons de navigation de la sidebar (infobulles avec la touche).
- Envisager une fonctionnalité de "favoris" pour les produits les plus vendus (accès rapide).

---
Task ID: 11
Agent: webDevReview (cron round 4)
Task: QA + indicateurs raccourcis sidebar + favoris produits

## État du projet (évaluation)
- Serveur dev : HTTP 200, compile en ~5.5s, 0 erreur dans dev.log.
- `bun run lint` : 0 erreur, 0 warning.
- 10 modules + palette Cmd+K + mode sombre + graphique Dashboard + aide/raccourcis clavier (rounds précédents).
- agent-browser : toujours bloqué par l'isolation réseau du sandbox (persistant). QA via curl + inspection HTML.

## Modifications réalisées

### 1. Indicateurs visuels de raccourcis sur la sidebar ⌨️
- Modifié `src/components/AppShell.tsx` :
  * Ajout d'un champ `shortcut` (chiffre 1-9, 0) à chaque `NAV_ITEMS`.
  * Chaque bouton de navigation affiche maintenant un `<kbd>` badge avec le chiffre du raccourci, positionné en absolu à droite.
  * Le badge est **caché par défaut** (`opacity-0 scale-90`) et **apparaît au survol** (`group-hover:opacity-100 group-hover:scale-100`) avec une transition fluide.
  * Style adaptatif : sur le bouton actif, le kbd utilise `border-white/30 bg-white/10 text-sidebar-primary-foreground` ; sur les autres, `border-sidebar-border bg-sidebar-accent text-sidebar-foreground/70`.
  * Le badge stock faible (module Stock) se **cache au survol** (`group-hover:opacity-0 group-hover:scale-90`) pour laisser place au kbd — transition élégante.
  * Ajout d'un `title` sur chaque bouton : "Tableau de bord (raccourci: 1)" etc. pour la découverte native via l'infobulle du navigateur.

### 2. Fonctionnalité Favoris produits ⭐
- Modifié `src/lib/types.ts` : ajout du champ optionnel `favorite?: boolean` à l'interface `Product` (rétro-compatible : les produits existants ont `undefined` = non favori).
- Modifié `src/lib/store.tsx` :
  * Ajout de `toggleFavorite(id)` à l'interface `StoreContextValue` et son implémentation (toggle `favorite` + `updatedAt`).
  * Ajout au contexte `value` pour exposer la méthode via `useStore()`.
- Modifié `src/components/modules/Products.tsx` :
  * Import de l'icône `Star` et de `cn` depuis `@/lib/utils`.
  * Ajout de `toggleFavorite` au destructuring du store.
  * Nouvel état `favoritesOnly` (booléen) pour filtrer les favoris.
  * `filteredProducts` : prend en compte `favoritesOnly` (n'affiche que les `p.favorite` si activé).
  * `stats` : ajout d'un compteur `favorites` (produits favoris non archivés).
  * **Stats cards** : passage à une grille 5 colonnes (`lg:grid-cols-5`) avec ajout d'une carte "Favoris" (icône Star, tone warning, hint "Accès rapide").
  * **Bouton filtre Favoris** : bouton toggle sous les filtres, avec icône Star (remplie si actif), badge compteur, variant `default` quand actif / `outline` sinon.
  * **Tableau desktop** : étoile cliquable en overlay sur l'image/icône du produit (bouton absolu -top-1.5 -right-1.5), étoile ambre remplie si favori, étoile muted sinon. Étoile aussi affichée à côté du nom du produit si favori.
  * **Cartes mobile** : même étoile cliquable en overlay + étoile à côté du nom.
  * **Menu d'actions** (ProductActions) : ajout d'un item "Ajouter/Retirer des favoris" avec icône Star (remplie ambre si favori).

## Vérifications
- `bun run lint` : 0 erreur, 0 warning.
- Serveur dev : HTTP 200, 72Ko (vs 69Ko avant), compile en 5.5s, 0 erreur.
- Inspection HTML (page d'accueil / Dashboard) :
  * Raccourcis sidebar présents : `title="Tableau de bord (raccourci: 1)"` ... `title="Paramètres (raccourci: 0)"` ✅
  * `<kbd>` badges avec les chiffres 1-9, 0, cachés par défaut (`opacity-0`) et visibles au survol (`group-hover:opacity-100`) ✅
  * Badge stock faible avec `group-hover:opacity-0` (se cache au survol) ✅
  * Boutons Aide + ThemeToggle + Rechercher présents dans les headers ✅
- Le module Produits (avec favoris) n'est pas visible sur la page d'accueil (Dashboard) — comportement attendu. Les favoris apparaissent en naviguant vers Produits (raccourci `4`).

## Risques / problèmes non résolus
- **agent-browser toujours bloqué** par l'isolation réseau du sandbox (limitation persistante). QA visuelle interactive impossible depuis le cron.
- Les favoris n'ont pas pu être testés interactivement (clic sur l'étoile, filtre favoris). La logique est standard (toggle booléen + filtrage).
- Le champ `favorite` est optionnel — les produits créés avant cette mise à jour auront `undefined` (traité comme `false` partout).

## Recommandations pour la prochaine phase
- Tester visuellement les favoris via le Panneau de prévisualisation (naviguer vers Produits, cliquer sur les étoiles, filtrer).
- Envisager d'ajouter une section "Favoris" en haut du module Ventes pour un accès rapide aux produits les plus utilisés.
- Ajouter un tri par favoris (les favoris en premier) dans la liste des produits.
- Envisager un export PDF natif (actuellement window.print()).
- Ajouter des infobulles (tooltips shadcn) sur les boutons d'action pour améliorer la découverte.

---
Task ID: 12
Agent: webDevReview (cron round 5)
Task: QA + favoris dans Ventes + tri par favoris + polish composants partagés

## État du projet (évaluation)
- Serveur dev : HTTP 200, compile en ~5.9s, 0 erreur dans dev.log.
- `bun run lint` : 0 erreur, 0 warning.
- 10 modules + palette Cmd+K + mode sombre + graphique Dashboard + aide/raccourcis + favoris produits (rounds précédents).
- agent-browser : toujours bloqué par l'isolation réseau du sandbox (persistant). QA via curl + inspection HTML.

## Modifications réalisées

### 1. Favoris dans le module Ventes — accès rapide ⭐
- Modifié `src/components/modules/Sales.tsx` :
  * Import de l'icône `Star` et de `cn` depuis `@/lib/utils`.
  * Nouveau `favoriteProducts` : liste des produits actifs non archivés marqués favoris.
  * **Barre "Favoris — accès rapide"** dans le dialog Nouvelle vente, au-dessus de la grille de produits. Affichée uniquement quand il n'y a pas de recherche active ET qu'il existe des favoris. Carte ambre (border + bg ambre) avec étoile, et chips cliquables (nom + prix) qui ajoutent le produit au panier en un clic.
  * **Grille de produits** : les produits favoris sont maintenant mis en évidence avec une bordure ambre et un fond ambre léger. Une étoile ambre remplie s'affiche en haut à droite de chaque carte favori.
  * Amélioration de l'UX : reconnaissance visuelle instantanée des produits préférés dans le flux de vente.

### 2. Tri par favoris dans le module Produits
- Modifié `src/components/modules/Products.tsx` (`filteredProducts`) :
  * Ajout d'un `.sort()` après le `.filter()` : les **favoris en premier** (favori=true avant favori=false), puis tri alphabétique par nom.
  * Les produits favoris apparaissent donc en haut de la liste, qu'ils soient filtrés ou non.

### 3. Polish des composants partagés (`src/components/shared.tsx`)
- **EmptyState** : refonte visuelle avec un halo flou (`bg-primary/10 blur-xl scale-150`) derrière l'icône circulaire, ajout d'une bordure subtile sur le cercle. Effet "glow" moderne qui attire l'œil sans être intrusif.
- **Money** : gestion correcte des montants négatifs — affiche un signe moins propre "−" (caractère Unicode U+2212) devant le montant formaté (au lieu d'un "-" hyphen). Plus élégant pour les pertes/sorties.
- **SearchInput** : ajout d'un **bouton "Effacer" (X)** qui apparaît quand il y a du texte dans le champ. Bouton circulaire discret à droite, avec hover. `aria-label="Effacer la recherche"` pour l'accessibilité. Le padding droit de l'input a été ajusté (`pr-9`) pour éviter le chevauchement.

## Vérifications
- `bun run lint` : 0 erreur, 0 warning.
- Serveur dev : HTTP 200, 72Ko, compile en 5.9s, 0 erreur.
- Inspection HTML : tous les raccourcis sidebar présents (raccourci: 0 à 9), panneau de bienvenue, Aide, dark mode (elishama-theme), recharts — tout fonctionne.

## Risques / problèmes non résolus
- **agent-browser toujours bloqué** par l'isolation réseau du sandbox (limitation persistante). La QA visuelle interactive reste impossible depuis le cron.
- Les favoris dans Ventes + le tri n'ont pas pu être testés interactivement. La logique est standard (filtrage + sort + clic addToCart).

## Recommandations pour la prochaine phase
- Tester visuellement les favoris dans Ventes via le Panneau de prévisualisation (marquer des favoris dans Produits, puis ouvrir une nouvelle vente).
- Envisager d'ajouter un compteur de favoris dans la barre "Favoris" du dialog Ventes.
- Ajouter des infobulles (tooltips shadcn) sur les boutons d'action pour améliorer la découverte.
- Envisager un export PDF natif (actuellement window.print()).
- Ajouter une fonctionnalité de recherche globale dans les rapports.
- Envisager des raccourcis clavier pour les actions courantes (ex: "N" pour nouvelle vente quand sur le module Ventes).

---
Task ID: 13
Agent: webDevReview (cron round 6)
Task: QA + tooltips + raccourci N contextuel + polish sidebar

## État du projet (évaluation)
- Serveur dev : HTTP 200, compile en ~7s, 0 erreur dans dev.log.
- `bun run lint` : 0 erreur, 0 warning.
- 10 modules + palette Cmd+K + mode sombre + graphique Dashboard + aide/raccourcis + favoris produits + favoris dans Ventes (rounds précédents).
- agent-browser : toujours bloqué par l'isolation réseau du sandbox (persistant). QA via curl + inspection HTML.

## Modifications réalisées

### 1. Tooltips sur les boutons d'action du header 💬
- Créé un composant `ActionTooltip` dans `src/components/shared.tsx` : wrapper léger autour des primitives Tooltip de shadcn (Tooltip + TooltipTrigger asChild + TooltipContent). Importe `Tooltip`, `TooltipTrigger`, `TooltipContent` depuis `@/components/ui/tooltip`.
- Modifié `src/components/AppShell.tsx` (header desktop) : wrappé le bouton "Rechercher" et le bouton "Aide" avec `<ActionTooltip label="...">`. Les infobulles affichent "Rechercher (⌘K)" et "Aide & raccourcis (?)" au survol, avec animation fade-in + zoom-in.

### 2. Raccourci "N" pour nouvelle action contextuelle ⌨️
- Modifié `src/hooks/use-keyboard-shortcuts.ts` :
  * Ajout de `onNewAction?: () => void` dans `ShortcutOptions`.
  * Gestion de la touche "n" → appelle `onNewAction` si fourni.
  * Export de `NEW_ACTION_MODULES` (liste des modules supportant une action "Nouvelle").
- Créé `src/hooks/use-new-action-listener.ts` : hook qui écoute l'événement global `elishama:new-action` et appelle un callback. Permet à chaque module d'ouvrir son dialog "Nouveau" sans prop drilling.
- Modifié `src/components/AppShell.tsx` :
  * Ajout de `handleNewAction` (useCallback) qui dispatche `window.dispatchEvent(new CustomEvent("elishama:new-action", { detail: { module: current } }))`.
  * Passé `onNewAction={handleNewAction}` au hook `useKeyboardShortcuts`.
  * Import de `useCallback`.
- Câblé le listener dans 4 modules :
  * **Sales.tsx** : `handleNewSale` → ouvre le dialog nouvelle vente.
  * **Products.tsx** : `handleNewProduct` → reset le form + ouvre le dialog nouveau produit.
  * **Tickets.tsx** : `handleNewTicket` → ouvre le dialog nouveau ticket.
  * **Expenses.tsx** : `handleNewExpense` → reset editing + ouvre le dialog nouvelle dépense.
- Modifié `src/components/HelpDialog.tsx` : ajout de "N — Nouvelle action contextuelle (vente, produit, ticket, dépense)" dans la section Général.

### 3. Polish sidebar ✨
- Modifié `src/components/AppShell.tsx` (SidebarContent) :
  * **Barre d'indicateur actif** : ajout d'un `<span>` absolu à gauche du bouton actif (`h-7 w-1 rounded-r-full bg-sidebar-primary-foreground/90`) — repère visuel clair du module courant.
  * **Header sidebar enrichi** : conteneur `relative overflow-hidden` avec un cercle flou décoratif (`bg-sidebar-primary/20 blur-2xl`) en haut à droite. L'icône Flame a maintenant un `shadow-md shadow-sidebar-primary/30` pour de la profondeur. Les éléments texte/icône sont `relative` pour être au-dessus du décor.

## Vérifications
- `bun run lint` : 0 erreur, 0 warning.
- Serveur dev : HTTP 200, 73Ko (vs 72Ko avant), compile en 7s, 0 erreur.
- Inspection HTML :
  * `data-slot="tooltip-trigger"` présent sur les boutons Rechercher et Aide du header desktop ✅
  * `rounded-r-full bg-sidebar-primary-foreground` présent (barre d'indicateur actif) ✅
  * Tous les raccourcis sidebar présents (raccourci: 0-9) ✅
  * Panneau de bienvenue, Aide, dark mode, recharts — tout fonctionne ✅

## Risques / problèmes non résolus
- **agent-browser toujours bloqué** par l'isolation réseau du sandbox (limitation persistante). La QA visuelle interactive reste impossible depuis le cron.
- Le raccourci "N" et les tooltips n'ont pas pu être testés interactivement. La logique est standard (event listener + CustomEvent pour N, Radix Tooltip pour les infobulles).

## Recommandations pour la prochaine phase
- Tester visuellement le raccourci "N" via le Panneau de prévisualisation (aller sur Ventes, appuyer sur N → le dialog nouvelle vente doit s'ouvrir).
- Tester les tooltips en survolant les boutons Rechercher et Aide du header desktop.
- Envisager d'ajouter des tooltips sur les boutons d'action des modules (ex: boutons entrée/sortie stock dans Products).
- Envisager un export PDF natif (actuellement window.print()).
- Ajouter une indication visuelle "N" (kbd) sur les boutons "Nouveau" de chaque module pour la découverte.

---
Task ID: 14
Agent: webDevReview (cron round 7)
Task: QA + badges kbd N + alerte stock Dashboard + polish PageHeader

## État du projet (évaluation)
- Serveur dev : HTTP 200, compile en ~5.2s, 0 erreur dans dev.log.
- `bun run lint` : 0 erreur, 0 warning.
- 10 modules + palette Cmd+K + mode sombre + graphique Dashboard + aide/raccourcis + favoris + tooltips + raccourci N contextuel (rounds précédents).
- agent-browser : toujours bloqué par l'isolation réseau du sandbox (persistant). QA via curl + inspection HTML.

## Modifications réalisées

### 1. Badges "N" sur les boutons "Nouveau" ⌨️
- Modifié 4 modules pour ajouter un badge `<kbd>N</kbd>` sur le bouton principal "Nouveau" de chaque PageHeader, pour la découverte du raccourci :
  * **Sales.tsx** : bouton "Nouvelle vente" → `kbd` "N" (border-white/30 bg-white/10, hidden sm:inline-flex)
  * **Products.tsx** : bouton "Ajouter un produit" → `kbd` "N"
  * **Tickets.tsx** : bouton "Nouveau ticket" → `kbd` "N"
  * **Expenses.tsx** : bouton "Ajouter une dépense" → `kbd` "N"
- Style cohérent : badge discret blanc sur fond primary, visible uniquement sur desktop (sm+), police mono, taille 10px.

### 2. Bannière d'alerte stock sur le Dashboard 🚨
- Modifié `src/components/modules/Dashboard.tsx` :
  * Ajout d'une **bannière d'alerte stock** entre la barre d'actions rapides et les stats principales.
  * Affichée uniquement si `outOfStock.length > 0 || lowStock.length > 0`.
  * Carte ambre (border + bg ambre, support dark mode) avec icône AlertTriangle dans un cercle ambre.
  * Texte : "Alertes de stock" + compteurs ("X en rupture · Y en stock faible") + noms des produits en rupture (3 max + "+N autre(s)").
  * Bouton "Gérer" à droite qui navigue vers le module Stock (border ambre, text ambre, hover ambre).
  * Responsive : flex-col sur mobile, flex-row sur desktop.

### 3. Polish PageHeader ✨
- Modifié `src/components/shared.tsx` (PageHeader) :
  * **Icône enrichie** : dégradé `bg-gradient-to-br from-primary/15 to-primary/5` + anneau `ring-1 ring-primary/10` pour un effet de profondeur moderne.
  * **Conteneur min-w-0** sur le bloc titre + `truncate` sur h1/subtitle pour éviter les débordements sur petits écrans.
  * **shrink-0** sur le conteneur d'actions pour qu'il garde sa largeur.

## Vérifications
- `bun run lint` : 0 erreur, 0 warning.
- Serveur dev : HTTP 200, 73Ko, compile en 5.2s, 0 erreur.
- Inspection HTML : tous les marqueurs présents — Bienvenue, Aide, elishama-theme (dark mode), recharts (graphique), raccourci: 0-9 (sidebar), tooltip-trigger (tooltips header).

## Risques / problèmes non résolus
- **agent-browser toujours bloqué** par l'isolation réseau du sandbox (limitation persistante). La QA visuelle interactive reste impossible depuis le cron.
- Les badges "N", la bannière d'alerte et le PageHeader polish n'ont pas pu être testés visuellement. La logique est standard (classes Tailwind + conditions d'affichage).

## Recommandations pour la prochaine phase
- Tester visuellement via le Panneau de prévisualisation :
  * Les badges "N" sur les boutons Nouveau (Ventes, Produits, Tickets, Dépenses)
  * La bannière d'alerte stock (créer un produit avec stock=0 pour la déclencher)
  * Le dégradé sur les icônes PageHeader
- Envisager d'ajouter des tooltips sur les boutons d'action des modules (ex: boutons entrée/sortie stock).
- Envisager un export PDF natif (actuellement window.print()).
- Ajouter une animation pulse subtile sur la bannière d'alerte pour attirer l'attention.
- Envisager des notifications de rappel (ex: "X tickets ouverts depuis plus de 2h").

---
Task ID: 15
Agent: webDevReview (cron round 8)
Task: QA + pulse animation + rappel tickets ouverts + tooltips actions Produits

## État du projet (évaluation)
- Serveur dev : HTTP 200, compile en ~5.5s, 0 erreur dans dev.log.
- `bun run lint` : 0 erreur, 0 warning.
- 10 modules + palette Cmd+K + mode sombre + graphique Dashboard + aide/raccourcis + favoris + tooltips + raccourci N + badges N + alerte stock (rounds précédents).
- agent-browser : toujours bloqué par l'isolation réseau du sandbox (persistant). QA via curl + inspection HTML.

## Modifications réalisées

### 1. Animations CSS utilitaires 🎬
- Modifié `src/app/globals.css` :
  * `@keyframes pulse-subtle` : opacité 1 → 0.7 → 1 sur 2.5s (pulse doux, non agressif).
  * `.animate-pulse-subtle` : classe utilitaire pour appliquer l'animation.
  * `@keyframes slide-in-right` : translateX(8px) → 0 + opacity 0 → 1 sur 0.3s.
  * `.animate-slide-in-right` : classe utilitaire (prête à l'emploi pour futures notifications/toasts).

### 2. Pulse sur la bannière d'alerte stock 💓
- Modifié `src/components/modules/Dashboard.tsx` :
  * L'icône AlertTriangle de la bannière d'alerte stock a maintenant la classe `animate-pulse-subtle` — attirer subtilement l'attention sans être agressif.
  * Animation 2.5s ease-in-out infinite.

### 3. Rappel tickets ouverts depuis longtemps 🎫
- Modifié `src/components/modules/Dashboard.tsx` :
  * Ajout de `staleTickets` dans les stats : tickets ouverts dont `createdAt` est antérieur à il y a 2h (`Date.now() - 2 * 60 * 60 * 1000`).
  * Nouvelle **bannière bleue** "Tickets en attente" affichée si `staleTickets.length > 0`, placée après la bannière d'alerte stock.
  * Carte bleue (border + bg bleu, support dark mode) avec icône TicketIcon dans un cercle bleu.
  * Texte : "Tickets en attente" + "X ticket(s) ouvert(s) depuis plus de 2h" + noms des tickets (3 max + "+N autre(s)").
  * Bouton "Voir" à droite qui navigue vers le module Tickets.
  * Responsive flex-col mobile / flex-row desktop.

### 4. Tooltips sur les boutons d'action Produits 💬
- Modifié `src/components/modules/Products.tsx` :
  * Import de `ActionTooltip` depuis `@/components/shared`.
  * Wrappé les 3 boutons d'action du composant `ProductActions` avec `<ActionTooltip>` :
    - Bouton "Entrée stock" (PackagePlus) → tooltip "Entrée stock" side="top"
    - Bouton "Sortie stock" (PackageMinus) → tooltip "Sortie stock" side="top"
    - Bouton "Plus d'actions" (MoreVertical, trigger du DropdownMenu) → tooltip "Plus d'actions" side="top"
  * Suppression des `title` natifs (remplacés par les tooltips shadcn plus élégants avec animation).

## Vérifications
- `bun run lint` : 0 erreur, 0 warning.
- Serveur dev : HTTP 200, 73Ko, compile en 5.5s, 0 erreur.
- Inspection HTML : tous les marqueurs présents — Bienvenue, Aide, elishama-theme (dark mode), recharts (graphique), raccourci: 0-9 (sidebar).
- Source CSS : `pulse-subtle` défini (3 occurrences dans globals.css).

## Risques / problèmes non résolus
- **agent-browser toujours bloqué** par l'isolation réseau du sandbox (limitation persistante). La QA visuelle interactive reste impossible depuis le cron.
- L'animation pulse, la bannière tickets et les tooltips Produits n'ont pas pu être testés visuellement. La logique est standard (classes Tailwind + conditions d'affichage + Radix Tooltip).

## Recommandations pour la prochaine phase
- Tester visuellement via le Panneau de prévisualisation :
  * L'animation pulse sur l'icône de la bannière d'alerte stock (créer un produit avec stock=0)
  * La bannière "Tickets en attente" (créer un ticket ouvert et attendre, ou modifier temporellement)
  * Les tooltips sur les boutons d'action Produits (survoler les boutons Entrée/Sortie stock)
- Envisager d'ajouter des tooltips sur les boutons d'action des autres modules (Tickets, Cash, Expenses).
- Envisager un export PDF natif (actuellement window.print()).
- Ajouter un indicateur visuel de bénéfice (flèche verte/rouge) sur le Dashboard selon la tendance.
- Envisager une page de statistiques avancées (ventes par heure, jour de la semaine le plus rentable).

---
Task ID: 16
Agent: webDevReview (cron round 9)
Task: QA + indicateur tendance bénéfice + statistiques avancées Rapports

## État du projet (évaluation)
- Serveur dev : HTTP 200, compile en ~5.5s, 0 erreur dans dev.log.
- `bun run lint` : 0 erreur, 0 warning.
- 10 modules + palette Cmd+K + mode sombre + graphique Dashboard + aide/raccourcis + favoris + tooltips + raccourci N + alertes stock/tickets (rounds précédents).
- agent-browser : toujours bloqué par l'isolation réseau du sandbox (persistant). QA via curl + inspection HTML.

## Modifications réalisées

### 1. Indicateur de tendance du bénéfice sur le Dashboard 📈
- Modifié `src/components/modules/Dashboard.tsx` (stats useMemo) :
  * Ajout du calcul du bénéfice d'hier (`yesterdayProfit`) : filtre les ventes/dépenses avec `isSameDay(date, yesterday)` où yesterday = aujourd'hui - 1 jour.
  * Calcul de `profitDiff = profit - yesterdayProfit` et `profitTrend` ("up" | "down" | "neutral").
  * Si `yesterdayProfit === 0` → "neutral" (pas de comparaison possible).
- La StatCard "Bénéfice estimé" affiche maintenant un hint contextuel :
  * Tendance ↑ : "↑ +X FCFA vs hier" (vert implicite)
  * Tendance ↓ : "↓ −X FCFA vs hier" (rouge implicite)
  * Stable : "Stable vs hier"
  * Pas de comparaison : "Ventes - Dépenses" (fallback)

### 2. Statistiques avancées dans le module Rapports 📊
- Modifié `src/components/modules/Reports.tsx` (salesStats useMemo) :
  * **Ventes par jour de la semaine** : agrège le CA par jour (Lun→Dim), construit `weekdayChart` (7 entrées, nom abrégé 3 lettres) et `bestWeekday` (jour avec le plus haut CA).
  * **Ventes par heure** : agrège le CA sur 24 plages horaires (0h-23h), construit `hourlyChart` (uniquement les heures avec ventes) et `peakHour` (heure de pointe).
- Ajout d'une nouvelle section "Statistiques avancées" à la fin de l'onglet Ventes :
  * **Card "Ventes par jour de la semaine"** : BarChart ambre (7 barres Lun-Dim), header avec "Meilleur jour : X (Y FCFA)", état vide si pas de ventes.
  * **Card "Ventes par heure"** : BarChart vert (heures avec ventes), header avec "Heure de pointe : Xh (Y FCFA)", état vide si pas de ventes.
  * Tooltips recharts personnalisés avec variables CSS (var(--popover), var(--border)) pour le support dark mode.
  * Grille responsive `grid-cols-1 lg:grid-cols-2`.
- Import des icônes `Calendar` et `Clock` depuis lucide-react.

## Vérifications
- `bun run lint` : 0 erreur, 0 warning.
- Serveur dev : HTTP 200, 73Ko, compile en 5.5s, 0 erreur.
- Inspection HTML : tous les marqueurs présents — Bienvenue, Aide, elishama-theme (dark mode), recharts (graphique), raccourci: 0-9 (sidebar), tooltip-trigger, pulse-subtle.

## Risques / problèmes non résolus
- **agent-browser toujours bloqué** par l'isolation réseau du sandbox (limitation persistante). La QA visuelle interactive reste impossible depuis le cron.
- L'indicateur de tendance et les graphiques avancés n'ont pas pu être testés visuellement avec des données réelles. La logique est standard (filtrage par date + agrégation + recharts).

## Recommandations pour la prochaine phase
- Tester visuellement via le Panneau de prévisualisation :
  * L'indicateur de tendance (créer des ventes/dépenses hier et aujourd'hui pour voir la comparaison)
  * Les graphiques "Ventes par jour de la semaine" et "Ventes par heure" dans Rapports → onglet Ventes
- Envisager d'ajouter des tooltips sur les boutons d'action des modules Tickets, Cash, Expenses.
- Envisager un export PDF natif (actuellement window.print()).
- Ajouter un comparatif de périodes dans les Rapports (ex: ce mois vs mois dernier).
- Envisager une fonctionnalité de "clôture de journée" qui archive les opérations du jour.

---
Task ID: 17
Agent: webDevReview (cron round 10)
Task: QA + comparaison périodes Rapports + amélioration clôture caisse

## État du projet (évaluation)
- Serveur dev : HTTP 200, compile en ~5.3s, 0 erreur dans dev.log.
- `bun run lint` : 0 erreur, 0 warning.
- 10 modules + palette Cmd+K + mode sombre + graphique Dashboard + aide/raccourcis + favoris + tooltips + raccourci N + alertes + tendance bénéfice + stats avancées (rounds précédents).
- agent-browser : toujours bloqué par l'isolation réseau du sandbox (persistant). QA via curl + inspection HTML.

## Modifications réalisées

### 1. Comparaison de périodes dans le module Rapports 📊
- Modifié `src/components/modules/Reports.tsx` :
  * Nouveau `useMemo` `previousPeriod` : calcule la période précédente (même durée, juste avant la période actuelle) en utilisant `dateRange.start.getTime() - 1` comme fin et `prevEnd - duration` comme début.
  * Filtre les ventes et dépenses de la période précédente, calcule `prevRevenue`, `prevExpensesTotal`, `prevProfit`, `prevSalesCount`.
  * `hasPreviousData` : true si la période précédente a eu du CA ou des dépenses.
  * `revenueDiff` et `profitDiff` : différences entre période actuelle et précédente.
  * **Nouvelle carte "Comparaison avec la période précédente"** dans l'onglet Bénéfice, affichée si `hasPreviousData` :
    - Header avec dates de la période précédente (formatées).
    - 3 colonnes (CA, Dépenses, Résultat) avec montant de la période précédente + différence colorée (↑ vert / ↓ rouge).
    - Pour les dépenses, la logique est inversée : ↓ vert (dépenses en baisse = bien), ↑ rouge (dépenses en hausse = mal).
    - Grille responsive `grid-cols-1 sm:grid-cols-3`.

### 2. Amélioration de la clôture de caisse 💰
- Modifié `src/components/modules/Cash.tsx` :
  * `stats` : ajout de `salesCount` (nombre de ventes du jour, incrémenté pour chaque opération de type "sale").
  * **Dialog "Fermer la caisse" enrichi** :
    - Ligne "Ventes du jour" affiche maintenant le nombre de ventes : "Ventes du jour (X)".
    - Nouvelle ligne "Bénéfice estimé" (CA - dépenses) avec couleur conditionnelle (vert si positif, rouge si négatif).
    - Séparateur entre la section ventes/dépenses/bénéfice et la section entrées/sorties/fond.
    - **Bouton "Imprimer"** ajouté dans le footer (variant secondary, icône Printer) qui déclenche `window.print()` pour imprimer le récapitulatif avant fermeture.
    - Footer avec 3 boutons : Annuler, Imprimer, Fermer (destructive).
    - `gap-2` sur le footer pour un espacement propre.

## Vérifications
- `bun run lint` : 0 erreur, 0 warning.
- Serveur dev : HTTP 200, 73Ko, compile en 5.3s, 0 erreur.
- Inspection HTML : tous les marqueurs présents — Bienvenue, Aide, elishama-theme (dark mode), recharts (graphique), raccourci: 0-9 (sidebar), tooltip-trigger, pulse-subtle.

## Risques / problèmes non résolus
- **agent-browser toujours bloqué** par l'isolation réseau du sandbox (limitation persistante). La QA visuelle interactive reste impossible depuis le cron.
- La comparaison de périodes et l'enrichissement de la clôture n'ont pas pu être testés visuellement avec des données réelles. La logique est standard (filtrage par date + calculs + affichage conditionnel).

## Recommandations pour la prochaine phase
- Tester visuellement via le Panneau de prévisualisation :
  * La comparaison de périodes dans Rapports → onglet Bénéfice (créer des ventes/dépenses sur deux périodes consécutives)
  * Le dialog de clôture enrichi dans Caisse → Fermer la caisse
- Envisager d'ajouter des tooltips sur les boutons d'action des modules Tickets, Expenses.
- Envisager un export PDF natif (actuellement window.print()).
- Ajouter une fonctionnalité de "réouverture" de caisse après fermeture accidentelle.
- Envisager un graphique d'évolution du CA sur 30 jours dans les Rapports.
