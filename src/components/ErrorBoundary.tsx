
import * as React from "react";
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    // In a production environment, you would also log this error to a service like Sentry or LogRocket.
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-transparent flex flex-col items-center justify-center text-center p-4">
            <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
            <h1 className="text-3xl font-bold text-white">Oops! Something went wrong.</h1>
            <p className="text-zinc-400 mt-2">We've been notified of the issue. Please try refreshing the page.</p>
            <button
                onClick={() => window.location.reload()}
                className="mt-6 px-6 py-2 bg-pink-600 rounded-lg font-semibold hover:bg-pink-700 transition-colors"
            >
                Refresh Page
            </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
