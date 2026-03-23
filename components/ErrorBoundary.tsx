
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("===== AEOHOLIC CRASH REPORT =====");
    console.error("Error:", error.message);
    console.error("Stack:", error.stack);
    console.error("Component Stack:", errorInfo.componentStack);
    this.setState({ errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          minHeight: '100vh', 
          background: '#0a0a0a', 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          padding: '40px',
          fontFamily: 'monospace'
        }}>
          <div style={{
            background: '#111',
            border: '1px solid #ff4444',
            borderRadius: '16px',
            padding: '40px',
            maxWidth: '800px',
            width: '100%'
          }}>
            <div style={{ color: '#ff4444', fontSize: '11px', fontWeight: 700, letterSpacing: '0.2em', marginBottom: '12px', textTransform: 'uppercase' }}>
              🔴 Dashboard Render Error
            </div>
            <h2 style={{ color: '#fff', fontSize: '20px', fontWeight: 700, marginBottom: '16px' }}>
              {this.state.error?.message || 'An unknown rendering error occurred'}
            </h2>
            <p style={{ color: '#aaa', fontSize: '13px', marginBottom: '24px', lineHeight: 1.6 }}>
              The dashboard crashed while trying to render the AI response. This usually means the AI returned 
              a field in an unexpected format. Open your browser's DevTools Console for the full crash report.
            </p>

            {this.state.error?.stack && (
              <div style={{ 
                background: '#0d0d0d', 
                border: '1px solid #333', 
                borderRadius: '8px', 
                padding: '16px',
                marginBottom: '24px',
                overflow: 'auto',
                maxHeight: '200px'
              }}>
                <pre style={{ color: '#ff8888', fontSize: '11px', margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                  {this.state.error.stack}
                </pre>
              </div>
            )}

            {this.state.errorInfo?.componentStack && (
              <div style={{ marginBottom: '24px' }}>
                <div style={{ color: '#777', fontSize: '10px', fontWeight: 700, letterSpacing: '0.15em', marginBottom: '8px', textTransform: 'uppercase' }}>
                  Component Stack
                </div>
                <div style={{ 
                  background: '#0d0d0d', 
                  border: '1px solid #333', 
                  borderRadius: '8px', 
                  padding: '16px',
                  overflow: 'auto',
                  maxHeight: '150px'
                }}>
                  <pre style={{ color: '#888', fontSize: '10px', margin: 0, whiteSpace: 'pre-wrap' }}>
                    {this.state.errorInfo.componentStack}
                  </pre>
                </div>
              </div>
            )}

            <button
              onClick={() => window.location.reload()}
              style={{
                background: '#4f46e5',
                color: '#fff',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '100px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                letterSpacing: '0.05em',
                textTransform: 'uppercase'
              }}
            >
              Reload App
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
