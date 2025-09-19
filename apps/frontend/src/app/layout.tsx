// apps/frontend/src/app/layout.tsx
import type { Metadata } from "next";
import "components/src/styles.css";
import "./globals.css";
import { ThemeProvider } from "components/index";
import ReduxProvider from "./providers/ReduxProvider";

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
    <html lang="en" data-theme="soft-pastel" className="theme-soft-pastel" suppressHydrationWarning>
      <body className="bg-background text-foreground font-sans antialiased min-h-screen" data-theme="soft-pastel">
        <ReduxProvider>
          <ThemeProvider defaultTheme="soft-pastel">
            {children}
          </ThemeProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}
