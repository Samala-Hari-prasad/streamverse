# Button

StreamVerse primary interactive button primitive. Supports visual hierarchy styling, icon slots, glassmorphism, responsive scaling, and integrated async spinner loading.

## Usage
```js
const { ButtonView } = require('./Button.view');

// Render HTML
const html = ButtonView({
  label: 'Watch Now',
  variant: 'primary',
  size: 'lg'
});
```

## Props
- `label`: `string` (Button text content)
- `variant`: `'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'glass'` (default: `'primary'`)
- `size`: `'sm' | 'md' | 'lg'` (default: `'md'`)
- `type`: `'button' | 'submit' | 'reset'` (default: `'button'`)
- `loading`: `boolean` (default: `false`)
- `disabled`: `boolean` (default: `false`)
- `id`: `string` (Optional DOM id)
- `onclick`: `string` (Optional inline handler)
- `className`: `string` (Optional CSS class names)

