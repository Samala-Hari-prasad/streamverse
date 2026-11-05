# Badge

Compact visual indicator used across StreamVerse for streaming resolution indicators (4K, HDR, 1080p), gateway status pills, and content rating tags.

## Usage
```js
const { BadgeView } = require('./Badge.view');

// Render HTML
const html = BadgeView({ text: '4K ULTRA HD', variant: 'accent', size: 'sm' });
```

## Props
- `text`: `string` (Badge content)
- `variant`: `'accent' | 'surface' | 'glass' | 'success' | 'warning' | 'outline'` (default: `'surface'`)
- `size`: `'sm' | 'md'` (default: `'md'`)
- `className`: `string` (Optional additional class names)
