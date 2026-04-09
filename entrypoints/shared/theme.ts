export const THEME_PREFERENCES = ["system", "light", "dark"] as const;

export type ThemePreference = (typeof THEME_PREFERENCES)[number];
export type ResolvedTheme = Exclude<ThemePreference, "system">;

const SYSTEM_THEME_MEDIA_QUERY = "(prefers-color-scheme: dark)";

export function getSystemPrefersDark(): boolean {
  if (typeof window === "undefined" || !("matchMedia" in window)) {
    return false;
  }

  return window.matchMedia(SYSTEM_THEME_MEDIA_QUERY).matches;
}

export function resolveThemePreference(
  preference: ThemePreference,
  systemPrefersDark: boolean
): ResolvedTheme {
  if (preference === "system") {
    return systemPrefersDark ? "dark" : "light";
  }

  return preference;
}

export function applyThemePreference(
  target: HTMLElement,
  preference: ThemePreference,
  systemPrefersDark = getSystemPrefersDark()
): ResolvedTheme {
  const resolvedTheme = resolveThemePreference(preference, systemPrefersDark);

  target.dataset.theme = resolvedTheme;
  target.dataset.themePreference = preference;
  target.style.colorScheme = resolvedTheme;

  return resolvedTheme;
}

export function observeSystemThemePreference(
  listener: (systemPrefersDark: boolean) => void
): () => void {
  if (typeof window === "undefined" || !("matchMedia" in window)) {
    return () => undefined;
  }

  const mediaQuery = window.matchMedia(SYSTEM_THEME_MEDIA_QUERY);
  const handleChange = (event: MediaQueryListEvent) => {
    listener(event.matches);
  };

  mediaQuery.addEventListener("change", handleChange);

  return () => {
    mediaQuery.removeEventListener("change", handleChange);
  };
}
