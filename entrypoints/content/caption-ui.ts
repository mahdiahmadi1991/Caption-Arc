import type { Caption } from "./types";
import { createElement } from "./libs";
import { createContentIcon } from "./icons";
import { retranslateCaption } from "./translation";
import { scrollToBottomIfNeeded } from "./render";
import { TranslationStatus } from "./constants";
import { settings } from "./state";
import { getLanguageDirection } from "../shared/language-metadata";
import { getUiRuntimeTranslator } from "../shared/i18n";
import { syncCompactStatus, syncTranslationDock } from "./overlay/header";

function removeDots(transEl: HTMLElement): void {
  const dotsEl = transEl.querySelector(".mc-dots");
  if (dotsEl) dotsEl.remove();
}

function applyTranslationDirection(element: HTMLElement): void {
  element.setAttribute("dir", getLanguageDirection(settings.targetLanguage));
}

export function updateCaptionTranslation(captionObj: Caption): void {
  const t = getUiRuntimeTranslator();
  const captionEl = document.querySelector(
    `[data-caption-id="${captionObj.id}"]`
  );
  if (!captionEl) {
    return;
  }

  let wrapper = captionEl.querySelector(".mc-translation-wrapper");
  let transEl = captionEl.querySelector(
    ".mc-translation"
  ) as HTMLElement | null;
  let reloadBtn = captionEl.querySelector(".mc-reload-action");

  if (!wrapper) {
    wrapper = createElement("div", { className: "mc-translation-wrapper" });
    const originalEl = captionEl.querySelector(".mc-original");
    if (originalEl?.parentNode) {
      originalEl.parentNode.appendChild(wrapper);
    }
  }

  if (!transEl) {
    transEl = createElement("div", {
      className: "mc-translation",
      onClick: () => startEditTranslation(captionObj),
    });
    wrapper.appendChild(transEl);
  }

  applyTranslationDirection(transEl);

  let dotsEl = transEl.querySelector(".mc-dots") as HTMLElement | null;

  if (
    captionObj.translationStatus === TranslationStatus.Translating ||
    captionObj.translationStatus === TranslationStatus.Pending
  ) {
    if (!dotsEl) {
      dotsEl = document.createElement("span");
      dotsEl.className = "mc-dots";
      dotsEl.textContent = "...";
    }
    transEl.textContent = captionObj.translation || "";
    transEl.appendChild(dotsEl);
    transEl.className = "mc-translation mc-translating";
  } else if (captionObj.translationStatus === TranslationStatus.Refining) {
    removeDots(transEl);
    transEl.textContent = captionObj.translation
      ? captionObj.translation + " ↻"
      : "...";
    transEl.className = "mc-translation mc-refining";
  } else if (captionObj.translationStatus === TranslationStatus.Error) {
    removeDots(transEl);
    if (captionObj.translation) {
      transEl.textContent = captionObj.translation + " ⚠";
      transEl.setAttribute(
        "data-tooltip",
        captionObj.translationError || t("content.translation.errorFallback")
      );
    } else {
      transEl.textContent =
        "⚠ " +
        (captionObj.translationError || t("content.translation.errorFallback"));
    }
    transEl.className = "mc-translation mc-error";
  } else if (captionObj.translation) {
    removeDots(transEl);
    transEl.textContent = captionObj.translation;
    transEl.className = "mc-translation";
    transEl.removeAttribute("data-tooltip");
  } else {
    removeDots(transEl);
    transEl.textContent = "";
    transEl.className = "mc-translation";
    transEl.removeAttribute("data-tooltip");
  }

  if (captionObj.translationStatus === TranslationStatus.Error) {
    if (!reloadBtn) {
      reloadBtn = createElement("button", {
        className: "mc-action-btn mc-reload-action",
        "data-tooltip": t("content.translation.retryAction"),
        onClick: (e) => {
          e.stopPropagation();
          retranslateCaption(captionObj);
        },
      }, [createContentIcon("refresh", { className: "mc-icon", size: 14 }) as unknown as HTMLElement]);
      wrapper.appendChild(reloadBtn);
    } else {
      reloadBtn.setAttribute("data-tooltip", t("content.translation.retryAction"));
    }
  } else if (reloadBtn) {
    reloadBtn.remove();
  }

  scrollToBottomIfNeeded();
  syncCompactStatus();
  syncTranslationDock();
}

function autoResizeTextarea(textarea: HTMLTextAreaElement): void {
  textarea.style.height = "auto";
  textarea.style.height = textarea.scrollHeight + "px";
}

export function startEditTranslation(captionObj: Caption): void {
  const captionEl = document.querySelector(
    `[data-caption-id="${captionObj.id}"]`
  );
  if (!captionEl) return;

  const transEl = captionEl.querySelector(
    ".mc-translation"
  ) as HTMLElement | null;
  if (
    !transEl ||
    transEl.classList.contains("mc-translating") ||
    transEl.classList.contains("mc-refining")
  ) {
    return;
  }

  const currentText = captionObj.translation || "";
  const input = createElement("textarea", {
    className: "mc-translation-edit",
    value: currentText,
  }) as HTMLTextAreaElement;
  input.setAttribute("dir", getLanguageDirection(settings.targetLanguage));
  transEl.classList.add("mc-editing");
  transEl.removeAttribute("data-tooltip");

  const saveEdit = () => {
    const newText = input.value.trim();
    if (newText !== currentText) {
      captionObj.translation = newText;
      captionObj.userEdited = true;
    }
    transEl.classList.remove("mc-editing");
    updateCaptionTranslation(captionObj);
  };

  input.addEventListener("blur", saveEdit);
  input.addEventListener("input", () => autoResizeTextarea(input));
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      input.blur();
    }
    if (e.key === "Escape") {
      input.value = currentText;
      input.blur();
    }
  });

  input.addEventListener("click", (e) => e.stopPropagation());
  input.addEventListener("mousedown", (e) => e.stopPropagation());
  input.addEventListener("mouseup", (e) => e.stopPropagation());

  transEl.textContent = "";
  transEl.appendChild(input);

  requestAnimationFrame(() => {
    autoResizeTextarea(input);
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);
  });
}
