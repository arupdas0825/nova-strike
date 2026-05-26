'use strict';

import { CONSTANTS } from '../config/constants.js';

/**
 * Advanced HUD Overlay for gameplay states.
 * Renders smooth HP lerps, Direct Shield radial arcs, bottom-left Weapon cards,
 * Overheating thermal bars, individual Homing Missile icons, bottom-centered Boss HP zones,
 * active Minimaps (player + hostiles), flashing kill streaks, and sliding slot-machine digits.
 */
export class HUD {
  /**
   * @param {Object} game 
   */
  constructor(game) {
    this.game = game;
    
    // smooth HP damage delay bars
    this.lerpHp = CONSTANTS.PLAYER_MAX_HP;

    // Rolling score board
    this.displayedScore = 0;

    // Pulse indicators
    this.hudTimer = 0;
  }

  /**
   * Renders the complete animated HUD
   * @param {CanvasRenderingContext2D} ctx 
   */
  draw(ctx) {
    const { player, scoreSystem } = this.game;
    this.hudTimer += 0.05;

    ctx.save();

    // 1. Smooth Hull HP Lerp & Damage delay bar
    this._drawHullHPBar(ctx, player);

    // 2. Rolling Score Board (Slot-machine roll)
    this._drawRollingScore(ctx, scoreSystem);

    // 3. Level & Combo multiplier bounces
    this._drawLevelAndCombo(ctx, scoreSystem);

    // 4. Weapon selection slots (bottom-left)
    this._drawWeaponSelection(ctx, player);

    // 5. Missile slots (◉) max 8
    this._drawMissileIcons(ctx, player);

    // 6. Boss HP segmentations (bottom center)
    this._drawBossHPBar(ctx);

    // 7. Tactical Minimap (bottom-right 90×60px)
    this._drawMiniMap(ctx);

    // 8. Flashing Kill Streak alerts
    this._drawKillStreakAlerts(ctx, scoreSystem);

    ctx.restore();
  }

