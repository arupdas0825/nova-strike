'use strict';

import { CONSTANTS } from '../config/constants.js';

/**
 * Pure synthesizer audio engine using Web Audio API nodes. Zero file requests.
 */
export class AudioEngine {
  constructor() {
    /** @type {AudioContext|null} */
    this.ctx = null;
    /** @type {GainNode|null} */
    this.masterGain = null;
    
    this.muted = false;
    this.initialized = false;
  }

  /**
   * Safe initialization triggered by user interactions
   */
  resumeContext() {
    if (this.muted) return;

    if (!this.initialized) {
      try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContextClass();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(CONSTANTS.AUDIO_VOLUME, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
        this.initialized = true;
      } catch (e) {
        if (CONSTANTS.DEBUG) console.error('Failed to init Web Audio:', e);
      }
    }

    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  /**
   * Synthesizes Player blaster shot: square osc 900 -> 200 Hz with 80ms exponential ramp.
   */
  playShoot() {
    this.resumeContext();
    if (!this.initialized || this.muted) return;

    const time = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(900, time);
    osc.frequency.exponentialRampToValueAtTime(200, time + 0.08);

    gain.gain.setValueAtTime(0.5, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.08);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + 0.08);
  }

  /**
   * Synthesizes Explosion using procedurally generated white noise + lowpass filter.
   * Boss uses 350 Hz cutoff (deep bass), standard uses 800 Hz. Duration 450ms.
   * @param {boolean} isBoss
   */
  playExplode(isBoss = false) {
    this.resumeContext();
    if (!this.initialized || this.muted) return;

    const time = this.ctx.currentTime;
    const duration = 0.45;
    const bufferSize = this.ctx.sampleRate * duration;
    
    // Generate white noise buffer
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(isBoss ? 350 : 800, time);
    filter.frequency.exponentialRampToValueAtTime(80, time + duration);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(isBoss ? 1.0 : 0.6, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + duration);

    noiseSource.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noiseSource.start(time);
    noiseSource.stop(time + duration);
  }

  /**
   * Synthesizes damage HIT sound: sawtooth osc 90 Hz, 150ms.
   */
  playHit() {
    this.resumeContext();
    if (!this.initialized || this.muted) return;

    const time = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(90, time);

    gain.gain.setValueAtTime(0.7, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.15);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + 0.15);
  }

  /**
   * Synthesizes Missile launch sound: sawtooth 440 -> 150 Hz, 250ms.
   */
  playMissile() {
    this.resumeContext();
    if (!this.initialized || this.muted) return;

    const time = this.ctx.currentTime;
    const duration = 0.25;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(440, time);
    osc.frequency.linearRampToValueAtTime(150, time + duration);

    gain.gain.setValueAtTime(0.6, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + duration);
  }

  /**
   * Synthesizes Powerup arpeggio: 3-note [520, 660, 780 Hz], 100ms stagger, 180ms each.
   */
  playPowerUp() {
    this.resumeContext();
    if (!this.initialized || this.muted) return;

    const time = this.ctx.currentTime;
    const notes = [520, 660, 780];
    const stagger = 0.1;
    const duration = 0.18;

    notes.forEach((freq, idx) => {
      const noteTime = time + (idx * stagger);
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.4, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.01, noteTime + duration);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(noteTime);
      osc.stop(noteTime + duration);
    });
  }

  /**
   * Synthesizes Boss alarm: 3-pulse square wave 340 Hz, 280ms stagger.
   */
  playBossAlarm() {
    this.resumeContext();
    if (!this.initialized || this.muted) return;

    const time = this.ctx.currentTime;
    const pulses = 3;
    const stagger = 0.28;
    const duration = 0.22;

    for (let i = 0; i < pulses; i++) {
      const pulseTime = time + (i * stagger);
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(340, pulseTime);

      gain.gain.setValueAtTime(0.8, pulseTime);
      gain.gain.exponentialRampToValueAtTime(0.01, pulseTime + duration);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(pulseTime);
      osc.stop(pulseTime + duration);
    }
  }

  /**
   * Mutes/unmutes audio
   * @param {boolean} shouldMute 
   */
  setMute(shouldMute) {
    this.muted = shouldMute;
    if (this.muted && this.ctx) {
      this.ctx.suspend();
    } else if (this.ctx) {
      this.ctx.resume();
    }
  }
}
