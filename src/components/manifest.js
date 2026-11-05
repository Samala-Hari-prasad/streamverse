// src/components/manifest.js

/**
 * Component manifest loader.
 * It re-exports the generated manifest and manifestInfo.
 * The generated file is created by scripts/generate-component-manifest.js.
 */
import { manifest, manifestInfo } from './manifest.generated.js';

export { manifest, manifestInfo };

export function getManifest() {
  return manifest;
}
