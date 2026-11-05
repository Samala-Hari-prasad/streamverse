// src/components/Button/Button.view.js
const { SpinnerView } = require('../Spinner/Spinner.view');

function ButtonView(props = {}) {
  const variant = props.variant || 'primary';
  const size = props.size || 'md';
  const type = props.type || 'button';
  const disabled = Boolean(props.disabled || props.loading);
  const loading = Boolean(props.loading);
  const label = props.label || props.children || 'Button';
  const idAttr = props.id ? ` id="${props.id}"` : '';
  const onclickAttr = props.onclick ? ` onclick="${props.onclick}"` : '';

  const classList = [
    'sv-btn',
    `sv-btn--${variant}`,
    `sv-btn--${size}`,
    loading ? 'sv-btn--loading' : '',
    disabled ? 'sv-btn--disabled' : '',
    props.className || ''
  ].filter(Boolean).join(' ');

  const content = loading
    ? `${SpinnerView({ size: size === 'lg' ? 'md' : 'sm', variant: variant === 'primary' ? 'white' : 'accent' })} <span>${label}</span>`
    : `<span>${label}</span>`;

  return `<button type="${type}" class="${classList}"${disabled ? ' disabled' : ''}${idAttr}${onclickAttr}>${content}</button>`;
}

module.exports = { ButtonView };
