// components/shared/error-boundary.tsx
import { Link } from "react-router";
import { AlertTriangle, Home, RefreshCw, Bug } from "lucide-react";

interface ErrorBoundaryPageProps {
  error?: Error;
  resetError?: () => void;
  showDebug?: boolean;
}

export function ErrorBoundaryPage({ 
  error, 
  resetError, 
  showDebug = false 
}: ErrorBoundaryPageProps) {
  // Determine if we're in development
  const isDevelopment = import.meta.env.DEV || showDebug;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#fbfcfe] px-6 text-center">
      {/* Error Icon */}
      <div className="relative">
        <div className="h-20 w-20 rounded-full bg-[#fef2f2] flex items-center justify-center">
          <AlertTriangle className="h-10 w-10 text-[#dc2626]" />
        </div>
        {error && isDevelopment && (
          <div className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-[#dc2626] text-white text-[10px] font-bold flex items-center justify-center">
            !
          </div>
        )}
      </div>

      {/* Error Message */}
      <div className="space-y-2">
        <h1 className="font-display text-[clamp(2rem,5vw,3rem)] font-semibold leading-none tracking-[-0.07em] text-[#13213a]">
          Something went wrong
        </h1>
        <p className="text-[15px] text-[#7b8799] max-w-md">
          We're sorry, but an unexpected error occurred. Please try again later.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
        <button
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
        {isDevelopment && error && (
          <button
            onClick={() => console.error(error)}
            className="flex items-center gap-2 rounded-[10px] border border-[#fecaca] bg-[#fef2f2] px-5 py-2.5 text-[13px] font-semibold text-[#dc2626] transition hover:bg-[#fee2e2]"
          >
            <Bug className="h-4 w-4" />
            Log Error
          </button>
        )}
      </div>

      {/* Debug Info (Development Only) */}
      {isDevelopment && error && (
        <div className="mt-6 w-full max-w-2xl text-left">
          <div className="rounded-[12px] border border-[#fecaca] bg-[#fef2f2] p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[12px] font-bold uppercase tracking-wider text-[#dc2626] flex items-center gap-2">
                <Bug className="h-4 w-4" />
                Error Details (Development Mode)
              </span>
              <button
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
                <span className="ml-2 text-[#dc2626]">{error.name}</span>
              </div>
              <div>
                <span className="font-semibold text-[#13213a]">Message:</span>
                <span className="ml-2 text-[#64748b] break-all">{error.message}</span>
              </div>
              {error.stack && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-[12px] font-medium text-[#2457e6] hover:text-[#1746cd]">
                    View Stack Trace
                  </summary>
                  <pre className="mt-2 max-h-48 overflow-auto rounded bg-[#f8fafc] p-3 text-[11px] text-[#475569] whitespace-pre-wrap break-all border border-[#e2e8f0]">
                    {error.stack}
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