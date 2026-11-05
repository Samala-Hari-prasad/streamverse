// scripts/build-summary.js

/**
 * Reads build outputs, metrics, and prints an executive build summary table.
 */
const fs = require('fs');
const path = require('path');

const BUILD_CONFIG = path.resolve(__dirname, '../build.config.json');
const COMPONENTS_DIR = path.resolve(__dirname, '../src/components');
const CSS_OUTPUT = path.resolve(__dirname, '../src/assets/css/components.generated.css');
const MANIFEST_OUTPUT = path.resolve(COMPONENTS_DIR, 'manifest.generated.js');
const ICON_OUTPUT = path.resolve(COMPONENTS_DIR, '_shared/iconRegistry.generated.js');
const PLAYGROUND_OUTPUT = path.resolve(__dirname, '../public/playground.html');
const DOCS_DIR = path.resolve(__dirname, '../docs/components');

function getFileSize(filePath) {
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    return `${(stats.size / 1024).toFixed(2)} KB`;
  }
  return 'Missing';
}

function countComponents() {
  if (!fs.existsSync(COMPONENTS_DIR)) return 0;
  return fs.readdirSync(COMPONENTS_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory() && !d.name.startsWith('_'))
    .length;
}

function countIcons() {
  if (!fs.existsSync(ICON_OUTPUT)) return 0;
  const content = fs.readFileSync(ICON_OUTPUT, 'utf8');
  const matches = content.match(/:\s*\(\)\s*=>/g);
  return matches ? matches.length : 0;
}

let buildConfig = { pipelineVersion: '2.0.0', minimumComponentScore: 95 };
try {
  buildConfig = JSON.parse(fs.readFileSync(BUILD_CONFIG, 'utf8'));
} catch (_) {}

const componentCount = countComponents();
const iconCount = countIcons();
const cssSize = getFileSize(CSS_OUTPUT);
const manifestStatus = fs.existsSync(MANIFEST_OUTPUT) ? '✅ Ready' : '❌ Missing';
const playgroundStatus = fs.existsSync(PLAYGROUND_OUTPUT) ? '✅ Ready' : '❌ Missing';
const docsCount = fs.existsSync(DOCS_DIR) ? fs.readdirSync(DOCS_DIR).filter(f => f.endsWith('.md')).length : 0;

console.log('\n======================================================');
console.log('       STREAMVERSE PHASE 2 BUILD PIPELINE SUMMARY     ');
console.log('======================================================');
console.log(` Pipeline Version         : ${buildConfig.pipelineVersion}`);
console.log(` Target Component Score   : ${buildConfig.minimumComponentScore}/100`);
console.log('------------------------------------------------------');
console.log(` Active Components        : ${componentCount}`);
console.log(` Compiled Icons           : ${iconCount}`);
console.log(` Generated CSS Bundle     : ${cssSize}`);
console.log(` Component Manifest       : ${manifestStatus}`);
console.log(` Interactive Playground   : ${playgroundStatus}`);
console.log(` Generated Docs Pages     : ${docsCount}`);
console.log('======================================================');

