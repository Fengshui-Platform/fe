<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import VueApexCharts from 'vue3-apexcharts'
import type { ApexOptions } from 'apexcharts'
import { adminService } from '@/services/admin.service'
import { useUIStore } from '@/stores/ui'
import AppSpinner from '@/components/common/AppSpinner.vue'

const ui = useUIStore()

// ── Date range ────────────────────────────────────────────────
type Preset = 'today' | '7d' | '30d' | '90d' | 'custom'
const activePreset = ref<Preset>('30d')

function toIso(d: Date) { return d.toISOString().slice(0, 10) }

function presetRange(p: Preset): { from: string; to: string } {
  const to = new Date()
  const from = new Date()
  if (p === 'today')  { return { from: toIso(to), to: toIso(to) } }
  if (p === '7d')     { from.setDate(to.getDate() - 6) }
  else if (p === '30d')  { from.setDate(to.getDate() - 29) }
  else if (p === '90d')  { from.setDate(to.getDate() - 89) }
  return { from: toIso(from), to: toIso(to) }
}

const { from: initFrom, to: initTo } = presetRange('30d')
const customFrom = ref(initFrom)
const customTo   = ref(initTo)

const dateFrom = computed(() => activePreset.value !== 'custom' ? presetRange(activePreset.value).from : customFrom.value)
const dateTo   = computed(() => activePreset.value !== 'custom' ? presetRange(activePreset.value).to   : customTo.value)

// ── Data ─────────────────────────────────────────────────────
const overview  = ref<Awaited<ReturnType<typeof adminService.getTrafficOverview>> | null>(null)
const daily     = ref<Awaited<ReturnType<typeof adminService.getTrafficDaily>>>([])
const pages     = ref<Awaited<ReturnType<typeof adminService.getTrafficPages>>>([])
const features  = ref<Awaited<ReturnType<typeof adminService.getTrafficFeatures>>>([])
const funnel    = ref<Awaited<ReturnType<typeof adminService.getTrafficFunnel>> | null>(null)

const loading = ref(false)

async function fetchAll() {
  loading.value = true
  try {
    const [ov, dv, pg, fe, fn] = await Promise.all([
      adminService.getTrafficOverview(dateFrom.value, dateTo.value),
      adminService.getTrafficDaily(dateFrom.value, dateTo.value),
      adminService.getTrafficPages(dateFrom.value, dateTo.value, 10),
      adminService.getTrafficFeatures(dateFrom.value, dateTo.value),
      adminService.getTrafficFunnel(dateFrom.value, dateTo.value),
    ])
    overview.value = ov
    daily.value    = dv
    pages.value    = pg
    features.value = fe
    funnel.value   = fn
  } catch {
    ui.toast.error('Không thể tải dữ liệu traffic')
  } finally {
    loading.value = false
  }
}

onMounted(fetchAll)

watch([dateFrom, dateTo], fetchAll)

// ── Chart base config ────────────────────────────────────────
const baseAxis = {
  labels: { style: { colors: '#9590b8', fontSize: '11px' } },
  axisBorder: { color: '#1e1e30' },
  axisTicks: { color: '#1e1e30' },
}
const baseChart: ApexOptions = {
  chart: { background: 'transparent', toolbar: { show: false }, fontFamily: 'Inter, sans-serif' },
  theme: { mode: 'dark' },
  grid: { borderColor: '#1e1e30', strokeDashArray: 3, padding: { left: 8, right: 8 } },
  tooltip: { theme: 'dark' },
  stroke: { curve: 'smooth', width: 2 },
}

// ── Chart 1: Daily traffic line ──────────────────────────────
const dailyCategories = computed(() => daily.value.map(d => d.date.slice(5).replace('-', '/')))
const dailyOptions = computed<ApexOptions>(() => ({
  ...baseChart,
  chart: { ...baseChart.chart, type: 'area', id: 'traffic-daily' },
  colors: ['#f5c842', '#7c3aed'],
  fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.3, opacityTo: 0.02, stops: [0, 100] } },
  xaxis: { ...baseAxis, categories: dailyCategories.value },
  yaxis: { labels: { style: { colors: '#9590b8', fontSize: '11px' }, formatter: (v: number) => String(Math.round(v)) } },
  dataLabels: { enabled: false },
  markers: { size: 0 },
  legend: { labels: { colors: '#9590b8' } },
}))
const dailySeries = computed(() => [
  { name: 'Tổng lượt xem',       data: daily.value.map(d => d.total_views) },
  { name: 'Khách độc lập',       data: daily.value.map(d => d.unique_sessions) },
])

