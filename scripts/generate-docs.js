// scripts/generate-docs.js

/**
 * Generates markdown documentation for each component based on its metadata and examples.
 * Output: docs/components/<component-id>.md and docs/components/index.md
 */
const fs = require('fs');
const path = require('path');

const componentsDir = path.resolve(__dirname, '..', 'src', 'components');
const docsRoot = path.resolve(__dirname, '..', 'docs', 'components');

function findComponentDirs(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const dirs = [];
  for (const entry of entries) {
    if (entry.isDirectory()) {
      // Skip internal helpers like _base, _shared, scripts
      if (entry.name.startsWith('_')) continue;
      const fullPath = path.join(dir, entry.name);
      // A component folder is expected to contain a metadata.js file
      if (fs.existsSync(path.join(fullPath, 'metadata.js'))) {
        dirs.push(fullPath);
      }
    }
  }
  return dirs;
}

function loadMetadata(metaPath) {
  try {
    // Use require with transpiled path
    const meta = require(metaPath);
    // Some components export { metadata } or default directly
    return meta.metadata || meta;
  } catch (e) {
    console.error('Failed to load metadata from', metaPath, e);
    return null;
  }
}

function generateComponentDoc(componentDir) {
  const metaPath = path.join(componentDir, 'metadata.js');
  const meta = loadMetadata(metaPath);
  if (!meta) return null;

  const componentId = meta.id || meta.name || path.basename(componentDir);
  const docLines = [];
  docLines.push(`# ${meta.name}`);
  docLines.push('');
  docLines.push('---');
  docLines.push('');
  docLines.push('## Metadata');
  docLines.push('```json');
  docLines.push(JSON.stringify(meta, null, 2));
  docLines.push('```');
  docLines.push('');

  // Load examples if present
  const examplesPath = path.join(componentDir, 'examples.js');
  if (fs.existsSync(examplesPath)) {
    try {
      const examples = require(examplesPath);
      docLines.push('## Examples');
      docLines.push('');
      if (Array.isArray(examples)) {
        examples.forEach((ex, idx) => {
          docLines.push(`### Example ${idx + 1}`);
          docLines.push('```js');
          docLines.push(typeof ex === 'string' ? ex : JSON.stringify(ex, null, 2));
          docLines.push('```');
          docLines.push('');
        });
      } else if (typeof examples === 'object') {
        docLines.push('```js');
        docLines.push(JSON.stringify(examples, null, 2));
        docLines.push('```');
        docLines.push('');
      }
    } catch (_) {
      // ignore if examples cannot be loaded
    }
  }

  // Additional sections (placeholders for now)
  const sections = ['Props', 'Methods', 'Variants', 'Accessibility', 'Theme support', 'Keyboard support', 'Version history'];
  sections.forEach((sec) => {
    docLines.push(`## ${sec}`);
    docLines.push('_No auto‑generated content yet._');
    docLines.push('');
  });

  return { componentId, content: docLines.join('\n') };
}

function main() {
  if (!fs.existsSync(docsRoot)) {
    fs.mkdirSync(docsRoot, { recursive: true });
  }
  const componentDirs = findComponentDirs(componentsDir);
  const indexLines = ['# Component Documentation', '', '---', '', '## Components'];

  componentDirs.forEach((dir) => {
    const result = generateComponentDoc(dir);
    if (!result) return;
    const { componentId, content } = result;
    const docPath = path.join(docsRoot, `${componentId}.md`);
    fs.writeFileSync(docPath, content, { encoding: 'utf8' });
    indexLines.push(`- [${componentId}](${componentId}.md)`);
  });

  // Write index file
  const indexPath = path.join(docsRoot, 'index.md');
  fs.writeFileSync(indexPath, indexLines.join('\n'), { encoding: 'utf8' });
  console.log('Documentation generated at', docsRoot);
}

main();
