import * as React from "react";
import { cn } from "@/lib/utils";

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Image source URL */
  src?: string | null;
  /** Alt text for the image */
  alt?: string;
  /** Fallback text — used for initials when no image */
  fallback?: string;
  /** Size variant */
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  /** Shape variant */
  shape?: "circle" | "square";
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

const sizeClasses: Record<string, string> = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
  xl: "h-16 w-16 text-lg",
};

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, src, alt, fallback, size = "md", shape = "circle", ...props }, ref) => {
    const [imageError, setImageError] = React.useState(false);

    const showImage = src && !imageError;
    const initials = fallback ? getInitials(fallback) : "?";

    React.useEffect(() => {
      setImageError(false);
    }, [src]);

    return (
      <div
        ref={ref}
        className={cn(
          "relative inline-flex shrink-0 items-center justify-center overflow-hidden bg-brand-slate-light font-medium text-text-primary",
          shape === "circle" ? "rounded-full" : "rounded-lg",
          sizeClasses[size],
          className,
        )}
        {...props}
      >
        {showImage ? (
          <img
            src={src}
            alt={alt || fallback || "Avatar"}
            onError={() => setImageError(true)}
            className="h-full w-full object-cover"
          />
        ) : (
          <span aria-label={fallback || "User avatar"}>{initials}</span>
        )}
      </div>
    );
  },
);
Avatar.displayName = "Avatar";

export { Avatar };
