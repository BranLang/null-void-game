import * as THREE from 'three'

export interface LiquidOptions {
  mask: THREE.Texture
  size: THREE.Vector2
  shallow: string
  deep: string
  lava?: boolean
  /** bioluminescent sparkle, used for the canals of Nyau */
  glow?: number
}

const liquids: THREE.ShaderMaterial[] = []

/** Advance all liquid shaders. */
export function updateLiquids(time: number): void {
  for (const m of liquids) m.uniforms.uTime.value = time
}

export function createLiquidMaterial(o: LiquidOptions): THREE.ShaderMaterial {
  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    fog: true,
    uniforms: THREE.UniformsUtils.merge([
      THREE.UniformsLib.fog,
      {
        uMask: { value: o.mask },
        uSize: { value: o.size },
        uTime: { value: 0 },
        uShallow: { value: new THREE.Color(o.shallow) },
        uDeep: { value: new THREE.Color(o.deep) },
        uLava: { value: o.lava ? 1 : 0 },
        uGlow: { value: o.glow ?? 0 },
        uFreeze: { value: 0 },
      },
    ]),
    vertexShader: /* glsl */ `
      #include <fog_pars_vertex>
      varying vec3 vWorld;
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorld = wp.xyz;
        vec4 mvPosition = viewMatrix * wp;
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }
    `,
    fragmentShader: /* glsl */ `
      #include <common>
      #include <fog_pars_fragment>
      uniform sampler2D uMask;
      uniform vec2 uSize;
      uniform float uTime, uLava, uGlow, uFreeze;
      uniform vec3 uShallow, uDeep;
      varying vec3 vWorld;

      float h2(vec2 p) { return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5453); }
      float n2(vec2 p) {
        vec2 i = floor(p), f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(mix(h2(i), h2(i + vec2(1, 0)), u.x), mix(h2(i + vec2(0, 1)), h2(i + vec2(1, 1)), u.x), u.y);
      }

      void main() {
        vec2 muv = (vWorld.xz + 0.5) / uSize;
        float m = texture2D(uMask, muv).r;
        if (m < 0.5) discard;
        float shore = smoothstep(0.5, 0.95, m);
        vec2 p = vWorld.xz;
        float t = uTime;
        float w1 = n2(p * 1.3 + vec2(t * 0.25, t * 0.13));
        float w2 = n2(p * 3.1 - vec2(t * 0.17, -t * 0.21));
        float waves = w1 * 0.6 + w2 * 0.4;
        vec3 col;
        float alpha = 0.9;
        if (uLava > 0.5) {
          float crust = smoothstep(0.45, 0.7, n2(p * 2.2 + t * 0.05));
          col = mix(uShallow * 2.2, uDeep * 0.25, crust);
          alpha = 1.0;
        } else {
          col = mix(uShallow, uDeep, shore * 0.85 + waves * 0.15);
          float spec = smoothstep(0.78, 0.95, waves) * 0.35;
          col += vec3(spec);
          // shore foam
          col = mix(col, vec3(0.85, 0.92, 0.95), (1.0 - smoothstep(0.5, 0.62, m)) * 0.55);
          if (uGlow > 0.0) {
            float s = step(0.985, h2(floor(p * 9.0) + floor(t * 1.5)));
            float pulse = 0.5 + 0.5 * sin(t * 2.0 + h2(floor(p * 9.0)) * 30.0);
            col += vec3(0.4, 1.4, 1.6) * s * pulse * uGlow;
            col += vec3(0.05, 0.25, 0.3) * uGlow * smoothstep(0.55, 0.9, w2);
          }
          // frozen by Ice
          col = mix(col, vec3(0.75, 0.88, 0.96) + waves * 0.08, uFreeze);
          alpha = mix(alpha, 1.0, uFreeze);
        }
        gl_FragColor = vec4(col, alpha);
        #include <fog_fragment>
      }
    `,
  })
  liquids.push(mat)
  return mat
}

export function disposeLiquids(): void {
  liquids.length = 0
}
