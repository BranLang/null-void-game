import * as THREE from 'three'

/**
 * Screen-space sky drawn behind the diorama: gradient, stars, the ringed moon
 * Sai (with eclipse), the red "star" Infera and an optional aurora. It shows
 * wherever no geometry covers the screen, so maps floating in the sky (the
 * airship deck) or bordered by void get a living backdrop.
 */
export interface SkyParams {
  top: string
  bottom: string
  stars?: number // 0..1
  /** screen position of Sai in [0..1] (x,y), radius in screen-height units; omit to hide */
  sai?: { x: number; y: number; r: number; eclipse?: number }
  infera?: { x: number; y: number } | null
  aurora?: number
  clouds?: number
}

const vert = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.9999, 1.0);
  }
`

const frag = /* glsl */ `
  uniform vec3 uTop, uBottom;
  uniform float uStars, uTime, uAspect, uAurora, uClouds;
  uniform vec4 uSai;     // x, y, r, eclipse
  uniform float uSaiOn;
  uniform vec3 uInfera;  // x, y, on
  varying vec2 vUv;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    float a = hash(i), b = hash(i + vec2(1, 0)), c = hash(i + vec2(0, 1)), d = hash(i + vec2(1, 1));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
  }
  float fbm(vec2 p) { float s = 0.0, a = 0.5; for (int i = 0; i < 4; i++) { s += a * noise(p); p *= 2.03; a *= 0.5; } return s; }

  void main() {
    vec2 uv = vUv;
    vec3 col = mix(uBottom, uTop, smoothstep(0.0, 1.0, uv.y));
    vec2 p = vec2(uv.x * uAspect, uv.y);

    // stars, two layers, twinkling
    if (uStars > 0.0) {
      for (int layer = 0; layer < 2; layer++) {
        float scale = layer == 0 ? 90.0 : 190.0;
        vec2 g = p * scale;
        vec2 id = floor(g);
        float h = hash(id + float(layer) * 17.0);
        if (h > 1.0 - 0.06 * uStars) {
          vec2 f = fract(g) - 0.5 - (vec2(hash(id + 3.1), hash(id + 7.7)) - 0.5) * 0.6;
          float d = length(f);
          float tw = 0.6 + 0.4 * sin(uTime * (1.0 + h * 3.0) + h * 40.0);
          float s = smoothstep(0.09, 0.0, d) * tw * (layer == 0 ? 1.0 : 0.6);
          col += vec3(0.85, 0.9, 1.0) * s * uStars * smoothstep(0.05, 0.4, uv.y);
        }
      }
    }

    // aurora: violet, blue and green curtains (the north, chapter 18)
    if (uAurora > 0.0) {
      float band = fbm(vec2(p.x * 1.6 + uTime * 0.03, uTime * 0.05)) ;
      float curtain = smoothstep(0.35, 0.0, abs(uv.y - 0.72 - (band - 0.5) * 0.25));
      float rays = 0.6 + 0.4 * sin(p.x * 40.0 + fbm(p * 6.0 + uTime * 0.1) * 6.0);
      vec3 ac = mix(vec3(0.15, 0.9, 0.55), vec3(0.55, 0.3, 1.0), smoothstep(0.55, 0.95, uv.y + band * 0.2));
      col += ac * curtain * rays * uAurora * 0.55;
    }

    // Sai: huge amber moon with a ring of ice fragments
    if (uSaiOn > 0.5) {
      vec2 sp = vec2(uSai.x * uAspect, uSai.y);
      vec2 d = p - sp;
      float r = uSai.z;
      float dist = length(d);
      float eclipse = uSai.w;
      // ring (tilted ellipse)
      float ang = -0.21;
      vec2 rd = mat2(cos(ang), -sin(ang), sin(ang), cos(ang)) * d;
      float ell = length(vec2(rd.x, rd.y * 4.2));
      float ring = smoothstep(r * 1.95, r * 1.85, ell) * smoothstep(r * 1.35, r * 1.45, ell);
      ring *= 0.55 + 0.45 * noise(vec2(atan(rd.y, rd.x) * 30.0, 1.0));
      bool behind = rd.y > 0.0 && dist < r;
      float disc = smoothstep(r, r * 0.97, dist);
      vec3 moon = mix(vec3(0.95, 0.68, 0.32), vec3(0.75, 0.45, 0.2), fbm(d / r * 3.0 + 4.0));
      moon *= 0.75 + 0.35 * smoothstep(r, -r, d.x + d.y);
      // eclipse: the moon swallows the light, a fiery ring remains
      vec3 litMoon = mix(moon, vec3(0.02, 0.015, 0.02), eclipse);
      col = mix(col, litMoon, disc);
      float corona = smoothstep(r * 1.25, r, dist) * (1.0 - disc);
      col += vec3(1.0, 0.45, 0.15) * corona * eclipse * 1.4;
      if (!behind) col += vec3(0.85, 0.8, 0.75) * ring * (1.0 - eclipse * 0.85) * 0.6;
      // glow
      col += vec3(0.9, 0.55, 0.25) * smoothstep(r * 3.0, r, dist) * 0.12 * (1.0 - eclipse);
    }

    // Infera: the Devil's Eye, a steady red point
    if (uInfera.z > 0.5) {
      vec2 ip = vec2(uInfera.x * uAspect, uInfera.y);
      float d = length(p - ip);
      col += vec3(1.0, 0.12, 0.08) * (smoothstep(0.006, 0.0, d) * 2.0 + smoothstep(0.04, 0.0, d) * 0.25);
    }

    // low clouds (airship scenes)
    if (uClouds > 0.0) {
      float c = fbm(vec2(p.x * 2.0 + uTime * 0.01, p.y * 5.0));
      float m = smoothstep(0.45, 0.8, c) * smoothstep(0.55, 0.0, uv.y);
      col = mix(col, mix(uBottom, vec3(0.85), 0.35), m * uClouds);
    }

    gl_FragColor = vec4(col, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`

export class Sky {
  readonly mesh: THREE.Mesh
  private mat: THREE.ShaderMaterial

  constructor() {
    const geo = new THREE.PlaneGeometry(2, 2)
    this.mat = new THREE.ShaderMaterial({
      vertexShader: vert,
      fragmentShader: frag,
      depthTest: false,
      depthWrite: false,
      toneMapped: false,
      uniforms: {
        uTop: { value: new THREE.Color('#0b1020') },
        uBottom: { value: new THREE.Color('#1b2236') },
        uStars: { value: 0.6 },
        uTime: { value: 0 },
        uAspect: { value: 1 },
        uAurora: { value: 0 },
        uClouds: { value: 0 },
        uSai: { value: new THREE.Vector4(0.8, 0.78, 0.09, 0) },
        uSaiOn: { value: 0 },
        uInfera: { value: new THREE.Vector3(0.2, 0.85, 0) },
      },
    })
    this.mesh = new THREE.Mesh(geo, this.mat)
    this.mesh.frustumCulled = false
    this.mesh.renderOrder = -1000
  }

  set(p: SkyParams): void {
    const u = this.mat.uniforms
    u.uTop.value.set(p.top)
    u.uBottom.value.set(p.bottom)
    u.uStars.value = p.stars ?? 0
    u.uAurora.value = p.aurora ?? 0
    u.uClouds.value = p.clouds ?? 0
    if (p.sai) {
      u.uSaiOn.value = 1
      u.uSai.value.set(p.sai.x, p.sai.y, p.sai.r, p.sai.eclipse ?? 0)
    } else u.uSaiOn.value = 0
    if (p.infera) u.uInfera.value.set(p.infera.x, p.infera.y, 1)
    else u.uInfera.value.z = 0
  }

  /** Animate the eclipse amount (0 = full moon, 1 = "Matka zatvorila Oko"). */
  setEclipse(v: number): void {
    this.mat.uniforms.uSai.value.w = v
  }

  get eclipse(): number {
    return this.mat.uniforms.uSai.value.w
  }

  update(time: number, aspect: number): void {
    this.mat.uniforms.uTime.value = time
    this.mat.uniforms.uAspect.value = aspect
  }
}
