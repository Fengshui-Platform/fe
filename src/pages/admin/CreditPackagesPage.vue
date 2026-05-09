<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { adminService } from '@/services/admin.service'
import type { CreditPackage } from '@/services/admin.service'
import { useUIStore } from '@/stores/ui'
import { formatCurrency } from '@/utils/format'
import AppSpinner from '@/components/common/AppSpinner.vue'
import AppButton from '@/components/common/AppButton.vue'
import AppModal from '@/components/common/AppModal.vue'
import AppBadge from '@/components/common/AppBadge.vue'

const ui = useUIStore()

const packages = ref<CreditPackage[]>([])
const isLoading = ref(false)

// Form modal
const formModal = ref(false)
const editingPackage = ref<CreditPackage | null>(null)
const isSaving = ref(false)

const formDefault = () => ({
  name: '',
  credits: 0,
  price: 0,
  validity_days: 30,
  is_active: 1,
  description: '',
})
const form = reactive(formDefault())

// Delete modal
const deleteModal = ref(false)
const deleteTarget = ref<CreditPackage | null>(null)
const isDeleting = ref(false)

async function loadPackages() {
  isLoading.value = true
  try {
    packages.value = await adminService.getPackages()
  } catch {
    ui.toast.error('Không thể tải danh sách gói lượt')
  } finally {
    isLoading.value = false
  }
}

function openCreate() {
  editingPackage.value = null
  Object.assign(form, formDefault())
  formModal.value = true
}

function openEdit(pkg: CreditPackage) {
  editingPackage.value = pkg
  Object.assign(form, {
    name: pkg.name,
    credits: pkg.credits,
    price: pkg.price,
    validity_days: pkg.validity_days,
    is_active: pkg.is_active,
    description: '',
  })
  formModal.value = true
}

async function doSave() {
  if (!form.name || form.credits <= 0 || form.price <= 0) {
    ui.toast.error('Vui lòng nhập đầy đủ thông tin hợp lệ')
    return
  }
  isSaving.value = true
  try {
    const dto = {
      name: form.name,
      credits: form.credits,
      price: form.price,
      validity_days: form.validity_days,
      is_active: form.is_active,
    }
    if (editingPackage.value) {
      await adminService.updatePackage(editingPackage.value.id, dto)
      ui.toast.success('Đã cập nhật gói lượt')
    } else {
      await adminService.createPackage(dto as Omit<CreditPackage, 'id' | 'sort_order'>)
      ui.toast.success('Đã tạo gói lượt mới')
    }
    formModal.value = false
    loadPackages()
  } catch {
    ui.toast.error('Lưu thất bại')
  } finally {
    isSaving.value = false
  }
}

async function toggleActive(pkg: CreditPackage) {
  try {
    await adminService.updatePackage(pkg.id, { is_active: pkg.is_active ? 0 : 1 })
    ui.toast.success('Đã cập nhật trạng thái')
    loadPackages()
  } catch {
    ui.toast.error('Thao tác thất bại')
  }
}

function openDelete(pkg: CreditPackage) {
  deleteTarget.value = pkg
  deleteModal.value = true
}

async function doDelete() {
  if (!deleteTarget.value) return
  isDeleting.value = true
  try {
    await adminService.deletePackage(deleteTarget.value.id)
    ui.toast.success('Đã xoá gói lượt')
    deleteModal.value = false
    loadPackages()
  } catch {
    ui.toast.error('Xoá thất bại')
  } finally {
    isDeleting.value = false
  }
}

onMounted(loadPackages)
</script>

