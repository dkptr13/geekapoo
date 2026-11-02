import './utils/polyfillFetch.ts';
import { inject } from '@vercel/analytics';
import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Analítica de Vercel: sin cookies (no hace falta banner de
// consentimiento) y solo se activa en producción. El panel hay que
// habilitarlo una vez en Vercel → Project → Analytics.
inject();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
