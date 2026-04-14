import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { useT } from "./i18n";
import { CloseIcon, InfoIcon } from "./icons";

type HelpPopoverPosition = {
  top: number;
  left: number;
  placement: "top" | "bottom";
  arrowLeft: number;
};

type HelpPopoverProps = {
  label: string;
  markdown: string;
  disabled?: boolean;
};

const CLOSE_ANIMATION_MS = 180;

export function HelpPopover({
  label,
  markdown,
  disabled = false,
}: HelpPopoverProps) {
  const t = useT();
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const closeTimerRef = useRef<number | null>(null);
  const [open, setOpen] = useState(false);
  const [rendered, setRendered] = useState(false);
  const [position, setPosition] = useState<HelpPopoverPosition | null>(null);

  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) {
      return;
    }

    const rect = triggerRef.current.getBoundingClientRect();
    const popoverWidth = popoverRef.current?.offsetWidth ?? 320;
    const popoverHeight = popoverRef.current?.offsetHeight ?? 220;
    const viewportPadding = 12;
    const gap = 12;
    const triggerCenter = rect.left + rect.width / 2;
    const clampedLeft = Math.min(
      Math.max(triggerCenter, viewportPadding + popoverWidth / 2),
      window.innerWidth - viewportPadding - popoverWidth / 2
    );
    const arrowLeft = Math.min(
      Math.max(triggerCenter - (clampedLeft - popoverWidth / 2), 24),
      popoverWidth - 24
    );
    const canPlaceAbove = rect.top >= popoverHeight + gap + viewportPadding;

    setPosition({
      top: canPlaceAbove ? rect.top - gap : rect.bottom + gap,
      left: clampedLeft,
      placement: canPlaceAbove ? "top" : "bottom",
      arrowLeft,
    });
  }, []);

  const closePopover = useCallback(() => {
    clearCloseTimer();
    setOpen(false);
    closeTimerRef.current = window.setTimeout(() => {
      setRendered(false);
      closeTimerRef.current = null;
    }, CLOSE_ANIMATION_MS);
  }, [clearCloseTimer]);

  const openPopover = useCallback(() => {
    clearCloseTimer();
    setRendered(true);
    setOpen(true);
  }, [clearCloseTimer]);

  useLayoutEffect(() => {
    if (!rendered || disabled) {
      return;
    }

    updatePosition();
    const frame = window.requestAnimationFrame(updatePosition);
    return () => window.cancelAnimationFrame(frame);
  }, [disabled, rendered, updatePosition]);

  useEffect(() => {
    if (!rendered || disabled) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (
        target &&
        (triggerRef.current?.contains(target) || popoverRef.current?.contains(target))
      ) {
        return;
      }

      closePopover();
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closePopover();
      }
    };

    const handleViewportChange = () => updatePosition();

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    window.addEventListener("scroll", handleViewportChange, true);
    window.addEventListener("resize", handleViewportChange);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
      window.removeEventListener("scroll", handleViewportChange, true);
      window.removeEventListener("resize", handleViewportChange);
    };
  }, [closePopover, disabled, rendered, updatePosition]);

  useEffect(() => {
    return () => clearCloseTimer();
  }, [clearCloseTimer]);

  if (disabled) {
    return null;
  }

  return (
    <>
      <span className="mc-app-help-trigger-slot">
        <button
          ref={triggerRef}
          type="button"
          aria-label={t("common.helpPopover.moreAbout", { label })}
          aria-expanded={open}
          aria-haspopup="dialog"
          className="mc-app-help-trigger"
          data-open={open ? "true" : "false"}
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => {
            event.stopPropagation();
            open ? closePopover() : openPopover();
          }}
        >
          <InfoIcon className="h-[0.95rem] w-[0.95rem]" />
        </button>
      </span>
      {rendered &&
        position &&
        createPortal(
          <div
            ref={popoverRef}
            className="mc-app-help-popover"
            data-placement={position.placement}
            data-state={open ? "open" : "closed"}
            role="dialog"
            aria-label={label}
            style={{
              top: position.top,
              left: position.left,
              ["--mc-help-popover-arrow-left" as string]: `${position.arrowLeft}px`,
              ["--mc-help-popover-open-transform" as string]:
                position.placement === "top"
                  ? "translate(-50%, -100%) scale(1)"
                  : "translate(-50%, 0) scale(1)",
              ["--mc-help-popover-closed-transform" as string]:
                position.placement === "top"
                  ? "translate(-50%, calc(-100% + 6px)) scale(0.98)"
                  : "translate(-50%, 6px) scale(0.98)",
            }}
          >
            <div className="mc-app-help-popover__header">
              <div className="min-w-0">
                <p className="mc-app-help-popover__eyebrow">
                  {t("common.helpPopover.eyebrow")}
                </p>
                <p className="mc-app-help-popover__title">{label}</p>
              </div>
              <button
                type="button"
                onClick={closePopover}
                aria-label={t("common.helpPopover.close")}
                className="mc-app-help-popover__close"
              >
                <CloseIcon className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="mc-app-help-popover__body mc-app-scrollbar mc-rich-scrollbars">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  p: ({ children }) => (
                    <p className="mt-2.5 text-[12px] leading-5 text-[var(--app-text-muted)] first:mt-0">
                      {children}
                    </p>
                  ),
                  ul: ({ children }) => (
                    <ul className="mt-2.5 list-disc space-y-1.5 ps-4 text-[12px] leading-5 text-[var(--app-text-muted)] marker:text-[var(--app-text-faint)]">
                      {children}
                    </ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="mt-2.5 list-decimal space-y-1.5 ps-4 text-[12px] leading-5 text-[var(--app-text-muted)] marker:text-[var(--app-text-faint)]">
                      {children}
                    </ol>
                  ),
                  li: ({ children }) => <li>{children}</li>,
                  strong: ({ children }) => (
                    <strong className="font-semibold text-[var(--app-text)]">
                      {children}
                    </strong>
                  ),
                  em: ({ children }) => (
                    <em className="italic text-[var(--app-text)]">{children}</em>
                  ),
                  code: ({ children }) => (
                    <code className="rounded-md bg-[var(--app-surface-soft)] px-1.5 py-0.5 text-[11px] text-[var(--app-text)]">
                      {children}
                    </code>
                  ),
                }}
              >
                {markdown}
              </ReactMarkdown>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
