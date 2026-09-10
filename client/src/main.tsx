import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { ToastProvider } from './components/ui/Feedback';
import './index.css';

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: '' };
  }
  static getDerivedStateFromError(err: Error) {
    return { hasError: true, error: err?.message || 'Unknown error' };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ background: '#04060a', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: '#e2e8f0', fontFamily: 'sans-serif', padding: '2rem', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🛡️</div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#06b6d4', marginBottom: '0.5rem' }}>ScamShield AI</h1>
          <p style={{ color: '#94a3b8', marginBottom: '1rem' }}>Something went wrong loading the application.</p>
          <code style={{ background: '#0f172a', padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.75rem', color: '#f87171', maxWidth: '600px', wordBreak: 'break-all' }}>{this.state.error}</code>
          <button onClick={() => window.location.reload()} style={{ marginTop: '1.5rem', padding: '0.5rem 1.5rem', background: '#06b6d4', border: 'none', borderRadius: '8px', color: '#0f172a', fontWeight: 600, cursor: 'pointer' }}>
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <ToastProvider>
          <App />
        </ToastProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>,
);