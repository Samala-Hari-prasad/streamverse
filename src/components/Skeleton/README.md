# Skeleton

Shimmering placeholder loader for movie posters, carousels, text rails, and hero backdrops.

## Usage
```js
const { SkeletonView } = require('./Skeleton.view');

// Render movie poster placeholder
const html = SkeletonView({ variant: 'poster' });
```

## Props
- `variant`: `'rect' | 'circle' | 'text' | 'poster' | 'backdrop'` (default: `'rect'`)
- `animation`: `'shimmer' | 'pulse' | 'none'` (default: `'shimmer'`)
- `width`: `string` (Optional CSS width)
- `height`: `string` (Optional CSS height)
- `className`: `string` (Optional CSS class names)

