// src/components/Button/tests/Button.test.js
const { ButtonView } = require('../Button.view');
const { Button } = require('../Button');

describe('Button Component', () => {
  it('renders default button element', () => {
    const html = ButtonView({ label: 'Play' });
    expect(html).toContain('sv-btn');
    expect(html).toContain('sv-btn--primary');
    expect(html).toContain('sv-btn--md');
    expect(html).toContain('Play');
  });

  it('renders disabled state', () => {
    const html = ButtonView({ label: 'Offline', disabled: true });
    expect(html).toContain('disabled');
    expect(html).toContain('sv-btn--disabled');
  });

  it('renders loading state with integrated spinner', () => {
    const html = ButtonView({ label: 'Connecting', loading: true });
    expect(html).toContain('sv-btn--loading');
    expect(html).toContain('sv-spinner');
  });

  it('instantiates and updates component class', () => {
    const btn = new Button({ label: 'Discover' });
    expect(btn.render()).toContain('Discover');
    btn.setLoading(true);
    expect(btn.render()).toContain('sv-btn--loading');
  });
});
