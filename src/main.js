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

  try {
    const game = new Game(canvas);
    game.boot();

    // Expose game instance for debugging
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      window.__novaStrike = game;
    }
  } catch (err) {
    console.error('NOVA STRIKE: Critical failure during game bootstrap:', err);
    
    // Emergency preloader removal fallback to allow user interface interaction or inspection
    const loader = document.getElementById('loader');
    if (loader) {
      loader.style.opacity = '0';
      setTimeout(() => {
        loader.style.display = 'none';
        loader.style.pointerEvents = 'none';
      }, 500);
    }
  }
}

// Boot when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
