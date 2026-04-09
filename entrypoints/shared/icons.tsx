import type { LucideProps } from "lucide-react";
import {
  Archive,
  AlertTriangle,
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronUp,
  Clock3,
  ExternalLink,
  Eye,
  EyeOff,
  FlaskConical,
  LoaderCircle,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Sparkles,
  SquarePen,
  Star,
  Trash2,
  Upload,
  X,
} from "lucide-react";

type IconProps = LucideProps;

function withDefaults(props: IconProps): IconProps {
  return {
    "aria-hidden": true,
    strokeWidth: 1.9,
    ...props,
  };
}

export function GearIcon(props: IconProps) {
  return <Settings {...withDefaults(props)} />;
}

export function ArchiveIcon(props: IconProps) {
  return <Archive {...withDefaults(props)} />;
}

export function AlertTriangleIcon(props: IconProps) {
  return <AlertTriangle {...withDefaults(props)} />;
}

export function BeakerIcon(props: IconProps) {
  return <FlaskConical {...withDefaults(props)} />;
}

export function EyeIcon(props: IconProps) {
  return <Eye {...withDefaults(props)} />;
}

export function EyeOffIcon(props: IconProps) {
  return <EyeOff {...withDefaults(props)} />;
}

export function RefreshIcon(props: IconProps) {
  return <RefreshCw {...withDefaults(props)} />;
}

export function SearchIcon(props: IconProps) {
  return <Search {...withDefaults(props)} />;
}

export function TrashIcon(props: IconProps) {
  return <Trash2 {...withDefaults(props)} />;
}

export function CloseIcon(props: IconProps) {
  return <X {...withDefaults(props)} />;
}

export function ClockIcon(props: IconProps) {
  return <Clock3 {...withDefaults(props)} />;
}

export function BackIcon(props: IconProps) {
  return <ArrowLeft {...withDefaults(props)} />;
}

export function ExportIcon(props: IconProps) {
  return <Upload {...withDefaults(props)} />;
}

export function EditIcon(props: IconProps) {
  return <SquarePen {...withDefaults(props)} />;
}

export function ChevronDownIcon(props: IconProps) {
  return <ChevronDown {...withDefaults(props)} />;
}

export function ChevronUpIcon(props: IconProps) {
  return <ChevronUp {...withDefaults(props)} />;
}

export function OpenIcon(props: IconProps) {
  return <ExternalLink {...withDefaults(props)} />;
}

export function CheckIcon(props: IconProps) {
  return <Check {...withDefaults(props)} />;
}

export function PlusIcon(props: IconProps) {
  return <Plus {...withDefaults(props)} />;
}

export function SparklesIcon(props: IconProps) {
  return <Sparkles {...withDefaults(props)} />;
}

export function StarIcon(props: IconProps) {
  return <Star {...withDefaults(props)} />;
}

export function SpinnerIcon(props: IconProps) {
  return <LoaderCircle {...withDefaults(props)} />;
}
