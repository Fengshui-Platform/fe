<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { adminService } from '@/services/admin.service'
import { useUIStore } from '@/stores/ui'
import AppSpinner from '@/components/common/AppSpinner.vue'
import AppButton from '@/components/common/AppButton.vue'

const ui = useUIStore()

// Metadata defined on the frontend — backend only stores key/value
const SETTINGS_META: Record<string, { label: string; description: string; type: 'number' | 'boolean' | 'text' }> = {
  credit_validity_days:  { label: 'Thời hạn lượt (ngày)',      description: 'Số ngày lượt còn hiệu lực kể từ ngày mua',           type: 'number' },
  free_readings_per_day: { label: 'Lượt xem miễn phí / ngày',  description: 'Số lần xem bói miễn phí tối đa theo địa chỉ IP',    type: 'number' },
  maintenance_mode:      { label: 'Chế độ bảo trì',            description: 'Khi bật, toàn bộ tính năng xem bói sẽ bị vô hiệu',  type: 'boolean' },
}

const isLoading = ref(false)
const isSaving = ref(false)
const values = ref<Record<string, string>>({})

async function loadSettings() {
  isLoading.value = true
  try {
    values.value = await adminService.getSettings()
  } catch {
    ui.toast.error('Không thể tải cài đặt')
  } finally {
    isLoading.value = false
  }
}

async function saveSettings() {
  isSaving.value = true
  try {
    await adminService.updateSettings(values.value)
    ui.toast.success('Đã lưu cài đặt thành công')
  } catch {
    ui.toast.error('Lưu cài đặt thất bại')
  } finally {
    isSaving.value = false
  }
}

const settingKeys = Object.keys(SETTINGS_META)

onMounted(loadSettings)
</script>

<template>
  <div>
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="font-serif text-3xl text-gold mb-1">Cài đặt hệ thống</h1>
        <p class="text-text-muted text-sm">Cấu hình chung của nền tảng</p>
      </div>
      <AppButton variant="primary" :loading="isSaving" @click="saveSettings">
        💾 Lưu tất cả
      </AppButton>
    </div>

    <div v-if="isLoading" class="flex justify-center py-20">
      <AppSpinner size="lg" />
    </div>

    <div v-else class="space-y-4">
      <div
        v-for="key in settingKeys"
        :key="key"
        class="bg-bg-card border border-border-subtle rounded-2xl p-5 shadow-card"
      >
        <div class="flex items-center justify-between gap-6">
          <div class="flex-1">
            <p class="text-sm font-medium text-text-primary mb-0.5">{{ SETTINGS_META[key].label }}</p>
            <p class="text-xs text-text-muted">{{ SETTINGS_META[key].description }}</p>
          </div>

          <!-- Boolean toggle -->
          <template v-if="SETTINGS_META[key].type === 'boolean'">
            <button
              type="button"
              :class="[
                'relative w-11 h-6 rounded-full transition-colors shrink-0',
                values[key] === '1' || values[key] === 'true' ? 'bg-mystic' : 'bg-bg-elevated border border-border-subtle'
              ]"
              @click="values[key] = (values[key] === '1' || values[key] === 'true') ? '0' : '1'"
            >
              <span
                :class="[
                  'absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform',
                  values[key] === '1' || values[key] === 'true' ? 'left-6' : 'left-1'
                ]"
              />
            </button>
          </template>

          <!-- Number input -->
          <input
            v-else
            v-model="values[key]"
            :type="SETTINGS_META[key].type === 'number' ? 'number' : 'text'"
            min="0"
            class="w-28 bg-bg-elevated border border-border-subtle rounded-xl px-3 py-2 text-sm text-text-primary text-center focus:border-mystic focus:outline-none transition-colors shrink-0"
          />
        </div>
      </div>

      <!-- Extra keys from DB not in meta -->
      <template v-for="(val, key) in values" :key="key">
        <div
          v-if="!SETTINGS_META[key]"
          class="bg-bg-card border border-border-subtle rounded-2xl p-5 shadow-card"
        >
          <div class="flex items-center justify-between gap-6">
            <div class="flex-1">
              <p class="text-sm font-medium text-text-primary font-mono">{{ key }}</p>
            </div>
            <input
              v-model="values[key]"
              class="w-40 bg-bg-elevated border border-border-subtle rounded-xl px-3 py-2 text-sm text-text-primary focus:border-mystic focus:outline-none transition-colors"
            />
          </div>
        </div>
      </template>

      <div class="flex justify-end pt-2">
        <AppButton variant="primary" size="lg" :loading="isSaving" @click="saveSettings">
          💾 Lưu tất cả cài đặt
        </AppButton>
      </div>
    </div>
  </div>
</template>
