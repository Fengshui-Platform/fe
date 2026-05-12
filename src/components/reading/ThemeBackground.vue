<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import ZodiacSilhouette from './ZodiacSilhouette.vue'
import type { ThemeConfig, ParticleConfig } from '@/config/themeConfig'

const props = defineProps<{ theme: ThemeConfig }>()

const canvasRef = ref<HTMLCanvasElement | null>(null)
let animId = 0

// ── Particle engine ───────────────────────────────────────────────────────────

interface Particle {
  x: number; y: number
  vx: number; vy: number
  size: number; alpha: number
  alphaDecay: number; color: string
  life: number; maxLife: number
  type: ParticleConfig['type']
  wobblePhase: number
  rotation: number; rotationSpeed: number
}

function hexToRgba(hex: string, alpha: number) {
  const r = parseInt(hex.slice(1,3),16)
  const g = parseInt(hex.slice(3,5),16)
  const b = parseInt(hex.slice(5,7),16)
  return `rgba(${r},${g},${b},${alpha})`
}

function parseRgba(color: string, alpha: number) {
  if (color.startsWith('#')) return hexToRgba(color, alpha)
  return color
}

function spawnParticle(cfg: ParticleConfig, W: number, H: number): Particle {
  const isMobile = W < 768
  const baseSize = cfg.size === 'sm' ? (isMobile ? 2 : 3) : cfg.size === 'md' ? (isMobile ? 3 : 5) : (isMobile ? 5 : 8)
  const size = baseSize + Math.random() * baseSize * 0.8

  const speedMult = cfg.speed === 'slow' ? 0.4 : cfg.speed === 'medium' ? 0.8 : 1.4

  let x = Math.random() * W
  let y = H + size
  let vx = 0; let vy = 0

  if (cfg.type === 'star') {
    x = Math.random() * W; y = Math.random() * H * 0.7
    vx = (Math.random() - 0.5) * 0.15; vy = (Math.random() - 0.5) * 0.1
  } else if (cfg.direction === 'up') {
    x = Math.random() * W; y = H + size
    vx = (Math.random() - 0.5) * 0.6 * speedMult; vy = -(0.5 + Math.random() * 1.0) * speedMult
  } else if (cfg.direction === 'diagonal-left') {
    x = W + size; y = Math.random() * H * 0.6
    vx = -(0.4 + Math.random() * 0.6) * speedMult; vy = (0.1 + Math.random() * 0.4) * speedMult
  } else if (cfg.direction === 'diagonal-right') {
    x = -size; y = -size
    vx = (0.3 + Math.random() * 0.5) * speedMult; vy = (0.4 + Math.random() * 0.6) * speedMult
  } else if (cfg.direction === 'float') {
    x = Math.random() * W; y = Math.random() * H
    vx = (Math.random() - 0.5) * 0.3 * speedMult; vy = -(0.1 + Math.random() * 0.2) * speedMult
  } else if (cfg.direction === 'radial') {
    x = Math.random() * W; y = Math.random() * H
    const angle = Math.random() * Math.PI * 2
    vx = Math.cos(angle) * (0.2 + Math.random() * 0.4) * speedMult
    vy = Math.sin(angle) * (0.2 + Math.random() * 0.4) * speedMult
  }

  const useSecondary = cfg.secondaryColor && Math.random() > 0.6
  const color = parseRgba(useSecondary ? cfg.secondaryColor! : cfg.color, 1)
  const maxLife = cfg.type === 'star' ? 9999 : 200 + Math.random() * 200

  return { x, y, vx, vy, size, alpha: cfg.type === 'star' ? 0.3 + Math.random() * 0.5 : 0.7 + Math.random() * 0.3,
    alphaDecay: cfg.type === 'star' ? 0 : 1 / maxLife * (0.6 + Math.random() * 0.4),
    color, life: 0, maxLife, type: cfg.type, wobblePhase: Math.random() * Math.PI * 2,
    rotation: Math.random() * Math.PI * 2, rotationSpeed: (Math.random() - 0.5) * 0.04 }
}

