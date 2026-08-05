// lib/audio.ts
// Sound effects disabled for clean presentation / pitching

export function playClickSound() {
  // noop
}

export function playScanSound(durationSec?: number) {
  // noop
  return {
    stop: () => {
      // noop
    }
  };
}

export function playSuccessSound() {
  // noop
}
