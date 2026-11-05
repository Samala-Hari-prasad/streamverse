// src/components/_base/Accessibility.js
/**
 * Accessibility mixin – provides ARIA handling utilities.
 */
export const Accessibility = {
  setAria(attr, value) {
    if (this.element) {
      this.element.setAttribute(`aria-${attr}`, value);
    }
  },
  setRole(role) {
    if (this.element) {
      this.element.setAttribute('role', role);
    }
  },
  setLabel(label) {
    if (this.element) {
      this.element.setAttribute('aria-label', label);
    }
  },
  focus() {
    if (this.element) this.element.focus();
  },
  blur() {
    if (this.element) this.element.blur();
  }
};
