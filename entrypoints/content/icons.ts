import {
  ArrowDown,
  ChevronDown,
  ChevronUp,
  FileText,
  GripHorizontal,
  Info,
  Maximize2,
  MessageSquareText,
  Minimize2,
  RefreshCw,
  Settings,
  Sparkles,
  X,
  createElement as createLucideElement,
} from "lucide";

const CONTENT_ICONS = {
  "arrow-down": ArrowDown,
  "chevron-down": ChevronDown,
  "chevron-up": ChevronUp,
  collapse: Minimize2,
  expand: Maximize2,
  "file-text": FileText,
  "grip-horizontal": GripHorizontal,
  info: Info,
  maximize: Maximize2,
  "message-square": MessageSquareText,
  minimize: Minimize2,
  refresh: RefreshCw,
  settings: Settings,
  sparkles: Sparkles,
  close: X,
} as const;

export type ContentIconName = keyof typeof CONTENT_ICONS;

type IconAttrs = {
  className?: string;
  size?: number;
  strokeWidth?: number;
};

export function createContentIcon(
  name: ContentIconName,
  attrs: IconAttrs = {}
): SVGElement {
  const { className, size = 16, strokeWidth = 1.9 } = attrs;

  return createLucideElement(CONTENT_ICONS[name], {
    width: size,
    height: size,
    "stroke-width": strokeWidth,
    class: className,
    "aria-hidden": "true",
  });
}
