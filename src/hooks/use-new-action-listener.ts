// ============================================================
// ELISHAMA — Hook pour écouter l'événement "nouvelle action" (raccourci N)
// ============================================================
"use client";

import { useEffect } from "react";

/**
 * Écoute l'événement global `elishama:new-action` (déclenché par le raccourci "N")
 * et appelle le callback fourni. Permet à chaque module d'ouvrir son dialog "Nouveau"
 * quand l'utilisateur appuie sur N.
 */
export function useNewActionListener(callback: () => void) {
  useEffect(() => {
    const handler = () => callback();
    window.addEventListener("elishama:new-action", handler);
    return () => window.removeEventListener("elishama:new-action", handler);
  }, [callback]);
}
