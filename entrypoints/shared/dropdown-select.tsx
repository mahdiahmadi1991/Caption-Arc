import {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { createPortal } from "react-dom";
import { ChevronDownIcon } from "./icons";

export type DropdownOption = {
  id: string;
  name: string;
  description?: string;
  badgeLabel?: string;
  badgeTone?: "accent" | "warning" | "neutral";
};

type DropdownSelectProps = {
  value: string;
  onChange: (value: string) => void;
  options: readonly DropdownOption[] | DropdownOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  buttonClassName?: string;
  menuClassName?: string;
  optionClassName?: string;
};

type DropdownMenuPosition = {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
};

function computeMenuPosition(
  triggerEl: HTMLButtonElement
): DropdownMenuPosition {
  const rect = triggerEl.getBoundingClientRect();
  const viewportPadding = 12;
  const gap = 8;
  const menuReservedHeight = 20;
  const maxScrollableHeight = 288;
  const availableBelow =
    window.innerHeight - rect.bottom - gap - viewportPadding;
  const availableAbove = rect.top - gap - viewportPadding;
  const placeAbove = availableBelow < 180 && availableAbove > availableBelow;
  const maxHeight = Math.round(
    Math.max(
      120,
      Math.min(
        maxScrollableHeight,
        (placeAbove ? availableAbove : availableBelow) - 8
      )
    )
  );
  const menuHeight = maxHeight + menuReservedHeight;
  const width = Math.round(
    Math.min(rect.width, window.innerWidth - viewportPadding * 2)
  );
  const left = Math.round(
    Math.min(
      Math.max(viewportPadding, rect.left),
      window.innerWidth - width - viewportPadding
    )
  );
  const unclampedTop = placeAbove
    ? rect.top - gap - menuHeight
    : rect.bottom + gap;
  const top = Math.round(
    Math.min(
      Math.max(viewportPadding, unclampedTop),
      Math.max(viewportPadding, window.innerHeight - menuHeight - viewportPadding)
    )
  );
  return { top, left, width, maxHeight };
}

export function DropdownSelect({
  value,
  onChange,
  options,
  placeholder = "Select an option",
  disabled = false,
  className = "",
  buttonClassName = "",
  menuClassName = "",
  optionClassName = "",
}: DropdownSelectProps) {
  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [menuPosition, setMenuPosition] = useState<DropdownMenuPosition | null>(
    null
  );
  const listboxId = useId();

  const menuPositionRef = useRef<DropdownMenuPosition | null>(null);
  useEffect(() => {
    menuPositionRef.current = menuPosition;
  }, [menuPosition]);

  const rafIdRef = useRef<number | null>(null);
  const settleTimeoutRef = useRef<number | null>(null);
  const lastScrollPosRef = useRef<DropdownMenuPosition | null>(null);

  const selectedIndex = useMemo(
    () => options.findIndex((option) => option.id === value),
    [options, value]
  );
  const selectedOption = selectedIndex >= 0 ? options[selectedIndex] : null;

  const badgeClassName = (tone: DropdownOption["badgeTone"] = "neutral") => {
    switch (tone) {
      case "accent":
        return "border-[var(--app-accent-border)] bg-[var(--app-accent-soft)] text-[var(--app-accent)]";
      case "warning":
        return "border-[var(--app-warning-border)] bg-[var(--app-warning-soft)] text-[var(--app-warning)]";
      case "neutral":
      default:
        return "border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-text-muted)]";
    }
  };

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      const targetNode = event.target as Node;
      if (
        !rootRef.current?.contains(targetNode) &&
        !menuRef.current?.contains(targetNode)
      ) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const nextIndex = selectedIndex >= 0 ? selectedIndex : 0;
    setHighlightedIndex(nextIndex);
  }, [open, selectedIndex]);

  useEffect(() => {
    if (!open || highlightedIndex < 0) {
      return;
    }

    optionRefs.current[highlightedIndex]?.focus();
  }, [highlightedIndex, open]);

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) {
      // ensure any scheduled work is cleared
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      if (settleTimeoutRef.current) {
        window.clearTimeout(settleTimeoutRef.current);
        settleTimeoutRef.current = null;
      }
      setMenuPosition(null);
      return;
    }

    // initial baseline position (React state)
    const initialPos = computeMenuPosition(triggerRef.current);
    setMenuPosition(initialPos);
    menuPositionRef.current = initialPos;

    const menuEl = () => menuRef.current as HTMLDivElement | null;
    const triggerEl = () => triggerRef.current as HTMLButtonElement | null;

    // Throttled scroll handler using requestAnimationFrame and transform updates.
    const handleScroll = () => {
      const trigger = triggerEl();
      const menu = menuEl();
      if (!trigger || !menu) return;

      // compute latest position
      const pos = computeMenuPosition(trigger);
      lastScrollPosRef.current = pos;

      // schedule one rAF to apply transform (do not set React state here)
      if (rafIdRef.current == null) {
        rafIdRef.current = requestAnimationFrame(() => {
          rafIdRef.current = null;
          const baseline = menuPositionRef.current || pos;
          const dx = pos.left - baseline.left;
          const dy = pos.top - baseline.top;
          // apply GPU-accelerated transform for smooth movement
          menu.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
          // ensure width and maxHeight are kept in sync
          menu.style.width = `${pos.width}px`;
          const scrollable = menu.querySelector('.mc-app-scrollbar') as HTMLElement | null;
          if (scrollable) scrollable.style.maxHeight = `${pos.maxHeight}px`;

          // settle: if no further scroll for 120ms, commit baseline and clear transform
          if (settleTimeoutRef.current) {
            window.clearTimeout(settleTimeoutRef.current);
          }
          settleTimeoutRef.current = window.setTimeout(() => {
            settleTimeoutRef.current = null;
            // commit baseline into React state so further re-renders stay in sync
            setMenuPosition(pos);
            menuPositionRef.current = pos;
            // clear transform (menu will be painted at new top/left)
            menu.style.transform = "none";
          }, 120);
        });
      }
    };

    const handleResize = () => {
      if (!triggerEl()) return;
      // cancel any in-flight rAFs
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      if (settleTimeoutRef.current) {
        window.clearTimeout(settleTimeoutRef.current);
        settleTimeoutRef.current = null;
      }
      const pos = computeMenuPosition(triggerEl() as HTMLButtonElement);
      setMenuPosition(pos);
      menuPositionRef.current = pos;
      const menu = menuEl();
      if (menu) {
        menu.style.transform = "none";
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true, capture: true });
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleResize);
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      if (settleTimeoutRef.current) {
        window.clearTimeout(settleTimeoutRef.current);
        settleTimeoutRef.current = null;
      }
    };
  }, [open]);

  const selectOption = (nextValue: string) => {
    setOpen(false);
    onChange(nextValue);
  };

  const handleTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) {
      return;
    }

    if (
      event.key === "ArrowDown" ||
      event.key === "ArrowUp" ||
      event.key === "Enter" ||
      event.key === " "
    ) {
      event.preventDefault();
      setOpen(true);
    }
  };

  const handleOptionKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    index: number
  ) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightedIndex((index + 1) % options.length);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightedIndex((index - 1 + options.length) % options.length);
      return;
    }

    if (event.key === "Home") {
      event.preventDefault();
      setHighlightedIndex(0);
      return;
    }

    if (event.key === "End") {
      event.preventDefault();
      setHighlightedIndex(options.length - 1);
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
    }
  };

  return (
    <div
      className={`relative ${className}`.trim()}
      ref={rootRef}
    >
      <button
        type="button"
        ref={triggerRef}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={handleTriggerKeyDown}
        className={`flex min-h-12 w-full items-center justify-between gap-3 rounded-2xl border border-[var(--app-border)] bg-[var(--app-bg-elevated)] px-4 py-3 text-start text-[var(--app-text)] outline-none transition-colors hover:border-[var(--app-border-strong)] hover:bg-[var(--app-surface-strong)] focus:border-[var(--app-accent)] disabled:cursor-default disabled:opacity-60 ${buttonClassName}`.trim()}
      >
        <span
          className={`flex min-w-0 items-center gap-2 ${selectedOption ? "" : "text-[var(--app-text-faint)]"}`}
        >
          <span className="truncate">{selectedOption?.name || placeholder}</span>
          {selectedOption?.badgeLabel && (
            <span
              className={`inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${badgeClassName(
                selectedOption.badgeTone
              )}`}
            >
              {selectedOption.badgeLabel}
            </span>
          )}
        </span>
        <span
          className={`shrink-0 text-[var(--app-text-faint)] transition-transform ${open ? "rotate-180" : ""}`}
        >
          <ChevronDownIcon className="h-4 w-4" />
        </span>
      </button>

      {open &&
        options.length > 0 &&
        menuPosition &&
        createPortal(
          <div
            id={listboxId}
            ref={menuRef}
            role="listbox"
            aria-activedescendant={
              highlightedIndex >= 0
                ? `${listboxId}-option-${highlightedIndex}`
                : undefined
            }
            className={`fixed z-[120] overflow-hidden rounded-[1.5rem] border border-[var(--app-border)] bg-[var(--app-surface-strong)] p-2 shadow-[0_24px_48px_var(--app-shadow)] ${menuClassName}`.trim()}
            style={{
              top: `${menuPosition.top}px`,
              left: `${menuPosition.left}px`,
              width: `${menuPosition.width}px`,
            }}
          >
            <div
              className="mc-app-scrollbar overflow-y-auto"
              style={{ maxHeight: `${menuPosition.maxHeight}px` }}
            >
              {options.map((option, index) => {
                const isSelected = option.id === value;
                return (
                  <button
                    key={option.id}
                    id={`${listboxId}-option-${index}`}
                    ref={(element) => {
                      optionRefs.current[index] = element;
                    }}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => selectOption(option.id)}
                    onKeyDown={(event) => handleOptionKeyDown(event, index)}
                    className={`flex w-full flex-col rounded-[1.1rem] border border-transparent px-4 py-3 text-start transition-[background,color,border-color,box-shadow,filter] focus:outline-none ${
                      isSelected
                        ? "bg-[var(--app-accent-soft)] text-[var(--app-accent)] shadow-[inset_0_0_0_1px_var(--app-accent-border)] hover:brightness-[0.985]"
                        : "text-[var(--app-text)] hover:border-[var(--app-border)] hover:bg-[var(--app-bg-elevated)] hover:shadow-[0_8px_18px_color-mix(in_srgb,var(--app-shadow)_32%,transparent)]"
                    } ${optionClassName}`.trim()}
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-sm font-medium">{option.name}</span>
                      {option.badgeLabel && (
                        <span
                          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${badgeClassName(
                            option.badgeTone
                          )}`}
                        >
                          {option.badgeLabel}
                        </span>
                      )}
                    </span>
                    {option.description && (
                      <span
                        className={
                          "mt-1 text-xs leading-relaxed " +
                          (isSelected
                            ? "text-[var(--app-accent)]"
                            : "text-[var(--app-text-muted)]")
                        }
                      >
                        {option.description}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
