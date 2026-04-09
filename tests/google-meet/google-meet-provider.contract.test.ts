import { describe, expect, test, vi } from "vitest";
import {
  googleMeetProvider,
  googleMeetProviderInternals,
} from "../../entrypoints/content/providers/google-meet";

function setPath(pathname: string): void {
  window.history.replaceState({}, "", pathname);
}

function setBodyText(text: string): void {
  Object.defineProperty(document.body, "innerText", {
    value: text,
    configurable: true,
    writable: true,
  });
  document.body.textContent = text;
}

function addButton(options: {
  ariaLabel?: string;
  text?: string;
  disabled?: boolean;
  ariaDisabled?: boolean;
  iconText?: string;
  insideOverlay?: boolean;
  tooltipId?: string;
  tooltipText?: string;
}): HTMLButtonElement {
  const parent = options.insideOverlay
    ? (() => {
        const overlay = document.createElement("div");
        overlay.id = "captionarc-overlay";
        document.body.appendChild(overlay);
        return overlay;
      })()
    : document.body;

  const button = document.createElement("button");
  if (options.ariaLabel) {
    button.setAttribute("aria-label", options.ariaLabel);
  }
  if (options.text) {
    button.textContent = options.text;
  }
  if (options.disabled) {
    button.disabled = true;
  }
  if (options.ariaDisabled) {
    button.setAttribute("aria-disabled", "true");
  }
  if (options.tooltipId) {
    button.setAttribute("data-tooltip-id", options.tooltipId);
    const tooltip = document.createElement("div");
    tooltip.id = options.tooltipId;
    tooltip.textContent = options.tooltipText || "";
    document.body.appendChild(tooltip);
  }
  if (options.iconText) {
    const icon = document.createElement("i");
    icon.textContent = options.iconText;
    button.appendChild(icon);
  }

  parent.appendChild(button);
  return button;
}

function addGoogleSymbolButton(iconText: string): HTMLButtonElement {
  const button = document.createElement("button");
  const icon = document.createElement("span");
  icon.setAttribute("data-google-symbols-override", "true");
  icon.textContent = iconText;
  button.appendChild(icon);
  document.body.appendChild(button);
  return button;
}

describe("Google Meet provider contract: URL and context", () => {
  test("GM-URL-001: classify /new as new", () => {
    const kind = googleMeetProviderInternals.getGoogleMeetPageKind(
      new URL("https://meet.google.com/new")
    );
    expect(kind).toBe("new");
  });

  test("GM-URL-002: classify meeting code path as meeting", () => {
    const kind = googleMeetProviderInternals.getGoogleMeetPageKind(
      new URL("https://meet.google.com/abc-defg-hij/")
    );
    expect(kind).toBe("meeting");
  });

  test("GM-URL-003: classify unrelated route as null", () => {
    const kind = googleMeetProviderInternals.getGoogleMeetPageKind(
      new URL("https://meet.google.com/landing")
    );
    expect(kind).toBeNull();
  });

  test("GM-URL-004: provider URL matcher true for /new and meeting path", () => {
    expect(googleMeetProvider.matchesUrl(new URL("https://meet.google.com/new"))).toBe(true);
    expect(
      googleMeetProvider.matchesUrl(new URL("https://meet.google.com/abc-defg-hij"))
    ).toBe(true);
  });

  test("GM-URL-005: provider URL matcher false for /landing", () => {
    expect(
      googleMeetProvider.matchesUrl(new URL("https://meet.google.com/landing"))
    ).toBe(false);
  });

  test("GM-CTX-007: /new always page-context true", () => {
    const value = googleMeetProviderInternals.hasGoogleMeetPageContext(
      new URL("https://meet.google.com/new")
    );
    expect(value).toBe(true);
  });

  test("GM-CTX-008: meeting route without context signals is false", () => {
    document.title = "";
    setBodyText("ordinary page text");

    const value = googleMeetProviderInternals.hasGoogleMeetPageContext(
      new URL("https://meet.google.com/abc-defg-hij")
    );
    expect(value).toBe(false);
  });

  test("GM-CTX-006: meeting shell title hint yields page-context true", () => {
    document.title = "Meet - Team sync";

    const value = googleMeetProviderInternals.hasGoogleMeetPageContext(
      new URL("https://meet.google.com/abc-defg-hij")
    );
    expect(value).toBe(true);
  });
});