<template>
  <div>
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="font-serif text-3xl text-gold mb-1">Gói lượt</h1>
        <p class="text-text-muted text-sm">Quản lý các gói mua lượt</p>
      </div>
      <AppButton variant="primary" @click="openCreate">+ Thêm gói</AppButton>
    </div>

    <div v-if="isLoading" class="flex justify-center py-20">
      <AppSpinner size="lg" />
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
      <div
        v-for="pkg in packages"
        :key="pkg.id"
        class="bg-bg-card border border-border-subtle rounded-2xl p-5 shadow-card flex flex-col"
        :class="{ 'opacity-60': !pkg.is_active }"
      >
        <div class="flex items-start justify-between mb-3">
          <h3 class="text-text-primary font-semibold text-base">{{ pkg.name }}</h3>
          <AppBadge :variant="pkg.is_active ? 'active' : 'default'" size="sm">
            {{ pkg.is_active ? 'Hiện' : 'Ẩn' }}
          </AppBadge>
        </div>

        <div class="flex-1 space-y-2 mb-4">
          <div class="flex justify-between text-sm">
            <span class="text-text-muted">Số lượt:</span>
            <span class="text-gold font-semibold">{{ pkg.credits }} lượt</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-text-muted">Giá:</span>
            <span class="text-text-primary font-semibold">{{ formatCurrency(pkg.price) }}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-text-muted">Thời hạn:</span>
            <span class="text-text-secondary">{{ pkg.validity_days }} ngày</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-text-muted">Thứ tự:</span>
            <span class="text-text-secondary">#{{ pkg.sort_order }}</span>
          </div>
        </div>

        <div class="flex gap-2 pt-3 border-t border-border-subtle">
          <AppButton variant="ghost" size="sm" class="flex-1" @click="toggleActive(pkg)">
            {{ pkg.is_active ? 'Ẩn' : 'Hiện' }}
          </AppButton>
          <AppButton variant="secondary" size="sm" class="flex-1" @click="openEdit(pkg)">Sửa</AppButton>
          <AppButton variant="danger" size="sm" @click="openDelete(pkg)">🗑</AppButton>
        </div>
      </div>

      <div v-if="packages.length === 0" class="col-span-full text-center py-12 text-text-muted">
        Chưa có gói lượt nào
      </div>
    </div>

    <!-- Form modal -->
    <AppModal :show="formModal" :title="editingPackage ? 'Sửa gói lượt' : 'Thêm gói lượt'" @close="formModal = false">
      <div class="space-y-4">
        <div>
          <label class="block text-sm text-text-secondary mb-1.5">Tên gói <span class="text-red-400">*</span></label>
          <input
            v-model="form.name"
            placeholder="VD: Gói Cơ Bản"
            class="w-full bg-bg-elevated border border-border-subtle rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder-text-muted focus:border-mystic focus:outline-none transition-colors"
          />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm text-text-secondary mb-1.5">Số lượt <span class="text-red-400">*</span></label>
            <input
              v-model.number="form.credits"
              type="number"
              min="1"
              placeholder="10"
              class="w-full bg-bg-elevated border border-border-subtle rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder-text-muted focus:border-mystic focus:outline-none transition-colors"
            />
          </div>
          <div>
            <label class="block text-sm text-text-secondary mb-1.5">Giá (VND) <span class="text-red-400">*</span></label>
            <input
              v-model.number="form.price"
              type="number"
              min="1000"
              placeholder="50000"
              class="w-full bg-bg-elevated border border-border-subtle rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder-text-muted focus:border-mystic focus:outline-none transition-colors"
            />
          </div>
        </div>
        <div>
          <label class="block text-sm text-text-secondary mb-1.5">Thời hạn (ngày)</label>
          <input
            v-model.number="form.validity_days"
            type="number"
            min="1"
            placeholder="30"
            class="w-full bg-bg-elevated border border-border-subtle rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder-text-muted focus:border-mystic focus:outline-none transition-colors"
          />
        </div>
        <div class="flex items-center gap-3">
          <button
            type="button"
            @click="form.is_active = form.is_active ? 0 : 1"
            :class="[
              'relative w-10 h-5 rounded-full transition-colors',
              form.is_active ? 'bg-mystic' : 'bg-bg-elevated border border-border-subtle'
            ]"
          >
            <span :class="['absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform', form.is_active ? 'left-5' : 'left-0.5']" />
          </button>
          <span class="text-sm text-text-secondary">Hiển thị gói này</span>
        </div>
        <div class="flex justify-end gap-3 pt-2">
          <AppButton variant="ghost" @click="formModal = false">Huỷ</AppButton>
          <AppButton variant="primary" :loading="isSaving" @click="doSave">
            {{ editingPackage ? 'Lưu thay đổi' : 'Tạo gói' }}
          </AppButton>
        </div>
      </div>
    </AppModal>

    <!-- Delete modal -->
    <AppModal :show="deleteModal" title="Xoá gói lượt" size="sm" @close="deleteModal = false">
      <p class="text-text-secondary mb-5">
        Bạn có chắc muốn xoá gói <strong class="text-gold">{{ deleteTarget?.name }}</strong>?
      </p>
      <div class="flex justify-end gap-3">
        <AppButton variant="ghost" @click="deleteModal = false">Huỷ</AppButton>
        <AppButton variant="danger" :loading="isDeleting" @click="doDelete">Xoá</AppButton>
      </div>
    </AppModal>
  </div>
</template>
