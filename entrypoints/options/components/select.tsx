import { DropdownSelect, type DropdownOption } from "../../shared/dropdown-select";

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
};

export function Select({
  label,
  value,
  onChange,
  options,
  disabled = false,
}: SelectProps) {
  return (
    <div className="relative z-0 rounded-[1.6rem] border border-[var(--app-border)] bg-[var(--app-surface)] p-3.5 shadow-[0_14px_30px_var(--app-shadow)] backdrop-blur-xl focus-within:z-20 sm:p-4">
      <label
        className={`mb-2 block text-sm font-medium text-[var(--app-text)] ${
          disabled ? "opacity-60" : ""
        }`}
      >
        {label}
      </label>
      <DropdownSelect
        value={value}
        onChange={onChange}
        options={options as DropdownOption[]}
        disabled={disabled}
      />
    </div>
  );
}
