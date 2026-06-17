import '@fontsource-variable/inter/index.css';
// Serif display do "gabinete": títulos com cara de livro de estudo.
import '@fontsource-variable/fraunces/wght.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { APP_NAME } from './config/appIdentity';
import { App } from './ui/App';
import './index.css';

document.title = `${APP_NAME} - treino de xadrez`;

const rootElement = document.getElementById('root');

if (rootElement === null) {
  throw new Error('Root element not found');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
