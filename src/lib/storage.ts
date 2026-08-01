// ============================================================
// ELISHAMA — Couche de stockage LocalStorage
// ============================================================
import type { AppData } from "./types";
import { defaultData, emptyData } from "./seed";

const STORAGE_KEY = "elishama:data";
// Version 2 : supprime l'onboarding et les données de démo.
// Toute donnée antérieure (version < 2) est réinitialisée vers un état propre.
const DATA_VERSION = 2;

export function loadData(): AppData {
  if (typeof window === "undefined") return emptyData();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    // Pas de données → état propre fonctionnel (sans onboarding, sans démo)
    if (!raw) {
      const fresh = emptyData();
      saveData(fresh);
      return fresh;
    }
    const parsed = JSON.parse(raw) as AppData;
    // Migration : si la version stockée est ancienne (données de test/démo),
    // on repart d'un état propre. Les vraies données utilisateur (version >= 2) sont conservées.
    const storedVersion = parsed?.settings?.version ?? 1;
    if (storedVersion < DATA_VERSION || !parsed?.settings?.initialized) {
      const fresh = emptyData();
      saveData(fresh);
      return fresh;
    }
    // Garde-fou : s'assurer que toutes les collections existent
    const base = emptyData();
    const merged: AppData = {
      ...base,
      ...parsed,
      settings: {
        ...base.settings,
        ...(parsed.settings || {}),
        restaurant: {
          ...base.settings.restaurant,
          ...(parsed.settings?.restaurant || {}),
        },
        usage: {
          ...base.settings.usage,
          ...(parsed.settings?.usage || {}),
        },
      },
    };
    return merged;
  } catch (e) {
    console.error("Erreur de chargement des données:", e);
    const fresh = emptyData();
    saveData(fresh);
    return fresh;
  }
}

export function saveData(data: AppData): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error("Erreur de sauvegarde des données:", e);
  }
}

export function clearData(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}

export function exportData(data: AppData): void {
  const dateStr = new Date().toISOString().slice(0, 10);
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `elishama-backup-${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function importDataFromFile(file: File): Promise<AppData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string) as AppData;
        if (!parsed || typeof parsed !== "object") {
          reject(new Error("Fichier invalide"));
          return;
        }
        const base = defaultData();
        const merged: AppData = {
          ...base,
          ...parsed,
          settings: {
            ...base.settings,
            ...(parsed.settings || {}),
            restaurant: {
              ...base.settings.restaurant,
              ...(parsed.settings?.restaurant || {}),
            },
            usage: {
              ...base.settings.usage,
              ...(parsed.settings?.usage || {}),
            },
          },
        };
        resolve(merged);
      } catch (e) {
        reject(e);
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

export { STORAGE_KEY, DATA_VERSION };
