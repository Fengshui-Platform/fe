<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { adminService } from '@/services/admin.service'
import type { AdminReading } from '@/services/admin.service'
import type { PaginatedData } from '@/types/api.types'
import { useUIStore } from '@/stores/ui'
import { formatDateTime } from '@/utils/format'
import AppSpinner from '@/components/common/AppSpinner.vue'
import AppButton from '@/components/common/AppButton.vue'
import AppModal from '@/components/common/AppModal.vue'
import AppBadge from '@/components/common/AppBadge.vue'

const ui = useUIStore()

const result = ref<PaginatedData<AdminReading> | null>(null)
const isLoading = ref(false)
const moduleFilter = ref('')
const isFreeFilter = ref<'' | '0' | '1'>('')
const page = ref(1)
const limit = 10

// Detail modal
const detailModal = ref(false)
const selectedReading = ref<AdminReading | null>(null)

const modules = [
  { value: '', label: 'Tất cả module' },
  { value: 'numerology', label: 'Thần số học' },
  { value: 'love', label: 'Tình duyên' },
  { value: 'finance', label: 'Tài chính' },
  { value: 'sim', label: 'Luận sim' },
  { value: 'fengshui_home', label: 'Phong thuỷ nhà' },
  { value: 'horoscope', label: 'Tử vi' },
]

async function loadReadings() {
  isLoading.value = true
  try {
    const params: Record<string, unknown> = { page: page.value, limit }
    if (moduleFilter.value) params.module = moduleFilter.value
    if (isFreeFilter.value !== '') params.is_free = Number(isFreeFilter.value)
    result.value = await adminService.getReadings(params)
  } catch {
    ui.toast.error('Không thể tải lịch sử xem')
  } finally {
    isLoading.value = false
  }
}

function onFilterChange() {
  page.value = 1
  loadReadings()
}

function viewDetail(reading: AdminReading) {
  selectedReading.value = reading
  detailModal.value = true
}

function goPage(p: number) {
  page.value = p
  loadReadings()
}

interface ResultSection {
  visible?: boolean
  locked?: boolean
  teaser?: string
  content?: Record<string, unknown>
}

interface ParsedResult {
  summary?: string
  life_path_number?: number
  soul_number?: number
  personality_number?: number
  destiny_number?: number
  sections?: Record<string, ResultSection>
}

function parseField<T>(field: unknown): T | null {
  if (!field) return null
  if (typeof field === 'object') return field as T
  try { return JSON.parse(field as string) as T } catch { return null }
}

function rawDisplay(field: unknown): string {
  if (!field) return ''
  if (typeof field === 'object') return JSON.stringify(field, null, 2)
  return String(field)
}

const parsedResult = computed<ParsedResult | null>(() =>
  parseField<ParsedResult>(selectedReading.value?.result_data)
)

const parsedInput = computed<Record<string, string> | null>(() =>
  parseField<Record<string, string>>(selectedReading.value?.input_data)
)

function asArray(v: unknown): string[] {
  return Array.isArray(v) ? v.map(String) : []
}

function asString(v: unknown): string {
  return typeof v === 'string' ? v : ''
}

function moduleLabel(mod: string): string {
  return modules.find(m => m.value === mod)?.label ?? mod
}

onMounted(loadReadings)
</script>

