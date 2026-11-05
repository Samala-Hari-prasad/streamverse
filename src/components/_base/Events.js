// src/components/_base/Events.js
/**
 * Simple event emitter mixin.
 */
export const Events = {
  _listeners: {},
  on(event, callback) {
    if (!this._listeners[event]) this._listeners[event] = [];
    this._listeners[event].push(callback);
  },
  off(event, callback) {
    if (!this._listeners[event]) return;
    this._listeners[event] = this._listeners[event].filter(cb => cb !== callback);
  },
  emit(event, payload) {
    if (!this._listeners[event]) return;
    this._listeners[event].forEach(cb => cb(payload));
  }
};
