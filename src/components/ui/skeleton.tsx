import * as React from "react";
import { cn } from "@/lib/utils";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Width */
  width?: string | number;
  /** Height */
  height?: string | number;
  /** Whether the skeleton is a circle */
  circle?: boolean;
}

function Skeleton({
  className,
  width,
  height,
  circle = false,
  style,
  ...props
}: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse bg-card-active",
        circle ? "rounded-full" : "rounded-md",
        className,
      )}
      style={{
        width: width ?? undefined,
        height: height ?? undefined,
        ...style,
      }}
      {...props}
    />
  );
}
Skeleton.displayName = "Skeleton";

/* Convenience preset components */

function SkeletonText({ rows = 3, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} height="12px" width={i === rows - 1 ? "60%" : "100%"} />
      ))}
    </div>
  );
}
SkeletonText.displayName = "SkeletonText";

function SkeletonCircle({ size = 40, className }: { size?: number; className?: string }) {
  return <Skeleton circle width={size} height={size} className={className} />;
}
SkeletonCircle.displayName = "SkeletonCircle";

function SkeletonRect({
  width = "100%",
  height = 100,
  className,
}: {
  width?: string | number;
  height?: string | number;
  className?: string;
}) {
  return <Skeleton width={width} height={height} className={className} />;
}
SkeletonRect.displayName = "SkeletonRect";

export { Skeleton, SkeletonText, SkeletonCircle, SkeletonRect };
