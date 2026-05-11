<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useReadingStore } from '@/stores/reading'
import { useAuthStore } from '@/stores/auth'
import AppButton from '@/components/common/AppButton.vue'
import { MODULE_LABELS, MODULE_ICONS, type ReadingModule } from '@/types/reading.types'

const router = useRouter()
const readingStore = useReadingStore()
const auth = useAuthStore()

// ── 12 Chinese zodiac themes ───────────────────────────────
interface ZodiacTheme {
  name: string; symbol: string; element: string
  accent: string
  heroBg: string   // dramatic gradient for hero section
  pageBg: string   // subtle ambient for full-page backgroundImage
}

const Z = (r: number, g: number, b: number, a: number) => `rgba(${r},${g},${b},${a})`
const nebula = (c1: string, c2: string, c3: string) => [
  `radial-gradient(ellipse 95% 75% at 50% -8%, ${c1} 0%, transparent 58%)`,
  `radial-gradient(ellipse 65% 55% at 6% 92%, ${c2} 0%, transparent 62%)`,
  `radial-gradient(ellipse 50% 40% at 94% 65%, ${c3} 0%, transparent 58%)`,
].join(',')
const page2 = (c1: string, c2: string) => [
  `radial-gradient(ellipse 70% 50% at 10% 20%, ${c1} 0%, transparent 70%)`,
  `radial-gradient(ellipse 55% 42% at 90% 78%, ${c2} 0%, transparent 70%)`,
].join(',')

const ZODIAC_THEMES: ZodiacTheme[] = [
  {
    name: 'Tý', symbol: '🐭', element: 'Thủy · Bắc', accent: '#06b6d4',
    heroBg: nebula(Z(6,182,212,.52), Z(14,116,144,.35), Z(6,182,212,.20)),
    pageBg: page2(Z(6,182,212,.16), Z(14,116,144,.10)),
  },
  {
    name: 'Sửu', symbol: '🐂', element: 'Thổ · Đông Bắc', accent: '#d97706',
    heroBg: nebula(Z(217,119,6,.50), Z(120,53,15,.33), Z(245,158,11,.20)),
    pageBg: page2(Z(217,119,6,.16), Z(120,53,15,.10)),
  },
  {
    name: 'Dần', symbol: '🐯', element: 'Mộc · Đông', accent: '#10b981',
    heroBg: nebula(Z(5,150,105,.54), Z(4,120,87,.34), Z(245,200,66,.22)),
    pageBg: page2(Z(5,150,105,.16), Z(245,200,66,.09)),
  },
  {
    name: 'Mão', symbol: '🐇', element: 'Mộc · Đông', accent: '#14b8a6',
    heroBg: nebula(Z(20,184,166,.52), Z(4,120,87,.32), Z(20,184,166,.20)),
    pageBg: page2(Z(20,184,166,.16), Z(4,120,87,.10)),
  },
  {
    name: 'Thìn', symbol: '🐲', element: 'Thổ · Đông Nam', accent: '#f5c842',
    heroBg: nebula(Z(245,200,66,.60), Z(124,58,237,.42), Z(6,182,212,.24)),
    pageBg: page2(Z(245,200,66,.18), Z(124,58,237,.13)),
  },
  {
    name: 'Tỵ', symbol: '🐍', element: 'Hỏa · Nam', accent: '#f43f5e',
    heroBg: nebula(Z(225,29,72,.52), Z(190,18,60,.34), Z(244,63,94,.20)),
    pageBg: page2(Z(225,29,72,.16), Z(190,18,60,.10)),
  },
  {
    name: 'Ngọ', symbol: '🐴', element: 'Hỏa · Nam', accent: '#f97316',
    heroBg: nebula(Z(234,88,12,.54), Z(220,38,38,.34), Z(251,146,60,.22)),
    pageBg: page2(Z(234,88,12,.16), Z(220,38,38,.10)),
  },
  {
    name: 'Mùi', symbol: '🐑', element: 'Thổ · Tây Nam', accent: '#a78bfa',
    heroBg: nebula(Z(139,92,246,.54), Z(109,40,217,.34), Z(168,85,247,.22)),
    pageBg: page2(Z(139,92,246,.16), Z(109,40,217,.10)),
  },
  {
    name: 'Thân', symbol: '🐒', element: 'Kim · Tây', accent: '#94a3b8',
    heroBg: nebula(Z(100,116,139,.52), Z(71,85,105,.34), Z(6,182,212,.25)),
    pageBg: page2(Z(100,116,139,.18), Z(6,182,212,.10)),
  },
  {
    name: 'Dậu', symbol: '🐓', element: 'Kim · Tây', accent: '#f5c842',
    heroBg: nebula(Z(245,200,66,.55), Z(180,130,30,.35), Z(217,119,6,.22)),
    pageBg: page2(Z(245,200,66,.18), Z(180,130,30,.11)),
  },
  {
    name: 'Tuất', symbol: '🐕', element: 'Thổ · Tây Bắc', accent: '#fb923c',
    heroBg: nebula(Z(180,83,9,.52), Z(146,64,14,.34), Z(217,119,6,.22)),
    pageBg: page2(Z(180,83,9,.16), Z(217,119,6,.11)),
  },
  {
    name: 'Hợi', symbol: '🐖', element: 'Thủy · Bắc', accent: '#818cf8',
    heroBg: nebula(Z(79,70,229,.54), Z(55,48,163,.35), Z(99,102,241,.24)),
    pageBg: page2(Z(79,70,229,.17), Z(55,48,163,.10)),
  },
]

