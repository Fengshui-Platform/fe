<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute, RouterLink } from 'vue-router'
import { useReadingStore } from '@/stores/reading'
import { useUIStore } from '@/stores/ui'
import { readingService } from '@/services/reading.service'
import { creditService } from '@/services/credit.service'
import { type ReadingModule, MODULE_LABELS, MODULE_ICONS } from '@/types/reading.types'
import type { Reading, ReadingResult, ReadingInputDto } from '@/types/reading.types'
import type { CreditOrder, OrderStatus } from '@/types/subscription.types'
import AppButton from '@/components/common/AppButton.vue'
import AppSpinner from '@/components/common/AppSpinner.vue'
import { formatDateTime, formatCurrency } from '@/utils/format'

const router = useRouter()
const route = useRoute()
const readingStore = useReadingStore()
const ui = useUIStore()

// ── Tab state ──────────────────────────────────────────────
type Tab = 'readings' | 'orders'
const activeTab = ref<Tab>(route.query.tab === 'orders' ? 'orders' : 'readings')

// ── Reading history ────────────────────────────────────────
const readings = ref<Reading[]>([])
const readingsLoading = ref(true)
const readingsTotal = ref(0)
const readingsPage = ref(1)
const readingsLimit = 10
const selectedModule = ref<ReadingModule | ''>('')

const readingsTotalPages = computed(() => Math.ceil(readingsTotal.value / readingsLimit))

const modules: { value: ReadingModule | ''; label: string }[] = [
  { value: '', label: 'Tất cả' },
  { value: 'numerology', label: MODULE_LABELS.numerology },
  { value: 'love', label: MODULE_LABELS.love },
  { value: 'finance', label: MODULE_LABELS.finance },
  { value: 'sim', label: MODULE_LABELS.sim },
  { value: 'fengshui_home', label: MODULE_LABELS.fengshui_home },
  { value: 'horoscope', label: MODULE_LABELS.horoscope },
]

async function loadReadings() {
  readingsLoading.value = true
  try {
    const res = await readingService.getHistory({
      module: selectedModule.value || undefined,
      page: readingsPage.value,
      limit: readingsLimit,
    })
    readings.value = res.items
    readingsTotal.value = res.total
  } catch {
    ui.toast.error('Không thể tải lịch sử xem')
  } finally {
    readingsLoading.value = false
  }
}

function parseField<T>(field: unknown): T | null {
  if (!field) return null
  if (typeof field === 'object') return field as T
  try { return JSON.parse(field as string) as T } catch { return null }
}

function viewReading(reading: Reading) {
  const id = reading.id ?? reading.reading_id
  if (!id) return
  const result = reading.result ?? parseField<ReadingResult>(reading.result_data)
  const input  = parseField<ReadingInputDto>(reading.input_data)
  if (result) {
    readingStore.setResult(id, reading.module, result, input ?? { full_name: '', birth_date: '' })
    router.push({ name: 'Result' })
  } else {
    ui.toast.info('Không có dữ liệu kết quả cho lần xem này')
  }
}

function changeModule(mod: ReadingModule | '') {
  selectedModule.value = mod
  readingsPage.value = 1
}

watch([selectedModule], () => {
  readingsPage.value = 1
  loadReadings()
})

// ── Order history ──────────────────────────────────────────
const orders = ref<CreditOrder[]>([])
const ordersLoading = ref(false)
const ordersTotal = ref(0)
const ordersPage = ref(1)
const ordersLimit = 10

const ordersTotalPages = computed(() => Math.ceil(ordersTotal.value / ordersLimit))

async function loadOrders() {
  ordersLoading.value = true
  try {
    const res = await creditService.getOrders({ page: ordersPage.value, limit: ordersLimit })
    orders.value = res.items
    ordersTotal.value = res.total
  } catch {
    ui.toast.error('Không thể tải lịch sử giao dịch')
  } finally {
    ordersLoading.value = false
  }
}

