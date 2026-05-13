<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'

const canvas = ref<HTMLCanvasElement | null>(null)
let animId = 0

interface Star {
  x: number; y: number
  r: number; alpha: number; alphaDir: number; alphaSpeed: number
  color: string; spike: boolean
}
interface Meteor {
  x: number; y: number; vx: number; vy: number
  len: number; alpha: number; speed: number
}
interface DustParticle {
  x: number; y: number; vx: number; vy: number
  r: number; alpha: number; color: string
}

const STAR_COLORS = [
  'rgba(255,255,255,A)', 'rgba(255,255,255,A)', 'rgba(255,255,255,A)',
  'rgba(245,200,66,A)', 'rgba(168,85,247,A)', 'rgba(6,182,212,A)',
  'rgba(196,212,255,A)',
]
const DUST_COLORS = ['#7c3aed', '#a855f7', '#06b6d4', '#f5c842']

function rand(a: number, b: number) { return a + Math.random() * (b - a) }
function toHex(n: number) { return Math.round(Math.max(0, Math.min(255, n))).toString(16).padStart(2, '0') }

function makeStars(W: number, H: number, count: number): Star[] {
  return Array.from({ length: count }, () => {
    const r = rand(0.15, 1.4)
    return {
      x: rand(0, W), y: rand(0, H),
      r,
      alpha: rand(0.2, 1),
      alphaDir: Math.random() > 0.5 ? 1 : -1,
      alphaSpeed: rand(0.003, 0.012),
      color: STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)],
      spike: r > 0.9,
    }
  })
}

function makeDust(W: number, H: number, count: number): DustParticle[] {
  return Array.from({ length: count }, () => ({
    x: rand(0, W), y: rand(0, H),
    vx: rand(-0.06, 0.06), vy: rand(-0.04, 0.04),
    r: rand(1.5, 4),
    alpha: rand(0.03, 0.12),
    color: DUST_COLORS[Math.floor(Math.random() * DUST_COLORS.length)],
  }))
}

function spawnMeteor(W: number, H: number): Meteor {
  const angle = rand(28, 42) * (Math.PI / 180)
  const speed = rand(9, 16)
  return {
    x: rand(-50, W * 0.65),
    y: rand(-30, H * 0.45),
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    len: rand(100, 220),
    alpha: 1,
    speed,
  }
}