const rawResult = computed(() => readingStore.currentResult)
const input     = computed(() => readingStore.currentInput)
const module    = computed(() => readingStore.currentModule)

if (!rawResult.value) router.replace({ name: 'Home' })

// ── Client-side recovery for malformed stored data ─────────
// When parseJsonResponse failed at write time, the full AI response
// string (markdown-fenced JSON) was stored in result.summary and
// sections was saved as {}. We recover here by re-parsing it.
function tryExtractJson(s: string): Record<string, unknown> | null {
  if (!s.includes('```') && !s.trimStart().startsWith('{')) return null
  try {
    const fenceMatch = s.match(/```(?:json)?\s*([\s\S]+?)```/)
    const cleaned = fenceMatch ? fenceMatch[1].trim() : s.trim()
    return JSON.parse(cleaned) as Record<string, unknown>
  } catch {
    return null
  }
}

const result = computed(() => {
  const r = rawResult.value
  if (!r) return null
  const summary = r.summary ?? ''
  const extracted = tryExtractJson(summary)
  if (!extracted) return r
  // Merge: extracted data wins over stale stored fields
  return { ...r, ...extracted } as typeof r
})

// ── Core numerology numbers ────────────────────────────────
const numberDefs: { key: string; label: string }[] = [
  { key: 'life_path_number',   label: 'Số Đường Đời' },
  { key: 'soul_number',        label: 'Số Linh Hồn' },
  { key: 'personality_number', label: 'Số Cá Tính' },
  { key: 'destiny_number',     label: 'Số Vận Mệnh' },
  { key: 'personal_year_number', label: 'Số Năm Cá Nhân' },
]

const coreNumbers = computed(() =>
  numberDefs
    .filter(({ key }) => result.value?.[key] !== undefined && result.value?.[key] !== null)
    .map(({ key, label }) => ({ label, value: result.value![key] as number }))
)

// ── Module-specific score (0–100) ──────────────────────────
const scoreField: Partial<Record<ReadingModule, { key: string; label: string }>> = {
  love:          { key: 'compatibility_score', label: 'Điểm tương hợp' },
  sim:           { key: 'sim_score',           label: 'Điểm phong thuỷ sim' },
  fengshui_home: { key: 'house_rating',        label: 'Điểm phong thuỷ nhà' },
}

