import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

type TooltipProps = {
  content: string;
  children: ReactNode;
  disabled?: boolean;
};

type TooltipPosition = {
  top: number;
  left: number;
  placement: "top" | "bottom";
  arrowLeft: number;
};

const TOOLTIP_HOVER_DELAY_MS = 260;
const TOOLTIP_FOCUS_DELAY_MS = 180;

export function Tooltip({ content, children, disabled = false }: TooltipProps) {
  const triggerRef = useRef<HTMLSpanElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const openTimeoutRef = useRef<number | null>(null);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<TooltipPosition | null>(null);

  const clearOpenTimeout = useCallback(() => {
    if (openTimeoutRef.current !== null) {
      window.clearTimeout(openTimeoutRef.current);
      openTimeoutRef.current = null;
    }
  }, []);

  const queueOpen = useCallback(
    (delayMs: number) => {
      clearOpenTimeout();
      openTimeoutRef.current = window.setTimeout(() => {
        openTimeoutRef.current = null;
        setOpen(true);
      }, delayMs);
    },
    [clearOpenTimeout]
  );

  const closeTooltip = useCallback(() => {
    clearOpenTimeout();
    setOpen(false);
  }, [clearOpenTimeout]);

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) {
      return;
    }

    const rect = triggerRef.current.getBoundingClientRect();
    const tooltipWidth = tooltipRef.current?.offsetWidth ?? 240;
    const tooltipHeight = tooltipRef.current?.offsetHeight ?? 44;
    const viewportPadding = 12;
    const gap = 10;
    const triggerCenter = rect.left + rect.width / 2;
    const clampedLeft = Math.min(
      Math.max(triggerCenter, viewportPadding + tooltipWidth / 2),
      window.innerWidth - viewportPadding - tooltipWidth / 2
    );
    const arrowLeft = Math.min(
      Math.max(triggerCenter - (clampedLeft - tooltipWidth / 2), 16),
      tooltipWidth - 16
    );
    const canPlaceAbove = rect.top >= tooltipHeight + gap + viewportPadding;

    setPosition({
      top: canPlaceAbove ? rect.top - gap : rect.bottom + gap,
      left: clampedLeft,
      placement: canPlaceAbove ? "top" : "bottom",
      arrowLeft,
    });
  }, []);

  useLayoutEffect(() => {
    if (!open || disabled) {
      return;
    }

    updatePosition();
    const frame = window.requestAnimationFrame(updatePosition);
    return () => window.cancelAnimationFrame(frame);
  }, [disabled, open, updatePosition]);

  useEffect(() => {
    if (!open || disabled) {
      return;
    }

    const handleViewportChange = () => updatePosition();
    window.addEventListener("scroll", handleViewportChange, true);
    window.addEventListener("resize", handleViewportChange);

    return () => {
      window.removeEventListener("scroll", handleViewportChange, true);
      window.removeEventListener("resize", handleViewportChange);
    };
  }, [disabled, open, updatePosition]);

  useEffect(() => () => clearOpenTimeout(), [clearOpenTimeout]);

  if (disabled) {
    return <>{children}</>;
  }

  return (
    <>
      <span
        ref={triggerRef}
        className="mc-app-tooltip-trigger"
        onMouseEnter={() => queueOpen(TOOLTIP_HOVER_DELAY_MS)}
        onMouseLeave={closeTooltip}
        onFocus={() => queueOpen(TOOLTIP_FOCUS_DELAY_MS)}
        onBlur={closeTooltip}
      >
        {children}
      </span>
      {open &&
        position &&
        createPortal(
          <div
            ref={tooltipRef}
            className="mc-app-tooltip"
            data-placement={position.placement}
            style={{
              top: position.top,
              left: position.left,
              transform:
                position.placement === "top"
                  ? "translate(-50%, -100%)"
                  : "translate(-50%, 0)",
              ["--mc-tooltip-arrow-left" as string]: `${position.arrowLeft}px`,
            }}
            role="tooltip"
          >
            {content}
          </div>,
          document.body
        )}
    </>
  );
}
