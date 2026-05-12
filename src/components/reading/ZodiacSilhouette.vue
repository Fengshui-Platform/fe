<script setup lang="ts">
import type { ZodiacKey } from '@/utils/zodiac'

defineProps<{
  zodiac: ZodiacKey
  opacity?: number
  glowColor?: string
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center' | 'full-right'
}>()
</script>

<template>
  <div
    class="silhouette-wrap pointer-events-none select-none"
    :class="[
      position === 'bottom-right'  ? 'silhouette-br' :
      position === 'bottom-left'   ? 'silhouette-bl' :
      position === 'bottom-center' ? 'silhouette-bc' :
      'silhouette-fr'
    ]"
    :style="{ opacity: opacity ?? 0.08 }"
  >
    <!-- ── Dragon ───────────────────────────────────────────── -->
    <svg v-if="zodiac === 'dragon'" viewBox="0 0 400 500" xmlns="http://www.w3.org/2000/svg" class="silhouette-svg">
      <defs>
        <filter id="glow-dragon"><feGaussianBlur stdDeviation="4" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        <radialGradient id="dg" cx="50%" cy="40%"><stop offset="0%" :stop-color="glowColor ?? '#f5c842'" stop-opacity="0.6"/><stop offset="100%" stop-color="#000" stop-opacity="0"/></radialGradient>
      </defs>
      <ellipse cx="200" cy="200" rx="180" ry="180" fill="url(#dg)" />
      <!-- Dragon body — sweeping S-curve -->
      <path d="M 80 480 C 60 420, 40 360, 80 300 C 120 240, 180 220, 200 160 C 220 100, 200 60, 240 30 C 260 15, 290 10, 310 25 C 330 40, 320 70, 300 85 C 280 100, 260 95, 250 120 C 240 145, 255 165, 270 185 C 300 225, 340 240, 350 280 C 360 320, 330 360, 310 380 C 285 405, 260 395, 240 415 C 215 440, 220 470, 200 490" stroke="#c0a060" stroke-width="22" fill="none" stroke-linecap="round" filter="url(#glow-dragon)" />
      <!-- Head -->
      <ellipse cx="310" cy="45" rx="28" ry="22" fill="#c0a060" filter="url(#glow-dragon)" />
      <!-- Horns -->
      <path d="M 295 28 L 280 5 M 325 28 L 338 5" stroke="#c0a060" stroke-width="5" stroke-linecap="round" />
      <!-- Whiskers -->
      <path d="M 295 50 C 270 55, 250 60, 235 70 M 330 48 C 350 45, 368 52, 378 62" stroke="#c0a060" stroke-width="3" fill="none" />
      <!-- Claws -->
      <path d="M 170 280 C 155 270, 140 265, 130 275 M 170 280 C 160 295, 148 302, 138 298 M 170 280 C 168 296, 160 308, 150 308" stroke="#c0a060" stroke-width="4" fill="none" stroke-linecap="round"/>
    </svg>

    <!-- ── Snake ─────────────────────────────────────────────── -->
    <svg v-else-if="zodiac === 'snake'" viewBox="0 0 500 300" xmlns="http://www.w3.org/2000/svg" class="silhouette-svg">
      <defs><filter id="glow-snake"><feGaussianBlur stdDeviation="3" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
      <!-- Coiling body -->
      <path d="M 20 250 C 60 200, 120 180, 180 200 C 240 220, 280 260, 340 240 C 400 220, 440 170, 470 140 C 490 120, 490 90, 470 80 C 450 70, 430 85, 425 105 C 420 125, 435 145, 430 165" stroke="#4a9090" stroke-width="18" fill="none" stroke-linecap="round" filter="url(#glow-snake)" />
      <!-- Head -->
      <ellipse cx="422" cy="175" rx="20" ry="12" fill="#4a9090" transform="rotate(-30 422 175)" filter="url(#glow-snake)"/>
      <!-- Tongue -->
      <path d="M 435 168 L 455 158 M 455 158 L 462 152 M 455 158 L 460 165" stroke="#f43f5e" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      <!-- Scale pattern -->
      <path d="M 80 230 Q 90 222 100 230 M 150 215 Q 160 207 170 215 M 220 225 Q 230 217 240 225 M 290 218 Q 300 210 310 218" stroke="#4a9090" stroke-width="2" fill="none" opacity="0.5"/>
    </svg>

    <!-- ── Tiger ──────────────────────────────────────────────── -->
    <svg v-else-if="zodiac === 'tiger'" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg" class="silhouette-svg">
      <defs><filter id="glow-tiger"><feGaussianBlur stdDeviation="4" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
      <!-- Body -->
      <ellipse cx="200" cy="260" rx="130" ry="90" fill="#d97706" opacity="0.9" filter="url(#glow-tiger)"/>
      <!-- Head -->
      <circle cx="200" cy="140" r="70" fill="#d97706" filter="url(#glow-tiger)"/>
      <!-- Ears -->
      <polygon points="150,90 135,55 165,75" fill="#d97706"/>
      <polygon points="250,90 265,55 235,75" fill="#d97706"/>
      <!-- Stripes -->
      <path d="M 155 130 C 160 120, 175 118, 178 130 M 220 130 C 223 118, 238 120, 243 130" stroke="#92400e" stroke-width="6" fill="none" stroke-linecap="round"/>
      <path d="M 170 160 C 175 148, 195 145, 200 160 C 205 145, 225 148, 230 160" stroke="#92400e" stroke-width="5" fill="none" stroke-linecap="round"/>
      <!-- Legs -->
      <rect x="135" y="320" width="35" height="60" rx="16" fill="#d97706" filter="url(#glow-tiger)"/>
      <rect x="230" y="320" width="35" height="60" rx="16" fill="#d97706" filter="url(#glow-tiger)"/>
      <!-- Tail -->
      <path d="M 330 260 C 370 240, 390 200, 375 170" stroke="#d97706" stroke-width="16" fill="none" stroke-linecap="round" filter="url(#glow-tiger)"/>
    </svg>

    <!-- ── Horse ──────────────────────────────────────────────── -->
    <svg v-else-if="zodiac === 'horse'" viewBox="0 0 400 450" xmlns="http://www.w3.org/2000/svg" class="silhouette-svg">
      <defs><filter id="glow-horse"><feGaussianBlur stdDeviation="4" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
      <!-- Legs running -->
      <path d="M 130 320 L 100 420 M 180 330 L 165 430 M 240 325 L 260 425 M 290 310 L 320 410" stroke="#b45309" stroke-width="22" stroke-linecap="round" filter="url(#glow-horse)"/>
      <!-- Body -->
      <ellipse cx="210" cy="270" rx="120" ry="80" fill="#b45309" filter="url(#glow-horse)"/>
      <!-- Neck -->
      <path d="M 150 220 C 140 160, 155 120, 175 90" stroke="#b45309" stroke-width="45" fill="none" stroke-linecap="round" filter="url(#glow-horse)"/>
      <!-- Head -->
      <ellipse cx="185" cy="75" rx="35" ry="50" fill="#b45309" transform="rotate(10 185 75)" filter="url(#glow-horse)"/>
      <!-- Mane flowing -->
      <path d="M 155 110 C 120 130, 100 150, 90 180 M 160 125 C 118 145, 95 168, 82 200 M 165 140 C 125 158, 100 182, 88 215" stroke="#92400e" stroke-width="8" fill="none" stroke-linecap="round"/>
      <!-- Ear -->
      <polygon points="195,40 205,20 215,42" fill="#b45309"/>
    </svg>

    <!-- ── Rabbit ──────────────────────────────────────────────── -->
    <svg v-else-if="zodiac === 'rabbit'" viewBox="0 0 300 400" xmlns="http://www.w3.org/2000/svg" class="silhouette-svg">
      <defs><filter id="glow-rabbit"><feGaussianBlur stdDeviation="3" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
      <!-- Ears (long) -->
      <ellipse cx="115" cy="80" rx="18" ry="75" fill="#14b8a6" filter="url(#glow-rabbit)"/>
      <ellipse cx="185" cy="75" rx="18" ry="75" fill="#14b8a6" filter="url(#glow-rabbit)"/>
      <!-- Body -->
      <ellipse cx="150" cy="280" rx="90" ry="100" fill="#14b8a6" filter="url(#glow-rabbit)"/>
      <!-- Head -->
      <circle cx="150" cy="175" r="60" fill="#14b8a6" filter="url(#glow-rabbit)"/>
      <!-- Tail -->
      <circle cx="240" cy="330" r="20" fill="#14b8a6" filter="url(#glow-rabbit)"/>
    </svg>

    <!-- ── Rat / default small ────────────────────────────────── -->
    <svg v-else-if="zodiac === 'rat'" viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg" class="silhouette-svg">
      <defs><filter id="glow-rat"><feGaussianBlur stdDeviation="3" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
      <ellipse cx="160" cy="190" rx="95" ry="70" fill="#06b6d4" filter="url(#glow-rat)"/>
      <circle cx="105" cy="140" r="50" fill="#06b6d4" filter="url(#glow-rat)"/>
      <ellipse cx="85" cy="112" rx="14" ry="24" fill="#06b6d4" transform="rotate(-15 85 112)"/>
      <ellipse cx="120" cy="108" rx="14" ry="24" fill="#06b6d4" transform="rotate(15 120 108)"/>
      <path d="M 255 180 C 280 160, 295 130, 285 110 C 275 90, 260 100, 258 120" stroke="#06b6d4" stroke-width="10" fill="none" stroke-linecap="round" filter="url(#glow-rat)"/>
    </svg>

    <!-- ── Ox ────────────────────────────────────────────────── -->
    <svg v-else-if="zodiac === 'ox'" viewBox="0 0 400 380" xmlns="http://www.w3.org/2000/svg" class="silhouette-svg">
      <defs><filter id="glow-ox"><feGaussianBlur stdDeviation="4" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
      <ellipse cx="200" cy="230" rx="145" ry="100" fill="#d97706" filter="url(#glow-ox)"/>
      <ellipse cx="200" cy="120" rx="75" ry="65" fill="#d97706" filter="url(#glow-ox)"/>
      <!-- Horns -->
      <path d="M 140 75 C 110 45, 90 50, 85 70 M 260 75 C 290 45, 310 50, 315 70" stroke="#d97706" stroke-width="14" fill="none" stroke-linecap="round" filter="url(#glow-ox)"/>
      <!-- Legs -->
      <rect x="120" y="310" width="38" height="60" rx="16" fill="#d97706" filter="url(#glow-ox)"/>
      <rect x="240" y="310" width="38" height="60" rx="16" fill="#d97706" filter="url(#glow-ox)"/>
    </svg>

    <!-- ── Goat ───────────────────────────────────────────────── -->
    <svg v-else-if="zodiac === 'goat'" viewBox="0 0 360 360" xmlns="http://www.w3.org/2000/svg" class="silhouette-svg">
      <defs><filter id="glow-goat"><feGaussianBlur stdDeviation="3" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
      <ellipse cx="180" cy="220" rx="120" ry="90" fill="#a78bfa" filter="url(#glow-goat)"/>
      <ellipse cx="170" cy="120" rx="60" ry="55" fill="#a78bfa" filter="url(#glow-goat)"/>
      <path d="M 140 82 C 130 55, 120 50, 115 65 M 200 80 C 210 53, 220 48, 225 63" stroke="#a78bfa" stroke-width="10" fill="none" stroke-linecap="round" filter="url(#glow-goat)"/>
      <rect x="130" y="290" width="30" height="55" rx="14" fill="#a78bfa" filter="url(#glow-goat)"/>
      <rect x="210" y="290" width="30" height="55" rx="14" fill="#a78bfa" filter="url(#glow-goat)"/>
      <path d="M 290 220 C 310 200, 320 175, 308 160" stroke="#a78bfa" stroke-width="12" fill="none" stroke-linecap="round" filter="url(#glow-goat)"/>
    </svg>

    <!-- ── Monkey ──────────────────────────────────────────────── -->
    <svg v-else-if="zodiac === 'monkey'" viewBox="0 0 350 420" xmlns="http://www.w3.org/2000/svg" class="silhouette-svg">
      <defs><filter id="glow-monkey"><feGaussianBlur stdDeviation="3" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
      <circle cx="175" cy="120" r="65" fill="#94a3b8" filter="url(#glow-monkey)"/>
      <ellipse cx="175" cy="270" rx="100" ry="90" fill="#94a3b8" filter="url(#glow-monkey)"/>
      <path d="M 80 200 C 50 170, 40 210, 55 240 M 270 200 C 300 170, 310 210, 295 240" stroke="#94a3b8" stroke-width="20" fill="none" stroke-linecap="round" filter="url(#glow-monkey)"/>
      <rect x="135" y="340" width="28" height="65" rx="13" fill="#94a3b8" filter="url(#glow-monkey)"/>
      <rect x="195" y="340" width="28" height="65" rx="13" fill="#94a3b8" filter="url(#glow-monkey)"/>
      <path d="M 275 280 C 310 260, 335 290, 325 320 C 315 350, 290 355, 280 340" stroke="#94a3b8" stroke-width="14" fill="none" stroke-linecap="round" filter="url(#glow-monkey)"/>
    </svg>

    <!-- ── Rooster ────────────────────────────────────────────── -->
    <svg v-else-if="zodiac === 'rooster'" viewBox="0 0 340 420" xmlns="http://www.w3.org/2000/svg" class="silhouette-svg">
      <defs><filter id="glow-rooster"><feGaussianBlur stdDeviation="3" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
      <!-- Tail feathers fan -->
      <path d="M 240 200 C 280 160, 310 130, 320 90 M 245 210 C 295 185, 325 165, 340 130 M 238 220 C 295 210, 330 205, 348 180" stroke="#f5c842" stroke-width="10" fill="none" stroke-linecap="round" filter="url(#glow-rooster)" opacity="0.8"/>
      <!-- Body -->
      <ellipse cx="160" cy="250" rx="110" ry="95" fill="#f5c842" filter="url(#glow-rooster)"/>
      <!-- Head -->
      <circle cx="155" cy="120" r="55" fill="#f5c842" filter="url(#glow-rooster)"/>
      <!-- Comb -->
      <path d="M 130 72 C 125 50, 140 45, 145 65 C 148 48, 162 42, 162 65 C 165 48, 178 52, 175 70" fill="#ef4444"/>
      <!-- Wattle -->
      <ellipse cx="170" cy="148" rx="12" ry="18" fill="#ef4444"/>
      <!-- Beak -->
      <polygon points="185,128 210,135 185,142" fill="#f97316"/>
    </svg>

    <!-- ── Dog ───────────────────────────────────────────────── -->
    <svg v-else-if="zodiac === 'dog'" viewBox="0 0 380 400" xmlns="http://www.w3.org/2000/svg" class="silhouette-svg">
      <defs><filter id="glow-dog"><feGaussianBlur stdDeviation="3" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
      <ellipse cx="190" cy="240" rx="130" ry="100" fill="#fb923c" filter="url(#glow-dog)"/>
      <circle cx="180" cy="120" r="65" fill="#fb923c" filter="url(#glow-dog)"/>
      <!-- Floppy ears -->
      <ellipse cx="122" cy="140" rx="28" ry="50" fill="#fb923c" transform="rotate(-15 122 140)" filter="url(#glow-dog)"/>
      <ellipse cx="238" cy="140" rx="28" ry="50" fill="#fb923c" transform="rotate(15 238 140)" filter="url(#glow-dog)"/>
      <!-- Legs -->
      <rect x="115" y="315" width="34" height="65" rx="16" fill="#fb923c" filter="url(#glow-dog)"/>
      <rect x="235" y="315" width="34" height="65" rx="16" fill="#fb923c" filter="url(#glow-dog)"/>
      <!-- Tail wagging -->
      <path d="M 320 240 C 355 210, 365 180, 348 162" stroke="#fb923c" stroke-width="16" fill="none" stroke-linecap="round" filter="url(#glow-dog)"/>
    </svg>

    <!-- ── Pig ───────────────────────────────────────────────── -->
    <svg v-else viewBox="0 0 360 360" xmlns="http://www.w3.org/2000/svg" class="silhouette-svg">
      <defs><filter id="glow-pig"><feGaussianBlur stdDeviation="3" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
      <ellipse cx="180" cy="220" rx="135" ry="110" fill="#818cf8" filter="url(#glow-pig)"/>
      <circle cx="175" cy="100" r="75" fill="#818cf8" filter="url(#glow-pig)"/>
      <!-- Ears round -->
      <ellipse cx="120" cy="55" rx="32" ry="38" fill="#818cf8" filter="url(#glow-pig)"/>
      <ellipse cx="230" cy="55" rx="32" ry="38" fill="#818cf8" filter="url(#glow-pig)"/>
      <!-- Snout -->
      <ellipse cx="175" cy="125" rx="32" ry="25" fill="#6366f1" filter="url(#glow-pig)"/>
      <circle cx="163" cy="122" r="7" fill="#312e81"/>
      <circle cx="187" cy="122" r="7" fill="#312e81"/>
      <!-- Curly tail -->
      <path d="M 315 220 C 340 200, 348 178, 336 165 C 324 152, 310 162, 314 178" stroke="#818cf8" stroke-width="12" fill="none" stroke-linecap="round" filter="url(#glow-pig)"/>
    </svg>
  </div>
