<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { useReadingStore } from '@/stores/reading'
import { useUIStore } from '@/stores/ui'
import { readingService } from '@/services/reading.service'
import { type ReadingModule, MODULE_LABELS, MODULE_ICONS } from '@/types/reading.types'
import type { Reading } from '@/types/reading.types'
import AppButton from '@/components/common/AppButton.vue'
import AppSpinner from '@/components/common/AppSpinner.vue'
import { formatDateTime } from '@/utils/format'

const router = useRouter()
const readingStore = useReadingStore()
const ui = useUIStore()

const readings = ref<Reading[]>([])
const isLoading = ref(true)
const total = ref(0)
const page = ref(1)
const limit = 10
const selectedModule = ref<ReadingModule | ''>('')

const totalPages = computed(() => Math.ceil(total.value / limit))

const modules: { value: ReadingModule | ''; label: string }[] = [
  { value: '', label: 'Tất cả' },
  { value: 'numerology', label: MODULE_LABELS.numerology },
  { value: 'love', label: MODULE_LABELS.love },
  { value: 'finance', label: MODULE_LABELS.finance },
  { value: 'sim', label: MODULE_LABELS.sim },
  { value: 'fengshui_home', label: MODULE_LABELS.fengshui_home },
  { value: 'horoscope', label: MODULE_LABELS.horoscope },
]

async function loadHistory() {
  isLoading.value = true
  try {
    const res = await readingService.getHistory({
      module: selectedModule.value || undefined,
      page: page.value,
      limit,
    })
    readings.value = res.items
    total.value = res.total
  } catch {
    ui.toast.error('Không thể tải lịch sử')
  } finally {
    isLoading.value = false
  }
}

function viewReading(reading: Reading) {
  const id = reading.id ?? reading.reading_id
  if (!id) return

  let result = reading.result
  if (!result && reading.result_data) {
    try { result = JSON.parse(reading.result_data) } catch { /* skip */ }
  }
  let input = null
  if (reading.input_data) {
    try { input = JSON.parse(reading.input_data) } catch { /* skip */ }
  }

  if (result) {
    readingStore.setResult(id, reading.module, result, input ?? { full_name: '', birth_date: '' })
    router.push({ name: 'Result' })
  } else {
    ui.toast.info('Không có dữ liệu kết quả cho lần xem này')
  }
}

function changeModule(mod: ReadingModule | '') {
  selectedModule.value = mod
  page.value = 1
}

watch([selectedModule], () => {
  page.value = 1
  loadHistory()
})

onMounted(loadHistory)
</script>

<template>
  <div class="flex flex-col flex-1">
    <div class="max-w-4xl mx-auto w-full px-4 py-10 flex-1">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="font-serif text-3xl text-text-primary mb-1">Lịch sử xem</h1>
        <p class="text-text-secondary text-sm">Xem lại kết quả cũ — không tốn lượt</p>
      </div>

      <!-- Module filter -->
      <div class="flex flex-wrap gap-2 mb-6">
        <button
          v-for="mod in modules"
          :key="mod.value"
          :class="[
            'px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200',
            selectedModule === mod.value
              ? 'bg-mystic text-white shadow-glow-mystic'
              : 'bg-bg-card border border-border-subtle text-text-secondary hover:border-border-glow',
          ]"
          @click="changeModule(mod.value as ReadingModule | '')"
        >
          {{ mod.value ? MODULE_ICONS[mod.value as ReadingModule] : '📋' }} {{ mod.label }}
        </button>
      </div>

      <!-- Loading -->
      <div v-if="isLoading" class="flex justify-center py-20">
        <AppSpinner size="lg" />
      </div>

      <!-- Empty -->
      <div v-else-if="readings.length === 0" class="text-center py-20">
        <div class="text-6xl mb-4">📭</div>
        <p class="text-text-secondary mb-2">Chưa có lịch sử xem</p>
        <p class="text-text-muted text-sm mb-6">Bắt đầu xem thần số học miễn phí ngay hôm nay</p>
        <RouterLink to="/">
          <AppButton>Xem ngay</AppButton>
        </RouterLink>
      </div>

      <!-- List -->
      <div v-else class="space-y-3">
        <div
          v-for="reading in readings"
          :key="reading.id ?? reading.reading_id"
          class="bg-bg-card border border-border-subtle rounded-xl p-5 hover:border-border-glow hover:shadow-card transition-all duration-200 cursor-pointer group"
          @click="viewReading(reading)"
        >
          <div class="flex items-start justify-between gap-4">
            <div class="flex items-center gap-3 flex-1 min-w-0">
              <div class="w-10 h-10 rounded-xl bg-mystic/20 border border-mystic/30 flex items-center justify-center text-xl flex-shrink-0">
                {{ MODULE_ICONS[reading.module] }}
              </div>
              <div class="min-w-0">
                <p class="font-medium text-text-primary group-hover:text-gold transition-colors">
                  {{ MODULE_LABELS[reading.module] }}
                </p>
                <p v-if="reading.input_data" class="text-sm text-text-muted truncate">
                  {{ (() => { try { return JSON.parse(reading.input_data!).full_name } catch { return '' } })() }}
                </p>
              </div>
            </div>

            <div class="text-right flex-shrink-0">
              <p class="text-xs text-text-muted mb-1">{{ formatDateTime(reading.created_at ?? '') }}</p>
              <div class="flex items-center gap-1.5 justify-end">
                <span
                  v-if="reading.is_free"
                  class="text-xs px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full"
                >Miễn phí</span>
                <span
                  v-else
                  class="text-xs px-2 py-0.5 bg-gold/10 text-gold border border-gold/20 rounded-full"
                >{{ reading.credits_used ?? 1 }} lượt</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="flex items-center justify-center gap-2 mt-8">
        <AppButton
          variant="secondary"
          size="sm"
          :disabled="page <= 1"
          @click="page--; loadHistory()"
        >← Trước</AppButton>

        <span class="text-text-muted text-sm px-4">
          {{ page }} / {{ totalPages }}
        </span>

        <AppButton
          variant="secondary"
          size="sm"
          :disabled="page >= totalPages"
          @click="page++; loadHistory()"
        >Sau →</AppButton>
      </div>
    </div>

  </div>
</template>
