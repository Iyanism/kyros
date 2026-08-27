import { Component, type ErrorInfo, type ReactNode } from "react";
import { ErrorBoundaryPage } from "@/pages/error-boundary";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDebug?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console
    console.error("Error caught by boundary:", error, errorInfo);

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Here you could send to error tracking service
    // e.g., Sentry, LogRocket, etc.
    // sendErrorToService(error, errorInfo);
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Use default error page
      return (
        <ErrorBoundaryPage
          error={this.state.error || undefined}
          resetError={this.resetError}
          showDebug={this.props.showDebug}
        />
      );
    }

    return this.props.children;
  }
}