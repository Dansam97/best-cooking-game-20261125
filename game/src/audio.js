// Kitchen noises from one oscillator at a time: no audio files, nothing to
// load. The context wakes on the first key or click, as browsers require, and
// every sound is a short envelope so a busy service never turns into a drone.

const NOTES = {
  pickup: [620, 0.06, 'square', 0.05],
  place: [340, 0.05, 'square', 0.05],
  chop: [190, 0.04, 'square', 0.07],
  trash: [150, 0.09, 'sawtooth', 0.05],
  error: [110, 0.14, 'sawtooth', 0.06],
};

export function createAudio() {
  let context = null;

  function wake() {
    if (context === null) {
      const Ctor = window.AudioContext || window.webkitAudioContext;
      if (Ctor) context = new Ctor();
    }
    if (context && context.state === 'suspended') context.resume();
  }

  function tone(freq, seconds, type, gain, when = 0, slideTo = 0) {
    if (!context) return;
    const start = context.currentTime + when;
    const osc = context.createOscillator();
    const amp = context.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    if (slideTo > 0) osc.frequency.exponentialRampToValueAtTime(slideTo, start + seconds);
    amp.gain.setValueAtTime(gain, start);
    amp.gain.exponentialRampToValueAtTime(0.0001, start + seconds);
    osc.connect(amp).connect(context.destination);
    osc.start(start);
    osc.stop(start + seconds + 0.02);
  }

  return {
    wake,
    /** Play the named kitchen sound; unknown names stay silent. */
    play(name) {
      if (!context) return;
      if (name === 'cooked') {
        tone(880, 0.09, 'sine', 0.07);
        tone(1318, 0.12, 'sine', 0.07, 0.08);
      } else if (name === 'serve') {
        tone(523, 0.08, 'triangle', 0.08);
        tone(659, 0.08, 'triangle', 0.08, 0.07);
        tone(784, 0.14, 'triangle', 0.09, 0.14);
      } else if (name === 'expire') {
        tone(392, 0.16, 'triangle', 0.08, 0, 196);
      } else if (name === 'burn') {
        tone(220, 0.2, 'sawtooth', 0.05, 0, 110);
      } else if (NOTES[name]) {
        const [freq, seconds, type, gain] = NOTES[name];
        tone(freq, seconds, type, gain);
      }
    },
  };
}
