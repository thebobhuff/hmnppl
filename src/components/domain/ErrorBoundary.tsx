/**
 * Error Boundaries — React error boundary with graceful degradation UI.
 *
 * Catches rendering errors and displays a fallback UI instead of
 * crashing the entire page. Logs errors to console and (in production)
 * to an error tracking service.
 */
"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Link from "next/link";

// ---------------------------------------------------------------------------
// Page-Level Error Boundary
// ---------------------------------------------------------------------------

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  name?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`[ErrorBoundary:${this.props.name ?? "unnamed"}]`, error, errorInfo);

    // In production, send to error tracking service:
    // if (process.env.NODE_ENV === "production") {
    //   reportToSentry(error, errorInfo);
    // }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Card className="mx-auto my-8 max-w-lg p-6 text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-brand-warning" />
          <h2 className="mt-4 font-display text-lg font-semibold text-text-primary">
            Something went wrong
          </h2>
          <p className="mt-2 text-sm text-text-secondary">
            {this.props.name
              ? `There was an error loading ${this.props.name}.`
              : "An unexpected error occurred."}
          </p>

          {process.env.NODE_ENV === "development" && this.state.error && (
            <details className="bg-brand-slate-dark mt-4 rounded-lg border border-border p-3 text-left">
              <summary className="cursor-pointer text-xs font-medium text-text-tertiary">
                Error Details (Development)
              </summary>
              <pre className="mt-2 overflow-x-auto text-xs text-brand-error">
                {this.state.error.message}
              </pre>
            </details>
          )}

          <div className="mt-6 flex justify-center gap-3">
            <Button variant="outline" onClick={this.handleReset}>
              <RefreshCw className="mr-1.5 h-4 w-4" />
              Try Again
            </Button>
            <Button asChild>
              <Link href="/dashboard">
                <Home className="mr-1.5 h-4 w-4" />
                Dashboard
              </Link>
            </Button>
          </div>
        </Card>
      );
    }

    return this.props.children;
  }
}

// ---------------------------------------------------------------------------
// Inline Error Boundary (for smaller UI sections)
// ---------------------------------------------------------------------------

export function InlineErrorBoundary({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <ErrorBoundary
      fallback={
        fallback ?? (
          <div className="bg-brand-slate-dark flex items-center gap-2 rounded-lg border border-border p-3 text-sm text-text-tertiary">
            <AlertTriangle className="h-4 w-4 flex-shrink-0 text-brand-warning" />
            This section failed to load.
          </div>
        )
      }
    >
      {children}
    </ErrorBoundary>
  );
}

// ---------------------------------------------------------------------------
// API Error Boundary (for data fetching errors)
// ---------------------------------------------------------------------------

export function APIErrorFallback({
  error,
  retry,
  message,
}: {
  error?: Error;
  retry?: () => void;
  message?: string;
}) {
  const isDegraded =
    error?.message?.includes("temporarily unavailable") ||
    error?.message?.includes("circuit breaker");

  return (
    <Card className="p-6 text-center">
      <AlertTriangle
        className={`mx-auto h-10 w-10 ${
          isDegraded ? "text-brand-warning" : "text-brand-error"
        }`}
      />
      <h3 className="mt-3 text-sm font-semibold text-text-primary">
        {isDegraded ? "Service Temporarily Unavailable" : "Failed to Load Data"}
      </h3>
      <p className="mt-1 text-xs text-text-tertiary">
        {message ??
          (isDegraded
            ? "The AI service is temporarily unavailable. Your request has been queued for manual review."
            : "Unable to fetch data. Please check your connection and try again.")}
      </p>
      {retry && (
        <Button variant="outline" size="sm" className="mt-4" onClick={retry}>
          <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
          Retry
        </Button>
      )}
    </Card>
  );
}
