import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { Check, ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps {
  /** Available options */
  options: SelectOption[];
  /** Currently selected value */
  value?: string;
  /** Called when selection changes */
  onValueChange?: (value: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Whether the select is disabled */
  disabled?: boolean;
  /** Whether the select has an error */
  error?: boolean;
  /** Whether to show the search input */
  searchable?: boolean;
  /** Empty state text when no options match search */
  emptyText?: string;
  /** Additional class names for the trigger button */
  className?: string;
  /** ID for the select */
  id?: string;
  /** Name attribute */
  name?: string;
}

function Select({
  options,
  value,
  onValueChange,
  placeholder = "Select an option...",
  disabled = false,
  error = false,
  searchable = false,
  emptyText = "No options found.",
  className,
  id,
  name,
}: SelectProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const triggerRef = React.useRef<HTMLButtonElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  const filteredOptions = searchable
    ? options.filter((opt) => opt.label.toLowerCase().includes(search.toLowerCase()))
    : options;

  function handleSelect(optionValue: string) {
    onValueChange?.(optionValue);
    setOpen(false);
    setSearch("");
  }

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild>
        <button
          ref={triggerRef}
          id={id}
          name={name}
          disabled={disabled}
          role="combobox"
          aria-expanded={open}
          aria-invalid={error}
          className={cn(
            "flex h-10 w-full items-center justify-between rounded-lg border bg-card px-3 py-2 font-body text-sm text-text-primary ring-offset-brand-dark-slate transition-colors hover:bg-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            error ? "border-brand-error" : "border-border",
            !selectedOption && "text-text-tertiary",
            className,
          )}
        >
          <span className="truncate">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 text-text-tertiary" />
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
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  disabled={option.disabled}
                  onClick={() => handleSelect(option.value)}
                  className={cn(
                    "relative flex w-full cursor-pointer select-none items-center rounded-md px-2 py-1.5 text-sm text-text-primary outline-none transition-colors hover:bg-card-hover focus:bg-card-hover",
                    option.disabled && "cursor-not-allowed opacity-50",
                    option.value === value && "bg-card-active",
                  )}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      option.value === value ? "text-brand-primary" : "text-transparent",
                    )}
                  />
                  {option.label}
                </button>
              ))
            )}
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
Select.displayName = "Select";

export { Select };