const score = computed(() => {
  const def = scoreField[module.value]
  if (!def || !result.value) return null
  const val = result.value[def.key]
  if (typeof val !== 'number') return null
  return { label: def.label, value: val }
})

function scoreColor(v: number) {
  if (v >= 80) return { bar: 'bg-gold',           text: 'text-gold' }
  if (v >= 60) return { bar: 'bg-emerald-400',    text: 'text-emerald-400' }
  if (v >= 40) return { bar: 'bg-amber-400',      text: 'text-amber-400' }
  return           { bar: 'bg-red-400',           text: 'text-red-400' }
}

// ── Summary heading by module ──────────────────────────────
const summaryLabel: Partial<Record<ReadingModule, string>> = {
  numerology:    'Tổng quan vận mệnh',
  love:          'Tổng quan tình duyên',
  finance:       'Tổng quan tài lộc',
  sim:           'Nhận xét tổng quan sim',
  fengshui_home: 'Tổng quan phong thuỷ nhà',
  horoscope:     'Tổng quan vận hạn năm',
}

const summaryText = computed(() => result.value?.summary ?? '')

// ── Chinese zodiac from birth year ────────────────────────
const zodiacInfo = computed<ZodiacTheme | null>(() => {
  const birthDate = input.value?.birth_date
  if (!birthDate) return null
  const year = parseInt(birthDate.split('-')[0], 10)
  if (isNaN(year)) return null
  const idx = ((year - 1900) % 12 + 12) % 12
  return ZODIAC_THEMES[idx]
})


// ── Display name ───────────────────────────────────────────
const displayName = computed(() =>
  (input.value?.full_name ?? '').replace(/\b\w/g, c => c.toUpperCase())
)

// ── Upsell modules ─────────────────────────────────────────
const premiumModules = [
  { key: 'love',          icon: '💕', name: 'Tình duyên' },
  { key: 'finance',       icon: '💰', name: 'Tài lộc' },
  { key: 'sim',           icon: '📱', name: 'Sim phong thuỷ' },
  { key: 'fengshui_home', icon: '🏠', name: 'Phong thuỷ nhà ở' },
  { key: 'horoscope',     icon: '⭐', name: 'Tử vi năm' },
].filter(m => m.key !== module.value)

const upsellState = computed<'active' | 'frozen' | 'empty' | 'guest'>(() => {
  if (!auth.isLoggedIn) return 'guest'
  if (auth.hasActiveCredits) return 'active'
  if (auth.hasFrozenCredits) return 'frozen'
  return 'empty'
})

const upsellHeading = computed(() => {
  if (upsellState.value === 'active') {
    const bal = auth.user?.credits_balance ?? 0
    return `Bạn còn ${bal} lượt — Xem thêm ngay`
  }
  if (upsellState.value === 'frozen') return 'Lượt của bạn đang bị đóng băng'
  return 'Khám phá thêm vận mệnh của bạn'
})

const upsellDesc = computed(() => {
  if (upsellState.value === 'active') return 'Nhấn vào module bên dưới để xem ngay, mỗi lần xem tốn 1 lượt.'
  if (upsellState.value === 'frozen') return 'Gia hạn để mở khoá và tiếp tục sử dụng các lượt còn lại.'
  if (upsellState.value === 'empty') return 'Mua lượt để mở khoá các module phân tích chuyên sâu.'
  return 'Đăng nhập và mua lượt để xem đầy đủ các module chuyên sâu.'
})

// ── Helpers ────────────────────────────────────────────────
function asArray(v: unknown): string[] {
  return Array.isArray(v) ? v.map(String) : []
}
function asString(v: unknown): string {
  return typeof v === 'string' ? v : ''
}
</script>

