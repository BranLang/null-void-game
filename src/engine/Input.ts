/**
 * Keyboard, mouse and gamepad input mapped to abstract actions.
 * Bindings are configurable from the settings menu.
 */
export type Action =
  | 'up'
  | 'down'
  | 'left'
  | 'right'
  | 'run'
  | 'interact'
  | 'advance'
  | 'pause'
  | 'journal'
  | 'ability1'
  | 'ability2'
  | 'ability3'
  | 'veil'
  | 'raw'

export type Bindings = Record<Action, string[]>

export const DEFAULT_BINDINGS: Bindings = {
  up: ['KeyW', 'ArrowUp'],
  down: ['KeyS', 'ArrowDown'],
  left: ['KeyA', 'ArrowLeft'],
  right: ['KeyD', 'ArrowRight'],
  run: ['ShiftLeft'],
  interact: ['KeyE', 'Space'],
  advance: ['Space', 'Enter', 'KeyE'],
  pause: ['Escape'],
  journal: ['KeyJ', 'Tab'],
  ability1: ['Digit1'],
  ability2: ['Digit2'],
  ability3: ['Digit3'],
  veil: ['KeyV', 'KeyQ'],
  raw: ['ControlLeft', 'KeyR'],
}

/** Gamepad button indices (standard mapping) per action. */
const PAD: Partial<Record<Action, number[]>> = {
  interact: [0],
  advance: [0],
  pause: [9],
  journal: [8],
  run: [4, 6],
  ability1: [2],
  ability2: [3],
  ability3: [5],
  veil: [1],
  raw: [7],
}

export class Input {
  private down = new Set<string>()
  private pressed = new Set<string>()
  private padDown = new Set<number>()
  private padPressed = new Set<number>()
  bindings: Bindings = structuredClone(DEFAULT_BINDINGS)
  mouseX = 0
  mouseY = 0
  /** Normalized device coordinates of the pointer */
  ndcX = 0
  ndcY = 0
  clicked = false
  rightClicked = false
  wheel = 0
  padAxisX = 0
  padAxisY = 0
  /** set when any keyboard/mouse/pad input arrives; UI uses it to show hints */
  lastDevice: 'kbm' | 'pad' = 'kbm'
  /** When true the game world ignores input (menus, dialogue overlay) */
  private listeners: ((code: string) => void)[] = []

  constructor(private canvas: HTMLElement) {
    window.addEventListener('keydown', (e) => {
      if (isTypingTarget(e.target)) return
      if (!this.down.has(e.code)) this.pressed.add(e.code)
      this.down.add(e.code)
      this.lastDevice = 'kbm'
      for (const fn of this.listeners) fn(e.code)
      if (e.code === 'Tab' || e.code === 'Space' || e.code.startsWith('Arrow')) e.preventDefault()
    })
    window.addEventListener('keyup', (e) => this.down.delete(e.code))
    window.addEventListener('blur', () => this.down.clear())
    canvas.addEventListener('mousemove', (e) => this.onMove(e))
    canvas.addEventListener('mousedown', (e) => {
      this.onMove(e)
      this.lastDevice = 'kbm'
      if (e.button === 0) this.clicked = true
      if (e.button === 2) this.rightClicked = true
    })
    canvas.addEventListener('contextmenu', (e) => e.preventDefault())
    canvas.addEventListener(
      'wheel',
      (e) => {
        this.wheel += Math.sign(e.deltaY)
        e.preventDefault()
      },
      { passive: false },
    )
  }

  /** Raw key listener (used for rebinding UI). Returns an unsubscribe fn. */
  onKey(fn: (code: string) => void): () => void {
    this.listeners.push(fn)
    return () => {
      this.listeners = this.listeners.filter((f) => f !== fn)
    }
  }

  private onMove(e: MouseEvent): void {
    const r = this.canvas.getBoundingClientRect()
    this.mouseX = e.clientX - r.left
    this.mouseY = e.clientY - r.top
    this.ndcX = (this.mouseX / r.width) * 2 - 1
    this.ndcY = -(this.mouseY / r.height) * 2 + 1
  }

