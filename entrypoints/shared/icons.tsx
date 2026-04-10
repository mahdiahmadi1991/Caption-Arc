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

export function GithubIcon(props: IconProps) {
  const resolved = withDefaults(props);

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...resolved}
    >
      <path d="M9 19c-4.5 1.5-4.5-2.5-6-3" />
      <path d="M15 21v-3.9a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 19 3.77 5.07 5.07 0 0 0 18.91 1S17.73.65 15 2.48a13.38 13.38 0 0 0-6 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 3.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 6.96A3.37 3.37 0 0 0 9 17.1V21" />
    </svg>
  );
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
