// src/components/Spinner/tests/Spinner.test.js
const { SpinnerView } = require('../Spinner.view');
const { Spinner } = require('../Spinner');

describe('Spinner Component', () => {
  it('renders default spinner element', () => {
    const html = SpinnerView();
    expect(html).toContain('sv-spinner');
    expect(html).toContain('sv-spinner--md');
    expect(html).toContain('sv-spinner--accent');
    expect(html).toContain('role="status"');
  });

  it('renders custom size and variant', () => {
    const html = SpinnerView({ size: 'sm', variant: 'white', label: 'Processing' });
    expect(html).toContain('sv-spinner--sm');
    expect(html).toContain('sv-spinner--white');
    expect(html).toContain('aria-label="Processing"');
  });

  it('instantiates component class', () => {
    const spinner = new Spinner({ size: 'lg' });
    expect(spinner.render()).toContain('sv-spinner--lg');
  });
});

