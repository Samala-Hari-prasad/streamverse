// src/components/Skeleton/tests/Skeleton.test.js
const { SkeletonView } = require('../Skeleton.view');
const { Skeleton } = require('../Skeleton');

describe('Skeleton Component', () => {
  it('renders default rectangle skeleton', () => {
    const html = SkeletonView();
    expect(html).toContain('sv-skeleton');
    expect(html).toContain('sv-skeleton--rect');
    expect(html).toContain('sv-skeleton--shimmer');
  });

  it('renders poster variant', () => {
    const html = SkeletonView({ variant: 'poster' });
    expect(html).toContain('sv-skeleton--poster');
  });

  it('instantiates component class', () => {
    const skel = new Skeleton({ variant: 'circle' });
    expect(skel.render()).toContain('sv-skeleton--circle');
  });
});
