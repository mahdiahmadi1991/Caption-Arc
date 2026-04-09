import { useEffect, useRef, type ReactNode } from "react";

type AnimatedCollapseProps = {
  open: boolean;
  children: ReactNode;
  className?: string;
};

export function AnimatedCollapse({
  open,
  children,
  className = "",
}: AnimatedCollapseProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    if (!open) {
      const activeElement = document.activeElement;
      if (activeElement instanceof HTMLElement && container.contains(activeElement)) {
        activeElement.blur();
      }
      container.setAttribute("inert", "");
      return;
    }

    container.removeAttribute("inert");
  }, [open]);

  return (
    <div
      ref={containerRef}
      aria-hidden={!open}
      className={[
        "grid min-h-0 transition-[grid-template-rows,opacity,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
        open
          ? "grid-rows-[1fr] translate-y-0 opacity-100"
          : "pointer-events-none grid-rows-[0fr] -translate-y-1 opacity-0",
      ].join(" ")}
    >
      <div className={["min-h-0 overflow-hidden", className].join(" ").trim()}>
        {children}
      </div>
    </div>
  );
}
