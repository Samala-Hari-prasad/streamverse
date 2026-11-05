// scripts/validate-components.js
// This script validates the component contract and metadata before any generation steps.
// It follows the validation order specified in the architecture.

const fs = require('fs');
const path = require('path');

const COMPONENTS_ROOT = path.resolve(__dirname, '../src/components');
const BUILD_CONFIG = path.resolve(__dirname, '../build.config.json');

function loadBuildConfig() {
  try {
    return JSON.parse(fs.readFileSync(BUILD_CONFIG, 'utf-8'));
  } catch (e) {
    console.error('Failed to load build.config.json', e);
    process.exit(1);
  }
}

const buildConfig = loadBuildConfig();

function report() {
  return { info: [], warnings: [], errors: [] };
}

function validateFolderStructure() {
  const rpt = report();
  const entries = fs.readdirSync(COMPONENTS_ROOT, { withFileTypes: true })
    .filter(d => d.isDirectory() && !d.name.startsWith('_'))
    .map(d => d.name);
  if (entries.length === 0) {
    rpt.warnings.push('No component directories found under src/components');
  }
  return rpt;
}

function getComponentFiles(compPath) {
  return fs.readdirSync(compPath);
}

function validateComponent(compName) {
  const rpt = report();
  const compPath = path.join(COMPONENTS_ROOT, compName);
  const files = getComponentFiles(compPath);

  const requiredFiles = [
    'metadata.js',
    `${compName}.js`,
    `${compName}.view.js`,
    `${compName}.css`,
    'variants.js',
    'examples.js',
    'README.md',
    'tests'
  ];

  requiredFiles.forEach(f => {
    const found = files.some(file => file.toLowerCase() === f.toLowerCase());
    if (!found) {
      rpt.errors.push(`Missing required file ${f} in component ${compName}`);
    }
  });

  // Metadata schema validation (basic required fields)
  const metaPath = path.join(compPath, 'metadata.js');
  if (fs.existsSync(metaPath)) {
    try {
      const meta = require(metaPath).metadata;
      const requiredFields = ['id', 'name', 'displayName', 'description', 'category'];
      requiredFields.forEach(key => {
        if (!meta[key]) {
          rpt.errors.push(`Metadata field '${key}' missing in component ${compName}`);
        }
      });
    } catch (e) {
      rpt.errors.push(`Failed to load metadata.js for ${compName}: ${e.message}`);
    }
  }

  // CSS file existence already checked via requiredFiles.

  // README existence already checked.

  // Example files existence warning
  const examplesPath = path.join(compPath, 'examples.js');
  if (!fs.existsSync(examplesPath)) {
    rpt.warnings.push(`examples.js not found for ${compName}`);
  }

  // Test folder check
  const testsPath = path.join(compPath, 'tests');
  if (!fs.existsSync(testsPath) || !fs.statSync(testsPath).isDirectory()) {
    rpt.warnings.push(`tests folder missing for ${compName}`);
  } else {
    const testFiles = fs.readdirSync(testsPath).filter(f => f.endsWith('.test.js'));
    if (testFiles.length === 0) {
      rpt.warnings.push(`No test files in tests/ for ${compName}`);
    }
  }

  // Import validation – warn on relative imports outside component folder
  const logicPath = path.join(compPath, `${compName}.js`);
  if (fs.existsSync(logicPath)) {
    const content = fs.readFileSync(logicPath, 'utf-8');
    const importRegex = /import\s+.*?from\s+['"](\.\.\/[^'\"]+)['"]/g;
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      rpt.warnings.push(`Component ${compName} imports from outside its folder: ${match[1]}`);
    }
  }

  return rpt;
}

function gatherComponents() {
  return fs.readdirSync(COMPONENTS_ROOT, { withFileTypes: true })
    .filter(d => d.isDirectory() && !d.name.startsWith('_'))
    .map(d => d.name);
}

function validateAll() {
  const overall = report();

  // 1. Folder structure
  const folderRpt = validateFolderStructure();
  overall.info.push(...folderRpt.info);
  overall.warnings.push(...folderRpt.warnings);
  overall.errors.push(...folderRpt.errors);

  const components = gatherComponents();
  const ids = new Set();
  const names = new Set();

  components.forEach(comp => {
    const rpt = validateComponent(comp);
    overall.info.push(...rpt.info);
    overall.warnings.push(...rpt.warnings);
    overall.errors.push(...rpt.errors);

    // Duplicate ID / name checks
    try {
      const meta = require(path.join(COMPONENTS_ROOT, comp, 'metadata.js')).metadata;
      if (ids.has(meta.id)) overall.errors.push(`Duplicate component id '${meta.id}' in ${comp}`);
      else ids.add(meta.id);
      if (names.has(meta.name)) overall.errors.push(`Duplicate component name '${meta.name}' in ${comp}`);
      else names.add(meta.name);
    } catch (_) {}
  });

  // Write validation report
  const reportPath = path.resolve(__dirname, '../build/validation-report.json');
  try {
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, JSON.stringify(overall, null, 2), 'utf-8');
  } catch (e) {
    console.error('Failed to write validation report:', e);
    process.exit(1);
  }

  console.log('Validation completed.');
  console.log(`Info: ${overall.info.length}, Warnings: ${overall.warnings.length}, Errors: ${overall.errors.length}`);

  if (overall.errors.length > 0) {
    console.error('Validation errors detected. Build will stop.');
    process.exit(1);
  }

  process.exit(0);
}

validateAll();
