// state.js
// Simple observable state store

let state = {};
const listeners = new Set();

export function initState(initial = {}) {
  state = { ...initial };
  notify();
}

export function get(key) {
  return key !== undefined ? state[key] : { ...state };
}

export function set(key, value) {
  if (key === undefined) return;
  state[key] = value;
  notify();
}

export function update(partial) {
  if (typeof partial === 'object') {
    state = { ...state, ...partial };
    notify();
  }
}

export function subscribe(callback) {
  listeners.add(callback);
  // return unsubscribe
  return () => listeners.delete(callback);
}

function notify() {
  listeners.forEach(cb => {
    try { cb(state); } catch (e) { console.error('State listener error', e); }
  });
}
