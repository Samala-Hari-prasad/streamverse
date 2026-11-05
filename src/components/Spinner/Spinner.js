// src/components/Spinner/Spinner.js
const { SpinnerView } = require('./Spinner.view');

class Spinner {
  constructor(props = {}) {
    this.props = {
      size: 'md',
      variant: 'accent',
      label: 'Loading...',
      ...props
    };
  }

  render() {
    return SpinnerView(this.props);
  }

  mount(container) {
    if (!container) return;
    container.innerHTML = this.render();
  }

  update(newProps = {}) {
    this.props = { ...this.props, ...newProps };
  }
}

module.exports = { Spinner, SpinnerView };
