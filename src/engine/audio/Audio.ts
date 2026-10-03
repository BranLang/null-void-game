import { Howl, Howler } from 'howler'
import type { AmbientSoundId, MusicId } from '../../content/types'

/**
 * Music is streamed with Howler (crossfades between tracks). Sound effects
 * and ambient beds are synthesised with WebAudio, so the game needs almost no
 * audio files and every ambience can be layered freely per scene.
 */
export class Audio {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private sfxBus: GainNode | null = null
  private ambBus: GainNode | null = null
  private music: { id: MusicId; howl: Howl } | null = null
  private musicVolume = 0.6
  private sfxVolume = 0.8
  private ambVolume = 0.7
  private beds = new Map<AmbientSoundId, { stop: () => void }>()
  private noiseBuf: AudioBuffer | null = null
  private brownBuf: AudioBuffer | null = null
  private steps: Howl[] = []
  private stepIndex = 0

  /** Must be called from a user gesture (browser autoplay policy). */
  unlock(): void {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') void this.ctx.resume()
      return
    }
    try {
      this.ctx = new AudioContext()
    } catch {
      return
    }
    const c = this.ctx
    this.master = c.createGain()
    this.master.connect(c.destination)
    this.sfxBus = c.createGain()
    this.sfxBus.gain.value = this.sfxVolume
    this.sfxBus.connect(this.master)
    this.ambBus = c.createGain()
    this.ambBus.gain.value = this.ambVolume
    this.ambBus.connect(this.master)
    this.noiseBuf = this.makeNoise('white')
    this.brownBuf = this.makeNoise('brown')
    for (const name of ['StoneL1', 'StoneR1', 'StoneL2', 'StoneR2', 'StoneL3', 'StoneR3']) {
      this.steps.push(new Howl({ src: [`assets/sfx/Fantozzi-${name}.ogg`], volume: 0.25 }))
    }
  }

  setVolumes(music: number, sfx: number, amb: number): void {
    this.musicVolume = music
    this.sfxVolume = sfx
    this.ambVolume = amb
    if (this.music) this.music.howl.volume(music)
    if (this.sfxBus) this.sfxBus.gain.value = sfx
    if (this.ambBus) this.ambBus.gain.value = amb
    Howler.volume(1)
  }

  // ------------------------------------------------------------------ music
  playMusic(id: MusicId | null, fadeMs = 1500): void {
    if (this.music?.id === id) return
    const old = this.music
    if (old) {
      old.howl.fade(old.howl.volume(), 0, fadeMs)
      setTimeout(() => old.howl.unload(), fadeMs + 50)
      this.music = null
    }
    if (!id) return
    const howl = new Howl({ src: [`assets/music/${id}.mp3`], html5: true, loop: true, volume: 0 })
    howl.play()
    howl.fade(0, this.musicVolume, fadeMs)
    this.music = { id, howl }
  }

  currentMusic(): MusicId | null {
    return this.music?.id ?? null
  }

  // ------------------------------------------------------------------ ambience
  setAmbience(ids: AmbientSoundId[]): void {
    const want = new Set(ids)
    for (const [id, bed] of this.beds) {
      if (!want.has(id)) {
        bed.stop()
        this.beds.delete(id)
      }
    }
    if (!this.ctx) return
    for (const id of want) if (!this.beds.has(id)) this.beds.set(id, this.makeBed(id))
  }

  private makeNoise(kind: 'white' | 'brown'): AudioBuffer {
    const c = this.ctx!
    const len = c.sampleRate * 4
    const buf = c.createBuffer(1, len, c.sampleRate)
    const d = buf.getChannelData(0)
    let last = 0
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1
      if (kind === 'white') d[i] = w
      else {
        last = (last + 0.02 * w) / 1.02
        d[i] = last * 3.5
      }
    }
    return buf
  }

  private noiseSource(kind: 'white' | 'brown'): AudioBufferSourceNode {
    const src = this.ctx!.createBufferSource()
    src.buffer = kind === 'white' ? this.noiseBuf : this.brownBuf
    src.loop = true
    src.loopStart = Math.random()
    return src
  }

  private makeBed(id: AmbientSoundId): { stop: () => void } {
    const c = this.ctx!
    const out = c.createGain()
    out.gain.value = 0
    out.connect(this.ambBus!)
    out.gain.linearRampToValueAtTime(1, c.currentTime + 2)
    const nodes: AudioScheduledSourceNode[] = []
    const timers: number[] = []
    const lfo = (freq: number, depth: number, target: AudioParam, base: number) => {
      const o = c.createOscillator()
      o.frequency.value = freq
      const g = c.createGain()
      g.gain.value = depth
      o.connect(g).connect(target)
      target.value = base
      o.start()
      nodes.push(o)
    }
    const noise = (kind: 'white' | 'brown', type: BiquadFilterType, freq: number, q: number, gain: number) => {
      const src = this.noiseSource(kind)
      const f = c.createBiquadFilter()
      f.type = type
      f.frequency.value = freq
      f.Q.value = q
      const g = c.createGain()
      g.gain.value = gain
      src.connect(f).connect(g).connect(out)
      src.start()
      nodes.push(src)
      return { f, g }
    }
    const every = (minMs: number, maxMs: number, fn: () => void) => {
      const tick = () => {
        fn()
        timers.push(window.setTimeout(tick, minMs + Math.random() * (maxMs - minMs)))
      }
      timers.push(window.setTimeout(tick, Math.random() * maxMs))
    }
    const ping = (freq: number, dur: number, vol: number, type: OscillatorType = 'sine') => {
      const o = c.createOscillator()
      o.type = type
      o.frequency.value = freq
      const g = c.createGain()
      g.gain.setValueAtTime(0, c.currentTime)
      g.gain.linearRampToValueAtTime(vol, c.currentTime + 0.01)
      g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur)
      o.connect(g).connect(out)
      o.start()
      o.stop(c.currentTime + dur + 0.05)
    }
    switch (id) {
      case 'wind': {
        const { f } = noise('brown', 'lowpass', 500, 0.7, 0.5)
        lfo(0.07, 300, f.frequency, 520)
        break
      }
      case 'storm': {
        const { f } = noise('brown', 'lowpass', 700, 0.6, 0.8)
        lfo(0.11, 400, f.frequency, 750)
        noise('white', 'highpass', 2500, 0.3, 0.06)
        every(6000, 16000, () => {
          const r = this.noiseSource('brown')
          const lp = c.createBiquadFilter()
          lp.type = 'lowpass'
          lp.frequency.value = 120
          const g = c.createGain()
          g.gain.setValueAtTime(0, c.currentTime)
          g.gain.linearRampToValueAtTime(1.6, c.currentTime + 0.3)
          g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 4)
          r.connect(lp).connect(g).connect(out)
          r.start()
          r.stop(c.currentTime + 4.2)
        })
        break
      }
      case 'rain':
        noise('white', 'highpass', 900, 0.5, 0.16)
        noise('white', 'bandpass', 3500, 0.8, 0.08)
        break
      case 'sea': {
        const { g } = noise('brown', 'lowpass', 600, 0.5, 0.5)
        lfo(0.09, 0.35, g.gain, 0.45)
        break
      }
      case 'water':
        noise('white', 'bandpass', 1400, 1.5, 0.05)
        every(300, 1400, () => ping(400 + Math.random() * 600, 0.12, 0.02))
        break
      case 'crowd':
        for (const fr of [350, 700, 1200]) {
          const { g } = noise('white', 'bandpass', fr, 4, 0.05)
          lfo(0.6 + Math.random(), 0.04, g.gain, 0.05)
        }
        break
      case 'fire':
        noise('brown', 'lowpass', 300, 0.5, 0.25)
        every(60, 400, () => ping(1500 + Math.random() * 3000, 0.03, 0.05, 'square'))
        break
      case 'forest':
      case 'night':
        noise('brown', 'lowpass', 400, 0.5, 0.15)
        every(400, 900, () => {
          for (let i = 0; i < 3; i++) setTimeout(() => ping(4200 + Math.random() * 300, 0.04, 0.015), i * 60)
        })
        if (id === 'forest') every(2500, 7000, () => ping(1800 + Math.random() * 1200, 0.25, 0.02, 'triangle'))
        break
      case 'drone': {
        const o1 = c.createOscillator()
        o1.frequency.value = 42
        const o2 = c.createOscillator()
        o2.frequency.value = 63.3
        const g = c.createGain()
        g.gain.value = 0.25
        o1.connect(g)
        o2.connect(g)
        g.connect(out)
        lfo(0.15, 0.12, g.gain, 0.22)
        o1.start()
        o2.start()
        nodes.push(o1, o2)
        break
      }
      case 'hum': {
        const o = c.createOscillator()
        o.type = 'sawtooth'
        o.frequency.value = 55
        const f = c.createBiquadFilter()
        f.type = 'lowpass'
        f.frequency.value = 180
        const g = c.createGain()
        g.gain.value = 0.06
        o.connect(f).connect(g).connect(out)
        o.start()
        nodes.push(o)
        break
      }
      case 'machine':
        noise('brown', 'lowpass', 200, 0.5, 0.2)
        every(380, 420, () => ping(70, 0.12, 0.25, 'square'))
        break
      case 'cave':
        noise('brown', 'lowpass', 250, 0.5, 0.12)
        every(900, 3000, () => ping(1200 + Math.random() * 1600, 0.35, 0.04))
        break
      case 'void':
        for (const fr of [220, 331, 441]) {
          const o = c.createOscillator()
          o.frequency.value = fr + Math.random() * 2
          const g = c.createGain()
          g.gain.value = 0.015
          o.connect(g).connect(out)
          o.start()
          nodes.push(o)
        }
        noise('white', 'highpass', 6000, 0.3, 0.02)
        break
    }
    return {
      stop: () => {
        out.gain.cancelScheduledValues(c.currentTime)
        out.gain.setValueAtTime(out.gain.value, c.currentTime)
        out.gain.linearRampToValueAtTime(0, c.currentTime + 1.5)
        timers.forEach((t) => clearTimeout(t))
        setTimeout(() => {
          nodes.forEach((n) => {
            try {
              n.stop()
            } catch {
              /* already stopped */
            }
          })
          out.disconnect()
        }, 1600)
      },
    }
  }

  // ------------------------------------------------------------------ sfx
  step(): void {
    if (!this.steps.length) return
    const h = this.steps[this.stepIndex++ % this.steps.length]
    h.volume(0.22 * this.sfxVolume)
    h.rate(0.92 + Math.random() * 0.16)
    h.play()
  }

  sfx(id: string, volume = 1): void {
    const c = this.ctx
    if (!c || !this.sfxBus) return
    const t0 = c.currentTime
    const out = c.createGain()
    out.gain.value = volume
    out.connect(this.sfxBus)
    const tone = (freq: number, start: number, dur: number, vol: number, type: OscillatorType = 'sine', endFreq?: number) => {
      const o = c.createOscillator()
      o.type = type
      o.frequency.setValueAtTime(freq, t0 + start)
      if (endFreq) o.frequency.exponentialRampToValueAtTime(endFreq, t0 + start + dur)
      const g = c.createGain()
      g.gain.setValueAtTime(0, t0 + start)
      g.gain.linearRampToValueAtTime(vol, t0 + start + Math.min(0.02, dur / 4))
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + start + dur)
      o.connect(g).connect(out)
      o.start(t0 + start)
      o.stop(t0 + start + dur + 0.05)
    }
    const burst = (start: number, dur: number, vol: number, type: BiquadFilterType, freq: number, endFreq?: number, kind: 'white' | 'brown' = 'white') => {
      const s = this.noiseSource(kind)
      const f = c.createBiquadFilter()
      f.type = type
      f.frequency.setValueAtTime(freq, t0 + start)
      if (endFreq) f.frequency.exponentialRampToValueAtTime(endFreq, t0 + start + dur)
      const g = c.createGain()
      g.gain.setValueAtTime(0, t0 + start)
      g.gain.linearRampToValueAtTime(vol, t0 + start + 0.02)
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + start + dur)
      s.connect(f).connect(g).connect(out)
      s.start(t0 + start)
      s.stop(t0 + start + dur + 0.05)
    }
    switch (id) {
      case 'click':
        tone(880, 0, 0.06, 0.12)
        break
      case 'text':
        tone(620 + Math.random() * 80, 0, 0.03, 0.03, 'triangle')
        break
      case 'open':
        tone(520, 0, 0.12, 0.08, 'triangle', 780)
        break
      case 'close':
        tone(700, 0, 0.12, 0.08, 'triangle', 420)
        break
      case 'success':
        ;[523, 659, 784, 1046].forEach((f, i) => tone(f, i * 0.09, 0.4, 0.1, 'triangle'))
        break
      case 'fail':
        tone(180, 0, 0.5, 0.25, 'sawtooth', 70)
        break
      case 'glyph':
      case 'chime':
        ;[880, 1320, 1760, 2217].forEach((f, i) => tone(f, i * 0.04, 1.2, 0.05))
        break
      case 'water':
        burst(0, 0.5, 0.2, 'bandpass', 1800, 500)
        tone(500, 0.05, 0.2, 0.05, 'sine', 900)
        break
      case 'ice':
      case 'crack':
        burst(0, 0.15, 0.3, 'highpass', 3000)
        ;[2600, 3400, 4100].forEach((f, i) => tone(f, i * 0.05, 0.5, 0.04))
        break
      case 'fire':
        burst(0, 0.6, 0.35, 'lowpass', 1800, 300, 'brown')
        break
      case 'whoosh':
        burst(0, 0.45, 0.25, 'bandpass', 300, 2500)
        break
      case 'tick':
        tone(1400, 0, 0.02, 0.06, 'square')
        break
      case 'heartbeat':
        tone(60, 0, 0.18, 0.5, 'sine', 40)
        tone(55, 0.22, 0.2, 0.4, 'sine', 38)
        break
      case 'page':
        burst(0, 0.25, 0.12, 'highpass', 2500)
        break
      case 'bell':
        ;[392, 588, 784, 1170].forEach((f, i) => tone(f * (1 + (i === 3 ? 0.03 : 0)), 0, 2.2 - i * 0.3, 0.07))
        break
      case 'boom':
        burst(0, 1.4, 0.9, 'lowpass', 400, 60, 'brown')
        tone(70, 0, 0.8, 0.5, 'sine', 30)
        break
      case 'bass':
        tone(38, 0, 2.8, 0.7, 'sine', 32)
        tone(57, 0, 2.5, 0.3, 'sine', 48)
        break
      case 'veil':
        ;[1760, 1320, 880, 660].forEach((f, i) => tone(f, i * 0.06, 0.7, 0.04))
        burst(0, 0.6, 0.06, 'highpass', 5000)
        break
      case 'door':
        burst(0, 0.35, 0.25, 'lowpass', 500, 150, 'brown')
        break
      case 'shot':
        burst(0, 0.25, 0.8, 'lowpass', 3000, 200)
        break
      case 'coil':
        tone(200, 0, 0.5, 0.2, 'sawtooth', 2000)
        break
      case 'alert':
        tone(660, 0, 0.12, 0.15, 'square')
        tone(990, 0.12, 0.2, 0.15, 'square')
        break
      default:
        tone(440, 0, 0.1, 0.05)
    }
  }
}

export const audio = new Audio()
