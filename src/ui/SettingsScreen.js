'use strict';

import { CONSTANTS } from '../config/constants.js';

/**
 * Handles the interactive settings configuration menu.
 * Renders master/sfx volume sliders, difficulty toggles, bloom selectors, 
 * FPS counters, keybinding tables, and dispatches zero-dependency mouse click maps.
 */
export class SettingsScreen {
  constructor(game) {
    this.game = game;
    this.timer = 0;
    this.hoveredItem = null;

    // Return destination ('title' or 'paused')
    this.returnState = CONSTANTS.STATE_TITLE;
  }

  /**
   * Updates animations
   * @param {number} dt 
   */
  update(dt) {
    this.timer += dt * 60;
  }

  /**
   * Renders the complete settings interface
   * @param {CanvasRenderingContext2D} ctx 
   */
  draw(ctx) {
    const W = CONSTANTS.GAME_WIDTH;
    const H = CONSTANTS.GAME_HEIGHT;
    const settings = this.game.settings;

    ctx.save();
    
    // Glassmorphic translucent dark background
    ctx.fillStyle = 'rgba(2, 2, 8, 0.88)';
    ctx.fillRect(0, 0, W, H);

    // Decorative nebula glow
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, 'rgba(0, 243, 255, 0.03)');
    grad.addColorStop(1, 'rgba(255, 0, 255, 0.03)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Title: "SETTINGS" (pulsing cyan)
    ctx.fillStyle = CONSTANTS.COLORS.TEXT_CYAN;
    ctx.font = "900 42px 'Orbitron', sans-serif";
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = CONSTANTS.COLORS.TEXT_CYAN;
    ctx.shadowBlur = 15;
    ctx.fillText('CONFIGURATION', W / 2, 70);
    ctx.shadowBlur = 0;

    // ────────────────────────────────────────────────────────
    // 1. MASTER VOLUME SLIDER (Y: 150)
    // ────────────────────────────────────────────────────────
    const sliderWidth = 300;
    const sliderX = W / 2 - sliderWidth / 2;
    
    ctx.fillStyle = CONSTANTS.COLORS.TEXT_GREY;
    ctx.font = "700 13px 'Orbitron', sans-serif";
    ctx.textAlign = 'right';
    ctx.fillText('MASTER VOLUME:', sliderX - 20, 160);

    // Slider Bar Background
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.fillRect(sliderX, 155, sliderWidth, 8);

    // Filled slider bar
    const masterPct = settings.masterVolume / 100;
    ctx.fillStyle = CONSTANTS.COLORS.TEXT_CYAN;
    ctx.fillRect(sliderX, 155, sliderWidth * masterPct, 8);

    // Grab handle
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(sliderX + sliderWidth * masterPct, 159, 8, 0, Math.PI * 2);
    ctx.fill();

    // Value text
    ctx.fillStyle = '#ffffff';
    ctx.font = "500 13px 'Inter', sans-serif";
    ctx.textAlign = 'left';
    ctx.fillText(`${settings.masterVolume}%`, sliderX + sliderWidth + 20, 160);

    // ────────────────────────────────────────────────────────
    // 2. SFX VOLUME SLIDER (Y: 220)
    // ────────────────────────────────────────────────────────
    ctx.fillStyle = CONSTANTS.COLORS.TEXT_GREY;
    ctx.font = "700 13px 'Orbitron', sans-serif";
    ctx.textAlign = 'right';
    ctx.fillText('SFX VOLUME:', sliderX - 20, 230);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.fillRect(sliderX, 225, sliderWidth, 8);

    const sfxPct = settings.sfxVolume / 100;
    ctx.fillStyle = CONSTANTS.COLORS.TEXT_MAGENTA;
    ctx.fillRect(sliderX, 225, sliderWidth * sfxPct, 8);

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(sliderX + sliderWidth * sfxPct, 229, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = "500 13px 'Inter', sans-serif";
    ctx.textAlign = 'left';
    ctx.fillText(`${settings.sfxVolume}%`, sliderX + sliderWidth + 20, 230);

    // ────────────────────────────────────────────────────────
    // 3. BLOOM EFFECT TOGGLE (Y: 290)
    // ────────────────────────────────────────────────────────
    ctx.fillStyle = CONSTANTS.COLORS.TEXT_GREY;
    ctx.font = "700 13px 'Orbitron', sans-serif";
    ctx.textAlign = 'right';
    ctx.fillText('GLOW BLOOM:', sliderX - 20, 300);

    this._drawToggleBtn(ctx, W / 2, 290, settings.bloomEnabled, 'BLOOM');

    // ────────────────────────────────────────────────────────
    // 4. DIFFICULTY SELECTORS (Y: 360)
    // ────────────────────────────────────────────────────────
    ctx.fillStyle = CONSTANTS.COLORS.TEXT_GREY;
    ctx.font = "700 13px 'Orbitron', sans-serif";
    ctx.textAlign = 'right';
    ctx.fillText('DIFFICULTY:', sliderX - 20, 370);

    const diffs = ['easy', 'normal', 'hard', 'insane'];
    const diffWidth = 85;
    const diffGap = 15;
    const diffStartX = W / 2 - ((diffWidth * 4 + diffGap * 3) / 2);

    for (let i = 0; i < 4; i++) {
      const d = diffs[i];
      const bx = diffStartX + i * (diffWidth + diffGap);
      const isSelected = settings.difficulty === d;

      ctx.save();
      if (isSelected) {
        ctx.fillStyle = d === 'insane' ? '#ff0000' : (d === 'hard' ? '#ff7700' : (d === 'normal' ? '#00f3ff' : '#00ff66'));
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 10;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.8;
      } else {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1.0;
      }

      ctx.fillRect(bx, 352, diffWidth, 26);
      ctx.strokeRect(bx, 352, diffWidth, 26);

      ctx.fillStyle = isSelected ? '#020208' : '#ffffff';
      ctx.font = "700 11px 'Orbitron', sans-serif";
      ctx.textAlign = 'center';
      ctx.fillText(d.toUpperCase(), bx + diffWidth / 2, 368);
      ctx.restore();
    }

    // ────────────────────────────────────────────────────────
    // 5. SHOW FPS TOGGLE (Y: 430)
    // ────────────────────────────────────────────────────────
    ctx.fillStyle = CONSTANTS.COLORS.TEXT_GREY;
    ctx.font = "700 13px 'Orbitron', sans-serif";
    ctx.textAlign = 'right';
    ctx.fillText('SHOW FPS:', sliderX - 20, 440);

    this._drawToggleBtn(ctx, W / 2, 430, settings.showFPS, 'FPS');

    // ────────────────────────────────────────────────────────
    // 6. CONTROLS INFORMATION TABLE (Y: 490)
    // ────────────────────────────────────────────────────────
    const tableY = 490;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(W * 0.15, tableY);
    ctx.lineTo(W * 0.85, tableY);
    ctx.stroke();

    ctx.fillStyle = CONSTANTS.COLORS.TEXT_CYAN;
    ctx.font = "700 13px 'Orbitron', sans-serif";
    ctx.textAlign = 'center';
    ctx.fillText('TACTICAL CONTROL SCHEME', W / 2, tableY + 22);

    const controls = [
      { key: 'W / A / S / D  (or ARROWS)', action: 'Strafing direction thrust (Verlet flight)' },
      { key: 'SPACEBAR  (hold)', action: 'Primary weapons fire (Plasma Cannon / Spread Shot / Laser)' },
      { key: 'Q KEY  (press)', action: 'Cycle weaponry slots (PLASMA → SPREAD → LASER)' },
      { key: 'M KEY  (press)', action: 'Fire Predictive Homing intercept Missile (Capacity max 8)' },
      { key: 'ESC / P KEY  (press)', action: 'Pause action / Access configuration subpanels' }
    ];

    ctx.font = "500 11px 'Inter', sans-serif";
    for (let i = 0; i < controls.length; i++) {
      const c = controls[i];
      const cy = tableY + 45 + i * 20;
      
      // Keys
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'right';
      ctx.fillText(c.key, W / 2 - 40, cy);

      // Actions
      ctx.fillStyle = CONSTANTS.COLORS.TEXT_GREY;
      ctx.textAlign = 'left';
      ctx.fillText(c.action, W / 2 + 40, cy);
    }

    // ────────────────────────────────────────────────────────
    // 7. BACK / APPLY BUTTON (Y: 710)
    // ────────────────────────────────────────────────────────
    const btnW = 180;
    const btnH = 36;
    const btnX = W / 2 - btnW / 2;
    const btnY = 700;

    ctx.save();
    ctx.fillStyle = 'rgba(0, 243, 255, 0.15)';
    ctx.strokeStyle = CONSTANTS.COLORS.TEXT_CYAN;
    ctx.lineWidth = 1.5;
    ctx.shadowColor = CONSTANTS.COLORS.TEXT_CYAN;
    ctx.shadowBlur = 10;
    
    ctx.fillRect(btnX, btnY, btnW, btnH);
    ctx.strokeRect(btnX, btnY, btnW, btnH);

    ctx.fillStyle = '#ffffff';
    ctx.font = "900 13px 'Orbitron', sans-serif";
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('APPLY CHANGES', W / 2, btnY + btnH / 2);
    ctx.restore();

    ctx.restore();
  }

  /**
   * Helper to draw glowing slider switch toggles
   */
  _drawToggleBtn(ctx, cx, cy, val, label) {
    const w = 90;
    const h = 26;
    const x = cx - w / 2;
    const y = cy - h / 2;

    ctx.save();
    if (val) {
      ctx.fillStyle = 'rgba(0, 243, 255, 0.2)';
      ctx.strokeStyle = CONSTANTS.COLORS.TEXT_CYAN;
      ctx.lineWidth = 1.5;
      ctx.shadowColor = CONSTANTS.COLORS.TEXT_CYAN;
      ctx.shadowBlur = 8;
    } else {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 1.0;
    }

    ctx.fillRect(x, y, w, h);
    ctx.strokeRect(x, y, w, h);

    ctx.fillStyle = val ? CONSTANTS.COLORS.TEXT_CYAN : CONSTANTS.COLORS.TEXT_GREY;
    ctx.font = "700 11px 'Orbitron', sans-serif";
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(val ? 'ON' : 'OFF', cx, cy);
    ctx.restore();
  }

  /**
   * Maps pointer click bounding boxes and updates values
   * @param {number} clickX 
   * @param {number} clickY 
   * @param {Object} audio 
   */
  handleClick(clickX, clickY, audio) {
    const W = CONSTANTS.GAME_WIDTH;
    const sliderWidth = 300;
    const sliderLeft = W / 2 - sliderWidth / 2;
    const settings = this.game.settings;

    // 1. Master Volume (Y: 155 - 163, X: sliderLeft - sliderLeft+sliderWidth)
    if (clickY >= 145 && clickY <= 170 && clickX >= sliderLeft - 10 && clickX <= sliderLeft + sliderWidth + 10) {
      const val = Math.round(((clickX - sliderLeft) / sliderWidth) * 100);
      settings.masterVolume = Math.max(0, Math.min(100, val));
      
      // Update engine audio volume
      this.game.audio.setVolumes(settings.masterVolume / 100, settings.sfxVolume / 100);
      audio.playWeaponSwitch();
      this.game.saveSystem.saveSettings(settings);
    }

    // 2. SFX Volume
    if (clickY >= 215 && clickY <= 240 && clickX >= sliderLeft - 10 && clickX <= sliderLeft + sliderWidth + 10) {
      const val = Math.round(((clickX - sliderLeft) / sliderWidth) * 100);
      settings.sfxVolume = Math.max(0, Math.min(100, val));
      
      this.game.audio.setVolumes(settings.masterVolume / 100, settings.sfxVolume / 100);
      audio.playWeaponSwitch();
      this.game.saveSystem.saveSettings(settings);
    }

    // 3. Bloom toggle
    const toggleW = 90;
    const toggleX = W / 2 - toggleW / 2;
    if (clickY >= 277 && clickY <= 303 && clickX >= toggleX && clickX <= toggleX + toggleW) {
      settings.bloomEnabled = !settings.bloomEnabled;
      this.game.bloom.enabled = settings.bloomEnabled;
      audio.playWeaponSwitch();
      this.game.saveSystem.saveSettings(settings);
    }

    // 4. Difficulty Selector buttons
    const diffs = ['easy', 'normal', 'hard', 'insane'];
    const diffWidth = 85;
    const diffGap = 15;
    const diffStartX = W / 2 - ((diffWidth * 4 + diffGap * 3) / 2);

    for (let i = 0; i < 4; i++) {
      const bx = diffStartX + i * (diffWidth + diffGap);
      if (clickY >= 352 && clickY <= 378 && clickX >= bx && clickX <= bx + diffWidth) {
        settings.difficulty = diffs[i];
        audio.playWeaponSwitch();
        this.game.saveSystem.saveSettings(settings);
        break;
      }
    }

    // 5. Show FPS Toggle
    if (clickY >= 417 && clickY <= 443 && clickX >= toggleX && clickX <= toggleX + toggleW) {
      settings.showFPS = !settings.showFPS;
      audio.playWeaponSwitch();
      this.game.saveSystem.saveSettings(settings);
    }

    // 6. Back / Apply changes button
    const btnW = 180;
    const btnX = W / 2 - btnW / 2;
    if (clickY >= 700 && clickY <= 736 && clickX >= btnX && clickX <= btnX + btnW) {
      audio.playLevelUp(); // click chime
      
      // Save changes fully
      this.game.saveSystem.saveSettings(settings);
      
      // Transition back
      this.game.state = this.returnState;
    }
  }
}
