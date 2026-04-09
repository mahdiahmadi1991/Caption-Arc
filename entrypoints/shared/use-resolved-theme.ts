import { useEffect, useState } from "react";
import {
  applyThemePreference,
  getSystemPrefersDark,
  resolveThemePreference,
  observeSystemThemePreference,
  type ResolvedTheme,
  type ThemePreference,
} from "./theme";

export function useResolvedTheme(preference: ThemePreference): ResolvedTheme {
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() =>
    resolveThemePreference(preference, getSystemPrefersDark())
  );

  useEffect(() => {
    const applyToDocument = (systemPrefersDark: boolean) => {
      const nextTheme = applyThemePreference(
        document.documentElement,
        preference,
        systemPrefersDark
      );
      setResolvedTheme(nextTheme);
    };

    applyToDocument(getSystemPrefersDark());

    return observeSystemThemePreference((systemPrefersDark) => {
      applyToDocument(systemPrefersDark);
    });
  }, [preference]);

  return resolvedTheme;
}
