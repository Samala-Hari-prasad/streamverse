// src/components/Badge/tests/Badge.test.js
const { BadgeView } = require('../Badge.view');
const { Badge } = require('../Badge');

describe('Badge Component', () => {
  it('renders default badge element', () => {
    const html = BadgeView({ text: 'HD' });
    expect(html).toContain('sv-badge');
    expect(html).toContain('sv-badge--surface');
    expect(html).toContain('sv-badge--md');
    expect(html).toContain('HD');
  });

  it('renders accent variant and small size', () => {
    const html = BadgeView({ text: '4K', variant: 'accent', size: 'sm' });
    expect(html).toContain('sv-badge--accent');
    expect(html).toContain('sv-badge--sm');
    expect(html).toContain('4K');
  });

  it('instantiates component class', () => {
    const badge = new Badge({ text: 'ONLINE', variant: 'success' });
    expect(badge.render()).toContain('sv-badge--success');
  });
});

