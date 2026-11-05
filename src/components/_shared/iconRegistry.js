// src/components/_shared/iconRegistry.js

/**
 * Wrapper around the generated icon registry.
 * Provides getIcon, preloadIcons, and hasIcon utilities.
 */
import { iconRegistry } from './iconRegistry.generated.js';

export async function getIcon(name) {
  const loader = iconRegistry[name];
  if (!loader) {
    throw new Error(`Icon "${name}" not registered`);
  }
  const module = await loader();
  return module.default;
}

export function hasIcon(name) {
  return !!iconRegistry[name];
}

export async function preloadIcons(names = []) {
  await Promise.all(names.map(getIcon));
}
