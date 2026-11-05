// theme.js
// Theme system supporting dark, light, amoled themes

let currentTheme = 'dark'; // default
const listeners = new Set();

export function initTheme() {
  const saved = localStorage.getItem('theme');
  if (saved) currentTheme = saved;
  applyTheme(currentTheme);
}

export function get() {
  return currentTheme;
}

export function set(themeName) {
  if (!['dark', 'light', 'amoled'].includes(themeName)) return;
  currentTheme = themeName;
  localStorage.setItem('theme', themeName);
  applyTheme(themeName);
  notify();
}

export function subscribe(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function toggle() {
  const next = currentTheme === 'dark' ? 'light' : 'dark';
  set(next);
}

function applyTheme(name) {
  document.documentElement.setAttribute('data-theme', name);
}

function notify() {
  listeners.forEach(cb => {
    try { cb(currentTheme); } catch (e) { console.error(e); }
  });
}

export const theme = {
  init: initTheme,
  get,
  set,
  subscribe,
  // internal only
  toggle,
};
