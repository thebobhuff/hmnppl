import * as React from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TimePickerProps {
  /** Selected time as a string "HH:mm" (24h) */
  value?: string;
  /** Called when time changes */
  onChange?: (time: string) => void;
  /** Whether the picker is disabled */
  disabled?: boolean;
  /** Whether the picker has an error */
  error?: boolean;
  /** Time step in minutes (default 15) */
  minuteStep?: number;
  /** Use 12-hour format */
  use12Hour?: boolean;
  /** Placeholder text */
  placeholder?: string;
  /** Additional class names */
  className?: string;
  /** ID for the component */
  id?: string;
}

function TimePicker({
  value,
  onChange,
  disabled = false,
  error = false,
  minuteStep = 15,
  use12Hour = false,
  placeholder = "Select time...",
  className,
  id,
}: TimePickerProps) {
  const [internalValue, setInternalValue] = React.useState(value ?? "");

  React.useEffect(() => {
    if (value !== undefined) {
      setInternalValue(value);
    }
  }, [value]);

  function handleHourChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const hour = e.target.value;
    const currentMin = internalValue ? internalValue.split(":")[1] : "00";
    const newValue = `${hour.padStart(2, "0")}:${currentMin}`;
    setInternalValue(newValue);
    onChange?.(newValue);
  }

  function handleMinuteChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const minute = e.target.value;
    const currentHour = internalValue ? internalValue.split(":")[0] : "00";
    const newValue = `${currentHour}:${minute.padStart(2, "0")}`;
    setInternalValue(newValue);
    onChange?.(newValue);
  }

  function handlePeriodChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const period = e.target.value;
    const parts = internalValue ? internalValue.split(":") : ["12", "00"];
    let hour = parseInt(parts[0], 10);
    const minute = parts[1];

    if (period === "AM" && hour >= 12) {
      hour -= 12;
    } else if (period === "PM" && hour < 12) {
      hour += 12;
    }

    const newValue = `${hour.toString().padStart(2, "0")}:${minute}`;
    setInternalValue(newValue);
    onChange?.(newValue);
  }

  const parsedHour = internalValue ? parseInt(internalValue.split(":")[0], 10) : 0;
  const parsedMinute = internalValue ? internalValue.split(":")[1] : "00";
  const displayHour = use12Hour ? parsedHour % 12 || 12 : parsedHour;
  const currentPeriod = parsedHour >= 12 ? "PM" : "AM";

  const hours = use12Hour
    ? Array.from({ length: 12 }, (_, i) => i + 1)
    : Array.from({ length: 24 }, (_, i) => i);

  const minutes = Array.from({ length: 60 / minuteStep }, (_, i) =>
    (i * minuteStep).toString().padStart(2, "0"),
  );

  const selectClasses =
    "h-10 rounded-lg border border-border bg-card px-2 py-1 text-sm font-body text-text-primary ring-offset-brand-dark-slate transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none cursor-pointer hover:bg-card-hover";

  return (
    <div
      className={cn(
        "flex items-center gap-1.5",
        error && "[&>select]:border-brand-error",
        className,
      )}
    >
      <Clock className="h-4 w-4 shrink-0 text-text-tertiary" />
      <select
        id={id}
        disabled={disabled}
        value={displayHour}
        onChange={handleHourChange}
        className={selectClasses}
        aria-label="Hour"
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {hours.map((h) => (
          <option key={h} value={h}>
            {h.toString().padStart(2, "0")}
          </option>
        ))}
      </select>
      <span className="text-text-tertiary">:</span>
      <select
        disabled={disabled}
        value={parsedMinute}
        onChange={handleMinuteChange}
        className={selectClasses}
        aria-label="Minute"
      >
        {minutes.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </select>
      {use12Hour && (
        <select
          disabled={disabled}
          value={currentPeriod}
          onChange={handlePeriodChange}
          className={selectClasses}
          aria-label="AM or PM"
        >
          <option value="AM">AM</option>
          <option value="PM">PM</option>
        </select>
      )}
    </div>
  );
}
TimePicker.displayName = "TimePicker";

export { TimePicker };
