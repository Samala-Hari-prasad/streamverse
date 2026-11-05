// scripts/generate-icon-registry.js

/**
 * Generates a compiled icon registry based on config/icons.config.js.
 * The output is written to src/components/_shared/iconRegistry.generated.js
 */
const fs = require('fs');
const path = require('path');

const configPath = path.resolve(__dirname, '..', 'config', 'icons.config.js');
const outputPath = path.resolve(__dirname, '..', 'src', 'components', '_shared', 'iconRegistry.generated.js');

if (!fs.existsSync(configPath)) {
  console.error('Icon config not found at', configPath);
  process.exit(1);
}

let icons = null;

try {
  const loaded = require(configPath);
  icons = Array.isArray(loaded) ? loaded : (loaded && loaded.default ? loaded.default : null);
} catch (_) {
  // ESM or syntax fallback: extract string literals from array in file
}

if (!Array.isArray(icons)) {
  const raw = fs.readFileSync(configPath, 'utf8');
  const match = raw.match(/\[([\s\S]*?)\]/);
  if (match) {
    icons = match[1]
      .split(',')
      .map(s => s.trim().replace(/['"`]/g, ''))
      .filter(Boolean);
  }
}

if (!Array.isArray(icons) || icons.length === 0) {
  console.error('Icon config must export or contain an array of icon names');
  process.exit(1);
}

let content = `// THIS FILE IS AUTO-GENERATED. DO NOT EDIT MANUALLY.
export const iconRegistry = {\n`;

icons.forEach((name) => {
  const safeName = name.replace(/[^a-zA-Z0-9_$]/g, '');
  content += `  ${safeName}: () => import('lucide/icons/${safeName}'),\n`;
});

content += `};\n`;

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, content, { encoding: 'utf8' });
console.log('Icon registry generated at', outputPath);
