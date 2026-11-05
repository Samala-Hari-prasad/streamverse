// src/components/_base/Component.js
/**
 * Base Component class that composes capabilities via mixins.
 * Each primitive can import only the mixins it needs.
 */
export default class Component {
  constructor(props = {}) {
    this.props = props;
    this.state = {};
    // Mixins will be assigned by the component implementation.
  }

  // Lifecycle methods – to be overridden or mixed in.
  render() {}
  mount(container) {}
  update(props) { this.props = { ...this.props, ...props }; }
  destroy() {}
}
