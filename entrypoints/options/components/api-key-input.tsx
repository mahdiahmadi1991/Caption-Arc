import { useId, useState } from "react";
import { EyeIcon, EyeOffIcon, OpenIcon } from "../../shared/icons";
import { HelpPopover } from "../../shared/help-popover";
import { useT } from "../../shared/i18n";
import { Tooltip } from "../../shared/tooltip";

type ApiKeyInputProps = {
  value: string;
  onChange: (value: string) => void;
  helpMarkdown?: string;
};

export function ApiKeyInput({ value, onChange, helpMarkdown }: ApiKeyInputProps) {
  const t = useT();
  const [showKey, setShowKey] = useState(false);
  const hintId = useId();

  return (
    <div className="rounded-[1.7rem] border border-[var(--app-border)] bg-[var(--app-surface)] p-4 shadow-[0_14px_30px_var(--app-shadow)] backdrop-blur-xl sm:p-5">
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="pointer-events-none flex items-center gap-2">
          <label className="pointer-events-auto block text-sm font-medium text-[var(--app-text)]">
            {t("options.openAiService.apiKeyInput.label")}
            <span className="ms-2 font-normal text-[var(--app-text-faint)]">
              ({t("options.openAiService.apiKeyInput.provider")})
            </span>
          </label>
          {helpMarkdown ? (
            <HelpPopover
              label={t("options.openAiService.apiKeyInput.label")}
              markdown={helpMarkdown}
            />
          ) : null}
        </div>
        <span className="inline-flex w-fit items-center rounded-full border border-[var(--app-accent-border)] bg-[var(--app-accent-soft)] px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.12em] text-[var(--app-accent)]">
          {t("options.openAiService.apiKeyInput.storedLocally")}
        </span>
      </div>

      <div className="rounded-[1.45rem] border border-[var(--app-border)] bg-[var(--app-bg-elevated)] p-2 transition-colors focus-within:border-[var(--app-accent)] focus-within:bg-[var(--app-surface-strong)]">
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1 rounded-[1rem] px-2">
            <div className="mb-1 text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--app-text-faint)]">
              {t("options.openAiService.apiKeyInput.credential")}
            </div>
            <textarea
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="sk-proj-..."
              spellCheck={false}
              autoCapitalize="none"
              autoCorrect="off"
              rows={2}
              dir="ltr"
              aria-describedby={hintId}
              className={`w-full resize-none border-0 bg-transparent px-0 py-1.5 font-mono text-[13px] text-[var(--app-text)] outline-none placeholder:font-sans placeholder:text-[var(--app-text-faint)] ${
                showKey
                  ? "break-all [field-sizing:content]"
                  : "[text-security:disc] [-webkit-text-security:disc]"
              }`}
            />
          </div>
          <Tooltip
            content={
              showKey
                ? t("options.openAiService.apiKeyInput.hide")
                : t("options.openAiService.apiKeyInput.show")
            }
          >
            <button
              type="button"
              onClick={() => setShowKey((current) => !current)}
              aria-label={
                showKey
                  ? t("options.openAiService.apiKeyInput.hide")
                  : t("options.openAiService.apiKeyInput.show")
              }
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[1rem] border border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-text-muted)] transition-colors hover:bg-[var(--app-surface-strong)] hover:text-[var(--app-text)] focus-visible:ring-2 focus-visible:ring-[var(--app-accent-border)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
            >
              {showKey ? (
                <EyeOffIcon className="h-4 w-4" />
              ) : (
                <EyeIcon className="h-4 w-4" />
              )}
            </button>
          </Tooltip>
        </div>
      </div>

      <div
        id={hintId}
        className="mt-3 flex flex-col gap-2 text-xs text-[var(--app-text-muted)] sm:flex-row sm:items-center sm:justify-between"
      >
        <p className="leading-relaxed">
          {t("options.openAiService.apiKeyInput.helper")}
        </p>
        <a
          href="https://help.openai.com/en/articles/4936850-where-do-i-find-my-openai-api-key"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 font-medium text-[var(--app-accent)] transition-colors hover:text-[var(--app-accent-strong)]"
        >
          <span>{t("options.openAiService.apiKeyInput.guide")}</span>
          <OpenIcon className="h-3.5 w-3.5" />
        </a>
      </div>
    </div>
  );
}
