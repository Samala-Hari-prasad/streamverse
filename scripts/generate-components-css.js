// scripts/generate-components-css.js

/**
 * Generates an aggregated CSS file that imports all component CSS files alphabetically.
 * Output: src/assets/css/components.generated.css
 */
const fs = require('fs');
const path = require('path');

const componentsDir = path.resolve(__dirname, '..', 'src', 'components');
const outputPath = path.resolve(__dirname, '..', 'src', 'assets', 'css', 'components.generated.css');

function collectCssFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const cssFiles = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      // Skip internal helpers
      if (entry.name.startsWith('_')) continue;
      cssFiles.push(...collectCssFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.css')) {
      // Exclude generated files themselves
      if (entry.name.includes('generated')) continue;
      // Store path relative to src/assets/css for import
      const rel = path.relative(path.resolve(__dirname, '..', 'src', 'assets', 'css'), fullPath).replace(/\\/g, '/');
      cssFiles.push(rel);
    }
  }
  return cssFiles;
}

const cssFiles = collectCssFiles(componentsDir);
cssFiles.sort((a, b) => a.localeCompare(b));

let content = `/* THIS FILE IS AUTO-GENERATED. DO NOT EDIT MANUALLY. */\n`;
cssFiles.forEach((file) => {
  content += `@import "${file}";\n`;
});

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, content, { encoding: 'utf8' });
console.log('Components CSS generated at', outputPath);