  /**
   * Hull HP Bar featuring damage delay bars
   */
  _drawHullHPBar(ctx, player) {
    const barX = 20;
    const barY = 20;
    const barW = 180;
    const barH = 14;

    // Lerp HP delay rate
    const diff = player.hp - this.lerpHp;
    if (Math.abs(diff) > 0.01) {
      this.lerpHp += diff * 0.12; // smooth lerp
    } else {
      this.lerpHp = player.hp;
    }

    ctx.save();
    
    // Tech Label
    ctx.fillStyle = CONSTANTS.COLORS.TEXT_GREY;
    ctx.font = "bold 9px 'Orbitron', sans-serif";
    ctx.fillText('HULL INTEGRITY', barX, barY - 6);

    // 1. Bar slot border background
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.fillRect(barX, barY, barW, barH);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1.0;
    ctx.strokeRect(barX, barY, barW, barH);

    // 2. Damage delay bar (Red / White lag)
    if (this.lerpHp > player.hp) {
      const delayRatio = this.lerpHp / player.maxHp;
      ctx.fillStyle = '#ff3300';
      ctx.fillRect(barX + 1, barY + 1, (barW - 2) * delayRatio, barH - 2);
    }

    // 3. Direct Hull bar (Green hue transitions)
    const hpRatio = player.hp / player.maxHp;
    if (hpRatio > 0) {
      const hue = hpRatio * 120; // 0 (red) to 120 (green)
      ctx.fillStyle = `hsl(${hue}, 100%, 45%)`;
      ctx.fillRect(barX + 1, barY + 1, (barW - 2) * hpRatio, barH - 2);
    }

    // Numeric text indicator centered
    ctx.fillStyle = '#ffffff';
    ctx.font = "900 9px 'Orbitron', sans-serif";
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${Math.round(player.hp)} / ${player.maxHp}`, barX + barW / 2, barY + barH / 2);

    ctx.restore();
  }

  /**
   * Rolling scoreboard (Slot-machine digits roll)
   */
  _drawRollingScore(ctx, ss) {
    const W = CONSTANTS.GAME_WIDTH;
    const scoreX = W - 20;
    const scoreY = 20;

    // smooth rolling lerp
    const diff = ss.score - this.displayedScore;
    if (diff > 0) {
      this.displayedScore = Math.min(ss.score, this.displayedScore + Math.ceil(diff * 0.15));
    }

    ctx.save();
    
    // Score header
    ctx.fillStyle = CONSTANTS.COLORS.TEXT_GREY;
    ctx.font = "bold 9px 'Orbitron', sans-serif";
    ctx.textAlign = 'right';
    ctx.fillText('COMMAND SCORE', scoreX, scoreY - 6);

    // Digit formatting padded to 8
    const scoreStr = this.displayedScore.toString().padStart(8, '0');
    
    ctx.font = "900 20px 'Orbitron', sans-serif";
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';

    // Draw digits with slot machine vibration when rolling
    const isRolling = diff > 0;
    
    for (let i = 0; i < scoreStr.length; i++) {
      const char = scoreStr[i];
      const jitter = isRolling ? (Math.random() * 3 - 1.5) : 0;
      
      ctx.fillStyle = isRolling ? CONSTANTS.COLORS.TEXT_YELLOW : '#ffffff';
      
      const charW = 14;
      const cx = scoreX - (scoreStr.length - 1 - i) * charW;
      ctx.fillText(char, cx, scoreY + jitter);
    }

    ctx.restore();
  }

  /**
   * Level progress & Combo bounces
   */
  _drawLevelAndCombo(ctx, ss) {
    const W = CONSTANTS.GAME_WIDTH;
    const levelY = 46;

    ctx.save();
    ctx.fillStyle = CONSTANTS.COLORS.TEXT_CYAN;
    ctx.font = "bold 12px 'Orbitron', sans-serif";
    ctx.textAlign = 'right';
    ctx.fillText(`LVL ${ss.level}`, W - 20, levelY);
    ctx.restore();

    // Combo display (center top)
    if (ss.combo <= 1) return;

    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    
    // Fade out near end of timer
    const alpha = ss.comboTimer > 35 ? 1.0 : ss.comboTimer / 35;
    ctx.globalAlpha = alpha;

    // Bounce scale on increment
    const scale = 1.0 + Math.max(0, (ss.comboTimer - 130) / 20) * 0.28;
    const cy = 20;

    ctx.fillStyle = CONSTANTS.COLORS.TEXT_MAGENTA;
    ctx.font = "900 22px 'Orbitron', sans-serif";
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    // Outer neon glow
    ctx.shadowColor = CONSTANTS.COLORS.TEXT_MAGENTA;
    ctx.shadowBlur = 15;

    ctx.translate(W / 2, cy);
    ctx.scale(scale, scale);
    ctx.fillText(`×${ss.combo} COMBO`, 0, 0);

    ctx.restore();
  }

  /**
   * Weapon selection slots (bottom-left)
   */
  _drawWeaponSelection(ctx, player) {
    const active = player.weaponSystem.activeWeapon;
    const cooldown = player.weaponSystem.cooldown;
    const laser = player.laser;

    const slotX = 20;
    const slotY = CONSTANTS.GAME_HEIGHT - 65;
    const slotW = 120;
    const slotH = 45;

    ctx.save();

    // 1. Draw glowing weapon box Card
    ctx.fillStyle = 'rgba(2, 2, 8, 0.75)';
    ctx.strokeStyle = active === 'LASER' ? '#00ffff' : (active === 'SPREAD' ? '#ff8800' : '#00ff88');
    ctx.lineWidth = 1.5;
    
    // flash card on Q switch
    const switchAnim = Math.max(0, (30 - cooldown) / 30);
    ctx.shadowColor = ctx.strokeStyle;
    ctx.shadowBlur = 10 + (switchAnim * 10);

    ctx.fillRect(slotX, slotY, slotW, slotH);
    ctx.strokeRect(slotX, slotY, slotW, slotH);
    ctx.shadowBlur = 0;

    // Card Header
    ctx.fillStyle = CONSTANTS.COLORS.TEXT_GREY;
    ctx.font = "bold 7px 'Orbitron', sans-serif";
    ctx.fillText('ACTIVE SLAP WEAPON', slotX + 8, slotY + 12);

    // Weapon Name
    ctx.fillStyle = '#ffffff';
    ctx.font = "900 12px 'Orbitron', sans-serif";
    ctx.fillText(active, slotX + 8, slotY + 26);

    // 2. Draw continuous Laser heat bar under weapon card if laser equipped
    if (active === 'LASER') {
      const heatW = slotW - 16;
      const heatX = slotX + 8;
      const heatY = slotY + 33;
      const heatH = 4;
      const heatPct = laser.heat / 120;

      // Background
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.fillRect(heatX, heatY, heatW, heatH);

      // Fill: orange base, flashes red when overheated
      if (laser.overheated) {
        ctx.fillStyle = Math.floor(Date.now() / 100) % 2 === 0 ? '#ff0000' : '#550000';
      } else {
        ctx.fillStyle = heatPct > 0.75 ? '#ff3300' : '#ff7700';
      }
      
      ctx.fillRect(heatX, heatY, heatW * heatPct, heatH);

      // Warning text if overheated
      if (laser.overheated) {
        ctx.fillStyle = '#ff0000';
        ctx.font = "bold 6px 'Orbitron', sans-serif";
        ctx.fillText('OVERHEAT LOCKOUT', slotX + 8, slotY + 41);
      }
    } else {
      // Cooldown bar for primary fire rate
      if (cooldown > 0) {
        const coolPct = cooldown / 18; // spread cooldown
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.fillRect(slotX + 8, slotY + 33, (slotW - 16) * Math.min(1.0, coolPct), 3);
      }
    }

    ctx.restore();
  }

  /**
   * Missile slot icons (◉) max 8
   */
  _drawMissileIcons(ctx, player) {
    const x = 20;
    const y = CONSTANTS.GAME_HEIGHT - 90;
    
    ctx.save();
    
    // Missile header
    ctx.fillStyle = CONSTANTS.COLORS.TEXT_GREY;
    ctx.font = "bold 7px 'Orbitron', sans-serif";
    ctx.fillText('LAUNCH PADS (M)', x, y - 5);

    // Draw max 8 missile slot icons
    const maxMissiles = 8;
    for (let i = 0; i < maxMissiles; i++) {
      const isReady = i < player.missiles;
      ctx.fillStyle = isReady ? CONSTANTS.COLORS.MISSILE : 'rgba(255, 255, 255, 0.15)';
      ctx.font = "13px sans-serif";
      
      const mx = x + (i * 12);
      ctx.fillText('◉', mx, y + 8);
    }

    ctx.restore();
  }

  /**
   * Segmented Boss HP Bar (bottom center)
   */
  _drawBossHPBar(ctx) {
    const { enemies } = this.game;
    
    // Find active Boss
    let boss = null;
    for (let i = 0; i < enemies.length; i++) {
      if (enemies[i].active && enemies[i].isBoss) {
        boss = enemies[i];
        break;
      }
    }

    if (!boss) return;

    const barW = 420;
    const barH = 10;
    const barX = CONSTANTS.GAME_WIDTH / 2 - barW / 2;
    const barY = CONSTANTS.GAME_HEIGHT - 35;
    
    const pct = boss.hp / boss.maxHp;

    ctx.save();
    
    // 1. Outer slot
    ctx.fillStyle = 'rgba(2, 2, 8, 0.85)';
    ctx.fillRect(barX, barY, barW, barH);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.0;
    ctx.strokeRect(barX, barY, barW, barH);

    // 2. Color segments by HP percentage zones:
    // P1 (100%-60%): Purple, P2 (60%-30%): Orange, P3 (30%-0%): Red
    let bossColor = '#bb00ff'; // Seeker
    if (boss.bossPhase === 2) bossColor = '#ff5500'; // Berserker
    if (boss.bossPhase === 3) bossColor = '#ff0000'; // Destroyer

    ctx.fillStyle = bossColor;
    ctx.fillRect(barX + 1, barY + 1, (barW - 2) * pct, barH - 2);

    // 3. Mark phase zones borders (at 30% and 60% coordinates)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 1.0;
    
    // 30% border line
    ctx.beginPath();
    ctx.moveTo(barX + barW * 0.3, barY);
    ctx.lineTo(barX + barW * 0.3, barY + barH);
    ctx.stroke();

    // 60% border line
    ctx.beginPath();
    ctx.moveTo(barX + barW * 0.6, barY);
    ctx.lineTo(barX + barW * 0.6, barY + barH);
    ctx.stroke();

    // Boss Name text
    ctx.fillStyle = '#ffffff';
    ctx.font = "900 8px 'Orbitron', sans-serif";
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    
    const phaseNames = ['SEEKER', 'BERSERKER', 'DESTROYER'];
    const pName = phaseNames[boss.bossPhase - 1];
    ctx.fillText(`COMMAND THREAT — BOSS v3.0: PHASE ${boss.bossPhase} [ ${pName} ]`, CONSTANTS.GAME_WIDTH / 2, barY - 4);

    ctx.restore();
  }

  /**
   * Tactical Minimap (bottom-right 90×60px)
   */
  _drawMiniMap(ctx) {
    const W = CONSTANTS.GAME_WIDTH;
    const H = CONSTANTS.GAME_HEIGHT;

    const mapW = 90;
    const mapH = 60;
    const mapX = W - mapW - 20;
    const mapY = H - mapH - 20;

    const player = this.game.player;
    const enemies = this.game.enemies;

    ctx.save();

    // Box slots
    ctx.fillStyle = 'rgba(2, 2, 8, 0.75)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1.0;
    ctx.fillRect(mapX, mapY, mapW, mapH);
    ctx.strokeRect(mapX, mapY, mapW, mapH);

    // Map title
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.font = "bold 6px 'Orbitron', sans-serif";
    ctx.fillText('RADAR', mapX + 4, mapY + 8);

    // Convert coordinates:
    // minimap coordinate mapping factors:
    const scaleX = mapW / CONSTANTS.GAME_WIDTH;
    const scaleY = mapH / CONSTANTS.GAME_HEIGHT;

    // Draw active enemies as colored dots
    for (let i = 0; i < enemies.length; i++) {
      const e = enemies[i];
      if (e.active) {
        ctx.fillStyle = e.color;
        const ex = mapX + e.x * scaleX;
        const ey = mapY + e.y * scaleY;
        ctx.fillRect(ex - 1.2, ey - 1.2, 2.4, 2.4);
      }
    }

    // Draw player as white blinking dot
    if (player.alive) {
      ctx.fillStyle = '#ffffff';
      if (Math.floor(Date.now() / 250) % 2 === 0) {
        const px = mapX + player.x * scaleX;
        const py = mapY + player.y * scaleY;
        ctx.fillRect(px - 1.5, py - 1.5, 3.0, 3.0);
      }
    }

    ctx.restore();
  }

  /**
   * Flashing Kill Streak alerts
   */
  _drawKillStreakAlerts(ctx, ss) {
    if (ss.streakAlertTimer <= 0) return;

    ctx.save();
    ctx.globalCompositeOperation = 'screen';

    const alpha = ss.streakAlertTimer > 0.4 ? 1.0 : ss.streakAlertTimer / 0.4;
    ctx.globalAlpha = alpha;

    // Pulse size and bright magenta glow
    const W = CONSTANTS.GAME_WIDTH;
    const H = CONSTANTS.GAME_HEIGHT;

    ctx.fillStyle = '#ffcc00';
    ctx.font = "900 24px 'Orbitron', sans-serif";
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Glow
    ctx.shadowColor = '#ffcc00';
    ctx.shadowBlur = 15;

    // flash scale pulsing
    const scale = 1.0 + Math.sin(Date.now() * 0.02) * 0.08;
    ctx.translate(W / 2, H * 0.22);
    ctx.scale(scale, scale);
    
    ctx.fillText(`KILL STREAK ×${ss.streakAlertCount}!`, 0, 0);

    ctx.restore();
  }
}
