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

// The config file exports default array of icon names.
const icons = require(configPath);

if (!Array.isArray(icons)) {
  console.error('Icon config must export an array of icon names');
  process.exit(1);
}

let content = `// THIS FILE IS AUTO-GENERATED. DO NOT EDIT MANUALLY.
export const iconRegistry = {\n`;

icons.forEach((name) => {
  // Ensure name is a valid identifier string
  const safeName = name.replace(/[^a-zA-Z0-9_$]/g, '');
  content += `  ${safeName}: () => import('lucide/icons/${safeName}'),\n`;
});

content += `};\n`;

fs.writeFileSync(outputPath, content, { encoding: 'utf8' });
console.log('Icon registry generated at', outputPath);
