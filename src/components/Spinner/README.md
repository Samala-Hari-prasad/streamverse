# Spinner

Animated circular loading indicator designed for asynchronous operations, streaming node health checks, and video embed transitions.

## Usage
```js
const { SpinnerView } = require('./Spinner.view');

// Render HTML
const html = SpinnerView({ size: 'md', variant: 'accent' });
```

## Props
- `size`: `'xs' | 'sm' | 'md' | 'lg'` (default: `'md'`)
- `variant`: `'accent' | 'white' | 'muted'` (default: `'accent'`)
- `label`: `string` (ARIA accessible label, default: `'Loading...'`)
- `className`: `string` (Optional additional class names)

