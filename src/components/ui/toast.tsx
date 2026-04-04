import * as React from "react";
import { CheckCircle2, Info, AlertTriangle, XCircle, X } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/* ---------- Toast Types ---------- */

export interface ToastData {
  id: string;
  title?: string;
  description?: string;
  variant?: "default" | "success" | "info" | "warning" | "error";
  duration?: number;
}

type AddToastFn = (toast: Omit<ToastData, "id">) => string;
type RemoveToastFn = (id: string) => void;

/* ---------- State management (outside React tree) ---------- */

const listeners: Array<() => void> = [];
let memoryToasts: ToastData[] = [];

function emitChange() {
  listeners.forEach((l) => l());
}

function addToast(toast: Omit<ToastData, "id">): string {
  const id = crypto.randomUUID?.() ?? Math.random().toString(36).slice(2);
  memoryToasts.push({ id, ...toast });
  emitChange();
  return id;
}

function removeToast(id: string) {
  memoryToasts = memoryToasts.filter((t) => t.id !== id);
  emitChange();
}

/* ---------- Hook ---------- */

function useToast() {
  const [, forceRender] = React.useReducer((x: number) => x + 1, 0);

  React.useEffect(() => {
    listeners.push(forceRender);
    return () => {
      const idx = listeners.indexOf(forceRender);
      if (idx > -1) listeners.splice(idx, 1);
    };
  }, []);

  const dismiss = React.useCallback((id: string) => {
    removeToast(id);
  }, []);

  const toast = React.useCallback((opts: Omit<ToastData, "id">) => {
    const id = addToast(opts);
    if (opts.duration !== 0) {
      const ms = opts.duration ?? 5000;
      setTimeout(() => removeToast(id), ms);
    }
    return id;
  }, []);

  return { toasts: memoryToasts, toast, dismiss };
}

/* ---------- Icon mapping ---------- */

const variantIcon: Record<string, React.ElementType> = {
  success: CheckCircle2,
  info: Info,
  warning: AlertTriangle,
  error: XCircle,
};

const variantStyles: Record<string, string> = {
  default: "border-border",
  success: "border-brand-success/30 bg-brand-success/5",
  info: "border-border bg-card",
  warning: "border-brand-warning/30 bg-brand-warning/5",
  error: "border-brand-error/30 bg-brand-error/5",
};

const variantIconColor: Record<string, string> = {
  default: "text-text-secondary",
  success: "text-brand-success",
  info: "text-text-secondary",
  warning: "text-brand-warning",
  error: "text-brand-error",
};

/* ---------- Toast component ---------- */

export interface ToastProps extends React.HTMLAttributes<HTMLDivElement> {
  toast: ToastData;
  onDismiss: (id: string) => void;
}

function Toast({ toast, onDismiss, className, ...props }: ToastProps) {
  const variant = toast.variant ?? "default";
  const IconComponent = variantIcon[variant];

  return (
    <div
      role="alert"
      className={cn(
        "pointer-events-auto flex w-full items-start gap-3 rounded-lg border bg-card p-4 shadow-xl shadow-black/20 transition-all",
        variantStyles[variant],
        className,
      )}
      {...props}
    >
      {IconComponent && (
        <IconComponent
          className={cn("mt-0.5 h-5 w-5 shrink-0", variantIconColor[variant])}
        />
      )}
      <div className="min-w-0 flex-1">
        {toast.title && (
          <p className="text-sm font-semibold text-text-primary">{toast.title}</p>
        )}
        {toast.description && (
          <p className="mt-0.5 text-sm text-text-secondary">{toast.description}</p>
        )}
      </div>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 rounded-md p-0.5 text-text-tertiary hover:bg-card-hover hover:text-text-primary"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
Toast.displayName = "Toast";

/* ---------- Toaster (renders all active toasts) ---------- */

function Toaster({ className }: { className?: string }) {
  const { toasts, dismiss } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div
      className={cn(
        "fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col-reverse gap-2",
        className,
      )}
    >
      {toasts.map((t) => (
        <Toast key={t.id} toast={t} onDismiss={dismiss} />
      ))}
    </div>
  );
}
Toaster.displayName = "Toaster";

export { Toast, Toaster, useToast, addToast, removeToast };
