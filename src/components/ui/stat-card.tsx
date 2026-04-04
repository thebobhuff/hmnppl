import * as React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Stat label (e.g., "Total Employees") */
  label: string;
  /** Stat value (e.g., "1,234") */
  value: string | number;
  /** Trend direction */
  trend?: "up" | "down" | "neutral";
  /** Trend value label (e.g., "+12.5%") */
  trendLabel?: string;
  /** Icon displayed in the top right */
  icon?: React.ReactNode;
  /** Whether the card is loading */
  loading?: boolean;
}

function StatCard({
  label,
  value,
  trend,
  trendLabel,
  icon,
  loading = false,
  className,
  ...props
}: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card p-5 transition-colors hover:border-border-light hover:bg-card-hover",
        className,
      )}
      {...props}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-text-secondary">{label}</p>
          {loading ? (
            <div className="h-8 w-24 animate-pulse rounded bg-card-active" />
          ) : (
            <p className="font-display text-2xl font-bold text-text-primary">{value}</p>
          )}
        </div>
        {icon && (
          <div className="rounded-lg bg-brand-slate-light p-2.5 text-text-secondary">
            {icon}
          </div>
        )}
      </div>

      {(trend || trendLabel) && !loading && (
        <div className="mt-3 flex items-center gap-1.5">
          {trend === "up" && <TrendingUp className="h-4 w-4 text-brand-success" />}
          {trend === "down" && <TrendingDown className="h-4 w-4 text-brand-error" />}
          {trend === "neutral" && <Minus className="h-4 w-4 text-text-tertiary" />}
          {trendLabel && (
            <span
              className={cn(
                "text-xs font-medium",
                trend === "up" && "text-brand-success",
                trend === "down" && "text-brand-error",
                trend === "neutral" && "text-text-tertiary",
                !trend && "text-text-tertiary",
              )}
            >
              {trendLabel}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
StatCard.displayName = "StatCard";

export { StatCard };
