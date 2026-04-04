import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { ChevronLeft, ChevronRight, CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DatePickerProps {
  /** Selected date */
  value?: Date;
  /** Called when date changes */
  onChange?: (date: Date | undefined) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Whether the picker is disabled */
  disabled?: boolean;
  /** Whether the picker has an error */
  error?: boolean;
  /** Minimum selectable date */
  minDate?: Date;
  /** Maximum selectable date */
  maxDate?: Date;
  /** Additional class names */
  className?: string;
  /** ID for the component */
  id?: string;
}

function formatDate(date: Date | undefined): string {
  if (!date) return "";
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function isSameDay(a: Date | undefined, b: Date | undefined): boolean {
  if (!a || !b) return false;
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isDateDisabled(date: Date, minDate?: Date, maxDate?: Date): boolean {
  if (minDate && date < minDate) return true;
  if (maxDate && date > maxDate) return true;
  return false;
}

function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date...",
  disabled = false,
  error = false,
  minDate,
  maxDate,
  className,
  id,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [viewMonth, setViewMonth] = React.useState(
    value ? value.getMonth() : new Date().getMonth(),
  );
  const [viewYear, setViewYear] = React.useState(
    value ? value.getFullYear() : new Date().getFullYear(),
  );

  React.useEffect(() => {
    if (value) {
      setViewMonth(value.getMonth());
      setViewYear(value.getFullYear());
    }
  }, [value]);

  function handlePrevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  }

  function handleNextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  }

  function handleSelect(day: number) {
    const selected = new Date(viewYear, viewMonth, day);
    if (isDateDisabled(selected, minDate, maxDate)) return;
    onChange?.(selected);
    setOpen(false);
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation();
    onChange?.(undefined);
  }

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild>
        <button
          id={id}
          disabled={disabled}
          className={cn(
            "flex h-10 w-full items-center justify-between rounded-lg border bg-card px-3 py-2 font-body text-sm ring-offset-brand-dark-slate transition-colors hover:bg-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            error ? "border-brand-error" : "border-border",
            !value && "text-text-tertiary",
            className,
          )}
        >
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 text-text-tertiary" />
            <span>{value ? formatDate(value) : placeholder}</span>
          </div>
        </button>
      </PopoverPrimitive.Trigger>

      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 z-50 w-auto rounded-lg border border-border bg-card p-3 shadow-xl shadow-black/20"
          sideOffset={4}
          align="start"
        >
          {/* Header */}
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="rounded-md p-1 text-text-tertiary hover:bg-card-hover hover:text-text-primary"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-medium text-text-primary">
              {MONTHS[viewMonth]} {viewYear}
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              className="rounded-md p-1 text-text-tertiary hover:bg-card-hover hover:text-text-primary"
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Weekday headers */}
          <div className="mb-1 grid grid-cols-7 gap-0">
            {WEEKDAYS.map((day) => (
              <div
                key={day}
                className="flex h-8 w-8 items-center justify-center text-xs font-medium text-text-tertiary"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7 gap-0">
            {/* Empty cells for offset */}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="h-8 w-8" />
            ))}

            {/* Day cells */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const date = new Date(viewYear, viewMonth, day);
              const selected = isSameDay(date, value);
              const dayDisabled = isDateDisabled(date, minDate, maxDate);
              const today = isSameDay(date, new Date());

              return (
                <button
                  key={day}
                  type="button"
                  disabled={dayDisabled}
                  onClick={() => handleSelect(day)}
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-md text-sm transition-colors",
                    selected
                      ? "bg-brand-primary font-semibold text-text-inverse"
                      : today
                        ? "border border-brand-primary text-text-primary hover:bg-card-hover"
                        : "text-text-primary hover:bg-card-hover",
                    dayDisabled && "cursor-not-allowed text-text-tertiary opacity-50",
                  )}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
DatePicker.displayName = "DatePicker";

export { DatePicker };