function drawParticle(ctx: CanvasRenderingContext2D, p: Particle) {
  ctx.save()
  ctx.globalAlpha = Math.max(0, p.alpha)
  ctx.translate(p.x, p.y)
  ctx.rotate(p.rotation)

  const baseRgba = p.color

  if (p.type === 'ember') {
    ctx.beginPath()
    ctx.arc(0, 0, p.size * 0.5, 0, Math.PI * 2)
    const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, p.size)
    grad.addColorStop(0, baseRgba)
    grad.addColorStop(1, 'transparent')
    ctx.fillStyle = grad
    ctx.fill()

  } else if (p.type === 'star') {
    const pulseAlpha = 0.3 + 0.4 * Math.sin(p.wobblePhase + p.life * 0.02)
    ctx.globalAlpha = pulseAlpha
    ctx.beginPath()
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2
      ctx.lineTo(Math.cos(a) * p.size, Math.sin(a) * p.size)
      ctx.lineTo(Math.cos(a + Math.PI/4) * p.size * 0.3, Math.sin(a + Math.PI/4) * p.size * 0.3)
    }
    ctx.closePath()
    ctx.fillStyle = baseRgba
    ctx.fill()

  } else if (p.type === 'petal') {
    ctx.beginPath()
    ctx.ellipse(0, -p.size * 0.5, p.size * 0.4, p.size * 0.8, 0, 0, Math.PI * 2)
    ctx.fillStyle = baseRgba
    ctx.fill()

  } else if (p.type === 'coin') {
    ctx.beginPath()
    ctx.arc(0, 0, p.size, 0, Math.PI * 2)
    const grad = ctx.createRadialGradient(-p.size*0.3, -p.size*0.3, 0, 0, 0, p.size)
    grad.addColorStop(0, 'rgba(255,240,120,0.9)')
    grad.addColorStop(0.6, baseRgba)
    grad.addColorStop(1, 'rgba(100,70,0,0.8)')
    ctx.fillStyle = grad
    ctx.fill()
    ctx.strokeStyle = 'rgba(255,220,50,0.5)'
    ctx.lineWidth = 0.8
    ctx.stroke()

  } else if (p.type === 'leaf') {
    ctx.beginPath()
    ctx.moveTo(0, -p.size)
    ctx.bezierCurveTo(p.size * 0.8, -p.size * 0.4, p.size * 0.8, p.size * 0.4, 0, p.size)
    ctx.bezierCurveTo(-p.size * 0.8, p.size * 0.4, -p.size * 0.8, -p.size * 0.4, 0, -p.size)
    ctx.fillStyle = baseRgba
    ctx.fill()

  } else if (p.type === 'spark') {
    ctx.beginPath()
    ctx.moveTo(0, -p.size * 1.5)
    ctx.lineTo(p.size * 0.3, 0)
    ctx.lineTo(0, p.size * 1.5)
    ctx.lineTo(-p.size * 0.3, 0)
    ctx.closePath()
    ctx.fillStyle = baseRgba
    ctx.fill()

  } else if (p.type === 'ripple') {
    ctx.beginPath()
    ctx.arc(0, 0, p.size * (0.5 + (p.life / p.maxLife) * 1.5), 0, Math.PI * 2)
    ctx.strokeStyle = baseRgba
    ctx.lineWidth = 1.5
    ctx.stroke()

  } else {
    // dust / snow / default
    ctx.beginPath()
    ctx.arc(0, 0, p.size * 0.5, 0, Math.PI * 2)
    ctx.fillStyle = baseRgba
    ctx.fill()
  }
  ctx.restore()
}

function runParticleSystem(canvas: HTMLCanvasElement, cfgs: ParticleConfig[]) {
  const ctx = canvas.getContext('2d')!
  const isMobile = window.innerWidth < 768
  const particles: Particle[] = []

  cfgs.forEach(cfg => {
    const count = isMobile ? Math.floor(cfg.count * 0.5) : cfg.count
    if (cfg.type === 'star') {
      for (let i = 0; i < count; i++) particles.push(spawnParticle(cfg, canvas.width, canvas.height))
    }
  })

  let lastSpawn = 0

  function tick(ts: number) {
    const W = canvas.width; const H = canvas.height
    ctx.clearRect(0, 0, W, H)

    cfgs.forEach(cfg => {
      if (cfg.type === 'star') return
      const count = isMobile ? Math.floor(cfg.count * 0.5) : cfg.count
      const existing = particles.filter(p => p.type === cfg.type).length
      if (existing < count && ts - lastSpawn > 120) {
        particles.push(spawnParticle(cfg, W, H))
        lastSpawn = ts
      }
    })

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i]
      p.life++
      p.x += p.vx + Math.sin(p.wobblePhase + p.life * 0.03) * 0.3
      p.y += p.vy
      p.rotation += p.rotationSpeed
      p.wobblePhase += 0.01

      if (p.type !== 'star' && p.type !== 'ripple') {
        p.alpha -= p.alphaDecay
      }

      const oob = p.x < -30 || p.x > W + 30 || p.y < -30 || p.y > H + 30
      if (oob || (p.life >= p.maxLife && p.type !== 'star')) {
        if (p.type === 'star') {
          // respawn in place
          const cfg = cfgs.find(c => c.type === 'star')
          if (cfg) { particles[i] = spawnParticle(cfg, W, H) }
        } else {
          particles.splice(i, 1)
        }
        continue
      }

      drawParticle(ctx, p)
    }

    animId = requestAnimationFrame(tick)
  }

  animId = requestAnimationFrame(tick)
}

function resize(canvas: HTMLCanvasElement) {
  canvas.width  = canvas.offsetWidth
  canvas.height = canvas.offsetHeight
}

function startCanvas() {
  const canvas = canvasRef.value
  if (!canvas) return
  resize(canvas)
  cancelAnimationFrame(animId)
  const cfgs: ParticleConfig[] = [props.theme.particles]
  if (props.theme.secondaryParticles) cfgs.push(props.theme.secondaryParticles)
  runParticleSystem(canvas, cfgs)
}

