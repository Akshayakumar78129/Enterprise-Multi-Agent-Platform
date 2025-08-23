// apps/web/ui-common/hooks/useTheme.ts
import { create } from "zustand";

type ThemeState = { theme: "dark" | "light"; toggle: () => void; set: (t:"dark"|"light")=>void; };
export const useTheme = create<ThemeState>((set, get) => ({
  theme: (typeof window !== "undefined" && (localStorage.getItem("theme") as "dark"|"light")) || "dark",
  toggle: () => {
    const next = get().theme === "dark" ? "light" : "dark";
    localStorage.setItem("theme", next);
    document.documentElement.setAttribute("data-theme", next);
    set({ theme: next });
  },
  set: (t) => {
    localStorage.setItem("theme", t);
    document.documentElement.setAttribute("data-theme", t);
    set({ theme: t });
  }
}));
