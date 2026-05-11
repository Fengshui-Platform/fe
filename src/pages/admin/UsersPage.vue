<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { adminService } from '@/services/admin.service'
import type { AdminUser } from '@/services/admin.service'
import type { PaginatedData } from '@/types/api.types'
import { useUIStore } from '@/stores/ui'
import { formatDate } from '@/utils/format'
import AppSpinner from '@/components/common/AppSpinner.vue'
import AppBadge from '@/components/common/AppBadge.vue'
import AppButton from '@/components/common/AppButton.vue'
import AppModal from '@/components/common/AppModal.vue'

const ui = useUIStore()
const router = useRouter()

const result = ref<PaginatedData<AdminUser> | null>(null)
const isLoading = ref(false)
const searchQuery = ref('')
const activeFilter = ref<'all' | 'active' | 'locked'>('all')
const page = ref(1)
const limit = 10

// Confirm modal
const confirmModal = ref(false)
const confirmTarget = ref<AdminUser | null>(null)
const confirmAction = ref<'lock' | 'unlock'>('lock')
const isConfirming = ref(false)

let debounceTimer: ReturnType<typeof setTimeout> | null = null

function onSearchInput(val: string) {
  searchQuery.value = val
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    page.value = 1
    loadUsers()
  }, 400)
}

function onFilterChange(f: 'all' | 'active' | 'locked') {
  activeFilter.value = f
  page.value = 1
  loadUsers()
}

async function loadUsers() {
  isLoading.value = true
  try {
    const params: Record<string, unknown> = { page: page.value, limit }
    if (searchQuery.value) params.search = searchQuery.value
    if (activeFilter.value === 'active') params.is_active = 1
    if (activeFilter.value === 'locked') params.is_active = 0
    result.value = await adminService.getUsers(params)
  } catch {
    ui.toast.error('Không thể tải danh sách người dùng')
  } finally {
    isLoading.value = false
  }
}

function openConfirm(user: AdminUser, action: 'lock' | 'unlock') {
  confirmTarget.value = user
  confirmAction.value = action
  confirmModal.value = true
}

async function doConfirm() {
  if (!confirmTarget.value) return
  isConfirming.value = true
  try {
    const is_active = confirmAction.value === 'unlock' ? 1 : 0
    await adminService.updateUser(confirmTarget.value.id, { is_active })
    ui.toast.success(confirmAction.value === 'unlock' ? 'Đã mở khoá tài khoản' : 'Đã khoá tài khoản')
    confirmModal.value = false
    loadUsers()
  } catch {
    ui.toast.error('Thao tác thất bại')
  } finally {
    isConfirming.value = false
  }
}

function goToDetail(user: AdminUser) {
  router.push({ name: 'AdminUserDetail', params: { id: user.id } })
}

function goPage(p: number) {
  page.value = p
  loadUsers()
}

onMounted(loadUsers)
</script>

