<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import VueApexCharts from 'vue3-apexcharts'
import type { ApexOptions } from 'apexcharts'
import { adminService } from '@/services/admin.service'
import type { AdminStats, DailyStats, ModuleRow, MonthlyRow, UserDailyRow } from '@/services/admin.service'
import { useUIStore } from '@/stores/ui'
import { formatCurrency } from '@/utils/format'
import AppSpinner from '@/components/common/AppSpinner.vue'

const ui = useUIStore()

const stats = ref<AdminStats | null>(null)
const dailyStats = ref<DailyStats | null>(null)
const moduleStats = ref<ModuleRow[]>([])
const usersDaily = ref<UserDailyRow[]>([])
const monthlyStats = ref<MonthlyRow[]>([])
const isLoadingStats = ref(true)
const isLoadingCharts = ref(true)

const MODULE_LABELS: Record<string, string> = {
  numerology: 'Thần số học',
  love: 'Tình duyên',
  finance: 'Tài chính',
  sim: 'Luận sim',
  fengshui_home: 'Phong thuỷ nhà',
  horoscope: 'Tử vi',
}

const CHART_COLORS = ['#f5c842', '#7c3aed', '#06b6d4', '#10b981', '#f97316', '#ec4899']

const baseAxis = {
  labels: { style: { colors: '#9590b8', fontSize: '11px' } },
  axisBorder: { color: '#1e1e30' },
  axisTicks: { color: '#1e1e30' },
}

const baseChartConfig: ApexOptions = {
  chart: {
    background: 'transparent',
    toolbar: { show: false },
    zoom: { enabled: false },
    fontFamily: 'Inter, sans-serif',
    sparkline: { enabled: false },
  },
  theme: { mode: 'dark' },
  grid: { borderColor: '#1e1e30', strokeDashArray: 3, padding: { left: 8, right: 8 } },
  xaxis: baseAxis,
  yaxis: { labels: { style: { colors: '#9590b8', fontSize: '11px' } } },
  tooltip: { theme: 'dark', style: { fontFamily: 'Inter, sans-serif' } },
  stroke: { curve: 'smooth', width: 2 },
}

// — Chart 1: Daily readings (area) —
const readingsOptions = computed<ApexOptions>(() => ({
  ...baseChartConfig,
  chart: { ...baseChartConfig.chart, type: 'area', id: 'daily-readings' },
  colors: ['#f5c842'],
  fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.35, opacityTo: 0.02, stops: [0, 100] } },
  xaxis: { ...baseAxis, categories: (dailyStats.value?.readings ?? []).map(r => r.date.slice(5).replace('-', '/')) },
  yaxis: { labels: { style: { colors: '#9590b8', fontSize: '11px' }, formatter: (v: number) => String(Math.round(v)) } },
  dataLabels: { enabled: false },
  markers: { size: 0 },
}))

const readingsSeries = computed(() => [{
  name: 'Lượt xem',
  data: (dailyStats.value?.readings ?? []).map(r => r.count),
}])

// — Chart 2: Daily revenue (bar) —
const revenueOptions = computed<ApexOptions>(() => ({
  ...baseChartConfig,
  chart: { ...baseChartConfig.chart, type: 'bar', id: 'daily-revenue' },
  colors: ['#7c3aed'],
  plotOptions: { bar: { borderRadius: 3, columnWidth: '55%' } },
  xaxis: { ...baseAxis, categories: (dailyStats.value?.revenue ?? []).map(r => r.date.slice(5).replace('-', '/')) },
  yaxis: { labels: { style: { colors: '#9590b8', fontSize: '11px' }, formatter: (v: number) => formatCurrency(v) } },
  dataLabels: { enabled: false },
}))

const revenueSeries = computed(() => [{
  name: 'Doanh thu',
  data: (dailyStats.value?.revenue ?? []).map(r => r.revenue),
}])

// — Chart 3: Module donut —
const moduleOptions = computed<ApexOptions>(() => ({
  ...baseChartConfig,
  chart: { ...baseChartConfig.chart, type: 'donut', id: 'modules' },
  colors: CHART_COLORS,
  labels: moduleStats.value.map(m => MODULE_LABELS[m.module] ?? m.module),
  legend: { position: 'bottom', labels: { colors: '#9590b8' }, fontSize: '12px' },
  plotOptions: { pie: { donut: { size: '62%', labels: { show: true, total: { show: true, label: 'Tổng', color: '#9590b8', formatter: (w: { globals: { seriesTotals: number[] } }) => w.globals.seriesTotals.reduce((a, b) => a + b, 0).toString() } } } } },
  dataLabels: { enabled: false },
  stroke: { width: 0 },
  tooltip: { ...baseChartConfig.tooltip, y: { formatter: (v: number) => `${v} lượt` } },
}))

