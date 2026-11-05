// src/components/Badge/Badge.view.js
function BadgeView(props = {}) {
  const variant = props.variant || 'surface';
  const size = props.size || 'md';
  const text = props.text || props.label || props.children || '';
  const extraClass = props.className || '';
  const className = `sv-badge sv-badge--${variant} sv-badge--${size} ${extraClass}`.trim();

  return `<span class="${className}">${text}</span>`;
}

module.exports = { BadgeView };
