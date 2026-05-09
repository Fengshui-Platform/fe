<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useReadingStore } from '@/stores/reading'
import { useAuthStore } from '@/stores/auth'
import AppButton from '@/components/common/AppButton.vue'
import AppBadge from '@/components/common/AppBadge.vue'
import { MODULE_LABELS, MODULE_ICONS } from '@/types/reading.types'

const router = useRouter()
const readingStore = useReadingStore()
const auth = useAuthStore()

const result = computed(() => readingStore.currentResult)
const input = computed(() => readingStore.currentInput)
const module = computed(() => readingStore.currentModule)

if (!result.value) {
  router.replace({ name: 'Home' })
}

const numberLabels: Record<string, string> = {
  life_path_number:    'Số Đường Đời',
  soul_number:         'Số Linh Hồn',
  personality_number:  'Số Cá Tính',
  destiny_number:      'Số Vận Mệnh',
}

const coreNumbers = computed(() => {
  if (!result.value) return []
  return Object.entries(numberLabels)
    .filter(([k]) => result.value![k as keyof typeof result.value] !== undefined)
    .map(([k, label]) => ({
      label,
      value: result.value![k as keyof typeof result.value] as number,
    }))
})

// Capitalize each word for proper name display
const displayName = computed(() => {
  const name = input.value?.full_name ?? ''
  return name.replace(/\b\w/g, c => c.toUpperCase())
})

const premiumModules = [
  { key: 'love',          icon: '💕', name: 'Tình duyên' },
  { key: 'finance',       icon: '💰', name: 'Tài lộc 2026' },
  { key: 'sim',           icon: '📱', name: 'Sim phong thuỷ' },
  { key: 'fengshui_home', icon: '🏠', name: 'Phong thuỷ nhà ở' },
  { key: 'horoscope',     icon: '⭐', name: 'Tử vi năm' },
]

function asArray(v: unknown): string[] {
  return Array.isArray(v) ? v.map(String) : []
}

function asString(v: unknown): string {
  return typeof v === 'string' ? v : ''
}
</script>

