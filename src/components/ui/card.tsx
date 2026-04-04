import * as React from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Whether the card should have hover effect */
  hoverable?: boolean;
  /** Whether the card is clickable */
  clickable?: boolean;
  /** Padding variant */
  padding?: "none" | "sm" | "default" | "lg";
}

function Card({
  className,
  hoverable = false,
  clickable = false,
  padding = "default",
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card text-text-primary transition-colors",
        {
          "hover:border-border-light hover:bg-card-hover": hoverable || clickable,
          "cursor-pointer": clickable,
          "p-0": padding === "none",
          "p-3": padding === "sm",
          "p-5": padding === "default",
          "p-6": padding === "lg",
        },
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
Card.displayName = "Card";

function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col space-y-1.5", className)} {...props} />;
}
CardHeader.displayName = "CardHeader";

function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        "font-display text-lg font-semibold leading-none tracking-tight text-text-primary",
        className,
      )}
      {...props}
    />
  );
}
CardTitle.displayName = "CardTitle";

function CardSubtitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm text-text-secondary", className)} {...props} />;
}
CardSubtitle.displayName = "CardSubtitle";

function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("", className)} {...props} />;
}
CardContent.displayName = "CardContent";

function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex items-center", className)} {...props} />;
}
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardTitle, CardSubtitle, CardContent, CardFooter };
