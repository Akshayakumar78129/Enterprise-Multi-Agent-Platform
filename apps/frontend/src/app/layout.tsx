// apps/frontend/src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
// Import shared component styles (glass-card, neo effects)
import "components/src/styles.css";
import { ThemeProvider } from "components/index";

export const metadata: Metadata = {
  title: "Enterprise Dashboards",
  description: "Multi-dashboard enterprise analytics platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-background text-foreground font-sans antialiased min-h-screen">
        <ThemeProvider defaultTheme="soft-pastel">
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
