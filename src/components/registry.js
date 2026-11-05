// src/components/registry.js
/**
 * Component Registry – stores component metadata for discovery.
 * Used by the Playground, documentation generator and plugin system.
 */
const registry = new Map();

export function registerComponent(metadata) {
  if (!metadata || !metadata.name) {
    throw new Error('Component metadata must have a name');
  }
  registry.set(metadata.name, metadata);
}

export function unregisterComponent(name) {
  registry.delete(name);
}

export function getComponent(name) {
  return registry.get(name);
}

export function hasComponent(name) {
  return registry.has(name);
}

export function getAllComponents() {
  return Array.from(registry.values());
}

export function getComponentsByCategory(category) {
  return Array.from(registry.values()).filter(c => c.category === category);
}
