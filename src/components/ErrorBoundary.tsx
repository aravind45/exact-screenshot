import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);

        // Handle chunk loading errors (usually due to deployments replacing old chunks)
        const isDynamicImportError =
            error.message?.includes("Failed to fetch dynamically imported module") ||
            error.message?.includes("Importing a module script failed") ||
            error.message?.includes("error loading dynamically imported module");

        if (isDynamicImportError) {
            const hasReloaded = sessionStorage.getItem("dynamic_import_reload_attempted");
            if (!hasReloaded) {
                console.warn("Dynamic import error detected. Reloading page to fetch latest build...");
                sessionStorage.setItem("dynamic_import_reload_attempted", "true");
                window.location.reload();
            }
        }
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-background p-4">
                    <div className="max-w-2xl w-full bg-white border border-red-200 rounded-lg p-6">
                        <h1 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h1>
                        <div className="bg-red-50 border border-red-200 rounded p-4 mb-4">
                            <p className="font-mono text-sm text-red-800">
                                {this.state.error?.toString()}
                            </p>
                        </div>
                        <details className="mb-4">
                            <summary className="cursor-pointer text-sm font-semibold text-gray-700 mb-2">
                                Error Stack Trace
                            </summary>
                            <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto">
                                {this.state.error?.stack}
                            </pre>
                        </details>
                        <button
                            onClick={() => window.location.reload()}
                            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                        >
                            Reload Page
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
