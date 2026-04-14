import type { AnchorHTMLAttributes, ReactNode } from "react";
import { useT } from "./i18n";
import {
  CAPTION_ARC_GITHUB_URL,
  getPrivacyPolicyPageUrl,
  getTermsOfServicePageUrl,
} from "./legal";
import { GithubIcon } from "./icons";
import { Tooltip } from "./tooltip";

type ExtensionPageLinkProps = Omit<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  "children" | "href"
> & {
  href: string;
  icon?: ReactNode;
  label: string;
  variant?: "default" | "soft" | "accent";
  size?: "sm" | "md";
  showLabel?: boolean;
};

const LINK_VARIANT_CLASSNAMES = {
  default:
    "border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-text-muted)] hover:text-[var(--app-text)]",
  soft:
    "border-[var(--app-border)] bg-[var(--app-surface-soft)] text-[var(--app-text-muted)] hover:bg-[var(--app-surface-strong)] hover:text-[var(--app-text)]",
  accent:
    "border-[var(--app-accent-border)] bg-[var(--app-accent-soft)] text-[var(--app-accent)] hover:bg-[var(--app-surface-strong)]",
} as const;

const LINK_SIZE_CLASSNAMES = {
  sm: "h-10 min-w-10 px-3",
  md: "h-10 min-w-10 px-3.5",
} as const;

export function ExtensionPageLink({
  href,
  icon,
  label,
  variant = "default",
  size = "md",
  showLabel = true,
  className = "",
  target = "_blank",
  rel = "noreferrer noopener",
  ...props
}: ExtensionPageLinkProps) {
  return (
    <Tooltip content={label}>
      <a
        href={href}
        target={target}
        rel={rel}
        aria-label={label}
        className={[
          "inline-flex items-center justify-center gap-2 rounded-full border outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--app-accent-border)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
          LINK_VARIANT_CLASSNAMES[variant],
          LINK_SIZE_CLASSNAMES[size],
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        {...props}
      >
        {icon ? (
          <span className="h-4 w-4 [&>svg]:h-4 [&>svg]:w-4">{icon}</span>
        ) : null}
        {showLabel ? (
          <span className="text-sm font-medium">{label}</span>
        ) : null}
      </a>
    </Tooltip>
  );
}

type GitHubHeaderLinkProps = {
  variant?: "default" | "soft" | "accent";
  size?: "sm" | "md";
  compact?: boolean;
  className?: string;
};

export function GitHubHeaderLink({
  variant = "soft",
  size = "md",
  compact = true,
  className,
}: GitHubHeaderLinkProps) {
  const t = useT();

  return (
    <ExtensionPageLink
      href={CAPTION_ARC_GITHUB_URL}
      icon={<GithubIcon />}
      label={t("common.links.github")}
      variant={variant}
      size={size}
      showLabel={!compact}
      className={compact ? `w-10 px-0 ${className || ""}`.trim() : className}
    />
  );
}

type LegalFooterProps = {
  className?: string;
  version: string;
  accessory?: ReactNode;
  compact?: boolean;
};

export function LegalFooter({
  className,
  version,
  accessory,
  compact = false,
}: LegalFooterProps) {
  const t = useT();
  const currentYear = new Date().getFullYear();
  const privacyPolicyUrl = getPrivacyPolicyPageUrl();

  return (
    <footer
      className={[
        "border-t border-[color:color-mix(in_srgb,var(--app-border)_86%,transparent)] pt-4 text-xs text-[var(--app-text-faint)]",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div
        className={[
          "flex gap-3",
          compact
            ? "flex-col"
            : "flex-col sm:flex-row sm:items-center sm:justify-between",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <div className={compact ? "space-y-2" : "space-y-2"}>
          <div
            className={[
              "flex flex-wrap items-center gap-x-3 gap-y-1.5",
              compact && accessory ? "justify-between" : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <span>{t("common.legal.copyright", { year: currentYear })}</span>
            {compact && accessory ? <div className="shrink-0">{accessory}</div> : null}
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <a
              href={privacyPolicyUrl}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-[var(--app-accent)] underline-offset-4 hover:underline"
            >
              {t("common.links.privacyPolicy")}
            </a>
            <span>{t("common.legal.version", { version })}</span>
          </div>
        </div>
        {!compact && accessory ? <div className="shrink-0">{accessory}</div> : null}
      </div>
    </footer>
  );
}

export function TermsAcceptanceLinks() {
  const t = useT();
  const termsPageUrl = getTermsOfServicePageUrl({ mode: "view" });
  const privacyPolicyUrl = getPrivacyPolicyPageUrl();

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
      <a
        href={termsPageUrl}
        target="_blank"
        rel="noreferrer"
        className="font-medium text-[var(--app-accent)] underline-offset-4 hover:underline"
      >
        {t("common.links.termsOfService")}
      </a>
      <a
        href={privacyPolicyUrl}
        target="_blank"
        rel="noreferrer"
        className="font-medium text-[var(--app-accent)] underline-offset-4 hover:underline"
      >
        {t("common.links.privacyPolicy")}
      </a>
    </div>
  );
}
