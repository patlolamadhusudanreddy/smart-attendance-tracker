import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error('Frontend Error caught by boundary:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', fontFamily: 'sans-serif', textAlign: 'center', background: '#f8fafc', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <h1 style={{ color: '#ef4444', fontSize: '1.5rem', marginBottom: '1rem' }}>Something went wrong</h1>
          <p style={{ color: '#475569', marginBottom: '1rem', maxWidth: '600px' }}>{this.state.error?.message || 'An unexpected client error occurred'}</p>
          <pre style={{ textAlign: 'left', background: '#f1f5f9', color: '#0f172a', padding: '12px', fontSize: '11px', maxWidth: '800px', width: '90%', maxHeight: '250px', overflow: 'auto', borderRadius: '8px', border: '1px solid #cbd5e1', marginBottom: '1rem', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
            {this.state.error?.stack || 'No stack trace available'}
          </pre>
          <button onClick={() => { localStorage.clear(); window.location.href = '/login'; }} style={{ padding: '0.6rem 1.2rem', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
            Clear Session & Go to Login
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
