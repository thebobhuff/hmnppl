import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { Check, ChevronDown, X, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MultiSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface MultiSelectProps {
  /** Available options */
  options: MultiSelectOption[];
  /** Currently selected values */
  value?: string[];
  /** Called when selection changes */
  onValueChange?: (value: string[]) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Whether the select is disabled */
  disabled?: boolean;
  /** Whether the select has an error */
  error?: boolean;
  /** Whether to show the search input */
  searchable?: boolean;
  /** Empty state text */
  emptyText?: string;
  /** Additional class names */
  className?: string;
  /** ID for the component */
  id?: string;
}

function MultiSelect({
  options,
  value = [],
  onValueChange,
  placeholder = "Select options...",
  disabled = false,
  error = false,
  searchable = false,
  emptyText = "No options found.",
  className,
  id,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");

  const filteredOptions = searchable
    ? options.filter((opt) => opt.label.toLowerCase().includes(search.toLowerCase()))
    : options;

  function handleToggle(optionValue: string) {
    const newValue = value.includes(optionValue)
      ? value.filter((v) => v !== optionValue)
      : [...value, optionValue];
    onValueChange?.(newValue);
  }

  function handleRemove(optionValue: string, e: React.MouseEvent) {
    e.stopPropagation();
    onValueChange?.(value.filter((v) => v !== optionValue));
  }

  function handleClearAll(e: React.MouseEvent) {
    e.stopPropagation();
    onValueChange?.([]);
  }

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild>
        <button
          id={id}
          disabled={disabled}
          role="combobox"
          aria-expanded={open}
          aria-invalid={error}
          className={cn(
            "flex min-h-[40px] w-full flex-wrap items-center gap-1 rounded-lg border bg-card px-3 py-2 font-body text-sm ring-offset-brand-dark-slate transition-colors hover:bg-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            error ? "border-brand-error" : "border-border",
            value.length === 0 && "text-text-tertiary",
            className,
          )}
        >
          {value.length === 0 ? (
            <span className="truncate">{placeholder}</span>
          ) : (
            <>
              {value.map((v) => {
                const opt = options.find((o) => o.value === v);
                if (!opt) return null;
                return (
                  <span
                    key={v}
                    className="inline-flex items-center gap-1 rounded-md bg-brand-slate-light px-2 py-0.5 text-xs font-medium text-text-primary"
                  >
                    {opt.label}
                    <button
                      type="button"
                      onClick={(e) => handleRemove(v, e)}
                      className="ml-0.5 rounded-sm p-0.5 text-text-tertiary hover:bg-card-active hover:text-text-primary"
                      aria-label={`Remove ${opt.label}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                );
              })}
            </>
          )}
          <div className="ml-auto flex shrink-0 items-center gap-1">
            {value.length > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                className="rounded-sm p-0.5 text-text-tertiary hover:text-text-primary"
                aria-label="Clear all"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
            <ChevronDown className="h-4 w-4 text-text-tertiary" />
          </div>
        </button>
      </PopoverPrimitive.Trigger>

      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 z-50 w-[var(--radix-popover-trigger-width)] rounded-lg border border-border bg-card p-1 shadow-xl shadow-black/20"
          sideOffset={4}
          align="start"
        >
          {searchable && (
            <div className="flex items-center border-b border-border px-2 pb-1 pt-1.5">
              <Search className="mr-2 h-4 w-4 shrink-0 text-text-tertiary" />
              <input
                className="flex-1 bg-transparent py-1 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}
          <div className="max-h-60 overflow-y-auto p-0.5">
            {filteredOptions.length === 0 ? (
              <p className="px-2 py-6 text-center text-sm text-text-tertiary">
                {emptyText}
              </p>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = value.includes(option.value);
                return (
                  <button
                    key={option.value}
                    disabled={option.disabled}
                    onClick={() => handleToggle(option.value)}
                    className={cn(
                      "relative flex w-full cursor-pointer select-none items-center rounded-md px-2 py-1.5 text-sm text-text-primary outline-none transition-colors hover:bg-card-hover focus:bg-card-hover",
                      option.disabled && "cursor-not-allowed opacity-50",
                      isSelected && "bg-card-active",
                    )}
                  >
                    <span
                      className={cn(
                        "mr-2 flex h-4 w-4 shrink-0 items-center justify-center rounded border border-border",
                        isSelected && "border-brand-primary bg-brand-primary",
                      )}
                    >
                      {isSelected && (
                        <Check className="h-3 w-3 text-text-inverse" strokeWidth={3} />
                      )}
                    </span>
                    {option.label}
                  </button>
                );
              })
            )}
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
MultiSelect.displayName = "MultiSelect";

export { MultiSelect };
