/**
 * src/core/app.js
 * Entry point for the StreamVerse application.
 * Initializes core services, renders the root component,
 * and starts the router.
 */
import { initTheme } from './theme.js';
import { initState } from './state.js';
import { initRouter } from './router.js';
import { initKeyboard } from './keyboard.js';
import { logger } from './logger.js';

export function initApp() {
  logger.info('Initializing StreamVerse app');
  initTheme(); // set default theme (dark)
  initState(); // create UI state store
  initRouter(); // set up routes
  initKeyboard(); // global shortcuts
  // Render root container (empty, features will populate)
  const appRoot = document.getElementById('app');
  if (!appRoot) {
    logger.error('Missing #app container in index.html');
    return;
  }
  appRoot.innerHTML = '<!-- UI will be injected by feature modules -->';
}

// Auto-start when script is loaded as a module
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
