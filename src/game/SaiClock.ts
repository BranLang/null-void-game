/**
 * Sai, Ahil's ringed moon, swings gravity: when it is overhead the "light
 * hour" makes everything lighter (faster walking, gaps can be leapt, airships
 * lift); on the far side the "heavy hour" makes everything about a third
 * heavier. Scenes either run the cycle or pin a phase.
 */
export type SaiPhase = 'light' | 'heavy' | 'neutral'

export class SaiClock {
  /** 0..1, 0 = Sai overhead */
  phase01 = 0.5
  cycle = 0
  forced: SaiPhase | null = null
  enabled = false

  configure(opts?: { cycle?: number; phase?: SaiPhase }): void {
    this.enabled = !!opts
    this.cycle = opts?.cycle ?? 0
    this.forced = opts?.phase ?? null
    this.phase01 = this.forced === 'light' ? 0 : this.forced === 'heavy' ? 0.5 : this.cycle ? 0.85 : 0.25
  }

  force(p: SaiPhase | 'cycle'): void {
    this.enabled = true
    if (p === 'cycle') {
      this.forced = null
      if (!this.cycle) this.cycle = 90
    } else this.forced = p
  }

  update(dt: number): void {
    if (!this.enabled) return
    if (this.forced) {
      const target = this.forced === 'light' ? 0 : this.forced === 'heavy' ? 0.5 : 0.25
      let d = target - this.phase01
      d = ((d + 0.5) % 1 + 1) % 1 - 0.5
      this.phase01 = (this.phase01 + d * Math.min(1, dt * 1.5) + 1) % 1
    } else if (this.cycle > 0) this.phase01 = (this.phase01 + dt / this.cycle) % 1
  }

  get phase(): SaiPhase {
    if (!this.enabled) return 'neutral'
    const p = this.phase01
    if (p < 0.125 || p > 0.875) return 'light'
    if (p > 0.375 && p < 0.625) return 'heavy'
    return 'neutral'
  }

  /** Movement speed multiplier. */
  get speedFactor(): number {
    const p = this.phase
    return p === 'light' ? 1.18 : p === 'heavy' ? 0.76 : 1
  }
}
