class SoundSystem {
  constructor() {
    this.enabled = Boolean(window.AudioContext || window.webkitAudioContext);
    this.context = null;
    this.voices = new Set();
  }

  unlock() {
    if (!this.enabled) {
      return;
    }
    try {
      if (!this.context) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.context = new AudioContext();
        this.volume = this.context.createGain();
        this.volume.gain.value = 0.18;
        this.volume.connect(this.context.destination);
      }
      if (this.context.state === 'suspended') {
        this.context.resume().catch(() => {});
      }
    } catch {
      this.enabled = false;
    }
  }

  setEnabled(enabled) {
    this.enabled = enabled;
    if (enabled) {
      this.unlock();
    } else {
      this.stop();
    }
  }

  stop() {
    this.voices.forEach((voice) => voice.stop());
    this.voices.clear();
  }

  play(action) {
    if (!this.enabled || !this.context || this.context.state !== 'running') {
      return;
    }
    const now = this.context.currentTime;
    if (action === 'place') {
      this.tone(440, 220, now, 0.08, 'square', 0.12);
    } else if (action === 'pickup') {
      this.tone(660, 660, now, 0.09, 'square', 0.12);
      this.tone(990, 990, now + 0.08, 0.13, 'square', 0.12);
    } else if (action === 'explosion') {
      this.tone(100, 35, now, 0.22, 'triangle', 0.35);
      const buffer = this.context.createBuffer(
        1, Math.ceil(this.context.sampleRate * 0.22), this.context.sampleRate
      );
      const samples = buffer.getChannelData(0);
      for (let i = 0; i < samples.length; i += 1) {
        samples[i] = Math.random() * 2 - 1;
      }
      const source = this.context.createBufferSource();
      source.buffer = buffer;
      const filter = this.context.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 900;
      source.connect(filter);
      this.schedule(source, filter, now, 0.22, 0.35);
    }
  }

  tone(from, to, start, duration, type, volume) {
    const oscillator = this.context.createOscillator();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(from, start);
    oscillator.frequency.exponentialRampToValueAtTime(to, start + duration);
    this.schedule(oscillator, oscillator, start, duration, volume);
  }

  schedule(source, output, start, duration, volume) {
    const envelope = this.context.createGain();
    envelope.gain.setValueAtTime(0, start);
    envelope.gain.linearRampToValueAtTime(volume, start + 0.008);
    envelope.gain.exponentialRampToValueAtTime(0.001, start + duration);
    output.connect(envelope);
    envelope.connect(this.volume);
    this.voices.add(source);
    source.onended = () => {
      this.voices.delete(source);
      source.disconnect();
      if (output !== source) {
        output.disconnect();
      }
      envelope.disconnect();
    };
    source.start(start);
    source.stop(start + duration + 0.01);
  }
}

window.SoundSystem = SoundSystem;