</template>

<style scoped>
.silhouette-wrap { position: absolute; z-index: 1; }
.silhouette-svg  { display: block; filter: blur(0.5px); }

.silhouette-br { bottom: -5%; right: -3%; width: 42vw; max-width: 340px; animation: sil-float 8s ease-in-out infinite; }
.silhouette-bl { bottom: -5%; left: -3%;  width: 42vw; max-width: 340px; animation: sil-float 8s ease-in-out infinite; transform: scaleX(-1); }
.silhouette-bc { bottom: -5%; left: 50%;  width: 55vw; max-width: 420px; transform: translateX(-50%); animation: sil-float 10s ease-in-out infinite; }
.silhouette-fr { bottom: -8%; right: -6%; width: 60vw; max-width: 520px; animation: sil-float-slow 12s ease-in-out infinite; }

@keyframes sil-float {
  0%, 100% { transform: translateY(0px); }
  50%       { transform: translateY(-14px); }
}
@keyframes sil-float-slow {
  0%, 100% { transform: translateY(0px) scale(1); }
  50%       { transform: translateY(-18px) scale(1.015); }
}
.silhouette-bl { animation: sil-float-flip 8s ease-in-out infinite; }
@keyframes sil-float-flip {
  0%, 100% { transform: scaleX(-1) translateY(0px); }
  50%       { transform: scaleX(-1) translateY(-14px); }
}
</style>
