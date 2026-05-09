<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { adminService } from '@/services/admin.service'
import type { AdminOrder } from '@/services/admin.service'
import type { PaginatedData } from '@/types/api.types'
import { useUIStore } from '@/stores/ui'
import { formatCurrency, formatDateTime } from '@/utils/format'
import AppSpinner from '@/components/common/AppSpinner.vue'
import AppButton from '@/components/common/AppButton.vue'
import AppModal from '@/components/common/AppModal.vue'
import AppBadge from '@/components/common/AppBadge.vue'

const ui = useUIStore()

const result = ref<PaginatedData<AdminOrder> | null>(null)
const isLoading = ref(false)
const statusFilter = ref('')
const page = ref(1)
const limit = 10

// Confirm modal
const confirmModal = ref(false)
const confirmTarget = ref<AdminOrder | null>(null)
const isConfirming = ref(false)

const statusOptions = [
  { value: '', label: 'Tất cả' },
  { value: 'pending', label: 'Chờ xác nhận' },
  { value: 'paid', label: 'Đã thanh toán' },
  { value: 'failed', label: 'Thất bại' },
  { value: 'expired', label: 'Hết hạn' },
]

type StatusVariant = 'active' | 'empty' | 'frozen' | 'default'

function statusVariant(status: string): StatusVariant {
  const map: Record<string, StatusVariant> = {
    paid: 'active',
    failed: 'empty',
    expired: 'default',
    pending: 'frozen',
  }
  return map[status] ?? 'default'
}

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    paid: '✅ Đã thanh toán',
    failed: '❌ Thất bại',
    expired: '⌛ Hết hạn',
    pending: '⏳ Chờ xác nhận',
  }
  return map[status] ?? status
}

async function loadOrders() {
  isLoading.value = true
  try {
    const params: Record<string, unknown> = { page: page.value, limit }
    if (statusFilter.value) params.status = statusFilter.value
    result.value = await adminService.getOrders(params)
  } catch {
    ui.toast.error('Không thể tải danh sách đơn hàng')
  } finally {
    isLoading.value = false
  }
}

function onFilterChange() {
  page.value = 1
  loadOrders()
}

function openConfirm(order: AdminOrder) {
  confirmTarget.value = order
  confirmModal.value = true
}

async function doConfirm() {
  if (!confirmTarget.value) return
  isConfirming.value = true
  try {
    await adminService.confirmOrder(confirmTarget.value.id)
    ui.toast.success('Đã xác nhận thanh toán')
    confirmModal.value = false
    loadOrders()
  } catch {
    ui.toast.error('Xác nhận thất bại')
  } finally {
    isConfirming.value = false
  }
}

function goPage(p: number) {
  page.value = p
  loadOrders()
}

onMounted(loadOrders)
</script>

<template>
  <div>
    <div class="mb-6">
      <h1 class="font-serif text-3xl text-gold mb-1">Đơn mua lượt</h1>
      <p class="text-text-muted text-sm">Quản lý đơn mua lượt của người dùng</p>
    </div>

    <!-- Filters -->
    <div class="flex flex-wrap items-center gap-3 mb-5">
      <select
        v-model="statusFilter"
        @change="onFilterChange"
        class="bg-bg-elevated border border-border-subtle rounded-xl px-4 py-2.5 text-sm text-text-primary focus:border-mystic focus:outline-none transition-colors"
      >
        <option v-for="s in statusOptions" :key="s.value" :value="s.value">{{ s.label }}</option>
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
                <th class="text-left px-4 py-3 text-text-muted font-medium">Gói</th>
                <th class="text-right px-4 py-3 text-text-muted font-medium">Lượt</th>
                <th class="text-right px-4 py-3 text-text-muted font-medium">Số tiền</th>
                <th class="text-left px-4 py-3 text-text-muted font-medium">Mã CK</th>
                <th class="text-left px-4 py-3 text-text-muted font-medium">Trạng thái</th>
                <th class="text-left px-4 py-3 text-text-muted font-medium">Thời gian</th>
                <th class="text-left px-4 py-3 text-text-muted font-medium">Hành động</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="order in result.items"
                :key="order.id"
                class="border-b border-border-subtle/50 hover:bg-bg-elevated/50 transition-colors"
              >
                <td class="px-4 py-3 text-text-muted font-mono text-xs">#{{ order.id }}</td>
                <td class="px-4 py-3">
                  <div>
                    <p class="text-text-primary text-sm">{{ order.full_name }}</p>
                    <p class="text-text-muted text-xs">{{ order.email }}</p>
                  </div>
                </td>
                <td class="px-4 py-3 text-text-secondary text-sm">{{ order.package_name || '—' }}</td>
                <td class="px-4 py-3 text-right text-gold font-semibold">{{ order.credits }}</td>
                <td class="px-4 py-3 text-right text-text-primary font-medium">{{ formatCurrency(order.amount) }}</td>
                <td class="px-4 py-3">
                  <code class="text-xs font-mono text-neon bg-neon/10 px-2 py-0.5 rounded">{{ order.topup_code }}</code>
                </td>
                <td class="px-4 py-3">
                  <AppBadge :variant="statusVariant(order.status)" size="sm">
                    {{ statusLabel(order.status) }}
                  </AppBadge>
                </td>
                <td class="px-4 py-3 text-text-muted text-xs">{{ formatDateTime(order.created_at) }}</td>
                <td class="px-4 py-3">
                  <AppButton
                    v-if="order.status === 'pending'"
                    variant="primary"
                    size="sm"
                    @click="openConfirm(order)"
                  >
                    Xác nhận
                  </AppButton>
                  <span v-else class="text-text-muted text-xs">—</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div v-if="result.totalPages > 1" class="flex items-center justify-between px-4 py-3 border-t border-border-subtle">
          <p class="text-xs text-text-muted">
            Trang {{ result.page }} / {{ result.totalPages }} — {{ result.total }} đơn hàng
          </p>
          <div class="flex gap-2">
            <AppButton variant="ghost" size="sm" :disabled="page <= 1" @click="goPage(page - 1)">← Trước</AppButton>
            <AppButton variant="ghost" size="sm" :disabled="page >= result.totalPages" @click="goPage(page + 1)">Tiếp →</AppButton>
          </div>
        </div>
      </template>

      <div v-else class="py-16 text-center text-text-muted">Không có dữ liệu</div>
    </div>

    <!-- Confirm payment modal -->
    <AppModal :show="confirmModal" title="Xác nhận thanh toán" @close="confirmModal = false">
      <div v-if="confirmTarget" class="space-y-3 mb-5">
        <p class="text-text-secondary">Bạn có chắc muốn xác nhận đã nhận thanh toán cho đơn hàng này?</p>
        <div class="bg-bg-surface rounded-xl p-4 space-y-2 text-sm">
          <div class="flex justify-between">
            <span class="text-text-muted">Người dùng:</span>
            <span class="text-text-primary">{{ confirmTarget.full_name }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-text-muted">Số tiền:</span>
            <span class="text-gold font-semibold">{{ formatCurrency(confirmTarget.amount) }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-text-muted">Lượt:</span>
            <span class="text-text-primary">{{ confirmTarget.credits }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-text-muted">Mã CK:</span>
            <code class="text-neon text-xs">{{ confirmTarget.topup_code }}</code>
          </div>
        </div>
      </div>
      <div class="flex justify-end gap-3">
        <AppButton variant="ghost" @click="confirmModal = false">Huỷ</AppButton>
        <AppButton variant="primary" :loading="isConfirming" @click="doConfirm">Xác nhận thanh toán</AppButton>
      </div>
    </AppModal>
  </div>
</template>
