let audioCtx: AudioContext | null = null;

function context(): AudioContext | null {
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;
  audioCtx ??= new Ctx();
  return audioCtx;
}

/** Libera o áudio no primeiro toque. No celular o som só toca depois de um gesto. */
export function unlockBeep() {
  const ctx = context();
  if (ctx && ctx.state === "suspended") void ctx.resume();
}

function blip(ctx: AudioContext, frequency: number, start: number, duration: number, peak: number) {
  const osc = ctx.createOscillator();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();
  osc.type = "square";
  osc.frequency.setValueAtTime(frequency, start);
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(3200, start);
  osc.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(peak, start + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

/** Dois apitos curtos: “bi-pi”, como um leitor de caixa. */
export function beep() {
  try {
    const ctx = context();
    if (!ctx) return;
    const play = () => {
      const now = ctx.currentTime;
      blip(ctx, 1760, now, 0.07, 0.16);
      blip(ctx, 2480, now + 0.1, 0.1, 0.18);
    };
    if (ctx.state === "suspended") {
      void ctx.resume().then(play).catch(() => {});
      return;
    }
    play();
  } catch {
    /* som é opcional */
  }
}

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}
