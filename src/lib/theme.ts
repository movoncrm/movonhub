export type MicrositeTheme = "light" | "dark";

/** Cookie for the per-visitor microsite theme preference. */
export const THEME_COOKIE = "mh_theme";

export function normaliseTheme(value: unknown, fallback: MicrositeTheme = "light"): MicrositeTheme {
  return value === "dark" || value === "light" ? value : fallback;
}
