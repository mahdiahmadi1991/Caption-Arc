import { useEffect, useState } from "react";
import {
  applyThemePreference,
  getSystemPrefersDark,
  resolveThemePreference,
  observeSystemThemePreference,
  type ResolvedTheme,
  type ThemePreference,
} from "./theme";

type UseResolvedThemeOptions = {
  deferDocumentApply?: boolean;
};

function readDocumentResolvedTheme(): ResolvedTheme | null {
  if (typeof document === "undefined") {
    return null;
  }

  const currentTheme = document.documentElement.dataset.theme;
  return currentTheme === "light" || currentTheme === "dark"
    ? currentTheme
    : null;
}

export function useResolvedTheme(
  preference: ThemePreference,
  options: UseResolvedThemeOptions = {}
): ResolvedTheme {
  const { deferDocumentApply = false } = options;
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() => {
    const documentTheme = readDocumentResolvedTheme();
    return (
      documentTheme ??
      resolveThemePreference(preference, getSystemPrefersDark())
    );
  });

  useEffect(() => {
    if (deferDocumentApply) {
      const documentTheme = readDocumentResolvedTheme();
      if (documentTheme) {
        setResolvedTheme(documentTheme);
        return;
      }

      setResolvedTheme(resolveThemePreference(preference, getSystemPrefersDark()));
      return;
    }

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
  }, [deferDocumentApply, preference]);

  return resolvedTheme;
}