const moduleSeries = computed(() => moduleStats.value.map(m => m.count))

// — Chart 4: Monthly line (readings + new_users) with bar revenue —
const monthlyOptions = computed<ApexOptions>(() => ({
  ...baseChartConfig,
  chart: { ...baseChartConfig.chart, type: 'line', id: 'monthly' },
  colors: ['#f5c842', '#06b6d4', '#10b981'],
  stroke: { width: [0, 2, 2], curve: 'smooth' },
  plotOptions: { bar: { columnWidth: '45%', borderRadius: 3 } },
  xaxis: { ...baseAxis, categories: monthlyStats.value.map(m => m.month.slice(0, 7)) },
  yaxis: [
    {
      seriesName: 'Doanh thu',
      labels: { style: { colors: '#9590b8', fontSize: '11px' }, formatter: (v: number) => formatCurrency(v) },
    },
    {
      seriesName: 'Lượt xem',
      opposite: true,
      labels: { style: { colors: '#9590b8', fontSize: '11px' }, formatter: (v: number) => String(Math.round(v)) },
    },
    { seriesName: 'Người dùng mới', show: false },
  ],
  legend: { labels: { colors: '#9590b8' } },
  dataLabels: { enabled: false },
  markers: { size: [0, 3, 3] },
}))

const monthlySeries = computed(() => [
  { name: 'Doanh thu', type: 'bar', data: monthlyStats.value.map(m => m.revenue) },
  { name: 'Lượt xem', type: 'line', data: monthlyStats.value.map(m => m.readings) },
  { name: 'Người dùng mới', type: 'line', data: monthlyStats.value.map(m => m.new_users) },
])

// — Users daily area (used as sub-stat) —
const usersOptions = computed<ApexOptions>(() => ({
  ...baseChartConfig,
  chart: { ...baseChartConfig.chart, type: 'area', id: 'users-daily' },
  colors: ['#06b6d4'],
  fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.35, opacityTo: 0.02, stops: [0, 100] } },
  xaxis: { ...baseAxis, categories: usersDaily.value.map(r => r.date.slice(5).replace('-', '/')) },
  yaxis: { labels: { style: { colors: '#9590b8', fontSize: '11px' }, formatter: (v: number) => String(Math.round(v)) } },
  dataLabels: { enabled: false },
  markers: { size: 0 },
}))

const usersSeries = computed(() => [{
  name: 'Người dùng mới',
  data: usersDaily.value.map(r => r.count),
}])

const statCards = [
  { key: 'total_users',         icon: '👥', label: 'Tổng người dùng',         color: 'text-neon',    format: (v: number) => v.toLocaleString('vi-VN') },
  { key: 'new_users_7d',        icon: '📈', label: 'Người dùng mới (7 ngày)', color: 'text-neon',    format: (v: number) => `+${v.toLocaleString('vi-VN')}` },
  { key: 'total_readings',      icon: '📖', label: 'Tổng lượt xem',           color: 'text-gold',    format: (v: number) => v.toLocaleString('vi-VN') },
  { key: 'readings_today',      icon: '✨', label: 'Lượt xem hôm nay',        color: 'text-gold',    format: (v: number) => v.toLocaleString('vi-VN') },
  { key: 'revenue_this_month',  icon: '💰', label: 'Doanh thu tháng này',      color: 'text-mystic-glow', format: (v: number) => formatCurrency(v) },
  { key: 'pending_orders',      icon: '⏳', label: 'Đơn chờ xác nhận',        color: 'text-text-secondary', format: (v: number) => v.toLocaleString('vi-VN') },
]

async function loadStats() {
  isLoadingStats.value = true
  try {
    stats.value = await adminService.getDashboard()
  } catch {
    ui.toast.error('Không thể tải thống kê tổng quan')
  } finally {
    isLoadingStats.value = false
  }
}

