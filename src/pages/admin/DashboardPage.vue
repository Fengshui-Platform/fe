<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { adminService } from '@/services/admin.service'
import type { AdminStats } from '@/services/admin.service'
import { useUIStore } from '@/stores/ui'
import { formatCurrency } from '@/utils/format'
import AppSpinner from '@/components/common/AppSpinner.vue'

const ui = useUIStore()
const stats = ref<AdminStats | null>(null)
const isLoading = ref(false)

const statCards = [
  { key: 'total_users',         icon: '👥', label: 'Tổng người dùng',     format: (v: number) => v.toLocaleString('vi-VN') },
  { key: 'new_users_7d',        icon: '📈', label: 'Người dùng mới (7 ngày)', format: (v: number) => v.toLocaleString('vi-VN') },
  { key: 'revenue_this_month',  icon: '💰', label: 'Doanh thu tháng này', format: (v: number) => formatCurrency(v) },
  { key: 'total_readings',      icon: '📖', label: 'Tổng lượt xem',        format: (v: number) => v.toLocaleString('vi-VN') },
  { key: 'readings_today',      icon: '✨', label: 'Lượt xem hôm nay',     format: (v: number) => v.toLocaleString('vi-VN') },
  { key: 'pending_orders',      icon: '⏳', label: 'Đơn chờ xác nhận',    format: (v: number) => v.toLocaleString('vi-VN') },
]

async function loadStats() {
  isLoading.value = true
  try {
    stats.value = await adminService.getDashboard()
  } catch {
    ui.toast.error('Không thể tải thống kê')
  } finally {
    isLoading.value = false
  }
}

onMounted(loadStats)
</script>

<template>
  <div>
    <div class="mb-6">
      <h1 class="font-serif text-3xl text-gold mb-1">Tổng quan</h1>
      <p class="text-text-muted text-sm">Thống kê tổng quan hệ thống</p>
    </div>

    <div v-if="isLoading" class="flex justify-center py-20">
      <AppSpinner size="lg" />
    </div>

    <template v-else-if="stats">
      <!-- Stat cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 mb-8">
        <div
          v-for="card in statCards"
          :key="card.key"
          class="bg-bg-card border border-border-subtle rounded-2xl p-5 shadow-card"
        >
          <div class="flex items-start justify-between">
            <div>
              <p class="text-text-muted text-sm mb-2">{{ card.label }}</p>
              <p class="font-serif text-3xl text-gold">
                {{ card.format(stats[card.key as keyof AdminStats] as number) }}
              </p>
            </div>
            <span class="text-3xl">{{ card.icon }}</span>
          </div>
        </div>
      </div>

      <!-- Chart placeholder -->
      <div class="bg-bg-card border border-border-subtle rounded-2xl p-6 text-center">
        <p class="text-text-muted text-sm">📊 Tính năng biểu đồ sẽ được bổ sung trong phiên bản tới.</p>
      </div>
    </template>
  </div>
</template>
