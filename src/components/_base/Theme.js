// src/components/_base/Theme.js
/**
 * Theme mixin – subscribes to the global theme system via module import.
 * This avoids reliance on globals and remains tree‑shakable.
 */
import { theme } from "@/core/theme"; // adjust alias as per your bundler config

export const Theme = {
  currentTheme: theme.get(),
  initTheme() {
    // Subscribe to theme changes
    theme.subscribe((newTheme) => {
      this.currentTheme = newTheme;
      if (typeof this.onThemeChange === "function") {
        this.onThemeChange(newTheme);
      }
    });
  },
  onThemeChange(newTheme) {
    // Components can optionally override this method for custom reactions.
  }
};
