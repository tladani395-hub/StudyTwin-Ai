/**
 * Audio Synthesizer and Master Player for Aanvi 3D Intro
 * Synchronized with the ~8.2s timeline.
 * Normalization target: RMS ~ -18 dBFS, Peak < -1.0 dBFS.
 */

export interface AudioRecordingResult {
  webm: string;
  wav: string;
  sampleRate: number;
}

export class IntroAudioSynth {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private makeupGain: GainNode | null = null;
  private limiter: WaveShaperNode | null = null;
  private volume = 0.8;
  public isPlaying = false;
  private autoplayBlocked = false;
  private activeNodes: { stop?: (when?: number) => void; disconnect?: () => void }[] = [];
  private timeouts: NodeJS.Timeout[] = [];
  private isExplicitlyStopped = false;
  private recorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private mediaDest: MediaStreamAudioDestinationNode | null = null;
  private pcmCaptureNode: ScriptProcessorNode | null = null;
  private pcmSamples: Float32Array[] = [];
  private recordedBase64Promise: Promise<AudioRecordingResult> | null = null;
  private resolveResult: ((val: AudioRecordingResult) => void) | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      } catch {}

      (window as any).__AANVI_AUDIO_SYNTH = this;
    }
  }

  public startRecording(): void {
    if (!this.ctx) return;
    try {
      this.mediaDest = this.ctx.createMediaStreamDestination();
      const outputNode = this.limiter || this.masterGain;
      if (outputNode) {
        outputNode.connect(this.mediaDest);
      }
      this.recordedChunks = [];
      this.pcmSamples = [];

      // 1. MediaRecorder capture (WebM/Opus)
      try {
        this.recorder = new MediaRecorder(this.mediaDest.stream);
        this.recorder.ondataavailable = (e) => {
          if (e.data.size > 0) this.recordedChunks.push(e.data);
        };
        this.recorder.start(100);
      } catch (err) {
        console.warn('MediaRecorder init error', err);
      }

      // 2. Direct Float32 PCM Capture (16-bit uncompressed WAV)
      try {
        this.pcmCaptureNode = this.ctx.createScriptProcessor(4096, 1, 1);
        this.pcmCaptureNode.onaudioprocess = (e) => {
          if (!this.isPlaying) return;
          const input = e.inputBuffer.getChannelData(0);
          this.pcmSamples.push(new Float32Array(input));
        };
        if (outputNode) {
          outputNode.connect(this.pcmCaptureNode);
        }
        this.pcmCaptureNode.connect(this.ctx.destination);
      } catch (pcmErr) {
        console.warn('PCM capture node error', pcmErr);
      }

      this.recordedBase64Promise = new Promise<AudioRecordingResult>((resolve) => {
        this.resolveResult = resolve;
      });
    } catch (e) {
      console.warn('Browser Audio startRecording failed', e);
    }
  }

  public async stopRecording(): Promise<AudioRecordingResult> {
    const sampleRate = this.ctx?.sampleRate || 48000;
    let wavBase64 = '';

    // Encode recorded PCM samples to standard 16-bit WAV
    if (this.pcmSamples.length > 0) {
      try {
        wavBase64 = this.encodeWav(this.pcmSamples, sampleRate);
      } catch (e) {
        console.warn('WAV encoding failed', e);
      }
    }

    if (this.pcmCaptureNode) {
      try {
        this.pcmCaptureNode.disconnect();
      } catch {}
      this.pcmCaptureNode = null;
    }

    if (this.recorder && this.recorder.state !== 'inactive') {
      return new Promise<AudioRecordingResult>((resolve) => {
        if (!this.recorder) {
          resolve({ webm: '', wav: wavBase64, sampleRate });
          return;
        }
        this.recorder.onstop = () => {
          const blob = new Blob(this.recordedChunks, { type: 'audio/webm' });
          const reader = new FileReader();
          reader.onloadend = () => {
            const webmBase64 = ((reader.result as string) || '').split(',')[1] || '';
            resolve({ webm: webmBase64, wav: wavBase64, sampleRate });
          };
          reader.readAsDataURL(blob);
        };
        this.recorder.stop();
      });
    }

    return { webm: '', wav: wavBase64, sampleRate };
  }

  private encodeWav(samplesList: Float32Array[], sampleRate: number): string {
    let totalLength = 0;
    for (const arr of samplesList) totalLength += arr.length;
    const merged = new Float32Array(totalLength);
    let offset = 0;
    for (const arr of samplesList) {
      merged.set(arr, offset);
      offset += arr.length;
    }

    const buffer = new ArrayBuffer(44 + merged.length * 2);
    const view = new DataView(buffer);

    const writeString = (view: DataView, off: number, str: string) => {
      for (let i = 0; i < str.length; i++) {
        view.setUint8(off + i, str.charCodeAt(i));
      }
    };

    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + merged.length * 2, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM format
    view.setUint16(22, 1, true); // Mono
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true); // Block align
    view.setUint16(34, 16, true); // 16-bit
    writeString(view, 36, 'data');
    view.setUint32(40, merged.length * 2, true);

    let pcmOffset = 44;
    for (let i = 0; i < merged.length; i++, pcmOffset += 2) {
      const s = Math.max(-1, Math.min(1, merged[i]));
      view.setInt16(pcmOffset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }

    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  public getContext(): AudioContext | null {
    return this.ctx;
  }

  public isBlocked(): boolean {
    return this.autoplayBlocked;
  }

  public async resume(): Promise<void> {
    if (this.ctx && this.ctx.state === 'suspended') {
      try {
        await this.ctx.resume();
        this.autoplayBlocked = false;
      } catch {}
    }
  }

  public setVolume(val: number): void {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  /**
   * Start intro audio playback immediately
   * Uses 100% code-generated Web Audio synthesis.
   * Under standard browser autoplay policy, if user gesture has not occurred,
   * ctx.resume() leaves context suspended and returns false (non-blocking).
   */
  public async start(startTimeOffset = 0): Promise<boolean> {
    this.isExplicitlyStopped = false;
    this.isPlaying = false;

    if (!this.ctx) {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) this.ctx = new AudioCtx();
      } catch {}
    }

    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        try {
          await this.ctx.resume();
        } catch {}
      }

      // If stop() was called during resume(), abort immediately
      if (this.isExplicitlyStopped) {
        this.isPlaying = false;
        return false;
      }

      // Check if browser autoplay policy blocked resumption
      if (this.ctx.state === 'suspended') {
        this.autoplayBlocked = true;
        this.isPlaying = false;
        return false;
      }

      this.autoplayBlocked = false;
      this.isPlaying = true;
      this.startSynthesized(startTimeOffset);
      return true;
    }

    return false;
  }

  private createLimiterCurve(ceiling = 0.86, n = 4096): Float32Array {
    const curve = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const x = (i * 2) / n - 1;
      const av = Math.abs(x);
      const sign = Math.sign(x);
      if (av <= 0.65) {
        curve[i] = x;
      } else {
        const excess = av - 0.65;
        const compressed = 0.65 + (ceiling - 0.65) * Math.tanh(excess / (ceiling - 0.65));
        curve[i] = sign * Math.min(compressed, ceiling);
      }
    }
    return curve;
  }

  /**
   * Full Web Audio fallback synthesized cue timeline
   */
  private startSynthesized(offset = 0): void {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    // Master volume control (default 80%)
    this.masterGain = ctx.createGain();
    this.masterGain.gain.setValueAtTime(this.volume, now);

    // Dynamics compressor to tame spikes and lift quiet details
    this.compressor = ctx.createDynamicsCompressor();
    this.compressor.threshold.setValueAtTime(-16, now);
    this.compressor.knee.setValueAtTime(10, now);
    this.compressor.ratio.setValueAtTime(4.0, now);
    this.compressor.attack.setValueAtTime(0.003, now);
    this.compressor.release.setValueAtTime(0.18, now);

    // Makeup gain calibrated so 80% volume produces RMS ~ -17 to -18 dBFS
    this.makeupGain = ctx.createGain();
    this.makeupGain.gain.setValueAtTime(0.95, now);

    // Limiter with soft saturation ceiling at 0.86 (-1.31 dBFS)
    this.limiter = ctx.createWaveShaper();
    this.limiter.curve = this.createLimiterCurve(0.86) as any;
    this.limiter.oversample = '2x';

    // Graph routing: masterGain -> compressor -> makeupGain -> limiter
    this.masterGain.connect(this.compressor);
    this.compressor.connect(this.makeupGain);
    this.makeupGain.connect(this.limiter);

    // Output routing from limiter
    this.limiter.connect(ctx.destination);
    if (this.mediaDest) {
      this.limiter.connect(this.mediaDest);
    }
    if (this.pcmCaptureNode) {
      this.limiter.connect(this.pcmCaptureNode);
    }

    // 0.0s - 1.8s: Deep space hum & star twinkles
    if (offset <= 1.8) {
      try {
        const humOsc = ctx.createOscillator();
        const humGain = ctx.createGain();
        humOsc.type = 'sine';
        humOsc.frequency.setValueAtTime(55, now);
        humOsc.frequency.exponentialRampToValueAtTime(73.4, now + 3.2);
        humGain.gain.setValueAtTime(0.35, now);
        humGain.gain.exponentialRampToValueAtTime(0.001, now + 3.2);
        humOsc.connect(humGain);
        humGain.connect(this.masterGain);
        humOsc.start(now);
        humOsc.stop(now + 3.2);
        this.activeNodes.push(humOsc, humGain);
      } catch {}

      // 5 star twinkles (0.15s, 0.45s, 0.75s, 1.05s, 1.30s)
      const twinkleTimes = [0.15, 0.45, 0.75, 1.05, 1.30];
      const twinkleFreqs = [1760.0, 2093.0, 2349.3, 2637.0, 3135.9];
      twinkleTimes.forEach((st, idx) => {
        if (st >= offset) {
          const t = setTimeout(() => {
            if (!this.isPlaying) return;
            this.playChime([twinkleFreqs[idx]], 0.45, 0.48);
          }, (st - offset) * 1000);
          this.timeouts.push(t);
        }
      });
    }

    // 3.0s - 4.6s: Deep Space Fly-through Whoosh
    if (offset <= 4.6) {
      const t = setTimeout(() => {
        if (!this.isPlaying || !this.ctx || !this.masterGain) return;
        try {
          const osc = this.ctx.createOscillator();
          const osc2 = this.ctx.createOscillator();
          const filter = this.ctx.createBiquadFilter();
          const gain = this.ctx.createGain();

          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(65, this.ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(280, this.ctx.currentTime + 1.4);

          osc2.type = 'sine';
          osc2.frequency.setValueAtTime(80, this.ctx.currentTime);
          osc2.frequency.exponentialRampToValueAtTime(360, this.ctx.currentTime + 1.4);

          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(180, this.ctx.currentTime);
          filter.frequency.exponentialRampToValueAtTime(1400, this.ctx.currentTime + 0.8);
          filter.frequency.exponentialRampToValueAtTime(220, this.ctx.currentTime + 1.5);

          gain.gain.setValueAtTime(0.001, this.ctx.currentTime);
          gain.gain.linearRampToValueAtTime(0.45, this.ctx.currentTime + 0.8);
          gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1.5);

          osc.connect(filter);
          osc2.connect(filter);
          filter.connect(gain);
          gain.connect(this.masterGain);

          osc.start();
          osc2.start();
          osc.stop(this.ctx.currentTime + 1.6);
          osc2.stop(this.ctx.currentTime + 1.6);
          this.activeNodes.push(osc, osc2, filter, gain);
        } catch {}
      }, Math.max(0, (3.0 - offset) * 1000));
      this.timeouts.push(t);
    }

    // 4.6s: Picture 1 Orb Chime (Harmonic 4-voice chord)
    if (offset <= 4.6) {
      const t = setTimeout(() => {
        if (!this.isPlaying) return;
        this.playChime([659.25, 987.77, 1318.51, 1975.53], 1.8, 0.65);
      }, (4.6 - offset) * 1000);
      this.timeouts.push(t);
    }

    // 5.65s: Picture 2 Happy Ping (Duolingo / Apple chime)
    if (offset <= 5.65) {
      const t = setTimeout(() => {
        if (!this.isPlaying) return;
        this.playChime([1046.50, 1318.51, 1567.98, 2093.00], 1.4, 0.70);
      }, (5.65 - offset) * 1000);
      this.timeouts.push(t);
    }

    // 6.4s: 5 Letter ticks & chord (Sample-accurate AudioContext timeline scheduling)
    if (offset <= 6.4) {
      const letterFreqs = [523.25, 659.25, 783.99, 1046.50, 1318.51];
      letterFreqs.forEach((freq, idx) => {
        const time = 6.4 + idx * 0.16;
        if (time >= offset) {
          this.playKalimba(freq, 0.35, 0.45, now + (time - offset));
        }
      });

      if (7.0 >= offset) {
        this.playWarmChord([349.23, 440.0, 523.25, 659.25], 1.6, 0.55, now + (7.0 - offset));
      }
    }

    // 7.3s: Doors Opening Grand Whoosh (Sample-accurate AudioContext timeline scheduling)
    if (offset <= 7.3) {
      const scheduleTime = now + (7.3 - offset);
      try {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(140, scheduleTime);
        osc.frequency.exponentialRampToValueAtTime(1100, scheduleTime + 0.8);
        gain.gain.setValueAtTime(0.02, scheduleTime);
        gain.gain.linearRampToValueAtTime(0.72, scheduleTime + 0.35);
        gain.gain.exponentialRampToValueAtTime(0.01, scheduleTime + 0.88);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(scheduleTime);
        osc.stop(scheduleTime + 0.9);
        this.activeNodes.push(osc, gain);
      } catch {}
    }
  }

  private playChime(freqs: number[], duration = 1.2, volume = 0.55): void {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    freqs.forEach((f) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now);
      const perVoice = freqs.length > 1 ? volume / Math.sqrt(freqs.length) : volume;
      gain.gain.setValueAtTime(perVoice, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + duration);
      this.activeNodes.push(osc, gain);
    });
  }

  private playKalimba(freq: number, duration = 0.35, volume = 0.42, startTime?: number): void {
    if (!this.ctx || !this.masterGain) return;
    const now = startTime !== undefined ? startTime : this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(freq * 2.76, now);

    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    osc2.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc2.start(now);
    osc.stop(now + duration);
    osc2.stop(now + duration);
    this.activeNodes.push(osc, osc2, gain);
  }

  private playWarmChord(freqs: number[], duration = 1.6, volume = 0.55, startTime?: number): void {
    if (!this.ctx || !this.masterGain) return;
    const now = startTime !== undefined ? startTime : this.ctx.currentTime;
    freqs.forEach((freq) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);
      const perVoice = freqs.length > 1 ? volume / Math.sqrt(freqs.length) : volume;
      gain.gain.setValueAtTime(perVoice, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + duration);
      this.activeNodes.push(osc, gain);
    });
  }

  public playReducedMotionChime(): void {
    if (this.ctx) {
      this.playChime([659.25, 987.77, 1318.51], 1.4, 0.45);
    }
  }

  public stop(): void {
    this.isExplicitlyStopped = true;
    this.isPlaying = false;
    this.timeouts.forEach(clearTimeout);
    this.timeouts = [];

    this.activeNodes.forEach((node) => {
      try {
        if (node.stop) node.stop();
        if (node.disconnect) node.disconnect();
      } catch {}
    });
    this.activeNodes = [];

    if (this.masterGain) {
      try {
        this.masterGain.disconnect();
      } catch {}
      this.masterGain = null;
    }
    if (this.compressor) {
      try {
        this.compressor.disconnect();
      } catch {}
      this.compressor = null;
    }
    if (this.makeupGain) {
      try {
        this.makeupGain.disconnect();
      } catch {}
      this.makeupGain = null;
    }
    if (this.limiter) {
      try {
        this.limiter.disconnect();
      } catch {}
      this.limiter = null;
    }
  }

  public dispose(): void {
    this.stop();
    if (this.ctx && this.ctx.state !== 'closed') {
      try {
        this.ctx.close();
      } catch {}
      this.ctx = null;
    }
  }
}
