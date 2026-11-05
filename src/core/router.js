// router.js
// Simple hash-based router for SPA navigation

import { logger } from './logger.js';

// Hook registries
const beforeNavigateHooks = [];
const afterNavigateHooks = [];
const beforeRenderHooks = [];
const afterRenderHooks = [];

export function beforeNavigate(callback) {
  if (typeof callback === 'function') beforeNavigateHooks.push(callback);
}
export function afterNavigate(callback) {
  if (typeof callback === 'function') afterNavigateHooks.push(callback);
}
export function beforeRender(callback) {
  if (typeof callback === 'function') beforeRenderHooks.push(callback);
}
export function afterRender(callback) {
  if (typeof callback === 'function') afterRenderHooks.push(callback);
}

const routes = {};

export function registerRoute(path, handler) {
  routes[path] = handler;
}

export function navigate(path) {
  // beforeNavigate hooks
  beforeNavigateHooks.forEach(cb => {
    try { cb(path); } catch (e) { logger.error('beforeNavigate hook error', e); }
  });
  window.location.hash = `#${path}`;
  // afterNavigate hooks
  afterNavigateHooks.forEach(cb => {
    try { cb(path); } catch (e) { logger.error('afterNavigate hook error', e); }
  });
}

function onHashChange() {
  const hash = window.location.hash.slice(1) || 'home';
  const handler = routes[hash];
  // beforeRender hooks
  beforeRenderHooks.forEach(cb => {
    try { cb(hash); } catch (e) { logger.error('beforeRender hook error', e); }
  });
  if (handler) {
    logger.debug('Navigating to', hash);
    try { handler(); } catch (e) { logger.error('Route handler error', e); }
  } else {
    logger.warn('No route handler for', hash);
  }
  // afterRender hooks
  afterRenderHooks.forEach(cb => {
    try { cb(hash); } catch (e) { logger.error('afterRender hook error', e); }
  });
}

export function initRouter() {
  window.addEventListener('hashchange', onHashChange);
  // Initial navigation
  onHashChange();
}

// Export for use in app.js
export const router = { registerRoute, navigate, init: initRouter };
