import { createContentIcon } from "../icons";

export function createScrollButton(
  content: HTMLElement,
  overlay: HTMLElement
): HTMLButtonElement {
  const btn = document.createElement("button");
  btn.className = "mc-scroll-bottom";
  btn.appendChild(createContentIcon("arrow-down", { size: 12 }));

  Object.assign(btn.style, {
    position: "absolute",
    opacity: "0",
    zIndex: "10",
    pointerEvents: "none",
  });

  btn.addEventListener("click", () => {
    content.scrollTo({
      top: content.scrollHeight,
      behavior: "smooth",
    });
  });

  const updateVisibility = () => {
    const isNearBottom =
      content.scrollHeight - content.scrollTop - content.clientHeight < 100;
    if (isNearBottom) {
      btn.style.opacity = "0";
      btn.style.pointerEvents = "none";
    } else {
      btn.style.opacity = "1";
      btn.style.pointerEvents = "auto";
    }
  };

  content.addEventListener("scroll", updateVisibility);

  const observer = new MutationObserver(updateVisibility);
  observer.observe(content, { childList: true, subtree: true });

  updateVisibility();

  // Hide when the overlay is in compact view.
  const minimizedObserver = new MutationObserver(() => {
    if (overlay.classList.contains("minimized")) {
      btn.style.display = "none";
    } else {
      btn.style.display = "flex";
    }
  });
  minimizedObserver.observe(overlay, {
    attributes: true,
    attributeFilter: ["class"],
  });

  return btn;
}
