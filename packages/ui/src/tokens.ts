export const colors = {
  ib: {
    50: "#f7f4ee",
    100: "#ede5d5",
    500: "#b86a26",
    700: "#7f4623",
    900: "#2b1d14",
  },
  primary: {
    50: "#eff6ff",
    500: "#3b82f6",
    600: "#2563eb",
    700: "#1d4ed8",
  },
  success: {
    50: "#ecfdf5",
    500: "#10b981",
    600: "#059669",
    700: "#047857",
  },
  warning: {
    50: "#fffbeb",
    500: "#f59e0b",
    600: "#d97706",
    700: "#b45309",
  },
  danger: {
    50: "#fef2f2",
    500: "#ef4444",
    600: "#dc2626",
    700: "#b91c1c",
  },
  neutral: {
    50: "#f9fafb",
    100: "#f3f4f6",
    500: "#6b7280",
    700: "#374151",
    900: "#111827",
  },
} as const;

export const spacing = {
  xs: "0.25rem",
  sm: "0.5rem",
  md: "1rem",
  lg: "1.5rem",
  xl: "2rem",
  "2xl": "3rem",
} as const;

export const radii = {
  sm: "0.25rem",
  md: "0.375rem",
  lg: "0.5rem",
  xl: "1rem",
  "2xl": "1.5rem",
  full: "9999px",
} as const;

export const shadows = {
  sm: "0 8px 24px rgba(15, 23, 42, 0.08)",
  md: "0 18px 40px rgba(15, 23, 42, 0.12)",
} as const;

export const typography = {
  display: "\"Space Grotesk\", \"Avenir Next\", sans-serif",
  body: "\"Avenir Next\", Avenir, \"Segoe UI\", sans-serif",
  mono: "\"SFMono-Regular\", Menlo, monospace",
} as const;
