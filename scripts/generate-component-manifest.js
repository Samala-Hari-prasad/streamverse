// scripts/generate-component-manifest.js

/**
 * Scans all component folders for a `metadata.js` file and builds a manifest.
 * Writes the result to `src/components/manifest.generated.js`.
 */
const fs = require('fs');
const path = require('path');

const componentsDir = path.resolve(__dirname, '..', 'src', 'components');
const outputPath = path.resolve(componentsDir, 'manifest.generated.js');

function findMetadataFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const metadataFiles = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      // skip internal folders like _base, _shared, scripts
      if (entry.name.startsWith('_')) continue;
      metadataFiles.push(...findMetadataFiles(fullPath));
    } else if (entry.isFile() && entry.name === 'metadata.js') {
      metadataFiles.push(fullPath);
    }
  }
  return metadataFiles;
}

const metadataFiles = findMetadataFiles(componentsDir);

const manifest = [];
metadataFiles.forEach((file) => {
  // Resolve relative path for import
  const relPath = path.relative(componentsDir, file).replace(/\\/g, '/');
  const importPath = `./${relPath}`.replace(/\/\.js$/, '.js');
  const meta = require(file);
  manifest.push({ importPath, metadata: meta.metadata || meta });
});

// Build generated file content
let content = `// THIS FILE IS AUTO-GENERATED. DO NOT EDIT MANUALLY.
export const manifestInfo = {
  generatedAt: new Date().toISOString(),
  schemaVersion: "1.0.0",
  componentCount: ${manifest.length},
};

export const manifest = [
`;
manifest.forEach((item) => {
  content += `  require('${item.importPath}').metadata,
`;
});
content += `];
`;

fs.writeFileSync(outputPath, content, { encoding: 'utf8' });
console.log('Component manifest generated at', outputPath);