describe("Google Meet provider contract: prejoin and leave-call detection", () => {
  test("GM-CTX-001: detect leave call via aria-label", () => {
    addButton({ ariaLabel: "Leave Call" });

    expect(googleMeetProviderInternals.hasGoogleMeetLeaveCallControl()).toBe(true);
  });

  test("GM-CTX-002: detect leave call via call_end icon", () => {
    addGoogleSymbolButton("call_end");

    expect(googleMeetProviderInternals.hasGoogleMeetLeaveCallControl()).toBe(true);
  });

  test("GM-CTX-002: ignore leave call controls inside extension overlay", () => {
    addButton({ ariaLabel: "Leave Call", insideOverlay: true });

    expect(googleMeetProviderInternals.hasGoogleMeetLeaveCallControl()).toBe(false);
  });

  test("GM-CTX-003: detect prejoin by join-now button text", () => {
    addButton({ text: "Join now" });

    expect(googleMeetProviderInternals.hasGoogleMeetPrejoinSurface()).toBe(true);
  });

  test("GM-CTX-004: detect prejoin by companion-mode body text", () => {
    setBodyText("You can use companion mode before joining");

    expect(googleMeetProviderInternals.hasGoogleMeetPrejoinSurface()).toBe(true);
  });

  test("GM-CTX-005: detect prejoin by data-meeting-title", () => {
    const title = document.createElement("div");
    title.setAttribute("data-meeting-title", "Daily sync");
    document.body.appendChild(title);

    expect(googleMeetProviderInternals.hasGoogleMeetPrejoinSurface()).toBe(true);
  });
});

describe("Google Meet provider contract: presence", () => {
  test("GM-PRES-001: unknown when page-kind is null", () => {
    setPath("/landing");

    expect(googleMeetProviderInternals.getGoogleMeetPresence()).toBe("unknown");
  });

  test("GM-PRES-002: prejoin on /new", () => {
    setPath("/new");

    expect(googleMeetProviderInternals.getGoogleMeetPresence()).toBe("prejoin");
  });

  test("GM-PRES-003: joined when leave-call control exists", () => {
    setPath("/abc-defg-hij");
    addButton({ ariaLabel: "Leave call" });

    expect(googleMeetProviderInternals.getGoogleMeetPresence()).toBe("joined");
  });

  test("GM-PRES-004: prejoin when context exists without leave-call", () => {
    setPath("/abc-defg-hij");
    addButton({ text: "Join now" });

    expect(googleMeetProviderInternals.getGoogleMeetPresence()).toBe("prejoin");
  });
});

