// Web Audio API Ringtone Synthesizer (Zero external assets, zero CORS, zero latency)
class RingtonePlayer {
  constructor() {
    this.audioCtx = null;
    this.oscillator1 = null;
    this.oscillator2 = null;
    this.gainNode = null;
    this.intervalId = null;
    this.isPlaying = false;
  }

  init() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    if (!this.audioCtx || this.audioCtx.state === "closed") {
      this.audioCtx = new AudioContext();
    }
  }

  playBeep() {
    if (!this.audioCtx) return;
    try {
      if (this.audioCtx.state === "suspended") {
        this.audioCtx.resume();
      }

      const osc1 = this.audioCtx.createOscillator();
      const osc2 = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      // Standard pleasant dual-frequency telephone ring (440Hz + 480Hz)
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(440, this.audioCtx.currentTime);

      osc2.type = "sine";
      osc2.frequency.setValueAtTime(480, this.audioCtx.currentTime);

      // Smooth attack and release envelope
      const now = this.audioCtx.currentTime;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.12, now + 0.05);
      gain.gain.setValueAtTime(0.12, now + 1.2);
      gain.gain.linearRampToValueAtTime(0, now + 1.4);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc1.start(now);
      osc2.start(now);

      osc1.stop(now + 1.4);
      osc2.stop(now + 1.4);
    } catch (err) {
      console.warn("Ringtone playback error:", err);
    }
  }

  start() {
    if (this.isPlaying) return;
    this.init();
    if (this.audioCtx && this.audioCtx.state === "suspended") {
      this.audioCtx.resume().catch(() => {});
    }
    this.isPlaying = true;
    this.playBeep();
    this.intervalId = setInterval(() => {
      if (this.isPlaying) {
        this.playBeep();
      }
    }, 2800);
  }

  stop() {
    this.isPlaying = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.audioCtx && this.audioCtx.state === "running") {
      this.audioCtx.suspend().catch(() => {});
    }
  }
}

const ringtone = new RingtonePlayer();
export default ringtone;