  isDown(a: Action): boolean {
    if (this.bindings[a].some((k) => this.down.has(k))) return true
    return (PAD[a] ?? []).some((b) => this.padDown.has(b))
  }

  wasPressed(a: Action): boolean {
    if (this.bindings[a].some((k) => this.pressed.has(k))) return true
    return (PAD[a] ?? []).some((b) => this.padPressed.has(b))
  }

  /** Consume a press so other systems do not also react to it this frame. */
  consume(a: Action): void {
    for (const k of this.bindings[a]) this.pressed.delete(k)
    for (const b of PAD[a] ?? []) this.padPressed.delete(b)
  }

  /** Movement vector in screen space: x right, y up, length <= 1. */
  moveVector(): { x: number; y: number } {
    let x = 0
    let y = 0
    if (this.isDown('left')) x -= 1
    if (this.isDown('right')) x += 1
    if (this.isDown('up')) y += 1
    if (this.isDown('down')) y -= 1
    if (Math.abs(this.padAxisX) > 0.2 || Math.abs(this.padAxisY) > 0.2) {
      x = this.padAxisX
      y = -this.padAxisY
    }
    const len = Math.hypot(x, y)
    if (len > 1) {
      x /= len
      y /= len
    }
    return { x, y }
  }

  pollGamepad(): void {
    const pads = typeof navigator !== 'undefined' && navigator.getGamepads ? navigator.getGamepads() : []
    const pad = Array.from(pads).find((p) => p && p.connected)
    if (!pad) {
      this.padAxisX = 0
      this.padAxisY = 0
      return
    }
    this.padAxisX = pad.axes[0] ?? 0
    this.padAxisY = pad.axes[1] ?? 0
    // d-pad
    if (pad.buttons[14]?.pressed) this.padAxisX = -1
    if (pad.buttons[15]?.pressed) this.padAxisX = 1
    if (pad.buttons[12]?.pressed) this.padAxisY = -1
    if (pad.buttons[13]?.pressed) this.padAxisY = 1
    pad.buttons.forEach((b, i) => {
      if (b.pressed) {
        if (!this.padDown.has(i)) this.padPressed.add(i)
        this.padDown.add(i)
        this.lastDevice = 'pad'
      } else this.padDown.delete(i)
    })
    if (Math.abs(this.padAxisX) > 0.3 || Math.abs(this.padAxisY) > 0.3) this.lastDevice = 'pad'
  }

  /** Call at the end of every frame. */
  endFrame(): void {
    this.pressed.clear()
    this.padPressed.clear()
    this.clicked = false
    this.rightClicked = false
    this.wheel = 0
  }

  /** Human readable label of the first binding for an action. */
  label(a: Action): string {
    if (this.lastDevice === 'pad') {
      const names: Record<number, string> = { 0: 'A', 1: 'B', 2: 'X', 3: 'Y', 4: 'LB', 5: 'RB', 6: 'LT', 7: 'RT', 8: 'Back', 9: 'Start' }
      const b = PAD[a]?.[0]
      if (b !== undefined) return names[b] ?? `#${b}`
    }
    return keyLabel(this.bindings[a][0] ?? '')
  }
}

export function keyLabel(code: string): string {
  if (!code) return '—'
  if (code.startsWith('Key')) return code.slice(3)
  if (code.startsWith('Digit')) return code.slice(5)
  const map: Record<string, string> = {
    Space: 'Space',
    Enter: 'Enter',
    Escape: 'Esc',
    ShiftLeft: 'Shift',
    ShiftRight: 'Shift',
    ControlLeft: 'Ctrl',
    ControlRight: 'Ctrl',
    ArrowUp: '↑',
    ArrowDown: '↓',
    ArrowLeft: '←',
    ArrowRight: '→',
    Tab: 'Tab',
  }
  return map[code] ?? code
}

function isTypingTarget(t: EventTarget | null): boolean {
  const el = t as HTMLElement | null
  return !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') && (el as HTMLInputElement).type !== 'range'
}
