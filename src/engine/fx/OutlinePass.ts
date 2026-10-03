import * as THREE from 'three'
import { Pass, FullScreenQuad } from 'three/examples/jsm/postprocessing/Pass.js'
import { FX_LAYER } from '../toon'
import { applyCutaway } from '../materials'

/**
 * Anime ink lines. A normal+depth pre-pass of everything on layer 0 is
 * edge-detected (Sobel-like cross kernel) and the edges are inked onto the
 * colour buffer. Glows, particles, water and decals live on FX_LAYER and are
 * skipped, so magic stays soft while geometry gets crisp line art.
 */
export class OutlinePass extends Pass {
  scene: THREE.Scene | null = null
  camera: THREE.Camera | null = null
  private normalTarget: THREE.WebGLRenderTarget
  private normalMaterial = new THREE.MeshNormalMaterial()
  private quad: FullScreenQuad
  private material: THREE.ShaderMaterial
  thickness = 1.6
  debug = 0
  strength = 0.9

  constructor(width: number, height: number) {
    super()
    this.normalTarget = new THREE.WebGLRenderTarget(width, height, {
      type: THREE.HalfFloatType,
      depthTexture: new THREE.DepthTexture(width, height, THREE.FloatType),
    })
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        tDiffuse: { value: null },
        tNormal: { value: this.normalTarget.texture },
        tDepth: { value: this.normalTarget.depthTexture },
        uResolution: { value: new THREE.Vector2(width, height) },
        uThickness: { value: this.thickness },
        uStrength: { value: this.strength },
        uNear: { value: 0.1 },
        uFar: { value: 400 },
        uInk: { value: new THREE.Color('#1a1020') },
        uDebug: { value: 0 },
      },
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
      `,
      fragmentShader: /* glsl */ `
        uniform sampler2D tDiffuse, tNormal, tDepth;
        uniform vec2 uResolution;
        uniform float uThickness, uStrength, uNear, uFar;
        uniform vec3 uInk;
        uniform float uDebug;
        varying vec2 vUv;
        float depthAt(vec2 uv) { return mix(uNear, uFar, texture2D(tDepth, uv).x); }
        vec3 normalAt(vec2 uv) { return texture2D(tNormal, uv).xyz * 2.0 - 1.0; }
        void main() {
          vec4 base = texture2D(tDiffuse, vUv);
          vec2 px = uThickness / uResolution;
          float dC = depthAt(vUv);
          vec3 nC = normalAt(vUv);
          float dd = 0.0;
          float nd = 0.0;
          vec2 offs[4];
          offs[0] = vec2(px.x, 0.0); offs[1] = vec2(-px.x, 0.0); offs[2] = vec2(0.0, px.y); offs[3] = vec2(0.0, -px.y);
          for (int i = 0; i < 4; i++) {
            float d = depthAt(vUv + offs[i]);
            // only the nearer side of a silhouette draws the line (avoids double lines)
            dd += max(0.0, d - dC);
            nd += 1.0 - clamp(dot(nC, normalAt(vUv + offs[i])), 0.0, 1.0);
          }
          float edgeD = smoothstep(0.35, 0.9, dd);
          float edgeN = smoothstep(0.65, 1.3, nd) * step(dC, uFar - 1.0);
          float edge = max(edgeD, edgeN) * uStrength;
          vec3 col = mix(base.rgb, base.rgb * 0.18 + uInk * 0.6, edge);
          gl_FragColor = vec4(col, base.a);
          if (uDebug > 0.5 && uDebug < 1.5) gl_FragColor = vec4(nC * 0.5 + 0.5, 1.0);
          if (uDebug > 1.5 && uDebug < 2.5) gl_FragColor = vec4(vec3(fract(dC)), 1.0);
          if (uDebug > 2.5) gl_FragColor = vec4(vec3(edge), 1.0);
        }
      `,
    })
    this.quad = new FullScreenQuad(this.material)
    // the pre-pass must lower walls exactly like the colour pass does
    applyCutaway(this.normalMaterial)
  }

  override setSize(width: number, height: number): void {
    this.normalTarget.setSize(width, height)
    this.material.uniforms.uResolution.value.set(width, height)
  }

  setInk(color: string): void {
    this.material.uniforms.uInk.value.set(color)
  }

  override render(renderer: THREE.WebGLRenderer, writeBuffer: THREE.WebGLRenderTarget, readBuffer: THREE.WebGLRenderTarget): void {
    if (!this.scene || !this.camera) return
    const cam = this.camera as THREE.OrthographicCamera
    // normal + depth pre-pass, layer 0 only
    const prevLayers = cam.layers.mask
    const prevOverride = this.scene.overrideMaterial
    const prevBg = this.scene.background
    cam.layers.set(0)
    this.scene.overrideMaterial = this.normalMaterial
    this.scene.background = null
    renderer.setRenderTarget(this.normalTarget)
    renderer.setClearColor(0x8080ff, 1)
    renderer.clear()
    renderer.render(this.scene, cam)
    this.scene.overrideMaterial = prevOverride
    this.scene.background = prevBg
    cam.layers.mask = prevLayers
    renderer.setClearColor(0x000000, 0)

    this.material.uniforms.tDiffuse.value = readBuffer.texture
    this.material.uniforms.uThickness.value = this.thickness * (renderer.getPixelRatio() > 1.4 ? 1.6 : 1)
    this.material.uniforms.uStrength.value = this.strength
    this.material.uniforms.uDebug.value = this.debug
    if ('near' in cam) {
      this.material.uniforms.uNear.value = cam.near
      this.material.uniforms.uFar.value = cam.far
    }
    renderer.setRenderTarget(this.renderToScreen ? null : writeBuffer)
    this.quad.render(renderer)
  }

  override dispose(): void {
    this.normalTarget.dispose()
    this.material.dispose()
    this.quad.dispose()
  }
}

export { FX_LAYER }
