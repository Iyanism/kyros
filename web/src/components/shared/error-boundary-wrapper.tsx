import { ErrorBoundary } from "@/components/shared/error-boundary-classes";
import { type ReactNode } from "react";

interface ErrorBoundaryWrapperProps {
  children: ReactNode;
  name?: string; // For debugging
  showDebug?: boolean;
}

export function ErrorBoundaryWrapper({ 
  children, 
  name = "App",
  showDebug = import.meta.env.DEV 
}: ErrorBoundaryWrapperProps) {
  return (
    <ErrorBoundary
      showDebug={showDebug}
      onError={(error, errorInfo) => {
        console.error(`[${name}] Error caught:`, {
          error: error.message,
          componentStack: errorInfo.componentStack,
        });
      }}
    >
      {children}
    </ErrorBoundary>
  );
}