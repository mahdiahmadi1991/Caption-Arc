import { DropdownSelect, type DropdownOption } from "../../shared/dropdown-select";
import { HelpPopover } from "../../shared/help-popover";

type SelectOption = {
  id: string;
  name: string;
  description?: string;
  badgeLabel?: string;
  badgeTone?: "accent" | "warning" | "neutral";
};

type SelectProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly SelectOption[] | SelectOption[];
  disabled?: boolean;
  helpMarkdown?: string;
};

export function Select({
  label,
  value,
  onChange,
  options,
  disabled = false,
  helpMarkdown,
}: SelectProps) {
  return (
    <div className="relative z-0 rounded-[1.6rem] border border-[var(--app-border)] bg-[var(--app-surface)] p-3.5 shadow-[0_14px_30px_var(--app-shadow)] backdrop-blur-xl focus-within:z-20 sm:p-4">
      <div
        className={`mb-2 flex items-center gap-2 text-sm font-medium text-[var(--app-text)] pointer-events-none ${
          disabled ? "opacity-60" : ""
        }`}
      >
        <span className="pointer-events-auto">{label}</span>
        {helpMarkdown ? (
          <HelpPopover label={label} markdown={helpMarkdown} disabled={disabled} />
        ) : null}
      </div>
      <DropdownSelect
        value={value}
        onChange={onChange}
        options={options as DropdownOption[]}
        disabled={disabled}
      />
    </div>
  );
}
