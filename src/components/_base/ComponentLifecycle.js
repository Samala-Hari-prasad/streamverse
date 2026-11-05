// src/components/_base/ComponentLifecycle.js
/**
 * Lifecycle mixin providing enable/disable, show/hide utilities.
 * Components can spread this into their class prototype.
 */
export const ComponentLifecycle = {
  enable() {
    this.disabled = false;
    this.element?.classList.remove('u-disabled');
  },
  disable() {
    this.disabled = true;
    this.element?.classList.add('u-disabled');
  },
  show() {
    this.hidden = false;
    this.element?.classList.remove('u-hidden');
  },
  hide() {
    this.hidden = true;
    this.element?.classList.add('u-hidden');
  }
};