async function loadCharts() {
  isLoadingCharts.value = true
  try {
    const [daily, modules, users, monthly] = await Promise.all([
      adminService.getDailyStats(30),
      adminService.getModuleStats(),
      adminService.getUsersDaily(30),
      adminService.getMonthlyStats(12),
    ])
    dailyStats.value = daily
    moduleStats.value = modules
    usersDaily.value = users
    monthlyStats.value = monthly
  } catch {
    ui.toast.error('Không thể tải dữ liệu biểu đồ')
  } finally {
    isLoadingCharts.value = false
  }
}

onMounted(() => {
  loadStats()
  loadCharts()
})
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="font-serif text-3xl text-gold mb-1">Tổng quan</h1>
      <p class="text-text-muted text-sm">Thống kê và biểu đồ hệ thống</p>
    </div>

    <!-- Stats cards -->
    <div v-if="isLoadingStats" class="flex justify-center py-12">
      <AppSpinner size="lg" />
    </div>
    <div v-else-if="stats" class="grid grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="card in statCards"
        :key="card.key"
        class="bg-bg-card border border-border-subtle rounded-2xl p-5 shadow-card"
      >
        <div class="flex items-start justify-between mb-3">
          <p class="text-text-muted text-xs">{{ card.label }}</p>
          <span class="text-xl">{{ card.icon }}</span>
        </div>
        <p :class="['font-serif text-2xl font-semibold', card.color]">
          {{ card.format(stats[card.key as keyof AdminStats] as number) }}
        </p>
      </div>
    </div>

    <!-- Charts loading -->
    <div v-if="isLoadingCharts" class="flex justify-center py-12">
      <AppSpinner size="lg" />
    </div>

    <template v-else>
      <!-- Row 1: Daily readings + Daily revenue -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div class="bg-bg-card border border-border-subtle rounded-2xl p-5 shadow-card">
          <p class="text-sm font-medium text-text-secondary mb-4">Lượt xem theo ngày (30 ngày)</p>
          <VueApexCharts
            v-if="readingsSeries[0].data.length"
            type="area"
            height="220"
            :options="readingsOptions"
            :series="readingsSeries"
          />
          <div v-else class="flex items-center justify-center h-[220px] text-text-muted text-sm">Chưa có dữ liệu</div>
        </div>

        <div class="bg-bg-card border border-border-subtle rounded-2xl p-5 shadow-card">
          <p class="text-sm font-medium text-text-secondary mb-4">Doanh thu theo ngày (30 ngày)</p>
          <VueApexCharts
            v-if="revenueSeries[0].data.length"
            type="bar"
            height="220"
            :options="revenueOptions"
            :series="revenueSeries"
          />
          <div v-else class="flex items-center justify-center h-[220px] text-text-muted text-sm">Chưa có dữ liệu</div>
        </div>
      </div>

      <!-- Row 2: Module donut + Users daily -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div class="bg-bg-card border border-border-subtle rounded-2xl p-5 shadow-card">
          <p class="text-sm font-medium text-text-secondary mb-4">Phân bổ theo module</p>
          <VueApexCharts
            v-if="moduleSeries.length"
            type="donut"
            height="280"
            :options="moduleOptions"
            :series="moduleSeries"
          />
          <div v-else class="flex items-center justify-center h-[280px] text-text-muted text-sm">Chưa có dữ liệu</div>
        </div>

        <div class="bg-bg-card border border-border-subtle rounded-2xl p-5 shadow-card">
          <p class="text-sm font-medium text-text-secondary mb-4">Người dùng mới theo ngày (30 ngày)</p>
          <VueApexCharts
            v-if="usersSeries[0].data.length"
            type="area"
            height="280"
            :options="usersOptions"
            :series="usersSeries"
          />
          <div v-else class="flex items-center justify-center h-[280px] text-text-muted text-sm">Chưa có dữ liệu</div>
        </div>
      </div>

      <!-- Row 3: Monthly overview (full width) -->
      <div class="bg-bg-card border border-border-subtle rounded-2xl p-5 shadow-card">
        <p class="text-sm font-medium text-text-secondary mb-4">Tổng quan hàng tháng (12 tháng)</p>
        <VueApexCharts
          v-if="monthlyStats.length"
          type="line"
          height="300"
          :options="monthlyOptions"
          :series="monthlySeries"
        />
        <div v-else class="flex items-center justify-center h-[300px] text-text-muted text-sm">Chưa có dữ liệu</div>
      </div>
    </template>
  </div>
</template>
