import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/* ---------- Drawer positions ---------- */

const drawerVariants = cva(
  "fixed z-50 flex flex-col gap-4 border-border bg-card shadow-xl shadow-black/20 transition ease-in-out data-[state=closed]:duration-300 data-[state=open]:duration-300 data-[state=open]:animate-in data-[state=closed]:animate-out",
  {
    variants: {
      side: {
        right:
          "inset-y-0 right-0 h-full w-3/4 max-w-sm border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right",
        bottom:
          "inset-x-0 bottom-0 w-full max-h-[85vh] rounded-t-xl border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
      },
    },
    defaultVariants: {
      side: "right",
    },
  },
);

/* ---------- Root ---------- */

const Drawer = DialogPrimitive.Root;
const DrawerTrigger = DialogPrimitive.Trigger;
const DrawerClose = DialogPrimitive.Close;
const DrawerPortal = DialogPrimitive.Portal;

/* ---------- Overlay ---------- */

const DrawerOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/60 backdrop-blur-sm",
      className,
    )}
    {...props}
  />
));
DrawerOverlay.displayName = "DrawerOverlay";

/* ---------- Content ---------- */

export interface DrawerContentProps
  extends
    React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>,
    VariantProps<typeof drawerVariants> {
  /** Whether to show the close button */
  showClose?: boolean;
}

const DrawerContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  DrawerContentProps
>(({ className, children, side, showClose = true, ...props }, ref) => (
  <DrawerPortal>
    <DrawerOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(drawerVariants({ side }), "p-6", className)}
      {...props}
    >
      {/* Bottom drawer handle */}
      {side === "bottom" && (
        <div className="mx-auto mb-2 h-1.5 w-12 rounded-full bg-border-light" />
      )}
      {children}
      {showClose && (
        <DialogPrimitive.Close className="absolute right-4 top-4 rounded-md p-1 text-text-tertiary ring-offset-brand-dark-slate transition-colors hover:bg-card-hover hover:text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      )}
    </DialogPrimitive.Content>
  </DrawerPortal>
));
DrawerContent.displayName = "DrawerContent";

/* ---------- Header ---------- */

function DrawerHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col space-y-1.5", className)} {...props} />;
}
DrawerHeader.displayName = "DrawerHeader";

/* ---------- Title ---------- */

const DrawerTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "font-display text-lg font-semibold leading-none tracking-tight text-text-primary",
      className,
    )}
    {...props}
  />
));
DrawerTitle.displayName = "DrawerTitle";

/* ---------- Description ---------- */

const DrawerDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-text-secondary", className)}
    {...props}
  />
));
DrawerDescription.displayName = "DrawerDescription";

/* ---------- Footer ---------- */

function DrawerFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "mt-auto flex flex-col-reverse border-t border-border pt-4 sm:flex-row sm:justify-end sm:space-x-2",
        className,
      )}
      {...props}
    />
  );
}
DrawerFooter.displayName = "DrawerFooter";

export {
  Drawer,
  DrawerTrigger,
  DrawerClose,
  DrawerPortal,
  DrawerOverlay,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
};
