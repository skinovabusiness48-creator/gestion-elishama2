// ============================================================
// ELISHAMA — Écran d'accueil / onboarding
// ============================================================
"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Flame, Sparkles, FileX2, ShieldCheck, HardDriveDownload, WifiOff } from "lucide-react";
import { useStore } from "@/lib/store";

export function Onboarding() {
  const { initializeEmpty, initializeDemo } = useStore();

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-primary/10 via-background to-accent/30">
      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-2xl">
          {/* Logo */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-primary text-primary-foreground shadow-lg shadow-primary/30 mb-4">
              <Flame className="h-10 w-10" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">ELISHAMA</h1>
            <p className="text-base text-muted-foreground mt-2">Gestion simple et efficace du restaurant</p>
          </div>

          {/* Cartes d'intro */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
            <Card className="border-border/60">
              <CardContent className="p-4 text-center">
                <HardDriveDownload className="h-6 w-6 mx-auto text-primary mb-2" />
                <p className="text-sm font-medium">Données locales</p>
                <p className="text-xs text-muted-foreground mt-1">Tout reste sur votre appareil</p>
              </CardContent>
            </Card>
            <Card className="border-border/60">
              <CardContent className="p-4 text-center">
                <WifiOff className="h-6 w-6 mx-auto text-primary mb-2" />
                <p className="text-sm font-medium">Hors ligne</p>
                <p className="text-xs text-muted-foreground mt-1">Fonctionne sans internet</p>
              </CardContent>
            </Card>
            <Card className="border-border/60">
              <CardContent className="p-4 text-center">
                <ShieldCheck className="h-6 w-6 mx-auto text-primary mb-2" />
                <p className="text-sm font-medium">Sans abonnement</p>
                <p className="text-xs text-muted-foreground mt-1">100% gratuit, à vie</p>
              </CardContent>
            </Card>
          </div>

          {/* Choix de démarrage */}
          <Card className="shadow-lg border-border/60">
            <CardContent className="p-6 sm:p-8">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">Bien démarrer</h2>
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                Choisissez comment vous souhaitez commencer. Vous pourrez tout modifier ou supprimer par la suite.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={initializeDemo}
                  className="group flex flex-col items-start gap-3 rounded-xl border-2 border-primary/30 bg-primary/5 p-5 text-left transition-all hover:border-primary hover:bg-primary/10 hover:shadow-md"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Données d'exemple</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Quelques produits, catégories, tables, ventes et dépenses pour découvrir l'application.
                    </p>
                  </div>
                  <span className="text-sm font-medium text-primary group-hover:underline">Commencer →</span>
                </button>

                <button
                  onClick={initializeEmpty}
                  className="group flex flex-col items-start gap-3 rounded-xl border-2 border-border bg-card p-5 text-left transition-all hover:border-primary/50 hover:shadow-md"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-muted text-foreground">
                    <FileX2 className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Application vide</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Démarrez de zéro et configurez votre restaurant selon vos besoins.
                    </p>
                  </div>
                  <span className="text-sm font-medium text-foreground group-hover:underline">Commencer →</span>
                </button>
              </div>
            </CardContent>
          </Card>

          <p className="text-center text-xs text-muted-foreground mt-6">
            Astuce : pensez à exporter régulièrement vos données depuis les Paramètres.
          </p>
        </div>
      </div>
    </div>
  );
}
