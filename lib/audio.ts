// lib/audio.ts

let audioCtx: AudioContext | null = null;

function getAudioContext() {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function playClickSound() {
  const ctx = getAudioContext();
  if (!ctx) return;
  
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.type = 'sine';
  osc.frequency.setValueAtTime(1200, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.03);
  
  gain.gain.setValueAtTime(0.08, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03);
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  
  osc.start();
  osc.stop(ctx.currentTime + 0.03);
}

export function playScanSound(durationSec: number = 4.0) {
  const ctx = getAudioContext();
  if (!ctx) return null;
  
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(220, ctx.currentTime);
  
  // Sweep frequency up and down for radar sound
  for (let i = 0; i < durationSec; i += 0.5) {
    osc.frequency.linearRampToValueAtTime(600, ctx.currentTime + i + 0.25);
    osc.frequency.linearRampToValueAtTime(220, ctx.currentTime + i + 0.5);
  }
  
  const filter = ctx.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.setValueAtTime(500, ctx.currentTime);
  
  gain.gain.setValueAtTime(0.02, ctx.currentTime);
  // Volume modulation for pulsating sweep
  for (let i = 0; i < durationSec; i += 0.5) {
    gain.gain.setValueAtTime(0.02, ctx.currentTime + i);
    gain.gain.linearRampToValueAtTime(0.04, ctx.currentTime + i + 0.25);
    gain.gain.linearRampToValueAtTime(0.02, ctx.currentTime + i + 0.5);
  }
  gain.gain.setValueAtTime(0.02, ctx.currentTime + durationSec - 0.1);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationSec);
  
  osc.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  
  osc.start();
  osc.stop(ctx.currentTime + durationSec);
  
  return {
    stop: () => {
      try {
        osc.stop();
      } catch (e) {}
    }
  };
}

export function playSuccessSound() {
  const ctx = getAudioContext();
  if (!ctx) return;
  
  const now = ctx.currentTime;
  
  const playBeep = (freq: number, startDelay: number, duration: number) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now + startDelay);
    
    gain.gain.setValueAtTime(0.0, now + startDelay);
    gain.gain.linearRampToValueAtTime(0.06, now + startDelay + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + startDelay + duration);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(now + startDelay);
    osc.stop(now + startDelay + duration);
  };
  
  playBeep(523.25, 0.0, 0.12); // C5
  playBeep(783.99, 0.08, 0.2); // G5
}
