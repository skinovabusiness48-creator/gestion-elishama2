// ============================================================
// ELISHAMA — Dialogue d'aide & raccourcis clavier
// ============================================================
"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Keyboard, Search, ArrowLeft, Home } from "lucide-react";
import type { ModuleKey } from "@/lib/types";
import { useStore } from "@/lib/store";
import { Flame } from "lucide-react";

const NAV_SHORTCUTS: { keys: string[]; label: string }[] = [
  { keys: ["1"], label: "Tableau de bord" },
  { keys: ["2"], label: "Ventes" },
  { keys: ["3"], label: "Tickets" },
  { keys: ["4"], label: "Produits" },
  { keys: ["5"], label: "Stock" },
  { keys: ["6"], label: "Caisse" },
  { keys: ["7"], label: "Dépenses" },
  { keys: ["8"], label: "Rapports" },
  { keys: ["9"], label: "Historique" },
  { keys: ["0"], label: "Paramètres" },
];

const GLOBAL_SHORTCUTS: { keys: string[]; label: string }[] = [
  { keys: ["⌘", "K"], label: "Ouvrir la recherche globale" },
  { keys: ["/"], label: "Rechercher (raccourci)" },
  { keys: ["N"], label: "Nouvelle action contextuelle (vente, produit, ticket, dépense)" },
  { keys: ["?"], label: "Afficher cette aide" },
  { keys: ["Échap"], label: "Fermer une fenêtre" },
];

const MNEMONIC_SHORTCUTS: { keys: string[]; label: string }[] = [
  { keys: ["G"], label: "Tableau de bord (général)" },
  { keys: ["V"], label: "Ventes" },
  { keys: ["T"], label: "Tickets" },
  { keys: ["P"], label: "Produits" },
  { keys: ["S"], label: "Stock" },
  { keys: ["C"], label: "Caisse" },
  { keys: ["D"], label: "Dépenses" },
  { keys: ["R"], label: "Rapports" },
  { keys: ["H"], label: "Historique" },
];

function Kbd({ keys }: { keys: string[] }) {
  return (
    <span className="inline-flex items-center gap-1">
      {keys.map((k, i) => (
        <React.Fragment key={i}>
          {i > 0 && <span className="text-muted-foreground text-xs">+</span>}
          <kbd className="inline-flex h-6 min-w-6 items-center justify-center rounded-md border border-border bg-muted px-1.5 text-xs font-semibold font-mono text-foreground">
            {k}
          </kbd>
        </React.Fragment>
      ))}
    </span>
  );
}

export function HelpDialog({
  open,
  onOpenChange,
  onNavigate,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onNavigate: (k: ModuleKey) => void;
}) {
  const { data } = useStore();
  const name = data.settings.restaurant.name || "ELISHAMA";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto scrollbar-thin">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Keyboard className="h-5 w-5 text-primary" />
            Raccourcis clavier & aide
          </DialogTitle>
          <DialogDescription>
            Naviguez rapidement dans {name} grâce à ces raccourcis. Les touches mnémoniques et numériques fonctionnent
            uniquement quand vous n'êtes pas en train de taper dans un champ.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          {/* Raccourcis globaux */}
          <section>
            <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
              <Search className="h-4 w-4 text-primary" /> Général
            </h3>
            <ul className="space-y-1.5">
              {GLOBAL_SHORTCUTS.map((s) => (
                <li key={s.label} className="flex items-center justify-between gap-3 py-1">
                  <span className="text-sm text-muted-foreground">{s.label}</span>
                  <Kbd keys={s.keys} />
                </li>
              ))}
            </ul>
          </section>

          {/* Navigation numérique */}
          <section>
            <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
              <Home className="h-4 w-4 text-primary" /> Navigation rapide (chiffres)
            </h3>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {NAV_SHORTCUTS.map((s) => (
                <li
                  key={s.label}
                  className="flex items-center justify-between gap-3 py-1 cursor-pointer hover:bg-muted/50 rounded px-2 -mx-2 transition-colors"
                  onClick={() => {
                    const map: Record<string, ModuleKey> = {
                      "1": "dashboard", "2": "sales", "3": "tickets", "4": "products",
                      "5": "stock", "6": "cash", "7": "expenses", "8": "reports",
                      "9": "history", "0": "settings",
                    };
                    const mod = map[s.keys[0]];
                    if (mod) {
                      onNavigate(mod);
                      onOpenChange(false);
                    }
                  }}
                >
                  <span className="text-sm text-muted-foreground">{s.label}</span>
                  <Kbd keys={s.keys} />
                </li>
              ))}
            </ul>
          </section>

          {/* Mnémoniques */}
          <section>
            <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
              <ArrowLeft className="h-4 w-4 text-primary" /> Navigation mnémonique (lettres)
            </h3>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {MNEMONIC_SHORTCUTS.map((s) => (
                <li key={s.label} className="flex items-center justify-between gap-3 py-1">
                  <span className="text-sm text-muted-foreground">{s.label}</span>
                  <Kbd keys={s.keys} />
                </li>
              ))}
            </ul>
            <p className="text-xs text-muted-foreground mt-2 italic">
              Astuce : ces lettres ne fonctionnent que si aucun champ de saisie n'est actif.
            </p>
          </section>

          {/* À propos */}
          <section className="border-t pt-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shrink-0">
                <Flame className="h-5 w-5" />
              </div>
              <div className="text-sm">
                <p className="font-semibold text-foreground">{name} — Gestion</p>
                <p className="text-muted-foreground mt-0.5">
                  Application 100% locale et hors ligne. Vos données ne quittent jamais votre appareil.
                  Pensez à exporter régulièrement une sauvegarde depuis les Paramètres.
                </p>
              </div>
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
