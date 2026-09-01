import { Link, useRouteError, isRouteErrorResponse } from "react-router";
import { AlertTriangle, Home, RefreshCw, Bug } from "lucide-react";

export interface ErrorBoundaryPageProps {
  error?: Error | null;
  resetError?: () => void;
  showDebug?: boolean;
}

export function ErrorBoundaryPage({ 
  error: errorProp, 
  resetError, 
  showDebug = false 
}: ErrorBoundaryPageProps) {
  let routeError: unknown = null;
  try {
    // Attempt to retrieve error from React Router context if not passed as prop
    // eslint-disable-next-line react-hooks/rules-of-hooks
    routeError = useRouteError();
  } catch {
    // Outside router context
  }

  const activeError: unknown = errorProp ?? routeError;
  const hasError = activeError !== null && activeError !== undefined;
  const isDevelopment = import.meta.env.DEV || showDebug;

  let title = "Something went wrong";
  let description = "We're sorry, but an unexpected error occurred. Please try again later.";
  let errorName = "Error";
  let errorMessage = "An unexpected error occurred.";
  let errorStack: string | undefined = undefined;

  if (isRouteErrorResponse(activeError)) {
    title = `${activeError.status} ${activeError.statusText || "Error"}`;
    description = (activeError.data as { message?: string } | null)?.message || activeError.statusText || "Page or resource error.";
    errorName = `HTTP ${activeError.status}`;
    errorMessage = typeof activeError.data === "string" ? activeError.data : JSON.stringify(activeError.data || {});
  } else if (activeError instanceof Error) {
    errorName = activeError.name;
    errorMessage = activeError.message;
    errorStack = activeError.stack;
  } else if (hasError) {
    errorMessage = String(activeError);
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#fbfcfe] px-6 text-center">
      {/* Error Icon */}
      <div className="relative">
        <div className="h-20 w-20 rounded-full bg-[#fef2f2] flex items-center justify-center">
          <AlertTriangle className="h-10 w-10 text-[#dc2626]" />
        </div>
        {hasError && isDevelopment && (
          <div className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-[#dc2626] text-white text-[10px] font-bold flex items-center justify-center">
            !
          </div>
        )}
      </div>

      {/* Error Message */}
      <div className="space-y-2">
        <h1 className="font-display text-[clamp(2rem,5vw,3rem)] font-semibold leading-none tracking-[-0.07em] text-[#13213a]">
          {title}
        </h1>
        <p className="text-[15px] text-[#7b8799] max-w-md">
          {description}
        </p>
      </div>

      {/* Action Buttons */}
      <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={resetError || (() => window.location.reload())}
          className="flex items-center gap-2 rounded-[10px] bg-[#2457e6] px-5 py-2.5 text-[13px] font-semibold text-white transition hover:bg-[#1746cd]"
        >
          <RefreshCw className="h-4 w-4" />
          Try Again
        </button>
        <Link
          to="/"
          className="flex items-center gap-2 rounded-[10px] border border-[#e2e8f0] bg-white px-5 py-2.5 text-[13px] font-semibold text-[#13213a] transition hover:bg-[#f8fafc]"
        >
          <Home className="h-4 w-4" />
          Back to Home
        </Link>
        {isDevelopment && hasError && (
          <button
            type="button"
            onClick={() => console.error(activeError)}
            className="flex items-center gap-2 rounded-[10px] border border-[#fecaca] bg-[#fef2f2] px-5 py-2.5 text-[13px] font-semibold text-[#dc2626] transition hover:bg-[#fee2e2]"
          >
            <Bug className="h-4 w-4" />
            Log Error
          </button>
        )}
      </div>

      {/* Debug Info (Development Only) */}
      {isDevelopment && hasError && (
        <div className="mt-6 w-full max-w-2xl text-left">
          <div className="rounded-[12px] border border-[#fecaca] bg-[#fef2f2] p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[12px] font-bold uppercase tracking-wider text-[#dc2626] flex items-center gap-2">
                <Bug className="h-4 w-4" />
                Error Details (Development Mode)
              </span>
              <button
                type="button"
                onClick={() => {
                  const details = document.getElementById('error-details');
                  if (details) {
                    details.classList.toggle('hidden');
                  }
                }}
                className="text-[11px] text-[#64748b] hover:text-[#13213a]"
              >
                Toggle
              </button>
            </div>
            <div id="error-details" className="space-y-2 text-[13px]">
              <div>
                <span className="font-semibold text-[#13213a]">Error:</span>
                <span className="ml-2 text-[#dc2626]">{errorName}</span>
              </div>
              <div>
                <span className="font-semibold text-[#13213a]">Message:</span>
                <span className="ml-2 text-[#64748b] break-all">{errorMessage}</span>
              </div>
              {errorStack && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-[12px] font-medium text-[#2457e6] hover:text-[#1746cd]">
                    View Stack Trace
                  </summary>
                  <pre className="mt-2 max-h-48 overflow-auto rounded bg-[#f8fafc] p-3 text-[11px] text-[#475569] whitespace-pre-wrap break-all border border-[#e2e8f0]">
                    {errorStack}
                  </pre>
                </details>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}