onMounted(() => {
  const c = canvas.value
  if (!c) return
  const ctx = c.getContext('2d')!

  let W = 0, H = 0
  let stars: Star[] = []
  let dust: DustParticle[] = []
  const meteors: Meteor[] = []
  let constellations: [number, number][] = []
  let meteorCd = 0

  function resize() {
    W = c!.width = c!.offsetWidth
    H = c!.height = c!.offsetHeight
    stars = makeStars(W, H, 300)
    dust = makeDust(W, H, 70)

    // Constellation edges — connect stars within ~90px
    constellations = []
    for (let i = 0; i < stars.length && constellations.length < 140; i++) {
      for (let j = i + 1; j < stars.length && constellations.length < 140; j++) {
        const dx = stars[i].x - stars[j].x, dy = stars[i].y - stars[j].y
        if (dx * dx + dy * dy < 8100) constellations.push([i, j])
      }
    }
  }
  resize()

  const ro = new ResizeObserver(resize)
  ro.observe(c.parentElement!)

  let lastTs = 0
  function draw(ts: number) {
    const dt = Math.min((ts - lastTs) / 16.67, 3)
    lastTs = ts
    ctx.clearRect(0, 0, W, H)

    // ── Constellation lines ────────────────────────────────
    for (const [i, j] of constellations) {
      const sa = stars[i], sb = stars[j]
      const opacity = 0.045 * sa.alpha * sb.alpha
      ctx.strokeStyle = `rgba(168,85,247,${opacity.toFixed(3)})`
      ctx.lineWidth = 0.4
      ctx.beginPath(); ctx.moveTo(sa.x, sa.y); ctx.lineTo(sb.x, sb.y); ctx.stroke()
    }

    // ── Nebula dust ────────────────────────────────────────
    for (const p of dust) {
      p.x = (p.x + p.vx * dt + W) % W
      p.y = (p.y + p.vy * dt + H) % H
      const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4)
      g.addColorStop(0, p.color + toHex(p.alpha * 255))
      g.addColorStop(1, p.color + '00')
      ctx.fillStyle = g
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 4, 0, Math.PI * 2); ctx.fill()
    }

    // ── Stars ──────────────────────────────────────────────
    for (const s of stars) {
      s.alpha += s.alphaDir * s.alphaSpeed * dt
      if (s.alpha >= 1) { s.alpha = 1; s.alphaDir = -1 }
      if (s.alpha <= 0.15) { s.alpha = 0.15; s.alphaDir = 1 }

      const col = s.color.replace('A', s.alpha.toFixed(2))

      if (s.spike) {
        // Glow halo
        const gr = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 5)
        gr.addColorStop(0, s.color.replace('A', (s.alpha * 0.45).toFixed(2)))
        gr.addColorStop(1, s.color.replace('A', '0'))
        ctx.fillStyle = gr
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r * 5, 0, Math.PI * 2); ctx.fill()

        // 4-point diffraction spike
        if (s.r > 1.1) {
          ctx.strokeStyle = s.color.replace('A', (s.alpha * 0.35).toFixed(2))
          ctx.lineWidth = 0.6
          const len = s.r * 7
          ctx.beginPath()
          ctx.moveTo(s.x - len, s.y); ctx.lineTo(s.x + len, s.y)
          ctx.moveTo(s.x, s.y - len); ctx.lineTo(s.x, s.y + len)
          ctx.stroke()
        }
      }

      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
      ctx.fillStyle = col; ctx.fill()
    }

    // ── Shooting stars ────────────────────────────────────
    meteorCd -= dt
    if (meteorCd <= 0 && meteors.length < 4) {
      meteors.push(spawnMeteor(W, H))
      meteorCd = rand(90, 260)
    }
    for (let i = meteors.length - 1; i >= 0; i--) {
      const m = meteors[i]
      m.x += m.vx * dt; m.y += m.vy * dt
      m.alpha -= 0.018 * dt
      if (m.alpha <= 0 || m.x > W + 150 || m.y > H + 100) { meteors.splice(i, 1); continue }

      const norm = Math.hypot(m.vx, m.vy)
      const tx = m.x - (m.vx / norm) * m.len
      const ty = m.y - (m.vy / norm) * m.len
      const g = ctx.createLinearGradient(tx, ty, m.x, m.y)
      g.addColorStop(0, 'rgba(255,255,255,0)')
      g.addColorStop(0.55, `rgba(245,200,66,${(m.alpha * 0.25).toFixed(2)})`)
      g.addColorStop(1, `rgba(255,255,255,${(m.alpha * 0.92).toFixed(2)})`)
      ctx.strokeStyle = g; ctx.lineWidth = 1.5; ctx.lineCap = 'round'
      ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(m.x, m.y); ctx.stroke()

      // Bright head sparkle
      const hg = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, 4)
      hg.addColorStop(0, `rgba(255,255,255,${(m.alpha * 0.9).toFixed(2)})`)
      hg.addColorStop(1, 'rgba(255,255,255,0)')
      ctx.fillStyle = hg; ctx.beginPath(); ctx.arc(m.x, m.y, 4, 0, Math.PI * 2); ctx.fill()
    }

    animId = requestAnimationFrame(draw)
  }
  animId = requestAnimationFrame(draw)

  onUnmounted(() => {
    cancelAnimationFrame(animId)
    ro.disconnect()
  })
})
</script>

