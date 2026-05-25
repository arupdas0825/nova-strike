'use strict';

import { Game } from './Game.js';

/**
 * NOVA STRIKE — Application bootstrap entry point.
 * Initializes the game instance after the DOM is ready and
 * removes the preloader overlay.
 */

function boot() {
  const canvas = document.getElementById('game-canvas');
  if (!canvas) {
    console.error('NOVA STRIKE: Canvas element #game-canvas not found.');
    return;
  }

  const game = new Game(canvas);
  game.start();

  // Remove preloader with fade transition
  const loader = document.getElementById('loader');
  if (loader) {
    // Short delay to ensure first frame renders
    setTimeout(() => {
      loader.style.opacity = '0';
      setTimeout(() => {
        loader.style.display = 'none';
      }, 500);
    }, 300);
  }

  // Expose game instance for debugging
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    window.__novaStrike = game;
  }
}

// Boot when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
