import { useEffect, useRef } from 'react'
import { SKY, SKY_FPS, SKY_MAX_DPR } from '../constants.js'

const VERTEX = `#version 300 es
in vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }`

const FRAGMENT = `#version 300 es
precision highp float;
uniform float uTime;
uniform float uDpr;
uniform vec2 uDir;
uniform float uDensity, uDepth, uSpeed, uTwinkle, uGlow, uWarmth, uHaze;
uniform vec3 uHazeColor;
out vec4 outColor;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
vec2 hash2(vec2 p) { return vec2(hash(p), hash(p + 17.31)); }

// 2D simplex noise (Ashima Arts / Ian McEwan, MIT)
vec3 permute(vec3 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }
float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m * m; m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 a0 = x - floor(x + 0.5);
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

void main() {
  vec2 px = gl_FragCoord.xy / uDpr; // CSS pixels, so the sky looks the same on every screen
  vec3 col = vec3(0.0);

  // Five star layers, far (small, slow) to near (big, fast)
  for (int i = 0; i < 5; i++) {
    float t = float(i) / 4.0;
    float cell = (26.0 + 34.0 * t) / sqrt(uDensity);
    float layerSpeed = uSpeed * mix(14.0, 14.0 + 70.0 * t, uDepth);
    vec2 p = (px - uDir * uTime * layerSpeed) / cell + float(i) * 31.7;
    vec2 id = floor(p);
    float h = hash(id);
    if (h > 0.55) continue; // empty cell
    vec2 star = (hash2(id) - 0.5) * 0.7;
    vec2 d = (fract(p) - 0.5 - star) * cell; // CSS px from the star

    float bright = pow(hash(id + 3.1), 3.0) * (0.45 + 0.55 * t) + 0.12;
    float tw = sin(uTime * (0.6 + 2.2 * hash(id + 7.7)) + h * 40.0);
    bright *= 1.0 - uTwinkle * 0.75 * (0.5 + 0.5 * tw);

    float r = 0.55 + 0.9 * t;
    float dist = length(d);
    float core = smoothstep(r + 0.6, r - 0.4, dist);
    float halo = uGlow * exp(-dist / (r * 2.6)) * 0.55;
    // Cross flare only on the brightest stars
    float flare = 0.0;
    if (bright > 0.55) {
      flare = uGlow * (bright - 0.55) * 2.2 *
        (exp(-abs(d.y) * 1.4) * exp(-abs(d.x) / (r * 5.0)) + exp(-abs(d.x) * 1.4) * exp(-abs(d.y) / (r * 5.0)));
    }

    float k = hash(id + 13.3);
    vec3 tint = k < 0.12 ? vec3(0.62, 0.76, 1.0) : (k > 0.9 ? vec3(1.0, 0.8, 0.55) : vec3(0.96));
    vec3 starColor = mix(vec3(0.96), tint, uWarmth);
    // Fade glow and flare to zero before the cell edge, or the cut shows up as a faint grid
    vec2 f = fract(p);
    float edge = smoothstep(0.0, 0.18, min(min(f.x, f.y), min(1.0 - f.x, 1.0 - f.y)));
    col += starColor * bright * (core + (halo + flare) * edge);
  }

  // Slow nebula haze
  vec2 q = px / 520.0 + uDir * uTime * uSpeed * 0.012;
  float n = snoise(q) * 0.6 + snoise(q * 2.1 + 5.2) * 0.3 + snoise(q * 4.3 - 1.7) * 0.1;
  float cloud = smoothstep(0.05, 0.85, n * 0.5 + 0.5) * uHaze * 0.32;
  col += uHazeColor * cloud;

  // Premultiplied alpha: the canvas sits over the page's dark background
  float a = clamp(max(col.r, max(col.g, col.b)), 0.0, 1.0);
  outColor = vec4(min(col, vec3(1.0)), a);
}`

function compile(gl, type, source) {
  const shader = gl.createShader(type)
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader))
  return shader
}

// Sets up WebGL2 and returns draw(timeSeconds), or null when WebGL2 isn't available
function createSky(canvas) {
  const gl = canvas.getContext('webgl2', { antialias: false, premultipliedAlpha: true })
  if (!gl) return null
  const program = gl.createProgram()
  gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERTEX))
  gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FRAGMENT))
  gl.linkProgram(program)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program))
  gl.useProgram(program)

  // One triangle that covers the whole screen
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
  const aPos = gl.getAttribLocation(program, 'aPos')
  gl.enableVertexAttribArray(aPos)
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)

  const u = (name) => gl.getUniformLocation(program, name)
  const rad = (SKY.direction * Math.PI) / 180
  gl.uniform2f(u('uDir'), Math.cos(rad), Math.sin(rad))
  gl.uniform1f(u('uDensity'), SKY.density)
  gl.uniform1f(u('uDepth'), SKY.depth)
  gl.uniform1f(u('uSpeed'), SKY.speed)
  gl.uniform1f(u('uTwinkle'), SKY.twinkle)
  gl.uniform1f(u('uGlow'), SKY.glow)
  gl.uniform1f(u('uWarmth'), SKY.warmth)
  gl.uniform1f(u('uHaze'), SKY.haze)
  gl.uniform3fv(u('uHazeColor'), SKY.hazeColor)
  const uDpr = u('uDpr')
  const uTime = u('uTime')

  return function draw(time) {
    const dpr = Math.min(window.devicePixelRatio || 1, SKY_MAX_DPR)
    const width = Math.round(canvas.clientWidth * dpr)
    const height = Math.round(canvas.clientHeight * dpr)
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width
      canvas.height = height
      gl.viewport(0, 0, width, height)
    }
    gl.uniform1f(uDpr, dpr)
    gl.uniform1f(uTime, time)
    gl.drawArrays(gl.TRIANGLES, 0, 3)
  }
}

export default function Starfield() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    let draw
    try {
      draw = createSky(canvas)
    } catch (err) {
      console.warn('Starfield disabled:', err)
    }
    // Without WebGL2 the plain dark background stays
    if (!draw) return

    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const start = performance.now()
    let frame = 0
    let last = -Infinity

    function tick(now) {
      frame = requestAnimationFrame(tick)
      if (now - last < 1000 / SKY_FPS) return
      last = now
      draw((now - start) / 1000)
    }
    function update() {
      cancelAnimationFrame(frame)
      frame = 0
      // Reduced motion: one still frame. Hidden tab: draw nothing until it comes back.
      if (motion.matches) draw(0)
      else if (!document.hidden) frame = requestAnimationFrame(tick)
    }
    function handleResize() {
      if (motion.matches) draw(0)
    }

    update()
    document.addEventListener('visibilitychange', update)
    motion.addEventListener('change', update)
    window.addEventListener('resize', handleResize)
    return () => {
      cancelAnimationFrame(frame)
      document.removeEventListener('visibilitychange', update)
      motion.removeEventListener('change', update)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return (
    <div className="chalk-bg pointer-events-none fixed inset-0 -z-10" aria-hidden="true">
      <canvas ref={canvasRef} className="absolute inset-0 size-full" />
    </div>
  )
}
