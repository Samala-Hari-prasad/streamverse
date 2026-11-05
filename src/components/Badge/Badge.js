// src/components/Badge/Badge.js
const { BadgeView } = require('./Badge.view');

class Badge {
  constructor(props = {}) {
    this.props = {
      variant: 'surface',
      size: 'md',
      text: '',
      ...props
    };
  }

  render() {
    return BadgeView(this.props);
  }

  mount(container) {
    if (!container) return;
    container.innerHTML = this.render();
  }

  update(newProps = {}) {
    this.props = { ...this.props, ...newProps };
  }
}

module.exports = { Badge, BadgeView };
