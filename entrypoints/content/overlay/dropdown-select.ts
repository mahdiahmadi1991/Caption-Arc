import { createElement } from "../libs";
import { createContentIcon } from "../icons";

export type OverlayDropdownOption = {
  id: string;
  name: string;
  description?: string;
  badgeLabel?: string;
  badgeTone?: "accent" | "neutral" | "warning";
};

type OverlayDropdownConfig = {
  id: string;
  value: string;
  options: readonly OverlayDropdownOption[] | OverlayDropdownOption[];
  onChange: (value: string) => void | Promise<void>;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
  menuClassName?: string;
  optionClassName?: string;
};

export type OverlayDropdownHandle = {
  element: HTMLElement;
  close: () => void;
  isOpen: () => boolean;
  setValue: (
    value: string,
    options?: { preserveOpen?: boolean }
  ) => void;
  setDisabled: (disabled: boolean) => void;
};

export function createOverlayDropdownSelect(
  config: OverlayDropdownConfig
): OverlayDropdownHandle {
  let selectedValue = config.value;
  let disabled = Boolean(config.disabled);

  const stopDropdownSurfacePropagation = (event: Event) => {
    event.stopPropagation();
  };

  const label = createElement("span", {
    className: "mc-dropdown-label",
    dir: "auto",
    textContent:
      config.options.find((option) => option.id === selectedValue)?.name || "",
  });

  const chevron = createElement("span", { className: "mc-dropdown-chevron" }, [
    createContentIcon("chevron-down", {
      className: "mc-icon mc-icon-chevron",
      size: 14,
    }) as unknown as HTMLElement,
  ]);

  const menu = createElement("div", {
    className: `mc-dropdown-menu${config.menuClassName ? ` ${config.menuClassName}` : ""}`,
    role: "listbox",
  });

  const root = createElement("div", {
    id: config.id,
    className: `mc-dropdown${config.className ? ` ${config.className}` : ""}`,
    "data-value": selectedValue,
  });

  root.addEventListener("mousedown", stopDropdownSurfacePropagation);
  root.addEventListener("pointerdown", stopDropdownSurfacePropagation);
  root.addEventListener("click", stopDropdownSurfacePropagation);
  menu.addEventListener("mousedown", stopDropdownSurfacePropagation);
  menu.addEventListener("pointerdown", stopDropdownSurfacePropagation);
  menu.addEventListener("click", stopDropdownSurfacePropagation);

  const close = () => {
    root.classList.remove("is-open");
    trigger.setAttribute("aria-expanded", "false");
    removeOutsidePointerListener();
  };

  const open = () => {
    root.classList.add("is-open");
    trigger.setAttribute("aria-expanded", "true");
  };

  const syncSelectedState = () => {
    root.setAttribute("data-value", selectedValue);
    root.classList.toggle("is-disabled", disabled);
    label.textContent =
      config.options.find((option) => option.id === selectedValue)?.name || "";

    const options = menu.querySelectorAll(".mc-dropdown-option");
    options.forEach((option) => {
      option.classList.toggle(
        "is-selected",
        option.getAttribute("data-value") === selectedValue
      );
      option.setAttribute(
        "aria-selected",
        String(option.getAttribute("data-value") === selectedValue)
      );
      if (option instanceof HTMLButtonElement) {
        option.disabled = disabled;
      }
    });

    trigger.setAttribute("aria-disabled", String(disabled));
  };

  const removeOutsidePointerListener = () => {
    document.removeEventListener("pointerdown", handleDocumentPointerDown, true);
  };

  const handleDocumentPointerDown = (event: PointerEvent) => {
    const target = event.target as Node | null;
    if (!target) {
      return;
    }

    if (menu.contains(target) || trigger.contains(target)) {
      return;
    }

    removeOutsidePointerListener();
    close();
  };

  const trigger = createElement(
    "button",
    {
      className: `mc-dropdown-trigger${config.triggerClassName ? ` ${config.triggerClassName}` : ""}`,
      type: "button",
      "aria-haspopup": "listbox",
      "aria-expanded": "false",
      onClick: (event) => {
        event.stopPropagation();
        if (disabled) {
          return;
        }
        const nextOpen = !root.classList.contains("is-open");
        root.classList.toggle("is-open", nextOpen);
        trigger.setAttribute("aria-expanded", String(nextOpen));

        if (nextOpen) {
          document.addEventListener("pointerdown", handleDocumentPointerDown, true);
        } else {
          removeOutsidePointerListener();
        }
      },
      onKeydown: (event) => {
        if (disabled) {
          return;
        }
        if (event.key === "Escape") {
          removeOutsidePointerListener();
          close();
        }
      },
    },
    [label, chevron]
  );

  const selectOption = async (value: string) => {
    removeOutsidePointerListener();
    close();

    if (value === selectedValue) {
      return;
    }

    selectedValue = value;
    syncSelectedState();
    await config.onChange(value);
  };

  config.options.forEach((option) => {
    const optionLabel = createElement("span", {
      className: "mc-dropdown-option-label",
      dir: "auto",
      textContent: option.name,
    });

    const optionHeadChildren: HTMLElement[] = [optionLabel];

    if (option.badgeLabel) {
      optionHeadChildren.push(
        createElement("span", {
          className: `mc-dropdown-option-badge mc-dropdown-option-badge--${
            option.badgeTone || "neutral"
          }`,
          textContent: option.badgeLabel,
        })
      );
    }

    const optionChildren: HTMLElement[] = [
      createElement("span", { className: "mc-dropdown-option-head" }, optionHeadChildren),
    ];

    if (option.description) {
      optionChildren.push(
        createElement("span", {
          className: "mc-dropdown-option-description",
          dir: "auto",
          textContent: option.description,
        })
      );
    }

    const optionElement = createElement(
      "button",
      {
        className: `mc-dropdown-option${config.optionClassName ? ` ${config.optionClassName}` : ""}${
          option.id === selectedValue ? " is-selected" : ""
        }`,
        type: "button",
        role: "option",
        "data-value": option.id,
        "aria-selected": String(option.id === selectedValue),
        onClick: () => {
          void selectOption(option.id);
        },
      },
      optionChildren
    );

    menu.appendChild(optionElement);
  });

  root.appendChild(trigger);
  root.appendChild(menu);
  syncSelectedState();

  return {
    element: root,
    close,
    isOpen: () => root.classList.contains("is-open"),
    setValue: (value: string, options) => {
      selectedValue = value;
      if (!options?.preserveOpen) {
        close();
      }
      syncSelectedState();
    },
    setDisabled: (nextDisabled: boolean) => {
      disabled = nextDisabled;
      if (disabled) {
        close();
      }
      syncSelectedState();
    },
  };
}
