// src/components/Skeleton/Skeleton.js
const { SkeletonView } = require('./Skeleton.view');

class Skeleton {
  constructor(props = {}) {
    this.props = {
      variant: 'rect',
      animation: 'shimmer',
      ...props
    };
  }

  render() {
    return SkeletonView(this.props);
  }

  mount(container) {
    if (!container) return;
    container.innerHTML = this.render();
  }

  update(newProps = {}) {
    this.props = { ...this.props, ...newProps };
  }
}

module.exports = { Skeleton, SkeletonView };