<template>
  <div v-if="result" class="flex flex-col flex-1">
    <div class="max-w-3xl mx-auto w-full px-4 py-8 flex-1">

      <!-- Header -->
      <div class="text-center mb-10">
        <div class="inline-flex items-center gap-2 px-4 py-1.5 bg-mystic/20 border border-mystic/30 rounded-full text-sm text-mystic-glow mb-4">
          {{ MODULE_ICONS[module] }} {{ MODULE_LABELS[module] }}
        </div>
        <h1 class="font-sans text-3xl font-semibold text-text-primary mb-1 uppercase">{{ displayName }}</h1>
        <p class="text-text-muted text-sm">{{ input?.birth_date }}</p>

        <!-- Core numbers -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          <div
            v-for="n in coreNumbers"
            :key="n.label"
            class="bg-bg-card border border-border-subtle rounded-xl p-3 text-center hover:border-border-glow transition-colors"
          >
            <div class="font-serif text-5xl text-gold drop-shadow-[0_0_20px_rgba(245,200,66,0.4)] mb-1">
              {{ n.value }}
            </div>
            <div class="text-xs text-text-muted">{{ n.label }}</div>
          </div>
        </div>
      </div>

      <!-- Summary -->
      <div class="backdrop-blur-md bg-bg-card/80 border border-border-glow rounded-2xl p-6 mb-4 shadow-card">
        <h2 class="font-semibold text-text-primary mb-3 flex items-center gap-2">
          <span class="text-gold">✦</span> Tổng quan vận mệnh
        </h2>
        <p class="text-text-secondary leading-relaxed">{{ result.summary }}</p>
      </div>

      <!-- Sections -->
      <template v-for="(section, key) in result.sections" :key="key">

        <!-- Visible section — render content fields properly -->
        <div
          v-if="section.visible && section.content"
          class="bg-bg-card border border-border-subtle rounded-2xl p-6 mb-4 hover:border-border-glow transition-colors"
        >
          <!-- Title -->
          <h3 v-if="section.content.title" class="text-xl text-gold mb-4">
            {{ section.content.title }}
          </h3>

          <!-- Description -->
          <p v-if="section.content.description" class="text-text-secondary leading-relaxed mb-4">
            {{ section.content.description }}
          </p>

          <!-- Keywords -->
          <div v-if="asArray(section.content.keywords).length" class="flex flex-wrap gap-2 mb-4">
            <span
              v-for="kw in asArray(section.content.keywords)"
              :key="kw"
              class="px-3 py-1 text-xs font-medium bg-mystic/15 text-mystic-glow border border-mystic/30 rounded-full"
            >{{ kw }}</span>
          </div>

          <!-- Strengths -->
          <div v-if="asArray(section.content.strengths).length" class="mb-4">
            <p class="text-xs font-semibold text-green-400 uppercase tracking-wider mb-2">Điểm mạnh</p>
            <ul class="space-y-1.5">
              <li
                v-for="s in asArray(section.content.strengths)"
                :key="s"
                class="flex items-start gap-2 text-sm text-text-secondary"
              >
                <span class="text-green-400 mt-0.5 shrink-0">✓</span>{{ s }}
              </li>
            </ul>
          </div>

          <!-- Challenges -->
          <div v-if="asArray(section.content.challenges).length" class="mb-4">
            <p class="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2">Thách thức</p>
            <ul class="space-y-1.5">
              <li
                v-for="c in asArray(section.content.challenges)"
                :key="c"
                class="flex items-start gap-2 text-sm text-text-secondary"
              >
                <span class="text-amber-400 mt-0.5 shrink-0">△</span>{{ c }}
              </li>
            </ul>
          </div>

          <!-- Career -->
          <div v-if="asString(section.content.career)" class="mb-4">
            <p class="text-xs font-semibold text-neon uppercase tracking-wider mb-2">Sự nghiệp</p>
            <p class="text-sm text-text-secondary leading-relaxed">{{ section.content.career }}</p>
          </div>

          <!-- Relationships -->
          <div v-if="asString(section.content.relationships)" class="mb-4">
            <p class="text-xs font-semibold text-pink-400 uppercase tracking-wider mb-2">Tình cảm & Quan hệ</p>
            <p class="text-sm text-text-secondary leading-relaxed">{{ section.content.relationships }}</p>
          </div>

          <!-- Desires (soul section) -->
          <div v-if="asArray(section.content.desires).length" class="mb-4">
            <p class="text-xs font-semibold text-mystic-glow uppercase tracking-wider mb-2">Khát vọng bên trong</p>
            <ul class="space-y-1.5">
              <li
                v-for="d in asArray(section.content.desires)"
                :key="d"
                class="flex items-start gap-2 text-sm text-text-secondary"
              >
                <span class="text-mystic-glow mt-0.5 shrink-0">◈</span>{{ d }}
              </li>
            </ul>
          </div>

          <!-- Inner conflicts (soul section) -->
          <div v-if="asString(section.content.inner_conflicts)" class="mb-4">
            <p class="text-xs font-semibold text-rose-400 uppercase tracking-wider mb-2">Mâu thuẫn nội tâm</p>
            <p class="text-sm text-text-secondary leading-relaxed">{{ section.content.inner_conflicts }}</p>
          </div>

          <!-- Social style (personality section) -->
          <div v-if="asString(section.content.social_style)" class="mb-4">
            <p class="text-xs font-semibold text-neon uppercase tracking-wider mb-2">Phong cách xã hội</p>
            <p class="text-sm text-text-secondary leading-relaxed">{{ section.content.social_style }}</p>
          </div>

          <!-- First impression (personality section) -->
          <div v-if="asString(section.content.first_impression)">
            <p class="text-xs font-semibold text-gold uppercase tracking-wider mb-2">Ấn tượng đầu tiên</p>
            <p class="text-sm text-text-secondary leading-relaxed">{{ section.content.first_impression }}</p>
          </div>

          <!-- Talents (destiny section) -->
          <div v-if="asArray(section.content.talents).length" class="mb-4">
            <p class="text-xs font-semibold text-gold uppercase tracking-wider mb-2">Tài năng tiềm ẩn</p>
            <ul class="space-y-1.5">
              <li
                v-for="t in asArray(section.content.talents)"
                :key="t"
                class="flex items-start gap-2 text-sm text-text-secondary"
              >
                <span class="text-gold mt-0.5 shrink-0">★</span>{{ t }}
              </li>
            </ul>
          </div>

          <!-- Life lesson (destiny section) -->
          <div v-if="asString(section.content.life_lesson)" class="mb-4">
            <p class="text-xs font-semibold text-mystic-glow uppercase tracking-wider mb-2">Bài học cuộc đời</p>
            <p class="text-sm text-text-secondary leading-relaxed">{{ section.content.life_lesson }}</p>
          </div>

          <!-- Lucky numbers (destiny section) -->
          <div v-if="asArray(section.content.lucky_numbers).length">
            <p class="text-xs font-semibold text-gold uppercase tracking-wider mb-2">Số may mắn</p>
            <div class="flex gap-2">
              <span
                v-for="num in asArray(section.content.lucky_numbers)"
                :key="num"
                class="w-9 h-9 rounded-full bg-gold/10 border border-gold/40 flex items-center justify-center font-serif text-gold font-bold text-sm"
              >{{ num }}</span>
            </div>
          </div>
        </div>

        <!-- Locked section -->
        <div
          v-else-if="section.locked"
          class="bg-bg-card border border-border-subtle rounded-2xl mb-4 px-6 py-8 flex flex-col items-center text-center gap-4"
        >
          <span class="text-4xl">🔒</span>
          <p class="text-text-secondary text-sm leading-relaxed max-w-sm">
            {{ section.teaser ?? 'Mở khoá để xem nội dung này' }}
          </p>
          <template v-if="!auth.isLoggedIn">
            <div class="flex gap-2">
              <RouterLink to="/login"><AppButton size="sm" variant="secondary">Đăng nhập</AppButton></RouterLink>
              <RouterLink to="/buy-credits"><AppButton size="sm">Mua lượt</AppButton></RouterLink>
            </div>
          </template>
          <RouterLink v-else to="/buy-credits">
            <AppButton size="sm">Mua lượt — từ 79.000đ</AppButton>
          </RouterLink>
        </div>

      </template>

      <!-- Upsell — premium modules -->
      <div class="mt-8 bg-gradient-to-br from-mystic/20 to-neon/10 border border-mystic/30 rounded-2xl p-6">
        <h3 class="font-serif text-xl text-text-primary mb-2">Khám phá thêm vận mệnh của bạn</h3>
        <p class="text-text-secondary text-sm mb-5">Mua lượt để xem đầy đủ 5 module chuyên sâu</p>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-5">
          <div
            v-for="mod in premiumModules"
            :key="mod.key"
            class="flex items-center gap-3 p-3 bg-bg-card/60 rounded-xl"
          >
            <span class="text-xl">{{ mod.icon }}</span>
            <div>
              <p class="text-sm font-medium text-text-primary">{{ mod.name }}</p>
              <p class="text-xs text-text-muted">1 lượt</p>
            </div>
            <AppBadge variant="mystic" size="sm" class="ml-auto">🔒</AppBadge>
          </div>
        </div>

        <RouterLink to="/buy-credits">
          <AppButton size="lg" class="w-full">
            ⚡ Mua 20 lượt chỉ 79.000đ — Xem ngay
          </AppButton>
        </RouterLink>
      </div>

      <!-- Back -->
      <div class="text-center mt-8">
        <RouterLink to="/" class="text-sm text-text-muted hover:text-text-secondary transition-colors">
          ← Xem cho người khác
        </RouterLink>
      </div>
    </div>
  </div>
</template>
