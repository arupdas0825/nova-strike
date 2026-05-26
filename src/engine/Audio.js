'use strict';

import { CONSTANTS } from '../config/constants.js';

/**
 * Pure synthesizer audio engine using Web Audio API nodes. Zero external requests.
 * Renders 15 high-fidelity sound effects and an ambient generative synth pad loop.
 */
export class AudioEngine {
  constructor() {
    /** @type {AudioContext|null} */
    this.ctx = null;
    /** @type {GainNode|null} */
    this.masterGain = null;
    
    this.muted = false;
    this.initialized = false;
    
    // Volume levels
    this.masterVolumeLevel = CONSTANTS.DEFAULT_MASTER_VOLUME;
    this.sfxVolumeLevel = CONSTANTS.DEFAULT_SFX_VOLUME;

    // Laser hum loop node reference
    this.laserHumNode = null;
    this.laserHumGain = null;

    // Music variables
    this.musicIntervalId = null;
    this.musicActive = false;
    this.currentChordIndex = 0;
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
        this.updateMasterVolume();
        this.masterGain.connect(this.ctx.destination);
        this.initialized = true;
      } catch (e) {
        if (CONSTANTS.DEBUG) console.error('Failed to init Web Audio:', e);
      }
    }

    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  /**
   * Update the master volume gain node
   */
  updateMasterVolume() {
    if (this.masterGain && this.ctx) {
      const vol = this.muted ? 0 : this.masterVolumeLevel;
      this.masterGain.gain.setValueAtTime(vol, this.ctx.currentTime);
    }
  }

  /**
   * Set master and sfx volumes
   * @param {number} master - volume 0.0 to 1.0
   * @param {number} sfx - volume 0.0 to 1.0
   */
  setVolumes(master, sfx) {
    this.masterVolumeLevel = master;
    this.sfxVolumeLevel = sfx;
    this.updateMasterVolume();
  }

  /**
   * 1. PLASMA SHOOT: square osc 880->180Hz, 90ms, gain 0.06
   */
  playPlasma() {
    this.resumeContext();
    if (!this.initialized || this.muted) return;

    const time = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(880, time);
    osc.frequency.exponentialRampToValueAtTime(180, time + 0.09);

    gain.gain.setValueAtTime(0.06 * this.sfxVolumeLevel, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.09);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + 0.09);
  }

  /**
   * 2. SPREAD SHOOT: 3× sawtooth 700->220Hz staggered 15ms, gain 0.05
   */
  playSpread() {
    this.resumeContext();
    if (!this.initialized || this.muted) return;

    const baseTime = this.ctx.currentTime;
    const duration = 0.12;

    for (let i = 0; i < 3; i++) {
      const time = baseTime + i * 0.015;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(700 - i * 50, time);
      osc.frequency.exponentialRampToValueAtTime(220, time + duration);

      gain.gain.setValueAtTime(0.05 * this.sfxVolumeLevel, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(time);
      osc.stop(time + duration);
    }
  }

  /**
   * 3. LASER HUM: continuous oscillator 320Hz + noise, on while firing, gain 0.04
   */
  startLaserHum() {
    this.resumeContext();
    if (!this.initialized || this.muted || this.laserHumNode) return;

    const time = this.ctx.currentTime;
    
    // Create oscillator
    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(320, time);

    // Dynamic shimmer filter
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(600, time);

    // Create custom noise node for laser hiss
    const bufferSize = this.ctx.sampleRate * 0.5;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(1000, time);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.015 * this.sfxVolumeLevel, time);

    // Connect noise
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);

    // Master laser hum gain
    this.laserHumGain = this.ctx.createGain();
    this.laserHumGain.gain.setValueAtTime(0.04 * this.sfxVolumeLevel, time);

    osc.connect(filter);
    filter.connect(this.laserHumGain);
    noiseGain.connect(this.laserHumGain);
    
    this.laserHumGain.connect(this.masterGain);

    osc.start(time);
    noise.start(time);

    // Save nodes to stop later
    this.laserHumNode = { osc, noise, filter };
  }

  stopLaserHum() {
    if (this.laserHumNode) {
      const time = this.ctx ? this.ctx.currentTime : 0;
      if (this.laserHumGain && this.ctx) {
        this.laserHumGain.gain.cancelScheduledValues(time);
        this.laserHumGain.gain.setValueAtTime(this.laserHumGain.gain.value, time);
        this.laserHumGain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
      }
      
      const nodeRef = this.laserHumNode;
      setTimeout(() => {
        try {
          nodeRef.osc.stop();
          nodeRef.noise.stop();
        } catch(e) {}
      }, 60);

      this.laserHumNode = null;
      this.laserHumGain = null;
    }
  }

  /**
   * 4. LASER IMPACT: white noise burst 20ms, gain 0.08 per frame of contact
   */
  playLaserImpact() {
    this.resumeContext();
    if (!this.initialized || this.muted) return;

    const time = this.ctx.currentTime;
    const duration = 0.02;
    const bufferSize = this.ctx.sampleRate * duration;
    
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(2000, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.08 * this.sfxVolumeLevel, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    source.start(time);
    source.stop(time + duration);
  }

  /**
   * 5. MISSILE LAUNCH: sawtooth 500→140Hz 280ms + whoosh noise, gain 0.09
   */
  playMissileLaunch() {
    this.resumeContext();
    if (!this.initialized || this.muted) return;

    const time = this.ctx.currentTime;
    const duration = 0.28;

    // Sawtooth jet engine sweep
    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(500, time);
    osc.frequency.exponentialRampToValueAtTime(140, time + duration);

    // Noise component
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.setValueAtTime(800, time);
    noiseFilter.frequency.exponentialRampToValueAtTime(180, time + duration);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.09 * this.sfxVolumeLevel, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc.connect(gain);
    noise.connect(noiseFilter);
    noiseFilter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(time);
    noise.start(time);
    osc.stop(time + duration);
    noise.stop(time + duration);
  }

  /**
   * Helper for noise-based explosions
   */
  _createNoiseExplosion(cutoff, duration, gainValue) {
    const time = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(cutoff, time);
    filter.frequency.exponentialRampToValueAtTime(30, time + duration);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(gainValue * this.sfxVolumeLevel, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    source.start(time);
    source.stop(time + duration);
  }

  /**
   * 6. EXPLOSION SM: noise+lowpass 900Hz, 380ms, gain 0.14
   */
  playExplosionSmall() {
    this.resumeContext();
    if (!this.initialized || this.muted) return;
    this._createNoiseExplosion(900, 0.38, 0.14);
  }

  /**
   * 7. EXPLOSION LG: noise+lowpass 280Hz, 580ms, gain 0.22
   */
  playExplosionLarge() {
    this.resumeContext();
    if (!this.initialized || this.muted) return;
    this._createNoiseExplosion(280, 0.58, 0.22);
  }

  /**
   * 8. EXPLOSION BOSS: noise+lowpass 120Hz, 900ms + sub-bass 60Hz sine, gain 0.30
   */
  playExplosionBoss() {
    this.resumeContext();
    if (!this.initialized || this.muted) return;

    const time = this.ctx.currentTime;
    const duration = 0.90;

    // White noise low-pass filtered
    this._createNoiseExplosion(120, duration, 0.30);

    // Deep sub-bass sinus bump
    const subOsc = this.ctx.createOscillator();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(60, time);
    subOsc.frequency.linearRampToValueAtTime(20, time + duration);

    const subGain = this.ctx.createGain();
    subGain.gain.setValueAtTime(0.35 * this.sfxVolumeLevel, time);
    subGain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    subOsc.connect(subGain);
    subGain.connect(this.masterGain);

    subOsc.start(time);
    subOsc.stop(time + duration);
  }

  /**
   * 9. PLAYER HIT: sawtooth 80Hz 200ms + distortion, gain 0.18
   */
  playPlayerHit() {
    this.resumeContext();
    if (!this.initialized || this.muted) return;

    const time = this.ctx.currentTime;
    const duration = 0.20;
    
    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(80, time);
    osc.frequency.linearRampToValueAtTime(40, time + duration);

    // Simple waveshaper distortion curve
    const waveShaper = this.ctx.createWaveShaper();
    const makeDistortionCurve = (amount = 50) => {
      const k = typeof amount === 'number' ? amount : 50;
      const n_samples = 44100;
      const curve = new Float32Array(n_samples);
      const deg = Math.PI / 180;
      for (let i = 0; i < n_samples; ++i) {
        const x = (i * 2) / n_samples - 1;
        curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
      }
      return curve;
    };
    waveShaper.curve = makeDistortionCurve(60);
    waveShaper.oversample = '4x';

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.18 * this.sfxVolumeLevel, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc.connect(waveShaper);
    waveShaper.connect(gain);
    gain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + duration);
  }

  /**
   * 10. SHIELD ABSORB: FM synth 400Hz, ring mod, 150ms, gain 0.10
   */
  playShieldAbsorb() {
    this.resumeContext();
    if (!this.initialized || this.muted) return;

    const time = this.ctx.currentTime;
    const duration = 0.15;

    const carrier = this.ctx.createOscillator();
    carrier.type = 'sine';
    carrier.frequency.setValueAtTime(400, time);

    const modulator = this.ctx.createOscillator();
    modulator.type = 'sine';
    modulator.frequency.setValueAtTime(180, time);

    const modGain = this.ctx.createGain();
    modGain.gain.setValueAtTime(300, time); // modulation index

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.10 * this.sfxVolumeLevel, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    modulator.connect(modGain);
    modGain.connect(carrier.frequency); // FM modulation
    
    carrier.connect(gain);
    gain.connect(this.masterGain);

    carrier.start(time);
    modulator.start(time);
    carrier.stop(time + duration);
    modulator.stop(time + duration);
  }

  /**
   * 11. POWERUP: ascending arp [540,680,820,1040Hz], 80ms each, gain 0.12
   */
  playPowerUp() {
    this.resumeContext();
    if (!this.initialized || this.muted) return;

    const baseTime = this.ctx.currentTime;
    const notes = [540, 680, 820, 1040];
    const step = 0.08;

    notes.forEach((freq, idx) => {
      const time = baseTime + idx * step;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, time);
      
      gain.gain.setValueAtTime(0.12 * this.sfxVolumeLevel, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + step);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(time);
      osc.stop(time + step);
    });
  }

  /**
   * 12. BOSS ALARM: 4-pulse square 360Hz, 220ms each, 300ms apart, gain 0.13
   */
  playBossAlarm() {
    this.resumeContext();
    if (!this.initialized || this.muted) return;

    const baseTime = this.ctx.currentTime;
    const pulses = 4;
    const step = 0.30;
    const duration = 0.22;

    for (let i = 0; i < pulses; i++) {
      const time = baseTime + i * step;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(360, time);

      gain.gain.setValueAtTime(0.13 * this.sfxVolumeLevel, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(time);
      osc.stop(time + duration);
    }
  }

  /**
   * 13. LEVEL UP: rising chord [261,329,392,523Hz] simultaneous, 400ms, gain 0.10
   */
  playLevelUp() {
    this.resumeContext();
    if (!this.initialized || this.muted) return;

    const time = this.ctx.currentTime;
    const duration = 0.40;
    const frequencies = [261.63, 329.63, 392.00, 523.25]; // C major chord

    frequencies.forEach((freq) => {
      const osc = this.ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, time);
      osc.frequency.exponentialRampToValueAtTime(freq * 2, time + duration);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.025 * this.sfxVolumeLevel, time); // sum chord gain to 0.10
      gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(time);
      osc.stop(time + duration);
    });
  }

  /**
   * 14. WARP: sine sweep 80→1200Hz over 500ms + synthetic reverb, gain 0.09
   */
  playWarp() {
    this.resumeContext();
    if (!this.initialized || this.muted) return;

    const time = this.ctx.currentTime;
    const duration = 0.50;

    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(80, time);
    osc.frequency.exponentialRampToValueAtTime(1200, time + duration);

    // Synthetic reverb decay node
    const delay = this.ctx.createDelay();
    delay.delayTime.setValueAtTime(0.08, time);

    const feedback = this.ctx.createGain();
    feedback.gain.setValueAtTime(0.35, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.09 * this.sfxVolumeLevel, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration + 0.2);

    osc.connect(gain);
    
    // Connect to delay/feedback loop
    gain.connect(delay);
    delay.connect(feedback);
    feedback.connect(delay);
    delay.connect(this.masterGain);

    gain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + duration);
  }

  /**
   * 15. WEAPON SWITCH: short click 1200Hz 30ms, gain 0.07
   */
  playWeaponSwitch() {
    this.resumeContext();
    if (!this.initialized || this.muted) return;

    const time = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, time);

    gain.gain.setValueAtTime(0.07 * this.sfxVolumeLevel, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.03);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + 0.03);
  }

  /**
   * Ambient generative synth space pad music
   */
  startMusic() {
    this.resumeContext();
    if (!this.initialized || this.musicActive) return;

    this.musicActive = true;
    this.musicLoop();
    this.musicIntervalId = setInterval(() => this.musicLoop(), 4500);
  }

  stopMusic() {
    this.musicActive = false;
    if (this.musicIntervalId) {
      clearInterval(this.musicIntervalId);
      this.musicIntervalId = null;
    }
  }

  musicLoop() {
    if (!this.initialized || this.muted || !this.musicActive) return;

    const time = this.ctx.currentTime;
    const duration = 4.2;

    // Chords: Am7 (A2, C3, E3, G3), Fmaj7 (F2, A3, C3, E3), Cmaj7 (C2, G3, B3, E3), Em7 (E2, G3, B3, D3)
    const chords = [
      [110.00, 130.81, 164.81, 196.00], // Am7
      [87.31, 110.00, 130.81, 164.81],  // Fmaj7
      [65.41, 196.00, 246.94, 329.63],  // Cmaj7
      [82.41, 196.00, 246.94, 293.66]   // Em7
    ];

    const currentChord = chords[this.currentChordIndex];
    this.currentChordIndex = (this.currentChordIndex + 1) % chords.length;

    // Create a low pass filtered synth pad for the chord
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(350, time);
    filter.frequency.linearRampToValueAtTime(500, time + duration * 0.5);
    filter.frequency.linearRampToValueAtTime(300, time + duration);
    filter.connect(this.masterGain);

    currentChord.forEach((freq) => {
      const osc = this.ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, time);

      // Low velocity gain with slow attack/decay
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.001, time);
      gain.gain.linearRampToValueAtTime(0.012, time + duration * 0.4);
      gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

      osc.connect(gain);
      gain.connect(filter);

      osc.start(time);
      osc.stop(time + duration);
    });
  }

  /**
   * Mutes/unmutes audio
   * @param {boolean} shouldMute 
   */
  setMute(shouldMute) {
    this.muted = shouldMute;
    if (this.muted && this.ctx) {
      try {
        this.ctx.suspend();
      } catch(e) {}
    } else if (this.ctx) {
      try {
        this.ctx.resume().catch(() => {});
      } catch(e) {}
      this.updateMasterVolume();
    }
  }
}