const resizeObserver = new ResizeObserver(() => {
  if (canvasRef.value) { resize(canvasRef.value) }
})

onMounted(() => {
  startCanvas()
  if (canvasRef.value) resizeObserver.observe(canvasRef.value)
})

onUnmounted(() => {
  cancelAnimationFrame(animId)
  resizeObserver.disconnect()
})

watch(() => props.theme, () => {
  cancelAnimationFrame(animId)
  startCanvas()
}, { deep: true })
</script>

<template>
  <div class="theme-bg-root">

    <!-- Layer 1: Base gradient -->
    <div
      class="layer-base"
      :style="{ background: theme.baseGradient }"
    />

    <!-- Layer 2: Particle canvas -->
    <canvas ref="canvasRef" class="layer-particles" />

    <!-- Layer 3: Zodiac silhouette -->
    <ZodiacSilhouette
      v-if="theme.zodiac"
      :zodiac="theme.zodiac"
      :opacity="theme.silhouetteOpacity"
      :glow-color="theme.primaryColor"
      :position="theme.silhouettePosition"
    />

    <!-- Layer 4a: Fog -->
    <div
      v-if="theme.fogIntensity !== 'none'"
      class="layer-fog"
      :class="`fog-${theme.fogIntensity}`"
    />

    <!-- Layer 4b: Light rays (for love / finance bright) -->
    <div
      v-if="theme.hasLightRays"
      class="layer-rays"
      :style="{ '--ray-color': theme.accentColor + '18' }"
    />

    <!-- Layer 4c: Vignette -->
    <div v-if="theme.hasVignette" class="layer-vignette" />

    <!-- Layer 5: Mood overlay -->
    <div
      v-if="theme.moodOverlay !== 'rgba(0,0,0,0)'"
      class="layer-mood"
      :style="{ background: theme.moodOverlay }"
    />

    <!-- Content -->
    <div class="relative z-10 w-full">
      <slot />
    </div>

  </div>
</template>

<style scoped>
.theme-bg-root {
  position: relative;
  width: 100%;
  min-height: 100%;
  overflow: hidden;
}

/* ── Layers ──────────────────────────────────────────────── */
.layer-base,
.layer-particles,
.layer-fog,
.layer-rays,
.layer-vignette,
.layer-mood {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.layer-base { z-index: 0; }
.layer-particles { z-index: 2; width: 100%; height: 100%; }
.layer-fog  { z-index: 3; }
.layer-rays { z-index: 4; }
.layer-vignette { z-index: 5; }
.layer-mood { z-index: 6; }

/* ── Fog ─────────────────────────────────────────────────── */
.fog-light {
  background:
    radial-gradient(ellipse 120% 30% at 0% 80%, rgba(255,255,255,0.025) 0%, transparent 60%),
    radial-gradient(ellipse 100% 25% at 100% 70%, rgba(255,255,255,0.020) 0%, transparent 60%);
  animation: fog-drift 18s ease-in-out infinite alternate;
}
.fog-medium {
  background:
    radial-gradient(ellipse 140% 40% at 0% 85%, rgba(200,200,255,0.04) 0%, transparent 60%),
    radial-gradient(ellipse 120% 35% at 100% 75%, rgba(200,200,255,0.03) 0%, transparent 60%);
  animation: fog-drift 14s ease-in-out infinite alternate;
}
.fog-heavy {
  background:
    radial-gradient(ellipse 160% 50% at 0% 88%, rgba(180,180,255,0.07) 0%, transparent 65%),
    radial-gradient(ellipse 150% 45% at 100% 78%, rgba(180,180,255,0.05) 0%, transparent 65%);
  animation: fog-drift 11s ease-in-out infinite alternate;
}

/* ── Light rays ──────────────────────────────────────────── */
.layer-rays::before,
.layer-rays::after {
  content: '';
  position: absolute;
  top: -20%;
  left: 50%;
  width: 2px;
  height: 130%;
  background: linear-gradient(to bottom, var(--ray-color, rgba(255,220,80,0.12)), transparent);
  animation: ray-sweep 7s ease-in-out infinite;
}
.layer-rays::before { transform: translateX(-60px) rotate(-8deg); animation-delay: 0s; }
.layer-rays::after  { transform: translateX(60px)  rotate(8deg);  animation-delay: 3.5s; }

/* ── Vignette ────────────────────────────────────────────── */
.layer-vignette {
  background: radial-gradient(ellipse 100% 100% at 50% 50%, transparent 40%, rgba(0,0,0,0.55) 100%);
}

/* ── Animations ──────────────────────────────────────────── */
@keyframes fog-drift {
  0%   { transform: translateX(-4%) scaleX(1); }
  100% { transform: translateX(4%)  scaleX(1.04); }
}
@keyframes ray-sweep {
  0%, 100% { opacity: 0; }
  40%, 60%  { opacity: 1; }
}
</style>
