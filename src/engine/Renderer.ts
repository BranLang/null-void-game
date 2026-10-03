import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { OutlinePass } from './fx/OutlinePass'

export type Quality = 'low' | 'medium' | 'high'

export interface GradeSettings {
  tint: THREE.Color
  saturation: number
  contrast: number
  vignette: number
  grain: number
  /** 0..1, used by scripted moments (Sora gate, possession) */
  aberration: number
  /** 0..1 frost creeping in from the screen edges (Spira strain) */
  frost: number
  /** 0..1 desaturate towards grey ("medzipriestor" of the veil) */
  veil: number
}

const GradeShader = {
  uniforms: {
    tDiffuse: { value: null as THREE.Texture | null },
    uTint: { value: new THREE.Color(1, 1, 1) },
    uSaturation: { value: 1 },
    uContrast: { value: 1 },
    uVignette: { value: 0.35 },
    uGrain: { value: 0.04 },
    uAberration: { value: 0 },
    uFrost: { value: 0 },
    uVeil: { value: 0 },
    uTime: { value: 0 },
    uAspect: { value: 1 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform vec3 uTint;
    uniform float uSaturation, uContrast, uVignette, uGrain, uAberration, uFrost, uVeil, uTime, uAspect;
    varying vec2 vUv;

    float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
    float noise(vec2 p) {
      vec2 i = floor(p), f = fract(p);
      float a = hash(i), b = hash(i + vec2(1, 0)), c = hash(i + vec2(0, 1)), d = hash(i + vec2(1, 1));
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
    }

    void main() {
      vec2 uv = vUv;
      vec2 c = uv - 0.5;
      vec3 col;
      if (uAberration > 0.001) {
        vec2 off = c * uAberration * 0.012;
        col = vec3(texture2D(tDiffuse, uv + off).r, texture2D(tDiffuse, uv).g, texture2D(tDiffuse, uv - off).b);
      } else {
        col = texture2D(tDiffuse, uv).rgb;
      }
      float luma = dot(col, vec3(0.299, 0.587, 0.114));
      col = mix(vec3(luma), col, uSaturation * (1.0 - uVeil * 0.85));
      col = (col - 0.5) * uContrast + 0.5;
      col *= uTint;
      // veil: colours drain, light seems to flow around the edges
      col = mix(col, col * vec3(0.82, 0.86, 1.0) + vec3(0.02, 0.02, 0.05), uVeil);
      // frost from the edges
      if (uFrost > 0.001) {
        vec2 q = c * vec2(uAspect, 1.0);
        float edge = length(q) * 1.25 + noise(uv * 18.0) * 0.18 + noise(uv * 60.0) * 0.06;
        float f = smoothstep(1.05 - uFrost * 0.55, 1.12 - uFrost * 0.45, edge);
        col = mix(col, vec3(0.78, 0.9, 1.0), f * 0.75);
      }
      float v = smoothstep(0.85, 0.2, length(c * vec2(uAspect * 0.8, 1.0)));
      col *= mix(1.0 - uVignette, 1.0, v);
      col += (hash(uv * 1000.0 + uTime) - 0.5) * uGrain;
      gl_FragColor = vec4(col, 1.0);
    }
  `,
}

export class Renderer {
  readonly renderer: THREE.WebGLRenderer
  readonly canvas: HTMLCanvasElement
  private composer: EffectComposer
  private renderPass: RenderPass
  private bloom: UnrealBloomPass
  readonly outline: OutlinePass
  private grade: ShaderPass
  private quality: Quality = 'high'
  private pendingCapture: ((url: string) => void) | null = null
  readonly gradeSettings: GradeSettings = {
    tint: new THREE.Color(1, 1, 1),
    saturation: 1,
    contrast: 1,
    vignette: 0.35,
    grain: 0.035,
    aberration: 0,
    frost: 0,
    veil: 0,
  }

  constructor(container: HTMLElement) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    this.canvas = this.renderer.domElement
    this.canvas.id = 'game-canvas'
    container.appendChild(this.canvas)

    const dummyScene = new THREE.Scene()
    const dummyCam = new THREE.PerspectiveCamera()
    this.composer = new EffectComposer(this.renderer)
    this.renderPass = new RenderPass(dummyScene, dummyCam)
    this.composer.addPass(this.renderPass)
    this.outline = new OutlinePass(256, 256)
    this.composer.addPass(this.outline)
    this.bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.6, 0.5, 0.82)
    this.composer.addPass(this.bloom)
    this.composer.addPass(new OutputPass())
    this.grade = new ShaderPass(GradeShader)
    this.composer.addPass(this.grade)

    this.resize()
    window.addEventListener('resize', () => this.resize())
  }

  setQuality(q: Quality): void {
    this.quality = q
    this.renderer.shadowMap.enabled = q !== 'low'
    this.bloom.enabled = q !== 'low'
    this.resize()
  }

  /** Ink outlines can be turned off in the settings (accessibility / performance). */
  setOutlines(on: boolean): void {
    this.outline.enabled = on
  }

  getQuality(): Quality {
    return this.quality
  }

  get shadowMapSize(): number {
    return this.quality === 'high' ? 2048 : 1024
  }

  setBloom(strength: number, radius = 0.5, threshold = 0.82): void {
    this.bloom.strength = strength
    this.bloom.radius = radius
    this.bloom.threshold = threshold
  }

  setExposure(e: number): void {
    this.renderer.toneMappingExposure = e
  }

  resize(): void {
    const w = window.innerWidth
    const h = window.innerHeight
    const maxRatio = this.quality === 'high' ? 2 : this.quality === 'medium' ? 1.5 : 1
    const ratio = Math.min(window.devicePixelRatio || 1, maxRatio)
    this.renderer.setPixelRatio(ratio)
    this.renderer.setSize(w, h)
    this.composer.setPixelRatio(ratio)
    this.composer.setSize(w, h)
    this.bloom.resolution.set(w / 2, h / 2)
    this.grade.uniforms.uAspect.value = w / h
  }

  /** Ask for a JPEG snapshot of the next rendered frame (save-slot thumbnails). */
  captureNextFrame(): Promise<string> {
    return new Promise((resolve) => {
      this.pendingCapture = resolve
    })
  }

  render(scene: THREE.Scene, camera: THREE.Camera, time: number): void {
    const g = this.gradeSettings
    const u = this.grade.uniforms
    u.uTint.value.copy(g.tint)
    u.uSaturation.value = g.saturation
    u.uContrast.value = g.contrast
    u.uVignette.value = g.vignette
    u.uGrain.value = this.quality === 'low' ? 0 : g.grain
    u.uAberration.value = g.aberration
    u.uFrost.value = g.frost
    u.uVeil.value = g.veil
    u.uTime.value = time % 1000
    this.renderPass.scene = scene
    this.renderPass.camera = camera
    this.outline.scene = scene
    this.outline.camera = camera
    this.composer.render()
    if (this.pendingCapture) {
      const cb = this.pendingCapture
      this.pendingCapture = null
      try {
        const c = document.createElement('canvas')
        c.width = 320
        c.height = 180
        const ctx = c.getContext('2d')
        if (ctx) ctx.drawImage(this.canvas, 0, 0, c.width, c.height)
        cb(c.toDataURL('image/jpeg', 0.7))
      } catch {
        cb('')
      }
    }
  }
}
