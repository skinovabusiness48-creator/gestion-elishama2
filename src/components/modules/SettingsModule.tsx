// ============================================================
// ELISHAMA — Module : Paramètres
// ============================================================
"use client";

import React, { useMemo, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { PageHeader, ConfirmDialog } from "@/components/shared";
import {
  Settings,
  Store,
  SlidersHorizontal,
  Database,
  Download,
  Upload,
  RotateCcw,
  Save,
  Image as ImageIcon,
  Trash2,
  Info,
  Package,
  Receipt,
  Ticket as TicketIcon,
  Wallet,
  HardDrive,
  ShieldCheck,
  WifiOff,
  HeartPulse,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { exportData, importDataFromFile } from "@/lib/storage";
import type { Settings as SettingsType, AppData } from "@/lib/types";

const APP_VERSION = "1.0.0";
const DATE_FORMATS = ["DD/MM/YYYY", "YYYY-MM-DD", "DD/MM/YYYY HH:mm", "HH:mm"];

export function SettingsModule() {
  const { data, updateSettings, importData, resetAll } = useStore();

  // ---------- Local form state (Restaurant tab) ----------
  const [rName, setRName] = useState(data.settings.restaurant.name);
  const [rLogo, setRLogo] = useState(data.settings.restaurant.logo);
  const [rPhone, setRPhone] = useState(data.settings.restaurant.phone);
  const [rAddress, setRAddress] = useState(data.settings.restaurant.address);
  const [rCurrency, setRCurrency] = useState(data.settings.restaurant.currency);
  const [rTicketMessage, setRTicketMessage] = useState(
    data.settings.restaurant.ticketMessage,
  );

  // ---------- Local form state (Usage tab) ----------
  const [uCurrency, setUCurrency] = useState(data.settings.usage.currency);
  const [uDateFormat, setUDateFormat] = useState(data.settings.usage.dateFormat);
  const [uTicketPrefix, setUTicketPrefix] = useState(
    data.settings.usage.ticketPrefix,
  );
  const [uTicketNumber, setUTicketNumber] = useState(
    String(data.settings.usage.ticketNumber),
  );
  const [uStockThreshold, setUStockThreshold] = useState(
    String(data.settings.usage.stockAlertThreshold),
  );

  // ---------- Backup / import state ----------
  const fileInputRef = useRef<HTMLInputElement>(null);
  const restoreInputRef = useRef<HTMLInputElement>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [confirmImport, setConfirmImport] = useState(false);

  const [confirmReset1, setConfirmReset1] = useState(false);
  const [confirmReset2, setConfirmReset2] = useState(false);

  // ---------- Derived: data size + counts ----------
  const dataInfo = useMemo(() => {
    const json = JSON.stringify(data);
    const sizeBytes = new Blob([json]).size;
    const sizeKo = sizeBytes / 1024;
    return {
      products: data.products.length,
      sales: data.sales.length,
      tickets: data.tickets.length,
      expenses: data.expenses.length,
      sizeKo: sizeKo < 1024 ? sizeKo.toFixed(1) : (sizeKo / 1024).toFixed(2),
      unit: sizeKo < 1024 ? "Ko" : "Mo",
    };
  }, [data]);

  // ---------- Logo upload ----------
  function onLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1024 * 1024) {
      toast.error("Le logo ne doit pas dépasser 1 Mo");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setRLogo(reader.result as string);
      toast.success("Logo chargé (penser à Enregistrer)");
    };
    reader.onerror = () => toast.error("Erreur lors du chargement du logo");
    reader.readAsDataURL(file);
  }

  // ---------- Save handlers ----------
  function saveRestaurant() {
    const newSettings: SettingsType = {
      ...data.settings,
      restaurant: {
        name: rName.trim() || "ELISHAMA",
        logo: rLogo,
        phone: rPhone.trim(),
        address: rAddress.trim(),
        currency: rCurrency.trim() || "FCFA",
        ticketMessage: rTicketMessage.trim(),
      },
      usage: {
        ...data.settings.usage,
        currency: rCurrency.trim() || "FCFA",
      },
    };
    updateSettings(newSettings);
    setUCurrency(newSettings.usage.currency);
    toast.success("✅ Paramètres du restaurant enregistrés");
  }

  function saveUsage() {
    const ticketNumber = parseInt(uTicketNumber, 10);
    const stockThreshold = parseInt(uStockThreshold, 10);
    if (!Number.isFinite(ticketNumber) || ticketNumber < 0) {
      toast.error("Numéro de ticket invalide");
      return;
    }
    if (!Number.isFinite(stockThreshold) || stockThreshold < 0) {
      toast.error("Seuil d'alerte invalide");
      return;
    }
    const newSettings: SettingsType = {
      ...data.settings,
      restaurant: {
        ...data.settings.restaurant,
        currency: uCurrency.trim() || "FCFA",
      },
      usage: {
        currency: uCurrency.trim() || "FCFA",
        dateFormat: uDateFormat,
        ticketPrefix: uTicketPrefix.trim() || "TICKET-",
        ticketNumber,
        stockAlertThreshold: stockThreshold,
      },
    };
    updateSettings(newSettings);
    setRCurrency(newSettings.restaurant.currency);
    toast.success("✅ Paramètres d'utilisation enregistrés");
  }

  // ---------- Export ----------
  function handleExport() {
    exportData(data);
    toast.success("✅ Données exportées");
  }

  // ---------- Import ----------
  function triggerImport(which: "import" | "restore") {
    const ref = which === "import" ? fileInputRef : restoreInputRef;
    ref.current?.click();
  }

  function onFilePicked(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingFile(file);
    setConfirmImport(true);
    e.target.value = "";
  }

  async function doImport() {
    if (!pendingFile) return;
    try {
      const parsed: AppData = await importDataFromFile(pendingFile);
      importData(parsed);
      toast.success("✅ Données importées avec succès");
    } catch (err) {
      console.error(err);
      toast.error("Erreur : fichier invalide ou corrompu");
    } finally {
      setPendingFile(null);
    }
  }

  // ---------- Reset ----------
  function handleReset() {
    resetAll();
    // Reset local form state to defaults
    setRName("ELISHAMA");
    setRLogo("");
    setRPhone("");
    setRAddress("");
    setRCurrency("FCFA");
    setRTicketMessage("Merci de votre visite !");
    setUCurrency("FCFA");
    setUDateFormat("DD/MM/YYYY");
    setUTicketPrefix("TICKET-");
    setUTicketNumber("1");
    setUStockThreshold("5");
    toast.success("Application réinitialisée");
  }

  return (
    <div className="print-area">
      <PageHeader
        title="Paramètres"
        subtitle="Personnalisez l'application et gérez vos données"
        icon={Settings}
      />

      <Tabs defaultValue="restaurant">
        <TabsList className="mb-4 no-print">
          <TabsTrigger value="restaurant" className="gap-1.5">
            <Store className="h-4 w-4" /> Restaurant
          </TabsTrigger>
          <TabsTrigger value="usage" className="gap-1.5">
            <SlidersHorizontal className="h-4 w-4" /> Utilisation
          </TabsTrigger>
          <TabsTrigger value="backup" className="gap-1.5">
            <Database className="h-4 w-4" /> Sauvegarde
          </TabsTrigger>
        </TabsList>

        {/* ============ Restaurant ============ */}
        <TabsContent value="restaurant">
          <Card className="border-border/60 max-w-2xl">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Store className="h-4 w-4 text-primary" /> Informations du restaurant
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              {/* Logo */}
              <div className="grid gap-2">
                <Label>Logo</Label>
                <div className="flex items-center gap-4">
                  <div className="h-20 w-20 rounded-lg border-2 border-dashed border-input flex items-center justify-center overflow-hidden bg-muted/40 shrink-0">
                    {rLogo ? (
                      <img
                        src={rLogo}
                        alt="Logo"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <ImageIcon className="h-8 w-8 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-2 w-fit"
                      onClick={() =>
                        document.getElementById("logo-upload")?.click()
                      }
                    >
                      <Upload className="h-4 w-4" /> Choisir un logo
                    </Button>
                    {rLogo && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="gap-2 w-fit text-destructive"
                        onClick={() => setRLogo("")}
                      >
                        <Trash2 className="h-4 w-4" /> Retirer
                      </Button>
                    )}
                    <input
                      id="logo-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={onLogoChange}
                    />
                    <p className="text-xs text-muted-foreground">
                      PNG, JPG. Max 1 Mo. Carré recommandé.
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="grid gap-2">
                <Label htmlFor="r-name">Nom du restaurant</Label>
                <Input
                  id="r-name"
                  value={rName}
                  onChange={(e) => setRName(e.target.value)}
                  placeholder="ELISHAMA"
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="r-phone">Téléphone</Label>
                  <Input
                    id="r-phone"
                    value={rPhone}
                    onChange={(e) => setRPhone(e.target.value)}
                    placeholder="+225 ..."
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="r-currency">Devise</Label>
                  <Input
                    id="r-currency"
                    value={rCurrency}
                    onChange={(e) => setRCurrency(e.target.value)}
                    placeholder="FCFA"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="r-address">Adresse</Label>
                <Textarea
                  id="r-address"
                  value={rAddress}
                  onChange={(e) => setRAddress(e.target.value)}
                  placeholder="Adresse complète du restaurant"
                  rows={2}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="r-msg">Message du ticket</Label>
                <Textarea
                  id="r-msg"
                  value={rTicketMessage}
                  onChange={(e) => setRTicketMessage(e.target.value)}
                  placeholder="Merci de votre visite !"
                  rows={2}
                />
              </div>
              <div className="flex justify-end">
                <Button onClick={saveRestaurant} className="gap-2">
                  <Save className="h-4 w-4" /> Enregistrer
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============ Utilisation ============ */}
        <TabsContent value="usage">
          <Card className="border-border/60 max-w-2xl">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-primary" /> Préférences
                d'utilisation
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="u-currency">Devise</Label>
                  <Input
                    id="u-currency"
                    value={uCurrency}
                    onChange={(e) => setUCurrency(e.target.value)}
                    placeholder="FCFA"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="u-date">Format de date</Label>
                  <Select value={uDateFormat} onValueChange={setUDateFormat}>
                    <SelectTrigger id="u-date" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DATE_FORMATS.map((f) => (
                        <SelectItem key={f} value={f}>
                          {f}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="u-prefix">Préfixe des tickets</Label>
                  <Input
                    id="u-prefix"
                    value={uTicketPrefix}
                    onChange={(e) => setUTicketPrefix(e.target.value)}
                    placeholder="TICKET-"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="u-num">Numéro de ticket actuel</Label>
                  <Input
                    id="u-num"
                    type="number"
                    min="0"
                    value={uTicketNumber}
                    onChange={(e) => setUTicketNumber(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="u-threshold">Seuil d'alerte stock global</Label>
                <Input
                  id="u-threshold"
                  type="number"
                  min="0"
                  value={uStockThreshold}
                  onChange={(e) => setUStockThreshold(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Les produits dont le stock est inférieur ou égal à ce seuil seront
                  signalés en alerte (par défaut).
                </p>
              </div>
              <div className="flex justify-end">
                <Button onClick={saveUsage} className="gap-2">
                  <Save className="h-4 w-4" /> Enregistrer
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============ Sauvegarde ============ */}
        <TabsContent value="backup">
          <div className="grid gap-4">
            {/* Data info */}
            <Card className="border-border/60">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <HardDrive className="h-4 w-4 text-primary" /> Données actuelles
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  <div className="p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Package className="h-3.5 w-3.5" /> Produits
                    </div>
                    <p className="text-lg font-bold mt-1">{dataInfo.products}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Receipt className="h-3.5 w-3.5" /> Ventes
                    </div>
                    <p className="text-lg font-bold mt-1">{dataInfo.sales}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <TicketIcon className="h-3.5 w-3.5" /> Tickets
                    </div>
                    <p className="text-lg font-bold mt-1">{dataInfo.tickets}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Wallet className="h-3.5 w-3.5" /> Dépenses
                    </div>
                    <p className="text-lg font-bold mt-1">{dataInfo.expenses}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <HardDrive className="h-3.5 w-3.5" /> Taille
                    </div>
                    <p className="text-lg font-bold mt-1">
                      {dataInfo.sizeKo} {dataInfo.unit}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Export / Backup */}
            <Card className="border-border/60">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Download className="h-4 w-4 text-emerald-600" /> Exporter / Sauvegarder
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3">
                <p className="text-sm text-muted-foreground">
                  Téléchargez l'ensemble de vos données dans un fichier JSON. Conservez-le
                  dans un endroit sûr (clé USB, cloud, email).
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button onClick={handleExport} className="gap-2">
                    <Download className="h-4 w-4" /> Exporter les données
                  </Button>
                  <Button variant="outline" onClick={handleExport} className="gap-2">
                    <Database className="h-4 w-4" /> Créer une sauvegarde
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Import / Restore */}
            <Card className="border-border/60">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Upload className="h-4 w-4 text-blue-600" /> Importer / Restaurer
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3">
                <p className="text-sm text-muted-foreground">
                  Restaurez vos données à partir d'un fichier de sauvegarde JSON. Les
                  données actuelles seront <strong>remplacées</strong>.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    onClick={() => triggerImport("import")}
                    className="gap-2"
                  >
                    <Upload className="h-4 w-4" /> Importer une sauvegarde
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => triggerImport("restore")}
                    className="gap-2"
                  >
                    <RotateCcw className="h-4 w-4" /> Restaurer
                  </Button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/json,.json"
                  className="hidden"
                  onChange={onFilePicked}
                />
                <input
                  ref={restoreInputRef}
                  type="file"
                  accept="application/json,.json"
                  className="hidden"
                  onChange={onFilePicked}
                />
              </CardContent>
            </Card>

            {/* Reset (destructive) */}
            <Card className="border-destructive/30 bg-destructive/5">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2 text-destructive">
                  <Trash2 className="h-4 w-4" /> Zone dangereuse
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3">
                <p className="text-sm text-muted-foreground">
                  La réinitialisation supprime <strong>toutes</strong> les données
                  (produits, ventes, tickets, dépenses, paramètres) et remet l'application
                  à son état initial. Cette action est <strong>irréversible</strong>.
                </p>
                <div>
                  <Button
                    variant="destructive"
                    onClick={() => setConfirmReset1(true)}
                    className="gap-2"
                  >
                    <Trash2 className="h-4 w-4" /> Réinitialiser l'application
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* About */}
      <Card className="border-border/60 mt-6">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <Info className="h-6 w-6" />
              </div>
              <div>
                <p className="font-bold text-base">
                  {data.settings.restaurant.name || "ELISHAMA"} — Gestion
                </p>
                <p className="text-xs text-muted-foreground">
                  Version {APP_VERSION} • {data.settings.version && `données v${data.settings.version}`}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="gap-1">
                <WifiOff className="h-3 w-3" /> 100% hors ligne
              </Badge>
              <Badge variant="secondary" className="gap-1">
                <ShieldCheck className="h-3 w-3" /> Sans abonnement
              </Badge>
              <Badge variant="secondary" className="gap-1">
                <HeartPulse className="h-3 w-3" /> Données locales
              </Badge>
            </div>
          </div>
          <Separator className="my-4" />
          <p className="text-xs text-muted-foreground">
            Toutes vos données restent stockées localement dans votre navigateur
            (LocalStorage). Aucune information n'est envoyée vers Internet. Pensez à
            exporter régulièrement une sauvegarde pour ne jamais perdre vos données.
          </p>
        </CardContent>
      </Card>

      {/* Confirm import */}
      <ConfirmDialog
        open={confirmImport}
        onOpenChange={setConfirmImport}
        title="Importer ce fichier ?"
        description="Cette opération va remplacer les données actuelles par le contenu du fichier sélectionné. Continuer ?"
        confirmLabel="Importer et remplacer"
        cancelLabel="Annuler"
        destructive
        onConfirm={doImport}
      />

      {/* Reset confirmation - step 1 */}
      <ConfirmDialog
        open={confirmReset1}
        onOpenChange={setConfirmReset1}
        title="⚠️ ATTENTION"
        description="Cette action va supprimer TOUTES les données et réinitialiser l'application. Cette action est IRRÉVERSIBLE. Continuer ?"
        confirmLabel="Continuer"
        cancelLabel="Annuler"
        destructive
        onConfirm={() => {
          setConfirmReset1(false);
          setConfirmReset2(true);
        }}
      />

      {/* Reset confirmation - step 2 */}
      <ConfirmDialog
        open={confirmReset2}
        onOpenChange={setConfirmReset2}
        title="⚠️ Confirmation définitive"
        description="Dernière confirmation : toutes les données seront définitivement effacées. Êtes-vous absolument sûr ?"
        confirmLabel="Oui, tout supprimer"
        cancelLabel="Non, garder mes données"
        destructive
        onConfirm={handleReset}
      />
    </div>
  );
}
