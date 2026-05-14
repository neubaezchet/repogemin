import React, { Suspense, lazy } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

// ✅ Lazy load main app component for code splitting
const App = lazy(() => import('./App'));

// ✅ Loading fallback component
const LoadingSpinner = () => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0D1117 0%, #0A0F14 100%)',
  }}>
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
      <div style={{
        animation: 'spin 1s linear infinite',
        borderRadius: '50%',
        height: '64px',
        width: '64px',
        border: '4px solid rgba(255,255,255,0.1)',
        borderTopColor: '#3B82F6',
      }}></div>
      <p style={{
        textAlign: 'center',
        color: '#A8B2BE',
        fontWeight: '500',
        fontSize: '14px',
        margin: 0,
      }}>Cargando formulario...</p>
    </div>
    <style>{`
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    `}</style>
  </div>
);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Suspense fallback={<LoadingSpinner />}>
      <App />
    </Suspense>
  </React.StrictMode>
);

// ✅ Service Worker registration for offline support and caching
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('✅ Service Worker registered:', registration);
      })
      .catch(error => {
        console.log('Service Worker registration failed:', error);
      });
  });
}