<template>
  <div>
    <div class="mb-6">
      <h1 class="font-serif text-3xl text-gold mb-1">Lịch sử xem</h1>
      <p class="text-text-muted text-sm">Tất cả lịch sử xem bói của người dùng</p>
    </div>

    <!-- Filters -->
    <div class="flex flex-wrap items-center gap-3 mb-5">
      <select
        v-model="moduleFilter"
        @change="onFilterChange"
        class="bg-bg-elevated border border-border-subtle rounded-xl px-4 py-2.5 text-sm text-text-primary focus:border-mystic focus:outline-none transition-colors"
      >
        <option v-for="m in modules" :key="m.value" :value="m.value">{{ m.label }}</option>
      </select>

      <select
        v-model="isFreeFilter"
        @change="onFilterChange"
        class="bg-bg-elevated border border-border-subtle rounded-xl px-4 py-2.5 text-sm text-text-primary focus:border-mystic focus:outline-none transition-colors"
      >
        <option value="">Tất cả loại</option>
        <option value="1">Miễn phí</option>
        <option value="0">Trả phí</option>
      </select>
    </div>

    <!-- Table -->
    <div class="bg-bg-card border border-border-subtle rounded-2xl overflow-hidden shadow-card">
      <div v-if="isLoading" class="flex justify-center py-16">
        <AppSpinner size="lg" />
      </div>

      <template v-else-if="result">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-border-subtle">
                <th class="text-left px-4 py-3 text-text-muted font-medium">ID</th>
                <th class="text-left px-4 py-3 text-text-muted font-medium">User</th>
                <th class="text-left px-4 py-3 text-text-muted font-medium">Module</th>
                <th class="text-left px-4 py-3 text-text-muted font-medium">Loại</th>
                <th class="text-left px-4 py-3 text-text-muted font-medium">IP</th>
                <th class="text-left px-4 py-3 text-text-muted font-medium">Thời gian</th>
                <th class="text-left px-4 py-3 text-text-muted font-medium">Hành động</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="reading in result.items"
                :key="reading.id"
                class="border-b border-border-subtle/50 hover:bg-bg-elevated/50 transition-colors"
              >
                <td class="px-4 py-3 text-text-muted font-mono text-xs">#{{ reading.id }}</td>
                <td class="px-4 py-3">
                  <div>
                    <p class="text-text-primary text-sm">{{ reading.full_name || 'Ẩn danh' }}</p>
                    <p class="text-text-muted text-xs">{{ reading.email || `#${reading.user_id}` }}</p>
                  </div>
                </td>
                <td class="px-4 py-3">
                  <AppBadge variant="mystic" size="sm">{{ moduleLabel(reading.module) }}</AppBadge>
                </td>
                <td class="px-4 py-3">
                  <AppBadge :variant="reading.is_free ? 'neon' : 'gold'" size="sm">
                    {{ reading.is_free ? 'Miễn phí' : `Trả phí (${reading.credits_used})` }}
                  </AppBadge>
                </td>
                <td class="px-4 py-3 text-text-muted font-mono text-xs">{{ reading.ip_address ?? '—' }}</td>
                <td class="px-4 py-3 text-text-muted text-xs">{{ formatDateTime(reading.created_at) }}</td>
                <td class="px-4 py-3">
                  <AppButton variant="ghost" size="sm" @click="viewDetail(reading)">Xem chi tiết</AppButton>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div v-if="result.totalPages > 1" class="flex items-center justify-between px-4 py-3 border-t border-border-subtle">
          <p class="text-xs text-text-muted">
            Trang {{ result.page }} / {{ result.totalPages }} — {{ result.total }} lượt xem
          </p>
          <div class="flex gap-2">
            <AppButton variant="ghost" size="sm" :disabled="page <= 1" @click="goPage(page - 1)">← Trước</AppButton>
            <AppButton variant="ghost" size="sm" :disabled="page >= result.totalPages" @click="goPage(page + 1)">Tiếp →</AppButton>
          </div>
        </div>
      </template>

      <div v-else class="py-16 text-center text-text-muted">Không có dữ liệu</div>
    </div>

    <!-- Detail modal -->
    <AppModal :show="detailModal" title="Chi tiết lượt xem" size="lg" @close="detailModal = false">
      <div v-if="selectedReading" class="space-y-5 max-h-[70vh] overflow-y-auto pr-1">

        <!-- Meta -->
        <div class="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p class="text-xs text-text-muted mb-1">Module</p>
            <AppBadge variant="mystic" size="sm">{{ moduleLabel(selectedReading.module) }}</AppBadge>
          </div>
          <div>
            <p class="text-xs text-text-muted mb-1">Thời gian</p>
            <p class="text-text-secondary">{{ formatDateTime(selectedReading.created_at) }}</p>
          </div>
        </div>

        <!-- Input data: parsed grid + raw JSON -->
        <div v-if="parsedInput">
          <p class="text-sm font-medium text-text-secondary mb-2">Dữ liệu đầu vào</p>
          <div class="bg-bg-surface border border-border-subtle rounded-xl p-4 grid grid-cols-2 gap-x-6 gap-y-2 mb-2">
            <template v-for="(val, key) in parsedInput" :key="key">
              <div>
                <p class="text-xs text-text-muted capitalize">{{ String(key).replace(/_/g, ' ') }}</p>
                <p class="text-sm text-text-primary">{{ val }}</p>
              </div>
            </template>
          </div>
          <details class="group">
            <summary class="text-xs text-text-muted cursor-pointer hover:text-text-secondary select-none">Raw JSON</summary>
            <pre class="mt-1 text-xs text-text-secondary overflow-auto max-h-32 bg-bg-surface p-3 rounded-xl border border-border-subtle">{{ rawDisplay(selectedReading.input_data) }}</pre>
          </details>
        </div>
        <div v-else>
          <p class="text-sm font-medium text-text-secondary mb-2">Dữ liệu đầu vào</p>
          <pre class="text-xs text-text-secondary overflow-auto max-h-32 bg-bg-surface p-3 rounded-xl border border-border-subtle">{{ rawDisplay(selectedReading.input_data) }}</pre>
        </div>

        <!-- Result -->
        <div v-if="parsedResult">
          <p class="text-sm font-medium text-text-secondary mb-3">Kết quả phân tích</p>

          <!-- Core numbers -->
          <div v-if="parsedResult.life_path_number" class="flex flex-wrap gap-3 mb-4">
            <div v-for="(num, label) in {
              'Đường Đời': parsedResult.life_path_number,
              'Linh Hồn': parsedResult.soul_number,
              'Nhân Cách': parsedResult.personality_number,
              'Vận Mệnh': parsedResult.destiny_number,
            }" :key="label" class="flex items-center gap-2 bg-bg-surface border border-border-subtle rounded-xl px-3 py-2">
              <span class="font-serif text-2xl text-gold">{{ num }}</span>
              <span class="text-xs text-text-muted">{{ label }}</span>
            </div>
          </div>

          <!-- Summary -->
          <div v-if="parsedResult.summary" class="bg-bg-surface border border-border-glow rounded-xl p-4 mb-4">
            <p class="text-xs text-text-muted mb-1">Tổng quan</p>
            <p class="text-sm text-text-secondary leading-relaxed">{{ parsedResult.summary }}</p>
          </div>

          <!-- Sections -->
          <div v-if="parsedResult.sections" class="space-y-3">
            <div
              v-for="(section, key) in parsedResult.sections"
              :key="key"
              class="bg-bg-surface border border-border-subtle rounded-xl p-4"
            >
              <!-- Section header -->
              <div class="flex items-center gap-2 mb-2">
                <span v-if="section.locked" class="text-base">🔒</span>
                <p class="text-sm font-semibold text-gold">
                  {{ asString(section.content?.title) || String(key).replace(/_/g, ' ') }}
                </p>
                <AppBadge v-if="section.locked" variant="default" size="sm">Khoá</AppBadge>
                <AppBadge v-else variant="active" size="sm">Hiển thị</AppBadge>
              </div>

              <!-- Locked: show teaser -->
              <p v-if="section.locked" class="text-xs text-text-muted italic">{{ section.teaser }}</p>

              <!-- Visible: show content fields -->
              <template v-else-if="section.content">
                <p v-if="section.content.description" class="text-sm text-text-secondary leading-relaxed mb-2">
                  {{ section.content.description }}
                </p>
                <div v-if="asArray(section.content.keywords).length" class="flex flex-wrap gap-1 mb-2">
                  <span v-for="kw in asArray(section.content.keywords)" :key="kw"
                    class="px-2 py-0.5 text-xs bg-mystic/15 text-mystic-glow border border-mystic/30 rounded-full">
                    {{ kw }}
                  </span>
                </div>
                <div v-if="asArray(section.content.strengths).length" class="mb-2">
                  <p class="text-xs font-semibold text-green-400 mb-1">Điểm mạnh</p>
                  <p v-for="s in asArray(section.content.strengths)" :key="s" class="text-xs text-text-secondary">✓ {{ s }}</p>
                </div>
                <div v-if="asArray(section.content.challenges).length" class="mb-2">
                  <p class="text-xs font-semibold text-amber-400 mb-1">Thách thức</p>
                  <p v-for="c in asArray(section.content.challenges)" :key="c" class="text-xs text-text-secondary">△ {{ c }}</p>
                </div>
                <div v-if="asString(section.content.career)">
                  <p class="text-xs font-semibold text-neon mb-1">Sự nghiệp</p>
                  <p class="text-xs text-text-secondary">{{ section.content.career }}</p>
                </div>
              </template>
            </div>
          </div>
        </div>

        <!-- Fallback raw if parse failed -->
        <div v-else>
          <p class="text-sm font-medium text-text-secondary mb-2">Kết quả (raw)</p>
          <pre class="text-xs text-text-secondary overflow-auto max-h-64 bg-bg-surface p-3 rounded-xl border border-border-subtle">{{ rawDisplay(selectedReading.result_data) }}</pre>
        </div>

      </div>
    </AppModal>
  </div>
</template>
