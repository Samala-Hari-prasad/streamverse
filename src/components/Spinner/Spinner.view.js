// src/components/Spinner/Spinner.view.js
function SpinnerView(props = {}) {
  const size = props.size || 'md';
  const variant = props.variant || 'accent';
  const label = props.label || 'Loading...';
  const extraClass = props.className || '';
  const className = `sv-spinner sv-spinner--${size} sv-spinner--${variant} ${extraClass}`.trim();

  return `<span class="${className}" role="status" aria-label="${label}"></span>`;
}

module.exports = { SpinnerView };
