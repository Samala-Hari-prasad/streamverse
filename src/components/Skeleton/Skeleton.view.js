// src/components/Skeleton/Skeleton.view.js
function SkeletonView(props = {}) {
  const variant = props.variant || 'rect';
  const animation = props.animation !== undefined ? props.animation : 'shimmer';
  const width = props.width ? `width: ${props.width};` : '';
  const height = props.height ? `height: ${props.height};` : '';
  const styleAttr = (width || height) ? ` style="${width} ${height}".trim()` : '';
  const extraClass = props.className || '';

  const classList = [
    'sv-skeleton',
    `sv-skeleton--${variant}`,
    animation ? `sv-skeleton--${animation}` : '',
    extraClass
  ].filter(Boolean).join(' ');

  return `<div class="${classList}"${styleAttr} aria-hidden="true"></div>`;
}

module.exports = { SkeletonView };

