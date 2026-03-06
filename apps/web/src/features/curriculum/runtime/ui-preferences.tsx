"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type UiTheme = "light" | "dark" | "system";
export type UiDensity = "comfortable" | "compact";

interface UiPreferencesValue {
  theme: UiTheme;
  resolvedTheme: "light" | "dark";
  density: UiDensity;
  setTheme: (value: UiTheme) => void;
  setDensity: (value: UiDensity) => void;
}

const THEME_KEY = "k12.ui.theme";
const DENSITY_KEY = "k12.ui.density";

const UiPreferencesContext = createContext<UiPreferencesValue>({
  theme: "system",
  resolvedTheme: "light",
  density: "comfortable",
  setTheme: () => {},
  setDensity: () => {},
});

function readStoredPreference<T extends string>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  const stored = window.localStorage.getItem(key);
  return (stored as T) || fallback;
}

function resolveSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function UiPreferencesProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<UiTheme>(() =>
    readStoredPreference<UiTheme>(THEME_KEY, "system"),
  );
  const [density, setDensity] = useState<UiDensity>(() =>
    readStoredPreference<UiDensity>(DENSITY_KEY, "comfortable"),
  );
  const [systemTheme, setSystemTheme] = useState<"light" | "dark">(() => resolveSystemTheme());

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => setSystemTheme(media.matches ? "dark" : "light");
    handler();
    media.addEventListener("change", handler);
    return () => media.removeEventListener("change", handler);
  }, []);

  const resolvedTheme = theme === "system" ? systemTheme : theme;

  useEffect(() => {
    if (typeof document === "undefined") return;

    document.documentElement.dataset.theme = resolvedTheme;
    document.documentElement.dataset.density = density;
    window.localStorage.setItem(THEME_KEY, theme);
    window.localStorage.setItem(DENSITY_KEY, density);
  }, [density, resolvedTheme, theme]);

  const value = useMemo<UiPreferencesValue>(
    () => ({
      theme,
      resolvedTheme,
      density,
      setTheme,
      setDensity,
    }),
    [density, resolvedTheme, theme],
  );

  return <UiPreferencesContext.Provider value={value}>{children}</UiPreferencesContext.Provider>;
}

export function useUiPreferences() {
  return useContext(UiPreferencesContext);
}
