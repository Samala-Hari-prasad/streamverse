// src/components/Button/Button.js
const { ButtonView } = require('./Button.view');

class Button {
  constructor(props = {}) {
    this.props = {
      variant: 'primary',
      size: 'md',
      type: 'button',
      disabled: false,
      loading: false,
      label: 'Button',
      ...props
    };
  }

  render() {
    return ButtonView(this.props);
  }

  mount(container) {
    if (!container) return;
    container.innerHTML = this.render();
  }

  update(newProps = {}) {
    this.props = { ...this.props, ...newProps };
  }

  setLoading(isLoading) {
    this.update({ loading: Boolean(isLoading) });
  }

  setDisabled(isDisabled) {
    this.update({ disabled: Boolean(isDisabled) });
  }
}

module.exports = { Button, ButtonView };

