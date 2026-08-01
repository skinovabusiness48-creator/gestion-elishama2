import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ELISHAMA — Gestion du restaurant",
  description: "Gestion simple et efficace du restaurant : ventes, stock, tickets, caisse, dépenses et rapports. 100% local et hors ligne.",
  keywords: ["restaurant", "gestion", "ventes", "stock", "caisse", "ELISHAMA", "maquis"],
  authors: [{ name: "ELISHAMA" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "ELISHAMA — Gestion",
    description: "Gestion simple et efficace du restaurant",
    type: "website",
  },
};

// Script anti-flash : applique la classe .dark avant l'hydration si nécessaire
const themeScript = `
(function() {
  try {
    var t = localStorage.getItem('elishama-theme');
    var m = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (t === 'dark' || (!t && m)) document.documentElement.classList.add('dark');
  } catch(e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          storageKey="elishama-theme"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
          <SonnerToaster richColors position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
