import type { ReactNode } from "react";
import {
  THEME_PREFERENCES,
  type ThemePreference,
} from "./theme";
import { Tooltip } from "./tooltip";

type ThemeToggleProps = {
  value: ThemePreference;
  onChange: (value: ThemePreference) => void;
  className?: string;
  labels?: ThemeToggleLabels;
};

export type ThemeToggleLabels = {
  group: string;
  options: Record<ThemePreference, string>;
};

type ThemeOption = {
  id: ThemePreference;
  icon: ReactNode;
};

const DEFAULT_THEME_TOGGLE_LABELS: ThemeToggleLabels = {
  group: "Theme",
  options: {
    system: "Use system theme",
    light: "Use light theme",
    dark: "Use dark theme",
  },
};

const OPTIONS: ThemeOption[] = [
  {
    id: "system",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="3.5" y="5" width="17" height="11.5" rx="2.5" />
        <path d="M8 19h8" />
        <path d="M10 16.5v2.5" />
        <path d="M14 16.5v2.5" />
      </svg>
    ),
  },
  {
    id: "light",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2.75v2.5" />
        <path d="M12 18.75v2.5" />
        <path d="M21.25 12h-2.5" />
        <path d="M5.25 12h-2.5" />
        <path d="M18.54 5.46l-1.77 1.77" />
        <path d="M7.23 16.77l-1.77 1.77" />
        <path d="M18.54 18.54l-1.77-1.77" />
        <path d="M7.23 7.23L5.46 5.46" />
      </svg>
    ),
  },
  {
    id: "dark",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M14.5 3.5a8 8 0 1 0 6 13.25A9 9 0 1 1 14.5 3.5Z" />
      </svg>
    ),
  },
];

export function ThemeToggle({
  value,
  onChange,
  className,
  labels = DEFAULT_THEME_TOGGLE_LABELS,
}: ThemeToggleProps) {
  return (
    <div
      className={["mc-theme-toggle", className].filter(Boolean).join(" ")}
      role="group"
      aria-label={labels.group}
    >
      {THEME_PREFERENCES.map((preference) => {
        const option = OPTIONS.find((entry) => entry.id === preference);
        if (!option) {
          return null;
        }

        const isActive = value === preference;
        const optionLabel = labels.options[preference];

        return (
          <Tooltip key={preference} content={optionLabel}>
            <button
              type="button"
              className={
                "mc-theme-toggle__button" + (isActive ? " is-active" : "")
              }
              aria-pressed={isActive}
              aria-label={optionLabel}
              onClick={() => onChange(preference)}
            >
              {option.icon}
            </button>
          </Tooltip>
        );
      })}
    </div>
  );
}