function switchTab(tab: Tab) {
  activeTab.value = tab
  if (tab === 'orders' && orders.value.length === 0 && !ordersLoading.value) {
    loadOrders()
  }
}

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: 'Đang chờ',
  paid:    'Đã thanh toán',
  expired: 'Hết hạn',
  failed:  'Thất bại',
}

const STATUS_CLASS: Record<OrderStatus, string> = {
  pending: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  paid:    'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  expired: 'bg-bg-elevated text-text-muted border-border-subtle',
  failed:  'bg-red-500/15 text-red-400 border-red-500/30',
}

onMounted(() => {
  loadReadings()
  if (activeTab.value === 'orders') loadOrders()
})
</script>

<template>
  <div class="flex flex-col flex-1">
    <div class="max-w-4xl mx-auto w-full px-4 py-10 flex-1">

      <!-- Header -->
      <div class="mb-7">
        <h1 class="font-serif text-3xl gradient-text-gold mb-1">Lịch sử</h1>
        <p class="text-text-secondary text-sm">Xem lại kết quả cũ hoặc tra cứu giao dịch của bạn</p>
      </div>

      <!-- Tabs -->
      <div class="flex gap-1 p-1 bg-bg-surface border border-border-subtle rounded-xl mb-7 w-fit">
        <button
          v-for="tab in [{ id: 'readings', icon: '☯', label: 'Lịch sử xem' }, { id: 'orders', icon: '💳', label: 'Giao dịch' }]"
          :key="tab.id"
          @click="switchTab(tab.id as Tab)"
          :class="[
            'flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200',
            activeTab === tab.id
              ? 'bg-bg-card text-gold shadow-card border border-border-glow'
              : 'text-text-muted hover:text-text-secondary',
          ]"
        >
          <span>{{ tab.icon }}</span>
          {{ tab.label }}
        </button>
      </div>

      <!-- ── READINGS TAB ── -->
      <div v-if="activeTab === 'readings'">
        <!-- Module filter -->
        <div class="flex flex-wrap gap-2 mb-6">
          <button
            v-for="mod in modules"
            :key="mod.value"
            :class="[
              'px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200',
              selectedModule === mod.value
                ? 'bg-mystic text-white shadow-glow-mystic'
                : 'bg-bg-card border border-border-subtle text-text-secondary hover:border-border-glow hover:text-gold',
            ]"
            @click="changeModule(mod.value as ReadingModule | '')"
          >
            {{ mod.value ? MODULE_ICONS[mod.value as ReadingModule] : '✦' }} {{ mod.label }}
          </button>
        </div>

        <div v-if="readingsLoading" class="flex justify-center py-20">
          <AppSpinner size="lg" />
        </div>

        <div v-else-if="readings.length === 0" class="text-center py-20">
          <div class="text-5xl mb-4 select-none animate-float inline-block">☯</div>
          <p class="text-text-secondary mb-2">Chưa có lịch sử xem</p>
          <p class="text-text-muted text-sm mb-6">Bắt đầu xem thần số học miễn phí ngay hôm nay</p>
          <RouterLink to="/">
            <AppButton>✨ Xem ngay</AppButton>
          </RouterLink>
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="reading in readings"
            :key="reading.id ?? reading.reading_id"
            class="group bg-bg-card border border-border-subtle rounded-xl p-5 hover:border-border-glow hover:shadow-card transition-all duration-200 cursor-pointer"
            @click="viewReading(reading)"
          >
            <div class="flex items-start justify-between gap-4">
              <div class="flex items-center gap-3 flex-1 min-w-0">
                <!-- Symbol frame -->
                <div class="w-10 h-10 rounded-xl bg-mystic/15 border border-mystic/30 flex items-center justify-center text-xl flex-shrink-0 group-hover:border-gold/40 group-hover:bg-gold/10 transition-all duration-200">
                  {{ MODULE_ICONS[reading.module] }}
                </div>
                <div class="min-w-0">
                  <p class="font-medium text-text-primary group-hover:text-gold transition-colors">
                    {{ MODULE_LABELS[reading.module] }}
                  </p>
                  <p class="text-sm text-text-muted truncate">
                    {{ parseField<ReadingInputDto>(reading.input_data)?.full_name ?? '' }}
                  </p>
                </div>
              </div>
              <div class="text-right flex-shrink-0">
                <p class="text-xs text-text-muted mb-1">{{ formatDateTime(reading.created_at ?? '') }}</p>
                <div class="flex items-center gap-1.5 justify-end">
                  <span
                    v-if="reading.is_free"
                    class="text-xs px-2 py-0.5 bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 rounded-full"
                  >Miễn phí</span>
                  <span
                    v-else
                    class="text-xs px-2 py-0.5 bg-gold/10 text-gold border border-gold/25 rounded-full"
                  >{{ reading.credits_used ?? 1 }} lượt</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="readingsTotalPages > 1" class="flex items-center justify-center gap-2 mt-8">
          <AppButton variant="secondary" size="sm" :disabled="readingsPage <= 1" @click="readingsPage--; loadReadings()">← Trước</AppButton>
          <span class="text-text-muted text-sm px-4">{{ readingsPage }} / {{ readingsTotalPages }}</span>
          <AppButton variant="secondary" size="sm" :disabled="readingsPage >= readingsTotalPages" @click="readingsPage++; loadReadings()">Sau →</AppButton>
        </div>
      </div>

      <!-- ── ORDERS TAB ── -->
      <div v-else-if="activeTab === 'orders'">
        <div v-if="ordersLoading" class="flex justify-center py-20">
          <AppSpinner size="lg" />
        </div>

        <div v-else-if="orders.length === 0" class="text-center py-20">
          <div class="text-5xl mb-4 select-none animate-float inline-block">🧾</div>
          <p class="text-text-secondary mb-2">Chưa có giao dịch nào</p>
          <p class="text-text-muted text-sm mb-6">Mua lượt để bắt đầu xem phân tích chuyên sâu</p>
          <RouterLink to="/buy-credits">
            <AppButton>✦ Mua lượt</AppButton>
          </RouterLink>
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="order in orders"
            :key="order.id"
            class="bg-bg-card border border-border-subtle rounded-xl p-5 hover:border-border-glow transition-all duration-200"
          >
            <div class="flex items-start justify-between gap-4">
              <!-- Left: status + amount -->
              <div class="flex items-center gap-3 flex-1 min-w-0">
                <div class="w-10 h-10 rounded-xl bg-gold/8 border border-gold/20 flex items-center justify-center text-lg flex-shrink-0">
                  {{ order.status === 'paid' ? '✅' : order.status === 'pending' ? '⏳' : order.status === 'expired' ? '⌛' : '❌' }}
                </div>
                <div class="min-w-0">
                  <div class="flex items-center gap-2 mb-0.5 flex-wrap">
                    <p class="font-medium text-text-primary">{{ order.credits }} lượt</p>
                    <span :class="['text-xs px-2 py-0.5 rounded-full border', STATUS_CLASS[order.status]]">
                      {{ STATUS_LABEL[order.status] }}
                    </span>
                  </div>
                  <p class="text-xs text-text-muted font-mono truncate">{{ order.topup_code }}</p>
                </div>
              </div>

              <!-- Right: amount + dates -->
              <div class="text-right flex-shrink-0">
                <p class="text-gold font-bold">{{ formatCurrency(order.amount) }}</p>
                <p class="text-xs text-text-muted mt-0.5">{{ formatDateTime(order.created_at) }}</p>
                <p v-if="order.paid_at" class="text-xs text-emerald-400 mt-0.5">
                  ✓ {{ formatDateTime(order.paid_at) }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div v-if="ordersTotalPages > 1" class="flex items-center justify-center gap-2 mt-8">
          <AppButton variant="secondary" size="sm" :disabled="ordersPage <= 1" @click="ordersPage--; loadOrders()">← Trước</AppButton>
          <span class="text-text-muted text-sm px-4">{{ ordersPage }} / {{ ordersTotalPages }}</span>
          <AppButton variant="secondary" size="sm" :disabled="ordersPage >= ordersTotalPages" @click="ordersPage++; loadOrders()">Sau →</AppButton>
        </div>
      </div>

    </div>
  </div>
</template>
