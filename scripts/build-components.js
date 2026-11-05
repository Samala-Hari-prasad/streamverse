// scripts/build-components.js

/**
 * Orchestrates component build pipeline:
 *   1. Generate icon registry
 *   2. Generate component manifest
 *   3. Generate CSS aggregation
 *   4. Generate documentation index
 *   5. Validate component structure
 *   6. Generate playground index
 *   7. Print build summary
 */
const { execSync } = require('child_process');

function run(command, description) {
  console.log(`\n▶️  ${description}`);
  execSync(command, { stdio: 'inherit' });
}

try {
  run('node scripts/generate-icon-registry.js', 'Generating icon registry');
  run('node scripts/generate-component-manifest.js', 'Generating component manifest');
  run('node scripts/generate-components-css.js', 'Generating components CSS');
  run('node scripts/generate-docs.js', 'Generating component documentation');
  run('node scripts/validate-components.js', 'Validating components');
  run('node scripts/generate-playground-index.js', 'Generating playground index');
  run('node scripts/build-summary.js', 'Printing build summary');
  console.log('\n✅ Build pipeline completed successfully');
} catch (error) {
  console.error('\n❌ Build pipeline failed');
  process.exit(1);
}