describe("Google Meet provider contract: caption toggle and caption-enabled checks", () => {
  test("GM-CAP-001: find enable toggle by aria-label", () => {
    const button = addButton({ ariaLabel: "Turn on captions" });

    const result = googleMeetProviderInternals.getGoogleMeetCaptionToggleButton("enable");
    expect(result).toBe(button);
  });

  test("GM-CAP-002: find disable toggle by aria-label", () => {
    const button = addButton({ ariaLabel: "Turn off captions" });

    const result = googleMeetProviderInternals.getGoogleMeetCaptionToggleButton("disable");
    expect(result).toBe(button);
  });

  test("GM-CAP-003: ignore disabled toggle button", () => {
    addButton({ ariaLabel: "Turn on captions", disabled: true });

    const result = googleMeetProviderInternals.getGoogleMeetCaptionToggleButton("enable");
    expect(result).toBeNull();
  });

  test("GM-CAP-003: ignore aria-disabled toggle button", () => {
    addButton({ ariaLabel: "Turn on captions", ariaDisabled: true });

    const result = googleMeetProviderInternals.getGoogleMeetCaptionToggleButton("enable");
    expect(result).toBeNull();
  });

  test("GM-CAP-004: find enable toggle by tooltip text", () => {
    const button = addButton({
      tooltipId: "tooltip-captions",
      tooltipText: "Turn on captions",
    });

    const result = googleMeetProviderInternals.getGoogleMeetCaptionToggleButton("enable");
    expect(result).toBe(button);
  });

  test("GM-CAP-005: find enable toggle by icon text", () => {
    const button = addButton({ iconText: "closed_caption_off" });

    const result = googleMeetProviderInternals.getGoogleMeetCaptionToggleButton("enable");
    expect(result).toBe(button);
  });

  test("GM-CAP-006: captions enabled when caption region exists", () => {
    const region = document.createElement("div");
    region.setAttribute("role", "region");
    region.className = "vNKgIf UDinHf";
    document.body.appendChild(region);

    expect(googleMeetProviderInternals.isGoogleMeetCaptionsEnabled()).toBe(true);
  });

  test("GM-CAP-007: captions enabled when disable-toggle exists", () => {
    addButton({ ariaLabel: "Turn off captions" });

    expect(googleMeetProviderInternals.isGoogleMeetCaptionsEnabled()).toBe(true);
  });

  test("GM-CAP-007: captions disabled when region and toggle are missing", () => {
    expect(googleMeetProviderInternals.isGoogleMeetCaptionsEnabled()).toBe(false);
  });
});

describe("Google Meet provider contract: auto-enable captions", () => {
  test("GM-CAP-008: returns true immediately if already enabled", async () => {
    const region = document.createElement("div");
    region.setAttribute("role", "region");
    region.className = "vNKgIf UDinHf";
    document.body.appendChild(region);

    await expect(
      googleMeetProviderInternals.tryEnableGoogleMeetLiveCaptions(1000)
    ).resolves.toBe(true);
  });

  test("GM-CAP-009: returns false when no enable toggle exists before timeout", async () => {
    await expect(
      googleMeetProviderInternals.tryEnableGoogleMeetLiveCaptions(0)
    ).resolves.toBe(false);
  });

  test("GM-CAP-010: clicks toggle and succeeds once region appears", async () => {
    const button = addButton({ ariaLabel: "Turn on captions" });
    button.addEventListener("click", () => {
      setTimeout(() => {
        const region = document.createElement("div");
        region.setAttribute("role", "region");
        region.className = "vNKgIf UDinHf";
        document.body.appendChild(region);
      }, 250);
    });

    vi.useFakeTimers();
    const pending = googleMeetProviderInternals.tryEnableGoogleMeetLiveCaptions(1500);
    await vi.advanceTimersByTimeAsync(3000);

    await expect(pending).resolves.toBe(true);
  });

  test("GM-CAP-011: returns false when verify window expires without enablement", async () => {
    addButton({ ariaLabel: "Turn on captions" });

    vi.useFakeTimers();
    const pending = googleMeetProviderInternals.tryEnableGoogleMeetLiveCaptions(1500);
    await vi.advanceTimersByTimeAsync(5000);

    await expect(pending).resolves.toBe(false);
  });
});

describe("Google Meet provider contract: session metadata", () => {
  test("GM-META-001: metadata includes meeting code, title, source url and provider", () => {
    setPath("/abc-defg-hij");

    const title = document.createElement("div");
    title.setAttribute("data-meeting-title", "Weekly product review");
    document.body.appendChild(title);

    const metadata = googleMeetProvider.getSessionMetadata();

    expect(metadata.platform).toBe("google-meet");
    expect(metadata.providerLabel).toBe("Google Meet");
    expect(metadata.identifiers.meetingCode).toBe("abc-defg-hij");
    expect(metadata.title).toBe("Weekly product review");
    expect(metadata.sourceUrl).toContain("/abc-defg-hij");
  });
});
