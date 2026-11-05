// templates/component/component.view.js
// Rendering logic (HTML/JSX) for a component. Replace {{component}} with the actual component name.
export function {{component}}View(props) {
  // Simple example using a container element
  return `<div class="{{component}} ${props.className || ''}">${props.children || ''}</div>`;
}
