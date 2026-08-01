// ============================================================
// ELISHAMA — Hook de raccourcis clavier globaux
// ============================================================
"use client";

import { useEffect } from "react";
import type { ModuleKey } from "@/lib/types";

interface ShortcutOptions {
  onNavigate: (k: ModuleKey) => void;
  onHelp: () => void;
  onSearch: () => void;
  enabled?: boolean;
}

// Mapping touche → module (uniquement quand pas de focus sur input/textarea)
const KEY_TO_MODULE: Record<string, ModuleKey> = {
  "1": "dashboard",
  "2": "sales",
  "3": "tickets",
  "4": "products",
  "5": "stock",
  "6": "cash",
  "7": "expenses",
  "8": "reports",
  "9": "history",
  "0": "settings",
  // Raccourcis mnémoniques (lettre unique)
  g: "dashboard", // "g" comme "général" / accueil
  v: "sales", // "v" comme "ventes"
  t: "tickets",
  p: "products",
  s: "stock",
  c: "cash",
  d: "expenses",
  r: "reports",
  h: "history",
};

/**
 * Active les raccourcis clavier globaux :
 * - ? : ouvre l'aide
 * - / : ouvre la recherche (palette)
 * - 1-9, 0 : navigation rapide vers les modules
 * - lettres mnémoniques (v, t, p, s, c, d, r, h, g) : navigation rapide
 *
 * Les raccourcis sont désactivés quand l'utilisateur tape dans un champ
 * (input, textarea, select, contenteditable) ou quand `enabled` est false.
 */
export function useKeyboardShortcuts({ onNavigate, onHelp, onSearch, enabled = true }: ShortcutOptions) {
  useEffect(() => {
    if (!enabled) return;

    const handler = (e: KeyboardEvent) => {
      // Ne pas intercepter si l'utilisateur tape dans un champ
      const target = e.target as HTMLElement | null;
      if (target) {
        const tag = target.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable) {
          return;
        }
      }
      // Ne pas interférer avec les modificateurs (sauf pour Cmd/Ctrl+K géré par la palette)
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const key = e.key.toLowerCase();

      // ? → aide
      if (key === "?" || (e.shiftKey && key === "/")) {
        e.preventDefault();
        onHelp();
        return;
      }
      // / → recherche
      if (key === "/") {
        e.preventDefault();
        onSearch();
        return;
      }
      // Échap → ne rien faire (géré par les dialogs)
      if (key === "escape") return;

      // Navigation rapide
      const targetModule = KEY_TO_MODULE[key];
      if (targetModule) {
        e.preventDefault();
        onNavigate(targetModule);
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onNavigate, onHelp, onSearch, enabled]);
}