<template>
  <div
    v-if="result"
    class="flex flex-col flex-1"
    :style="zodiacInfo ? { backgroundImage: zodiacInfo.pageBg } : {}"
  >

    <!-- ── Hero banner ─────────────────────────────────────── -->
    <div class="relative overflow-hidden">
      <!-- Zodiac nebula: unique astronomical gradient per con giáp -->
      <div
        class="absolute inset-0 pointer-events-none transition-[background] duration-1000"
        :style="{ background: zodiacInfo ? zodiacInfo.heroBg : 'radial-gradient(ellipse 90% 70% at 50% -10%, rgba(124,58,237,0.40) 0%, transparent 60%)' }"
      />
      <!-- Fade into page -->
      <div class="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-bg-base to-transparent pointer-events-none" />

      <!-- Orbital ring decorations -->
      <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[420px] rounded-full border border-mystic/8 animate-spin-slow pointer-events-none" />
      <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-gold/4 animate-spin-slow-reverse pointer-events-none" />

      <div class="relative max-w-5xl mx-auto px-4 pt-10 pb-14 text-center">
        <!-- Module pill -->
        <div class="inline-flex items-center gap-2 px-4 py-1.5 bg-mystic/20 border border-mystic/30 rounded-full text-sm text-mystic-glow mb-6">
          {{ MODULE_ICONS[module] }} {{ MODULE_LABELS[module] }}
        </div>

        <!-- Name -->
        <h1 class="font-sans text-4xl md:text-5xl font-bold text-text-primary uppercase tracking-widest mb-2">
          {{ displayName }}
        </h1>
        <p class="text-text-muted text-sm tracking-widest">{{ input?.birth_date }}</p>

        <!-- Zodiac cung mệnh badge -->
        <div v-if="zodiacInfo" class="flex items-center justify-center mt-3">
          <div
            class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-[11px] tracking-[0.22em] uppercase font-serif"
            :style="{
              borderColor: zodiacInfo.accent + '45',
              background: zodiacInfo.accent + '12',
              color: zodiacInfo.accent,
            }"
          >
            <span class="text-base leading-none">{{ zodiacInfo.symbol }}</span>
            <span>Tuổi {{ zodiacInfo.name }}</span>
            <span class="opacity-40">·</span>
            <span>{{ zodiacInfo.element }}</span>
          </div>
        </div>

        <!-- Love: partner -->
        <template v-if="module === 'love' && input?.partner_name">
          <div class="flex items-center justify-center gap-4 mt-5">
            <div class="flex-1 max-w-[100px] h-px bg-gradient-to-r from-transparent to-mystic/50" />
            <span class="text-3xl">💕</span>
            <div class="flex-1 max-w-[100px] h-px bg-gradient-to-l from-transparent to-mystic/50" />
          </div>
          <p class="font-sans text-2xl font-bold text-mystic-glow uppercase tracking-widest mt-2">
            {{ input.partner_name.replace(/\b\w/g, c => c.toUpperCase()) }}
          </p>
          <p class="text-text-muted text-sm">{{ input.partner_birth_date }}</p>
        </template>

        <!-- Sim: phone -->
        <template v-else-if="module === 'sim' && input?.phone">
          <p class="text-mystic-glow font-mono text-2xl mt-3 tracking-[0.3em] font-bold">{{ input.phone }}</p>
        </template>

        <!-- Fengshui: direction -->
        <template v-else-if="module === 'fengshui_home' && input?.house_direction">
          <div class="inline-flex items-center gap-2 mt-3 px-4 py-1.5 bg-gold/10 border border-gold/30 rounded-full">
            <span>🧭</span>
            <span class="text-gold text-sm font-medium">Hướng {{ input.house_direction }}</span>
          </div>
        </template>

        <!-- Core numbers -->
        <div v-if="coreNumbers.length" class="flex flex-wrap justify-center gap-3 mt-10">
          <div
            v-for="n in coreNumbers"
            :key="n.label"
            class="bg-bg-card/80 backdrop-blur-sm border border-border-subtle hover:border-gold/50 rounded-2xl px-6 py-5 text-center transition-all duration-300 hover:shadow-glow-gold min-w-[110px] group"
          >
            <div class="font-serif text-6xl text-gold drop-shadow-[0_0_28px_rgba(245,200,66,0.5)] leading-none mb-2 group-hover:drop-shadow-[0_0_40px_rgba(245,200,66,0.7)] transition-all">
              {{ n.value }}
            </div>
            <div class="text-xs text-text-muted font-medium uppercase tracking-wider">{{ n.label }}</div>
          </div>
        </div>

        <!-- Score gauge -->
        <div v-if="score" class="mt-8 max-w-sm mx-auto bg-bg-card/80 backdrop-blur-sm border border-border-subtle rounded-2xl p-6">
          <div class="flex items-center justify-between mb-4">
            <p class="text-sm font-medium text-text-secondary">{{ score.label }}</p>
            <p class="font-serif text-4xl font-bold leading-none" :class="scoreColor(score.value).text">
              {{ score.value }}<span class="text-sm font-sans text-text-muted ml-1 font-normal">/100</span>
            </p>
          </div>
          <div class="w-full bg-bg-elevated rounded-full h-3 overflow-hidden">
            <div
              class="h-3 rounded-full transition-all duration-1000 ease-out"
              :class="scoreColor(score.value).bar"
              :style="{ width: `${score.value}%` }"
            />
          </div>
          <div class="flex justify-between mt-2 text-xs text-text-muted">
            <span>Yếu</span><span>Trung bình</span><span>Xuất sắc</span>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Content ──────────────────────────────────────────── -->
    <div class="max-w-4xl mx-auto w-full px-4 pb-16 space-y-4">

      <!-- Zodiac destiny card (numerology) -->
      <div
        v-if="zodiacInfo && module === 'numerology'"
        class="relative overflow-hidden backdrop-blur-md bg-bg-card/80 rounded-2xl p-5 border"
        :style="{ borderColor: zodiacInfo.accent + '30' }"
      >
        <!-- Accent top bar -->
        <div class="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl" :style="{ background: `linear-gradient(90deg, transparent, ${zodiacInfo.accent}99, transparent)` }" />
        <!-- Bg glow blob -->
        <div class="absolute -right-8 -top-8 w-40 h-40 rounded-full blur-3xl pointer-events-none" :style="{ background: zodiacInfo.accent + '22' }" />

        <div class="flex items-center gap-5">
          <!-- Zodiac symbol seal -->
          <div class="shrink-0 relative">
            <div
              class="w-16 h-16 rounded-full border-2 flex items-center justify-center text-3xl"
              :style="{ borderColor: zodiacInfo.accent + '55', boxShadow: `0 0 20px ${zodiacInfo.accent}25, inset 0 0 20px ${zodiacInfo.accent}08` }"
            >{{ zodiacInfo.symbol }}</div>
            <div class="absolute inset-0 rounded-full border border-dashed opacity-20" :style="{ borderColor: zodiacInfo.accent, margin: '-5px' }" />
          </div>

          <!-- Info -->
          <div class="flex-1 min-w-0">
            <p class="text-[10px] tracking-[0.3em] uppercase mb-1" :style="{ color: zodiacInfo.accent + 'aa' }">Thiên Can Địa Chi</p>
            <p class="font-serif text-xl font-semibold text-text-primary">
              Tuổi {{ zodiacInfo.name }}
              <span class="text-sm font-sans font-normal text-text-muted ml-1">· {{ zodiacInfo.element }}</span>
            </p>
            <p class="text-text-muted text-xs mt-1">Mệnh số huyền cơ theo thập nhị địa chi</p>
          </div>

          <!-- Decorative trigrams -->
          <div class="shrink-0 text-right select-none hidden sm:block">
            <p class="font-serif text-2xl opacity-20" :style="{ color: zodiacInfo.accent }">☯</p>
            <p class="text-[10px] tracking-wider mt-1 opacity-30" :style="{ color: zodiacInfo.accent }">天干</p>
          </div>
        </div>
      </div>

      <!-- Summary -->
      <div class="relative overflow-hidden backdrop-blur-md bg-bg-card/80 border border-border-glow rounded-2xl p-6 shadow-glow-mystic">
        <div class="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-mystic via-neon to-transparent rounded-l-2xl" />
        <h2 class="font-semibold text-text-primary mb-3 flex items-center gap-2 pl-3">
          <span class="text-gold text-lg animate-shimmer-gold">✦</span>
          {{ summaryLabel[module] ?? 'Tổng quan' }}
        </h2>
        <p class="text-text-secondary leading-relaxed pl-3 text-[15px]">{{ summaryText }}</p>
      </div>

      <!-- Sections -->
      <template v-for="(section, key) in result.sections" :key="key">

        <!-- Visible section -->
        <div
          v-if="section.visible && section.content"
          class="relative bg-bg-card border border-border-subtle hover:border-border-glow rounded-2xl p-6 transition-all duration-300 group overflow-hidden"
        >
          <div class="absolute top-0 left-0 w-0.5 h-full bg-gradient-to-b from-gold/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-l-2xl" />

          <h3 v-if="section.content.title" class="text-lg text-gold mb-4 font-semibold flex items-center gap-2">
            <span class="text-gold/50 text-sm">◆</span>
            {{ section.content.title }}
          </h3>

          <div class="space-y-4">
            <!-- Description -->
            <p v-if="section.content.description" class="text-text-secondary leading-relaxed text-[15px]">
              {{ section.content.description }}
            </p>

            <!-- Keywords -->
            <div v-if="asArray(section.content.keywords).length" class="flex flex-wrap gap-2">
              <span
                v-for="kw in asArray(section.content.keywords)"
                :key="kw"
                class="px-3 py-1 text-xs font-medium bg-mystic/15 text-mystic-glow border border-mystic/30 rounded-full"
              >{{ kw }}</span>
            </div>

            <!-- Strengths + Challenges side by side -->
            <div
              v-if="asArray(section.content.strengths).length || asArray(section.content.challenges).length"
              class="grid gap-4"
              :class="asArray(section.content.strengths).length && asArray(section.content.challenges).length
                ? 'sm:grid-cols-2' : 'grid-cols-1'"
            >
              <div v-if="asArray(section.content.strengths).length" class="bg-emerald-400/5 border border-emerald-400/20 rounded-xl p-4">
                <p class="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-3">
                  {{ module === 'fengshui_home' && String(key) === 'bo_tri_noi_that' ? 'Gợi ý bố trí' :
                     module === 'fengshui_home' && String(key) === 'hoa_giai_va_phat_huy' ? 'Nên dùng' :
                     module === 'sim' ? 'Điểm tương hợp' : 'Điểm mạnh' }}
                </p>
                <ul class="space-y-2">
                  <li v-for="s in asArray(section.content.strengths)" :key="s"
                    class="flex items-start gap-2 text-sm text-text-secondary">
                    <span class="text-emerald-400 shrink-0 mt-0.5">✓</span>{{ s }}
                  </li>
                </ul>
              </div>

              <div v-if="asArray(section.content.challenges).length" class="bg-amber-400/5 border border-amber-400/20 rounded-xl p-4">
                <p class="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-3">
                  {{ module === 'fengshui_home' && String(key) === 'hoa_giai_va_phat_huy' ? 'Nên tránh' :
                     module === 'sim' ? 'Cần lưu ý' : 'Thách thức' }}
                </p>
                <ul class="space-y-2">
                  <li v-for="c in asArray(section.content.challenges)" :key="c"
                    class="flex items-start gap-2 text-sm text-text-secondary">
                    <span class="text-amber-400 shrink-0 mt-0.5">△</span>{{ c }}
                  </li>
                </ul>
              </div>
            </div>

            <!-- Career -->
            <div v-if="asString(section.content.career)" class="bg-neon/5 border border-neon/20 rounded-xl p-4">
              <p class="text-xs font-semibold text-neon uppercase tracking-wider mb-2">Sự nghiệp</p>
              <p class="text-sm text-text-secondary leading-relaxed">{{ section.content.career }}</p>
            </div>

            <!-- Relationships -->
            <div v-if="asString(section.content.relationships)" class="bg-pink-400/5 border border-pink-400/20 rounded-xl p-4">
              <p class="text-xs font-semibold text-pink-400 uppercase tracking-wider mb-2">Tình cảm & Quan hệ</p>
              <p class="text-sm text-text-secondary leading-relaxed">{{ section.content.relationships }}</p>
            </div>

            <!-- Desires -->
            <div v-if="asArray(section.content.desires).length">
              <p class="text-xs font-semibold text-mystic-glow uppercase tracking-wider mb-2">Khát vọng bên trong</p>
              <ul class="space-y-1.5">
                <li v-for="d in asArray(section.content.desires)" :key="d"
                  class="flex items-start gap-2 text-sm text-text-secondary">
                  <span class="text-mystic-glow mt-0.5 shrink-0">◈</span>{{ d }}
                </li>
              </ul>
            </div>

            <!-- Inner conflicts -->
            <div v-if="asString(section.content.inner_conflicts)" class="bg-rose-400/5 border border-rose-400/20 rounded-xl p-4">
              <p class="text-xs font-semibold text-rose-400 uppercase tracking-wider mb-2">Mâu thuẫn nội tâm</p>
              <p class="text-sm text-text-secondary leading-relaxed">{{ section.content.inner_conflicts }}</p>
            </div>

            <!-- Social style -->
            <div v-if="asString(section.content.social_style)">
              <p class="text-xs font-semibold text-neon uppercase tracking-wider mb-2">Phong cách xã hội</p>
              <p class="text-sm text-text-secondary leading-relaxed">{{ section.content.social_style }}</p>
            </div>

            <!-- First impression -->
            <div v-if="asString(section.content.first_impression)">
              <p class="text-xs font-semibold text-gold uppercase tracking-wider mb-2">Ấn tượng đầu tiên</p>
              <p class="text-sm text-text-secondary leading-relaxed">{{ section.content.first_impression }}</p>
            </div>

            <!-- Talents -->
            <div v-if="asArray(section.content.talents).length">
              <p class="text-xs font-semibold text-gold uppercase tracking-wider mb-2">Tài năng tiềm ẩn</p>
              <ul class="space-y-1.5">
                <li v-for="t in asArray(section.content.talents)" :key="t"
                  class="flex items-start gap-2 text-sm text-text-secondary">
                  <span class="text-gold mt-0.5 shrink-0">★</span>{{ t }}
                </li>
              </ul>
            </div>

            <!-- Life lesson -->
            <div v-if="asString(section.content.life_lesson)" class="bg-mystic/8 border border-mystic/20 rounded-xl p-4">
              <p class="text-xs font-semibold text-mystic-glow uppercase tracking-wider mb-2">Bài học cuộc đời</p>
              <p class="text-sm text-text-secondary leading-relaxed">{{ section.content.life_lesson }}</p>
            </div>

            <!-- Lucky numbers -->
            <div v-if="asArray(section.content.lucky_numbers).length">
              <p class="text-xs font-semibold text-gold uppercase tracking-wider mb-3">Số may mắn</p>
              <div class="flex gap-3 flex-wrap">
                <span
                  v-for="num in asArray(section.content.lucky_numbers)"
                  :key="num"
                  class="w-11 h-11 rounded-full bg-gold/10 border border-gold/40 flex items-center justify-center font-serif text-gold font-bold hover:shadow-glow-gold transition-all duration-300"
                >{{ num }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Locked section -->
        <div
          v-else-if="section.locked"
          class="relative bg-bg-card border border-border-subtle rounded-2xl overflow-hidden"
        >
          <div class="absolute inset-0 bg-gradient-to-b from-transparent via-bg-card/60 to-bg-base/80 backdrop-blur-[1px]" />
          <div class="relative px-6 py-10 flex flex-col items-center text-center gap-4">
            <div class="w-12 h-12 rounded-full bg-mystic/20 border border-mystic/30 flex items-center justify-center text-xl">🔒</div>
            <p class="text-text-secondary text-sm leading-relaxed max-w-sm italic">
              {{ section.teaser ?? 'Mở khoá để xem nội dung này' }}
            </p>
            <div v-if="!auth.isLoggedIn" class="flex gap-2">
              <RouterLink to="/login"><AppButton size="sm" variant="secondary">Đăng nhập</AppButton></RouterLink>
              <RouterLink to="/buy-credits"><AppButton size="sm">Mua lượt</AppButton></RouterLink>
            </div>
            <RouterLink v-else to="/buy-credits">
              <AppButton size="sm">Mua lượt — từ 79.000đ</AppButton>
            </RouterLink>
          </div>
        </div>

      </template>

      <!-- ── Upsell ───────────────────────────────────────── -->
      <div class="mt-4 rounded-2xl overflow-hidden border border-mystic/25">
        <div class="bg-gradient-to-br from-mystic/15 via-bg-surface to-neon/8 p-6">
          <!-- Header -->
          <div class="mb-5">
            <div class="flex justify-center gap-4 text-text-muted/20 text-base select-none mb-3">
              <span>☰</span><span>☱</span><span>☲</span><span>☳</span><span>☴</span><span>☵</span><span>☶</span><span>☷</span>
            </div>
            <h3 class="font-serif text-xl mb-1" :class="upsellState === 'active' ? 'gradient-text-gold' : 'text-text-primary'">
              {{ upsellHeading }}
            </h3>
            <p class="text-text-secondary text-sm">{{ upsellDesc }}</p>
          </div>

          <!-- Module grid -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5">
            <template v-if="upsellState === 'active'">
              <RouterLink
                v-for="mod in premiumModules"
                :key="mod.key"
                :to="`/reading/${mod.key}`"
                class="flex flex-col items-center gap-2 py-4 px-2 bg-bg-card/60 rounded-xl border border-transparent hover:border-gold/40 hover:bg-bg-elevated transition-all duration-200 group text-center"
              >
                <span class="text-2xl">{{ mod.icon }}</span>
                <p class="text-xs font-medium text-text-secondary group-hover:text-gold transition-colors leading-tight">{{ mod.name }}</p>
                <span class="text-[10px] text-gold font-semibold opacity-0 group-hover:opacity-100 transition-opacity">Xem ngay →</span>
              </RouterLink>
            </template>
            <template v-else>
              <div
                v-for="mod in premiumModules"
                :key="mod.key"
                class="flex flex-col items-center gap-2 py-4 px-2 bg-bg-card/40 rounded-xl opacity-50 text-center"
              >
                <span class="text-2xl grayscale">{{ mod.icon }}</span>
                <p class="text-xs font-medium text-text-muted leading-tight">{{ mod.name }}</p>
                <span class="text-xs text-text-muted">🔒</span>
              </div>
            </template>
          </div>

          <!-- CTA -->
          <RouterLink v-if="upsellState === 'frozen'" to="/buy-credits">
            <AppButton size="lg" class="w-full">🔥 Gia hạn lượt — tiếp tục xem ngay</AppButton>
          </RouterLink>
          <RouterLink v-else-if="upsellState === 'empty'" to="/buy-credits">
            <AppButton size="lg" class="w-full">⚡ Mua 20 lượt chỉ 79.000đ — Xem ngay</AppButton>
          </RouterLink>
          <RouterLink v-else-if="upsellState === 'guest'" to="/login">
            <AppButton size="lg" class="w-full" variant="secondary">Đăng nhập để bắt đầu</AppButton>
          </RouterLink>
        </div>
      </div>

      <!-- Back -->
      <div class="text-center pt-2 pb-4">
        <RouterLink to="/" class="text-sm text-text-muted hover:text-gold transition-colors">
          ← Xem cho người khác
        </RouterLink>
      </div>

    </div>
  </div>
</template>
