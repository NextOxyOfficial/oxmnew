'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Check if it's a ChunkLoadError
    const isChunkLoadError =
      error.name === 'ChunkLoadError' ||
      error.message.includes('Loading chunk') ||
      error.message.includes('ChunkLoadError');

    if (isChunkLoadError) {
      console.error('ChunkLoadError detected, reloading page...');
      // Reload the page to fetch the latest chunks
      window.location.reload();
      return;
    }

    // Log other errors
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen app-shell flex items-center justify-center px-4 py-10">
          <div className="plane w-full max-w-md">
            <div className="plane-section text-center">
              <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-rose-50">
                <svg
                  className="w-5 h-5 text-rose-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h2 className="text-base font-semibold text-slate-900">
                কিছু একটা সমস্যা হয়েছে
              </h2>
              <p className="mt-1 text-[13px] text-slate-500 break-words">
                {this.state.error?.message || 'অপ্রত্যাশিত একটা সমস্যা হয়েছে'}
              </p>

              {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                <details className="mt-4 text-left text-xs">
                  <summary className="cursor-pointer text-slate-500">
                    সমস্যার বিস্তারিত
                  </summary>
                  <pre className="mt-2 max-h-56 overflow-auto rounded-lg border border-slate-200 bg-slate-50 p-2 text-slate-600">
                    {this.state.error?.stack}
                  </pre>
                </details>
              )}
            </div>

            <div className="modal-foot">
              <button onClick={this.handleReset} className="btn btn-ghost">
                আবার চেষ্টা করুন
              </button>
              <button
                onClick={() => window.location.reload()}
                className="btn btn-primary"
              >
                পেজ রিলোড করুন
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
