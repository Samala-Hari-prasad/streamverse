// src/components/_shared/validators.js
/**
 * Lightweight internal validation utilities for Phase 2 components.
 * These are kept minimal to avoid extra dependencies.
 */
export const validators = {
  isString(value) {
    return typeof value === 'string';
  },
  isBoolean(value) {
    return typeof value === 'boolean';
  },
  isNumber(value) {
    return typeof value === 'number' && !Number.isNaN(value);
  },
  isEnum(value, enumObj) {
    return Object.values(enumObj).includes(value);
  },
  // Add more as needed for component props
};