<template>
  <div>
    <div class="mb-6">
      <h1 class="font-serif text-3xl text-gold mb-1">Người dùng</h1>
      <p class="text-text-muted text-sm">Quản lý tài khoản người dùng</p>
    </div>

    <!-- Toolbar -->
    <div class="flex flex-wrap items-center gap-3 mb-5">
      <div class="flex-1 min-w-48">
        <input
          :value="searchQuery"
          @input="onSearchInput(($event.target as HTMLInputElement).value)"
          placeholder="Tìm theo tên, email..."
          class="w-full bg-bg-elevated border border-border-subtle rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder-text-muted focus:border-mystic focus:outline-none transition-colors"
        />
      </div>
      <div class="flex gap-2">
        <button
          v-for="f in [['all','Tất cả'],['active','Hoạt động'],['locked','Đã khoá']] as const"
          :key="f[0]"
          @click="onFilterChange(f[0])"
          :class="[
            'px-4 py-2 rounded-xl text-sm font-medium transition-all',
            activeFilter === f[0]
              ? 'bg-mystic/20 text-mystic-glow border border-mystic/40'
              : 'text-text-secondary border border-border-subtle hover:bg-bg-elevated'
          ]"
        >
          {{ f[1] }}
        </button>
      </div>
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
                <th class="text-left px-4 py-3 text-text-muted font-medium">Họ tên</th>
                <th class="text-left px-4 py-3 text-text-muted font-medium">Email</th>
                <th class="text-right px-4 py-3 text-text-muted font-medium">Số lượt</th>
                <th class="text-left px-4 py-3 text-text-muted font-medium">Trạng thái lượt</th>
                <th class="text-left px-4 py-3 text-text-muted font-medium">Trạng thái TK</th>
                <th class="text-left px-4 py-3 text-text-muted font-medium">Ngày tạo</th>
                <th class="text-left px-4 py-3 text-text-muted font-medium">Hành động</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="user in result.items"
                :key="user.id"
                class="border-b border-border-subtle/50 hover:bg-bg-elevated/50 transition-colors"
              >
                <td class="px-4 py-3 text-text-muted font-mono text-xs">#{{ user.id }}</td>
                <td class="px-4 py-3 text-text-primary font-medium">{{ user.full_name }}</td>
                <td class="px-4 py-3 text-text-secondary">{{ user.email }}</td>
                <td class="px-4 py-3 text-right text-gold font-semibold">{{ user.credits_balance }}</td>
                <td class="px-4 py-3">
                  <AppBadge :variant="user.credits_status as 'active' | 'frozen' | 'empty'" size="sm">
                    {{ user.credits_status === 'active' ? 'Còn hạn' : user.credits_status === 'frozen' ? 'Đóng băng' : 'Hết lượt' }}
                  </AppBadge>
                </td>
                <td class="px-4 py-3">
                  <AppBadge :variant="user.is_active ? 'active' : 'empty'" size="sm">
                    {{ user.is_active ? 'Hoạt động' : 'Đã khoá' }}
                  </AppBadge>
                </td>
                <td class="px-4 py-3 text-text-muted text-xs">{{ formatDate(user.created_at) }}</td>
                <td class="px-4 py-3">
                  <div class="flex items-center gap-2">
                    <AppButton variant="ghost" size="sm" @click="goToDetail(user)">Xem</AppButton>
                    <AppButton
                      :variant="user.is_active ? 'danger' : 'secondary'"
                      size="sm"
                      @click="openConfirm(user, user.is_active ? 'lock' : 'unlock')"
                    >
                      {{ user.is_active ? 'Khoá' : 'Mở khoá' }}
                    </AppButton>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div v-if="result.totalPages > 1" class="flex items-center justify-between px-4 py-3 border-t border-border-subtle">
          <p class="text-xs text-text-muted">
            Trang {{ result.page }} / {{ result.totalPages }} — {{ result.total }} người dùng
          </p>
          <div class="flex gap-2">
            <AppButton variant="ghost" size="sm" :disabled="page <= 1" @click="goPage(page - 1)">← Trước</AppButton>
            <AppButton variant="ghost" size="sm" :disabled="page >= result.totalPages" @click="goPage(page + 1)">Tiếp →</AppButton>
          </div>
        </div>
      </template>

      <div v-else class="py-16 text-center text-text-muted">Không có dữ liệu</div>
    </div>

    <!-- Confirm lock/unlock modal -->
    <AppModal :show="confirmModal" :title="confirmAction === 'lock' ? 'Khoá tài khoản' : 'Mở khoá tài khoản'" @close="confirmModal = false">
      <p class="text-text-secondary mb-5">
        Bạn có chắc muốn
        <strong class="text-text-primary">{{ confirmAction === 'lock' ? 'khoá' : 'mở khoá' }}</strong>
        tài khoản <strong class="text-gold">{{ confirmTarget?.full_name }}</strong>?
      </p>
      <div class="flex justify-end gap-3">
        <AppButton variant="ghost" @click="confirmModal = false">Huỷ</AppButton>
        <AppButton
          :variant="confirmAction === 'lock' ? 'danger' : 'primary'"
          :loading="isConfirming"
          @click="doConfirm"
        >
          {{ confirmAction === 'lock' ? 'Khoá' : 'Mở khoá' }}
        </AppButton>
      </div>
    </AppModal>
  </div>
</template>