// ── Chart 2: Top pages bar ───────────────────────────────────
const pagesOptions = computed<ApexOptions>(() => ({
  ...baseChart,
  chart: { ...baseChart.chart, type: 'bar', id: 'traffic-pages' },
  colors: ['#06b6d4'],
  plotOptions: { bar: { horizontal: true, borderRadius: 3, barHeight: '60%' } },
  xaxis: { ...baseAxis, categories: pages.value.map(p => labelPage(p.page)) },
  yaxis: { labels: { style: { colors: '#9590b8', fontSize: '11px' } } },
  dataLabels: { enabled: false },
}))
const pagesSeries = computed(() => [{ name: 'Lượt xem', data: pages.value.map(p => p.views) }])

// ── Chart 3: Feature events bar ──────────────────────────────
const featureSummary = computed(() => {
  const map = new Map<string, number>()
  features.value.forEach(f => {
    const key = labelFeature(f.event_type, f.module)
    map.set(key, (map.get(key) ?? 0) + f.count)
  })
  return Array.from(map.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
})
const featuresOptions = computed<ApexOptions>(() => ({
  ...baseChart,
  chart: { ...baseChart.chart, type: 'bar', id: 'traffic-features' },
  colors: ['#10b981'],
  plotOptions: { bar: { horizontal: true, borderRadius: 3, barHeight: '60%' } },
  xaxis: { ...baseAxis, categories: featureSummary.value.map(e => e[0]) },
  yaxis: { labels: { style: { colors: '#9590b8', fontSize: '11px' } } },
  dataLabels: { enabled: false },
}))
const featuresSeries = computed(() => [{ name: 'Số lần', data: featureSummary.value.map(e => e[1]) }])

// ── CSV export ───────────────────────────────────────────────
function exportCsv() {
  const header = 'Ngày,Tổng lượt xem,Khách độc lập,Đã đăng nhập'
  const rows = daily.value.map(d =>
    `${d.date},${d.total_views},${d.unique_sessions},${d.logged_in_users}`
  )
  const blob = new Blob([header + '\n' + rows.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `traffic_${dateFrom.value}_${dateTo.value}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// ── Label mappings ────────────────────────────────────────────
const PAGE_LABELS: Record<string, string> = {
  Home:            'Trang chủ',
  Reading:         'Xem bài (tất cả module)',
  Result:          'Trang kết quả',
  Login:           'Đăng nhập',
  Register:        'Đăng ký',
  BuyCredits:      'Mua lượt',
  History:         'Lịch sử xem',
  Profile:         'Hồ sơ cá nhân',
  ForgotPassword:  'Quên mật khẩu',
  ResetPassword:   'Đặt lại mật khẩu',
  VerifyEmail:     'Xác thực email',
  AdminDashboard:  'Admin — Tổng quan',
  AdminTraffic:    'Admin — Traffic',
  AdminUsers:      'Admin — Người dùng',
  AdminUserDetail: 'Admin — Chi tiết user',
  AdminReadings:   'Admin — Lịch sử bài đọc',
  AdminOrders:     'Admin — Đơn mua lượt',
  AdminPackages:   'Admin — Gói lượt',
  AdminAIModels:   'Admin — Mô hình AI',
  AdminSettings:   'Admin — Cài đặt',
}

const MODULE_LABELS: Record<string, string> = {
  numerology:    'Thần số học',
  love:          'Tình duyên',
  finance:       'Tài chính',
  sim:           'Luận SIM',
  fengshui_home: 'Phong thuỷ nhà',
  horoscope:     'Tử vi',
  zodiac:        'Cung hoàng đạo',
}

const EVENT_LABELS: Record<string, string> = {
  reading_start:    'Bắt đầu xem bài',
  reading_complete: 'Xem bài hoàn tất',
  buy_credit_view:  'Vào trang mua lượt',
  buy_credit_init:  'Khởi tạo mua lượt',
  login_success:    'Đăng nhập thành công',
  register_success: 'Đăng ký thành công',
}

function labelPage(key: string): string {
  return PAGE_LABELS[key] ?? key
}

function labelFeature(event_type: string, module: string | null): string {
  const ev = EVENT_LABELS[event_type] ?? event_type
  const mod = module ? (MODULE_LABELS[module] ?? module) : null
  return mod ? `${ev} — ${mod}` : ev
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header + date controls -->
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-semibold text-text-primary">Traffic & Analytics</h1>
        <p class="text-sm text-text-muted mt-0.5">Theo dõi lượt truy cập và hành vi người dùng</p>
      </div>

      <!-- Preset buttons -->
      <div class="flex items-center gap-2 flex-wrap">
        <div class="flex gap-1 p-1 bg-bg-surface border border-border-subtle rounded-lg">
          <button
            v-for="p in [{ key: 'today', label: 'Hôm nay' }, { key: '7d', label: '7 ngày' }, { key: '30d', label: '30 ngày' }, { key: '90d', label: '3 tháng' }]"
            :key="p.key"
            class="px-3 py-1.5 text-xs rounded-md transition-all"
            :class="activePreset === p.key ? 'bg-mystic text-white' : 'text-text-secondary hover:text-text-primary'"
            @click="activePreset = p.key as Preset"
          >{{ p.label }}</button>
          <button
            class="px-3 py-1.5 text-xs rounded-md transition-all"
            :class="activePreset === 'custom' ? 'bg-mystic text-white' : 'text-text-secondary hover:text-text-primary'"
            @click="activePreset = 'custom'"
          >Tùy chọn</button>
        </div>

        <!-- Custom date inputs -->
        <template v-if="activePreset === 'custom'">
          <input type="date" v-model="customFrom" class="bg-bg-elevated border border-border-subtle text-text-primary text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-mystic" />
          <span class="text-text-muted text-xs">→</span>
          <input type="date" v-model="customTo"   class="bg-bg-elevated border border-border-subtle text-text-primary text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-mystic" />
        </template>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-16">
      <AppSpinner />
    </div>

    <template v-else>
      <!-- Overview cards -->
      <div class="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <div class="bg-bg-card border border-border-subtle rounded-xl p-5">
          <p class="text-xs text-text-muted mb-1">Tổng lượt xem trang</p>
          <p class="text-2xl font-bold text-gold">{{ overview?.total_views?.toLocaleString() ?? 0 }}</p>
          <p class="text-xs text-text-muted mt-1">Mỗi lần chuyển trang = 1 lượt</p>
        </div>
        <div class="bg-bg-card border border-border-subtle rounded-xl p-5">
          <p class="text-xs text-text-muted mb-1">Thiết bị độc lập</p>
          <p class="text-2xl font-bold text-neon">{{ overview?.unique_sessions?.toLocaleString() ?? 0 }}</p>
          <p class="text-xs text-text-muted mt-1">Theo cookie trình duyệt (1 năm)</p>
        </div>
        <div class="bg-bg-card border border-border-subtle rounded-xl p-5">
          <p class="text-xs text-text-muted mb-1">Người dùng đã đăng nhập</p>
          <p class="text-2xl font-bold text-mystic-glow">{{ overview?.logged_in_users?.toLocaleString() ?? 0 }}</p>
          <p class="text-xs text-text-muted mt-1">Tỉ lệ đăng nhập: {{ overview?.login_rate ?? 0 }}%</p>
        </div>
        <div class="bg-bg-card border border-border-subtle rounded-xl p-5">
          <p class="text-xs text-text-muted mb-1">Tương tác tính năng</p>
          <p class="text-2xl font-bold text-emerald-400">{{ overview?.total_events?.toLocaleString() ?? 0 }}</p>
          <p class="text-xs text-text-muted mt-1">Bắt đầu đọc bài: {{ overview?.reading_starts ?? 0 }}</p>
        </div>
      </div>

      <!-- Giải thích cách tính -->
      <div class="bg-bg-surface border border-border-subtle rounded-xl px-5 py-3 text-xs text-text-muted leading-relaxed">
        <span class="text-text-secondary font-medium">Cách tính: </span>
        <span class="text-neon">Thiết bị độc lập</span> = 1 trình duyệt/máy tính (cookie 1 năm). Cùng 1 người vào web → đăng nhập → xem bài tính là <strong class="text-text-primary">1 thiết bị</strong>, không phải 3. Còn <span class="text-mystic-glow">Người dùng đã đăng nhập</span> chỉ đếm những tài khoản đã login trong kỳ, không tính khách ẩn danh.
      </div>

      <!-- Daily traffic chart -->
      <div class="bg-bg-card border border-border-subtle rounded-xl p-5">
        <h2 class="text-sm font-semibold text-text-primary mb-4">Lượt truy cập theo ngày</h2>
        <VueApexCharts
          v-if="daily.length"
          type="area"
          height="220"
          :options="dailyOptions"
          :series="dailySeries"
        />
        <p v-else class="text-center text-text-muted text-sm py-12">Chưa có dữ liệu trong khoảng thời gian này</p>
      </div>

      <!-- Pages + Features charts (2 columns) -->
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <!-- Top pages -->
        <div class="bg-bg-card border border-border-subtle rounded-xl p-5">
          <h2 class="text-sm font-semibold text-text-primary mb-4">Trang phổ biến nhất</h2>
          <VueApexCharts
            v-if="pages.length"
            type="bar"
            height="240"
            :options="pagesOptions"
            :series="pagesSeries"
          />
          <p v-else class="text-center text-text-muted text-sm py-12">Chưa có dữ liệu</p>
        </div>

        <!-- Feature events -->
        <div class="bg-bg-card border border-border-subtle rounded-xl p-5">
          <h2 class="text-sm font-semibold text-text-primary mb-4">Tính năng được dùng nhiều nhất</h2>
          <VueApexCharts
            v-if="featureSummary.length"
            type="bar"
            height="240"
            :options="featuresOptions"
            :series="featuresSeries"
          />
          <p v-else class="text-center text-text-muted text-sm py-12">Chưa có dữ liệu</p>
        </div>
      </div>

      <!-- Funnel -->
      <div v-if="funnel" class="bg-bg-card border border-border-subtle rounded-xl p-5">
        <h2 class="text-sm font-semibold text-text-primary mb-5">Phễu chuyển đổi (Conversion Funnel)</h2>
        <div class="flex flex-col gap-3 max-w-lg">
          <div
            v-for="(step, i) in funnel.steps"
            :key="step.step"
            class="relative"
          >
            <div class="flex items-center justify-between mb-1">
              <span class="text-xs text-text-secondary">{{ step.step }}</span>
              <span class="text-xs font-bold text-text-primary">{{ step.count.toLocaleString() }} <span class="text-text-muted font-normal">({{ step.pct }}%)</span></span>
            </div>
            <div class="h-7 bg-bg-elevated rounded-lg overflow-hidden">
              <div
                class="h-full rounded-lg transition-all duration-500"
                :class="[
                  i === 0 ? 'bg-gold/80' :
                  i === 1 ? 'bg-mystic/80' :
                  i === 2 ? 'bg-neon/80' :
                             'bg-emerald-500/80'
                ]"
                :style="{ width: `${step.pct}%` }"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Daily table + export -->
      <div class="bg-bg-card border border-border-subtle rounded-xl overflow-hidden">
        <div class="flex items-center justify-between px-5 py-4 border-b border-border-subtle">
          <h2 class="text-sm font-semibold text-text-primary">Thống kê theo ngày</h2>
          <button
            class="text-xs px-3 py-1.5 rounded-lg bg-bg-elevated border border-border-subtle text-text-secondary hover:text-text-primary hover:border-mystic transition-all"
            @click="exportCsv"
          >
            Xuất CSV
          </button>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-border-subtle text-left">
                <th class="px-5 py-3 text-xs font-medium text-text-muted">Ngày</th>
                <th class="px-5 py-3 text-xs font-medium text-text-muted text-right">Tổng lượt xem</th>
                <th class="px-5 py-3 text-xs font-medium text-text-muted text-right">Khách độc lập</th>
                <th class="px-5 py-3 text-xs font-medium text-text-muted text-right">Đã đăng nhập</th>
                <th class="px-5 py-3 text-xs font-medium text-text-muted text-right">Tỉ lệ ĐN</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in [...daily].reverse()"
                :key="row.date"
                class="border-b border-border-subtle/40 hover:bg-bg-elevated/40 transition-colors"
              >
                <td class="px-5 py-3 text-text-secondary font-mono text-xs">{{ row.date }}</td>
                <td class="px-5 py-3 text-right font-medium text-text-primary">{{ row.total_views.toLocaleString() }}</td>
                <td class="px-5 py-3 text-right text-neon">{{ row.unique_sessions.toLocaleString() }}</td>
                <td class="px-5 py-3 text-right text-mystic-glow">{{ row.logged_in_users.toLocaleString() }}</td>
                <td class="px-5 py-3 text-right text-text-secondary">
                  {{ row.unique_sessions > 0 ? (row.logged_in_users / row.unique_sessions * 100).toFixed(1) : '0' }}%
                </td>
              </tr>
              <tr v-if="!daily.length">
                <td colspan="5" class="px-5 py-10 text-center text-text-muted text-sm">Chưa có dữ liệu</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
  </div>
</template>
