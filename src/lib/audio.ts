/**
 * Procedural sound effects via the Web Audio API — no audio files, so there's
 * nothing to download or decode and playback starts immediately.
 *
 * Every sound is a few oscillators shaped by gain envelopes (and optional
 * filters). Nodes are disconnected as soon as they finish, so fast typing
 * doesn't accumulate audio graph nodes.
 */

export type SoundEffect = 'correct' | 'incorrect' | 'blockComplete'

interface Tone {
  type: OscillatorType
  /** Start frequency (Hz). */
  from: number
  /** End frequency (Hz) for a pitch sweep; omitted = steady pitch. */
  to?: number
  /** Offset from "now" (s), for staggered notes. */
  delay?: number
  /** Attack and decay times (s). */
  attack: number
  decay: number
  /** Peak gain (0–1) before the master volume. */
  peak: number
  filter?: { type: BiquadFilterType; frequency: number }
}

/** Sound recipes. Durations: tap ≈ 30 ms, thud ≈ 0.13 s, chime ≈ 0.7 s. */
const SOUNDS: Readonly<Record<SoundEffect, readonly Tone[]>> = {
  // Mechanical-keyboard tap: a bright downward chirp plus a tiny high click transient.
  correct: [
    { type: 'triangle', from: 2200, to: 800, attack: 0.001, decay: 0.028, peak: 0.22, filter: { type: 'highpass', frequency: 600 } },
    { type: 'square', from: 4200, attack: 0.0005, decay: 0.006, peak: 0.04 },
  ],
  // Muted thud: low falling sine with a dull, filtered buzz underneath.
  incorrect: [
    { type: 'sine', from: 190, to: 85, attack: 0.003, decay: 0.12, peak: 0.55, filter: { type: 'lowpass', frequency: 500 } },
    { type: 'square', from: 120, to: 95, attack: 0.002, decay: 0.07, peak: 0.07, filter: { type: 'lowpass', frequency: 380 } },
  ],
  // Chime: two bell-like notes (C6 → G6) with a soft octave shimmer, ringing out.
  blockComplete: [
    { type: 'sine', from: 1046.5, attack: 0.005, decay: 0.55, peak: 0.28 },
    { type: 'sine', from: 2093, attack: 0.005, decay: 0.25, peak: 0.05 },
    { type: 'sine', from: 1568, delay: 0.08, attack: 0.005, decay: 0.6, peak: 0.26 },
    { type: 'sine', from: 3136, delay: 0.08, attack: 0.005, decay: 0.28, peak: 0.04 },
  ],
}

const MASTER_VOLUME = 0.6
/** Exponential ramps can't reach 0; this is inaudible. */
const SILENCE = 0.0001

type ContextFactory = () => BaseAudioContext | null

function createDefaultContext(): AudioContext | null {
  if (typeof window === 'undefined' || typeof window.AudioContext !== 'function') return null
  return new AudioContext({ latencyHint: 'interactive' })
}

export class AudioPlayer {
  private context: BaseAudioContext | null = null
  private master: GainNode | null = null
  private readonly createContext: ContextFactory

  /** `createContext` is injectable so tests can render into an OfflineAudioContext. */
  constructor(createContext: ContextFactory = createDefaultContext) {
    this.createContext = createContext
  }

  /** Play a sound effect now. Never throws; a no-op where Web Audio is unavailable. */
  play(effect: SoundEffect): void {
    const ready = this.ensureContext()
    if (!ready) return
    for (const tone of SOUNDS[effect]) this.playTone(ready.context, ready.master, tone)
  }

  /**
   * Create/resume the audio context. Browsers only allow audio after a user
   * gesture; calling this from one (e.g. the sound toggle) avoids a silent
   * first keystroke on stricter browsers.
   */
  unlock(): void {
    this.ensureContext()
  }

  private ensureContext(): { context: BaseAudioContext; master: GainNode } | null {
    try {
      if (!this.context || !this.master) {
        const context = this.createContext()
        if (!context) return null
        const master = context.createGain()
        master.gain.value = MASTER_VOLUME
        master.connect(context.destination)
        this.context = context
        this.master = master
      }
      const { context, master } = this
      if (context instanceof AudioContext && context.state === 'suspended') void context.resume()
      return { context, master }
    } catch {
      return null // e.g. too many contexts, or audio blocked entirely
    }
  }

  private playTone(context: BaseAudioContext, output: AudioNode, tone: Tone): void {
    const start = context.currentTime + (tone.delay ?? 0)
    const end = start + tone.attack + tone.decay

    const osc = context.createOscillator()
    osc.type = tone.type
    osc.frequency.setValueAtTime(tone.from, start)
    if (tone.to !== undefined) osc.frequency.exponentialRampToValueAtTime(tone.to, end)

    const gain = context.createGain()
    gain.gain.setValueAtTime(SILENCE, start)
    gain.gain.exponentialRampToValueAtTime(tone.peak, start + tone.attack)
    gain.gain.exponentialRampToValueAtTime(SILENCE, end)

    let filter: BiquadFilterNode | null = null
    if (tone.filter) {
      filter = context.createBiquadFilter()
      filter.type = tone.filter.type
      filter.frequency.value = tone.filter.frequency
      osc.connect(filter).connect(gain)
    } else {
      osc.connect(gain)
    }
    gain.connect(output)

    osc.onended = () => {
      osc.disconnect()
      filter?.disconnect()
      gain.disconnect()
    }
    osc.start(start)
    osc.stop(end + 0.01)
  }
}

/** App-wide player (one AudioContext for the whole app). */
export const audioPlayer = new AudioPlayer()
