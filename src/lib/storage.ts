// ============================================================
// ELISHAMA — Couche de stockage LocalStorage
// ============================================================
import type { AppData } from "./types";
import { defaultData, emptyData } from "./seed";

const STORAGE_KEY = "elishama:data";
// Version 3 : importe les données SQLite ELISHAMA au premier lancement.
// Version 2 : supprime l'onboarding et les données de démo.
const DATA_VERSION = 3;

export function loadData(): AppData {
  if (typeof window === "undefined") return emptyData();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    // Pas de données → état propre (le fetch initial se fera via fetchInitialData si nécessaire)
    if (!raw) {
      const fresh = emptyData();
      saveData(fresh);
      return fresh;
    }
    const parsed = JSON.parse(raw) as AppData;
    // Migration : si la version stockée est ancienne, on repart d'un état propre.
    const storedVersion = parsed?.settings?.version ?? 1;
    if (storedVersion < DATA_VERSION) {
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

/**
 * Vérifie si c'est le tout premier lancement (aucune donnée en localStorage).
 * Utilisé pour déclencher le fetch des données initiales importées.
 */
export function isFirstLaunch(): boolean {
  if (typeof window === "undefined") return false;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return true;
  try {
    const parsed = JSON.parse(raw) as AppData;
    // Si la version est ancienne ou pas d'historique, c'est un premier lancement
    return (parsed?.settings?.version ?? 1) < DATA_VERSION || !parsed?.history?.length;
  } catch {
    return true;
  }
}

/**
 * Charge les données initiales depuis /initial-data.json (données importées de la base SQLite).
 * Ne s'exécute qu'une seule fois au premier lancement (quand settings.initialized est false).
 */
export async function fetchInitialData(): Promise<AppData | null> {
  try {
    const res = await fetch("/initial-data.json");
    if (!res.ok) return null;
    const imported = (await res.json()) as AppData;
    if (!imported || !imported.settings) return null;
    // Marquer comme initialisé avec la version courante
    imported.settings.initialized = true;
    imported.settings.version = DATA_VERSION;
    return imported;
  } catch (e) {
    console.error("Erreur lors du chargement des données initiales:", e);
    return null;
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