<template>
  <div class="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">

    <!-- Deep space gradient base -->
    <div class="absolute inset-0" style="background: radial-gradient(ellipse 120% 80% at 50% 0%, #0e0520 0%, #06060e 55%, #070612 100%)" />

    <!-- Canvas: stars + constellations + meteors -->
    <canvas ref="canvas" class="absolute inset-0 w-full h-full" />

    <!-- ── Large nebula clouds (CSS, animated) ───────────── -->
    <div class="absolute -top-[10%] left-[5%]  w-[700px] h-[450px] rounded-full bg-mystic/10 blur-[130px] animate-nebula-a" />
    <div class="absolute top-[15%]  right-[-8%] w-[550px] h-[380px] rounded-full bg-neon/6   blur-[110px] animate-nebula-b" />
    <div class="absolute bottom-[5%] left-[15%] w-[480px] h-[320px] rounded-full bg-gold/5   blur-[100px] animate-nebula-c" />
    <div class="absolute top-[40%]  left-[35%] w-[600px] h-[350px] rounded-full bg-mystic/7  blur-[120px] animate-nebula-a" style="animation-delay:-8s" />

    <!-- ── Zodiac wheel SVG (faint, slow spin) ───────────── -->
    <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[820px] h-[820px] opacity-[0.10] animate-spin-slow" style="animation-duration:110s">
      <svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
        <circle cx="200" cy="200" r="192" stroke="#f5c842" stroke-width="0.6" fill="none"/>
        <circle cx="200" cy="200" r="158" stroke="#7c3aed" stroke-width="0.35" fill="none"/>
        <circle cx="200" cy="200" r="124" stroke="#f5c842" stroke-width="0.5" fill="none"/>
        <circle cx="200" cy="200" r="90"  stroke="#a855f7" stroke-width="0.3" fill="none"/>
        <g stroke="#f5c842" stroke-width="0.8" opacity="0.8">
          <line x1="200" y1="8"  x2="200" y2="28" />
          <line x1="200" y1="8"  x2="200" y2="28" transform="rotate(30 200 200)"/>
          <line x1="200" y1="8"  x2="200" y2="28" transform="rotate(60 200 200)"/>
          <line x1="200" y1="8"  x2="200" y2="28" transform="rotate(90 200 200)"/>
          <line x1="200" y1="8"  x2="200" y2="28" transform="rotate(120 200 200)"/>
          <line x1="200" y1="8"  x2="200" y2="28" transform="rotate(150 200 200)"/>
          <line x1="200" y1="8"  x2="200" y2="28" transform="rotate(180 200 200)"/>
          <line x1="200" y1="8"  x2="200" y2="28" transform="rotate(210 200 200)"/>
          <line x1="200" y1="8"  x2="200" y2="28" transform="rotate(240 200 200)"/>
          <line x1="200" y1="8"  x2="200" y2="28" transform="rotate(270 200 200)"/>
          <line x1="200" y1="8"  x2="200" y2="28" transform="rotate(300 200 200)"/>
          <line x1="200" y1="8"  x2="200" y2="28" transform="rotate(330 200 200)"/>
        </g>
        <g fill="#f5c842" font-size="9" text-anchor="middle" font-family="serif">
          <text x="200" y="21">♈</text>
          <text transform="rotate(30 200 200)"  x="200" y="21">♉</text>
          <text transform="rotate(60 200 200)"  x="200" y="21">♊</text>
          <text transform="rotate(90 200 200)"  x="200" y="21">♋</text>
          <text transform="rotate(120 200 200)" x="200" y="21">♌</text>
          <text transform="rotate(150 200 200)" x="200" y="21">♍</text>
          <text transform="rotate(180 200 200)" x="200" y="21">♎</text>
          <text transform="rotate(210 200 200)" x="200" y="21">♏</text>
          <text transform="rotate(240 200 200)" x="200" y="21">♐</text>
          <text transform="rotate(270 200 200)" x="200" y="21">♑</text>
          <text transform="rotate(300 200 200)" x="200" y="21">♒</text>
          <text transform="rotate(330 200 200)" x="200" y="21">♓</text>
        </g>
      </svg>
    </div>

    <!-- ── Orbital rings ───────────────────────────────── -->
    <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full border border-mystic/[0.07] animate-spin-slow" />
    <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full border border-gold/[0.05] animate-spin-slow-reverse" />
    <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] h-[340px] rounded-full border border-neon/[0.04] animate-spin-slow" style="animation-duration:55s" />

    <!-- Orbiting dots on rings -->
    <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] animate-spin-slow">
      <div class="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-mystic-glow shadow-glow-mystic" />
      <div class="absolute top-1/2 -right-1.5 w-2 h-2 rounded-full bg-mystic/50" />
    </div>
    <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] animate-spin-slow-reverse">
      <div class="absolute -top-1 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-gold shadow-glow-gold" />
      <div class="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-neon/60" />
    </div>

    <!-- ── Floating astrological symbols ─────────────── -->
    <span class="absolute top-[12%] left-[6%]   text-4xl text-gold/[0.15]       animate-drift"  style="animation-duration:9s">☽</span>
    <span class="absolute top-[20%] right-[8%]  text-3xl text-mystic-glow/[0.18] animate-float"  style="animation-delay:1.5s;animation-duration:11s">✦</span>
    <span class="absolute top-[55%] left-[4%]   text-2xl text-gold/[0.13]       animate-float"  style="animation-delay:3s;animation-duration:10s">♃</span>
    <span class="absolute top-[66%] right-[6%]  text-2xl text-neon/[0.13]       animate-drift"  style="animation-delay:2s;animation-duration:8s">☿</span>
    <span class="absolute top-[36%] left-[10%]  text-xl  text-gold/[0.12]       animate-float"  style="animation-delay:5s;animation-duration:12s">✧</span>
    <span class="absolute top-[42%] right-[12%] text-xl  text-mystic-glow/[0.15] animate-drift"  style="animation-delay:0.5s;animation-duration:9s">♄</span>
    <span class="absolute top-[76%] left-[17%]  text-lg  text-gold/[0.10]       animate-float"  style="animation-delay:2.5s;animation-duration:9s">⊕</span>
    <span class="absolute top-[7%]  right-[21%] text-base text-mystic/[0.20]    animate-float"  style="animation-delay:1s;animation-duration:13s">☊</span>
    <span class="absolute top-[82%] right-[28%] text-xl  text-gold/[0.10]       animate-drift"  style="animation-delay:4s;animation-duration:11s">♆</span>
    <span class="absolute top-[28%] left-[22%]  text-base text-neon/[0.12]      animate-float"  style="animation-delay:3.5s;animation-duration:8s">♅</span>
    <span class="absolute bottom-[18%] right-[16%] text-lg text-gold/[0.10]     animate-drift"  style="animation-delay:1.2s;animation-duration:10s">☰</span>
    <span class="absolute bottom-[25%] left-[28%] text-base text-neon/[0.10]    animate-float"  style="animation-delay:2s;animation-duration:9s">☷</span>

    <!-- Bottom fade -->
    <div class="absolute bottom-0 inset-x-0 h-56 bg-gradient-to-t from-bg-base to-transparent" />
  </div>
</template>
