import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './src/App';
import './index.css';
import { registerServiceWorker } from './src/lib/install';

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

registerServiceWorker();
