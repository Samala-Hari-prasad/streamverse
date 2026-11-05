// keyboard.js
// Global keyboard shortcuts handling

export function initKeyboard() {
  document.addEventListener('keydown', (e) => {
    // Ctrl+K opens command palette (placeholder)
    if (e.ctrlKey && e.key === 'k') {
      e.preventDefault();
      const ev = new CustomEvent('openCommandPalette');
      document.dispatchEvent(ev);
    }
  });
}
