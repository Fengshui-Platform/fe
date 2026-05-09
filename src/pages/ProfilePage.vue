<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useUIStore } from '@/stores/ui'
import { userService } from '@/services/user.service'
import { authService } from '@/services/auth.service'
import { type AxiosError } from 'axios'
import AppButton from '@/components/common/AppButton.vue'
import AppInput from '@/components/common/AppInput.vue'
import AppModal from '@/components/common/AppModal.vue'
import AppBadge from '@/components/common/AppBadge.vue'
import AppSpinner from '@/components/common/AppSpinner.vue'
import { formatDate } from '@/utils/format'

const router = useRouter()
const auth = useAuthStore()
const ui = useUIStore()

// ── Profile form ──────────────────────────────────────────────
const profileForm = reactive({
  full_name: auth.user?.full_name ?? '',
  phone: auth.user?.phone ?? '',
})
const profileErrors = reactive({ full_name: '', general: '' })
const savingProfile = ref(false)

async function saveProfile() {
  profileErrors.full_name = profileForm.full_name.trim() ? '' : 'Vui lòng nhập họ tên'
  if (profileErrors.full_name) return
  profileErrors.general = ''
  savingProfile.value = true
  try {
    const updated = await userService.updateProfile({
      full_name: profileForm.full_name.trim(),
      phone: profileForm.phone || undefined,
    })
    auth.setUser(updated)
    ui.toast.success('Đã cập nhật thông tin')
  } catch (err) {
    const e = err as AxiosError<{ error?: { message?: string } }>
    profileErrors.general = e.response?.data?.error?.message ?? 'Cập nhật thất bại'
  } finally {
    savingProfile.value = false
  }
}

// ── Change password ───────────────────────────────────────────
const pwForm = reactive({ current_password: '', new_password: '', confirm_password: '' })
const pwErrors = reactive({ current: '', new: '', confirm: '', general: '' })
const savingPw = ref(false)
const showPw = ref(false)

function validatePw() {
  pwErrors.current = pwForm.current_password ? '' : 'Vui lòng nhập mật khẩu hiện tại'
  pwErrors.new = pwForm.new_password.length >= 6 ? '' : 'Mật khẩu mới tối thiểu 6 ký tự'
  pwErrors.confirm = pwForm.new_password === pwForm.confirm_password ? '' : 'Mật khẩu xác nhận không khớp'
  return !pwErrors.current && !pwErrors.new && !pwErrors.confirm
}

async function changePassword() {
  if (!validatePw()) return
  pwErrors.general = ''
  savingPw.value = true
  try {
    await userService.changePassword({
      current_password: pwForm.current_password,
      new_password: pwForm.new_password,
    })
    pwForm.current_password = ''
    pwForm.new_password = ''
    pwForm.confirm_password = ''
    ui.toast.success('Đã đổi mật khẩu thành công')
  } catch (err) {
    const e = err as AxiosError<{ error?: { message?: string } }>
    pwErrors.general = e.response?.data?.error?.message ?? 'Đổi mật khẩu thất bại'
  } finally {
    savingPw.value = false
  }
}

// ── Avatar ────────────────────────────────────────────────────
const fileInput = ref<HTMLInputElement | null>(null)
const uploadingAvatar = ref(false)
const deletingAvatar = ref(false)

async function handleAvatarChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  if (file.size > 5 * 1024 * 1024) {
    ui.toast.error('Ảnh tối đa 5MB')
    return
  }
  uploadingAvatar.value = true
  try {
    const updated = await userService.uploadAvatar(file)
    auth.setUser(updated)
    ui.toast.success('Đã cập nhật ảnh đại diện')
  } catch (err) {
    const e = err as AxiosError<{ error?: { message?: string } }>
    ui.toast.error(e.response?.data?.error?.message ?? 'Tải ảnh thất bại')
  } finally {
    uploadingAvatar.value = false
    if (fileInput.value) fileInput.value.value = ''
  }
}

async function removeAvatar() {
  deletingAvatar.value = true
  try {
    const updated = await userService.deleteAvatar()
    auth.setUser(updated)
    ui.toast.success('Đã xóa ảnh đại diện')
  } catch {
    ui.toast.error('Xóa ảnh thất bại')
  } finally {
    deletingAvatar.value = false
  }
}

// ── Delete account ────────────────────────────────────────────
const showDeleteModal = ref(false)
const deletePassword = ref('')
const deleteError = ref('')
const deletingAccount = ref(false)

async function deleteAccount() {
  if (!deletePassword.value) {
    deleteError.value = 'Vui lòng nhập mật khẩu để xác nhận'
    return
  }
  deleteError.value = ''
  deletingAccount.value = true
  try {
    await userService.deleteAccount(deletePassword.value)
    await authService.logout().catch(() => {})
    auth.clearUser()
    ui.toast.success('Tài khoản đã bị xóa')
    router.replace({ name: 'Home' })
  } catch (err) {
    const e = err as AxiosError<{ error?: { message?: string } }>
    deleteError.value = e.response?.data?.error?.message ?? 'Xóa tài khoản thất bại'
  } finally {
    deletingAccount.value = false
  }
}
</script>

<template>
  <div class="flex flex-col flex-1">
    <div class="max-w-2xl mx-auto w-full px-4 py-10 flex-1 space-y-6">
      <h1 class="font-serif text-3xl text-text-primary">Tài khoản</h1>

      <!-- ─── Avatar & Info Card ─── -->
      <div class="bg-bg-card border border-border-subtle rounded-2xl p-6">
        <div class="flex items-center gap-5 mb-6">
          <!-- Avatar -->
          <div class="relative">
            <div class="w-20 h-20 rounded-full bg-mystic/20 border-2 border-mystic/40 overflow-hidden flex items-center justify-center">
              <img
                v-if="auth.user?.avatar_url"
                :src="auth.user.avatar_url"
                alt="avatar"
                class="w-full h-full object-cover"
              />
              <span v-else class="text-3xl">{{ auth.user?.full_name?.charAt(0)?.toUpperCase() ?? '?' }}</span>
            </div>
            <div v-if="uploadingAvatar || deletingAvatar" class="absolute inset-0 rounded-full bg-bg-base/70 flex items-center justify-center">
              <AppSpinner size="sm" />
            </div>
          </div>

          <div class="flex-1">
            <h2 class="font-semibold text-text-primary text-lg">{{ auth.user?.full_name }}</h2>
            <p class="text-text-muted text-sm">{{ auth.user?.email }}</p>
            <p class="text-text-muted text-xs mt-1">Tham gia {{ formatDate(auth.user?.created_at ?? '') }}</p>
          </div>

          <AppBadge :variant="auth.user?.credits_status ?? 'empty'">
            ⚡ {{ auth.user?.credits_balance }} lượt
          </AppBadge>
        </div>

        <!-- Avatar actions -->
        <div class="flex gap-2">
          <input
            ref="fileInput"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            class="hidden"
            @change="handleAvatarChange"
          />
          <AppButton
            size="sm"
            variant="secondary"
            :loading="uploadingAvatar"
            @click="fileInput?.click()"
          >
            Đổi ảnh
          </AppButton>
          <AppButton
            v-if="auth.user?.avatar_url"
            size="sm"
            variant="ghost"
            :loading="deletingAvatar"
            @click="removeAvatar"
          >
            Xóa ảnh
          </AppButton>
        </div>
      </div>

      <!-- ─── Edit Profile ─── -->
      <div class="bg-bg-card border border-border-subtle rounded-2xl p-6">
        <h2 class="font-semibold text-text-primary mb-5">Thông tin cá nhân</h2>

        <form @submit.prevent="saveProfile" class="space-y-4">
          <div v-if="profileErrors.general" class="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-400">
            {{ profileErrors.general }}
          </div>

          <AppInput
            v-model="profileForm.full_name"
            label="Họ và tên"
            placeholder="Nguyễn Văn An"
            :error="profileErrors.full_name"
            required
          />

          <div class="space-y-1.5">
            <label class="block text-sm font-medium text-text-secondary">Email</label>
            <input
              :value="auth.user?.email"
              disabled
              class="w-full bg-bg-surface border border-border-subtle rounded-lg px-4 py-2.5 text-text-muted cursor-not-allowed"
            />
            <p class="text-xs text-text-muted">Email không thể thay đổi</p>
          </div>

          <AppInput
            v-model="profileForm.phone"
            label="Số điện thoại (tùy chọn)"
            type="tel"
            placeholder="0901234567"
          />

          <AppButton type="submit" :loading="savingProfile">
            Lưu thay đổi
          </AppButton>
        </form>
      </div>

      <!-- ─── Change Password ─── -->
      <div class="bg-bg-card border border-border-subtle rounded-2xl p-6">
        <h2 class="font-semibold text-text-primary mb-5">Đổi mật khẩu</h2>

        <form @submit.prevent="changePassword" class="space-y-4">
          <div v-if="pwErrors.general" class="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-400">
            {{ pwErrors.general }}
          </div>

          <!-- Current password -->
          <div class="space-y-1.5">
            <label class="block text-sm font-medium text-text-secondary">Mật khẩu hiện tại <span class="text-gold">*</span></label>
            <div class="relative">
              <input
                v-model="pwForm.current_password"
                :type="showPw ? 'text' : 'password'"
                placeholder="••••••••"
                class="w-full bg-bg-elevated border rounded-lg px-4 py-2.5 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 transition-colors pr-10"
                :class="pwErrors.current ? 'border-red-500/60 focus:border-red-500 focus:ring-red-500/30' : 'border-border-subtle focus:border-mystic focus:ring-mystic/30'"
              />
              <button type="button" @click="showPw = !showPw" class="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted">
                {{ showPw ? '🙈' : '👁' }}
              </button>
            </div>
            <p v-if="pwErrors.current" class="text-xs text-red-400">⚠ {{ pwErrors.current }}</p>
          </div>

          <!-- New password -->
          <div class="space-y-1.5">
            <label class="block text-sm font-medium text-text-secondary">Mật khẩu mới <span class="text-gold">*</span></label>
            <input
              v-model="pwForm.new_password"
              :type="showPw ? 'text' : 'password'"
              placeholder="Tối thiểu 6 ký tự"
              class="w-full bg-bg-elevated border rounded-lg px-4 py-2.5 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 transition-colors"
              :class="pwErrors.new ? 'border-red-500/60 focus:border-red-500 focus:ring-red-500/30' : 'border-border-subtle focus:border-mystic focus:ring-mystic/30'"
            />
            <p v-if="pwErrors.new" class="text-xs text-red-400">⚠ {{ pwErrors.new }}</p>
          </div>

          <!-- Confirm password -->
          <div class="space-y-1.5">
            <label class="block text-sm font-medium text-text-secondary">Xác nhận mật khẩu mới <span class="text-gold">*</span></label>
            <input
              v-model="pwForm.confirm_password"
              :type="showPw ? 'text' : 'password'"
              placeholder="Nhập lại mật khẩu mới"
              class="w-full bg-bg-elevated border rounded-lg px-4 py-2.5 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 transition-colors"
              :class="pwErrors.confirm ? 'border-red-500/60 focus:border-red-500 focus:ring-red-500/30' : 'border-border-subtle focus:border-mystic focus:ring-mystic/30'"
            />
            <p v-if="pwErrors.confirm" class="text-xs text-red-400">⚠ {{ pwErrors.confirm }}</p>
          </div>

          <AppButton type="submit" :loading="savingPw">
            Đổi mật khẩu
          </AppButton>
        </form>
      </div>

      <!-- ─── Credits Info ─── -->
      <div class="bg-bg-card border border-border-subtle rounded-2xl p-6">
        <h2 class="font-semibold text-text-primary mb-4">Số dư lượt</h2>
        <div class="flex items-center justify-between">
          <div>
            <p class="text-3xl font-serif text-gold">{{ auth.user?.credits_balance }}</p>
            <p class="text-text-muted text-sm mt-0.5">lượt còn lại</p>
            <p v-if="auth.user?.credits_status === 'frozen'" class="text-amber-400 text-xs mt-1">
              ⚠ Đang đóng băng — mua thêm để giải băng
            </p>
            <p v-else-if="auth.user?.credits_expires_at" class="text-text-muted text-xs mt-1">
              Hết hạn: {{ formatDate(auth.user.credits_expires_at) }}
            </p>
          </div>
          <RouterLink to="/buy-credits">
            <AppButton size="sm">Mua thêm lượt</AppButton>
          </RouterLink>
        </div>
      </div>

      <!-- ─── Danger Zone ─── -->
      <div class="bg-bg-card border border-red-500/20 rounded-2xl p-6">
        <h2 class="font-semibold text-red-400 mb-2">Vùng nguy hiểm</h2>
        <p class="text-text-muted text-sm mb-4">Xóa tài khoản là hành động không thể hoàn tác. Tất cả dữ liệu của bạn sẽ bị xóa.</p>
        <AppButton variant="danger" size="sm" @click="showDeleteModal = true">
          Xóa tài khoản
        </AppButton>
      </div>
    </div>

    <!-- Delete Account Modal -->
    <AppModal :show="showDeleteModal" title="Xác nhận xóa tài khoản" size="sm" @close="showDeleteModal = false; deletePassword = ''; deleteError = ''">
      <div class="space-y-4">
        <div class="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-300">
          ⚠ Hành động này không thể hoàn tác. Tất cả lịch sử xem và lượt còn lại sẽ bị mất vĩnh viễn.
        </div>

        <div v-if="deleteError" class="text-sm text-red-400">{{ deleteError }}</div>

        <div class="space-y-1.5">
          <label class="block text-sm font-medium text-text-secondary">Nhập mật khẩu để xác nhận <span class="text-red-400">*</span></label>
          <input
            v-model="deletePassword"
            type="password"
            placeholder="••••••••"
            class="w-full bg-bg-elevated border border-red-500/40 rounded-lg px-4 py-2.5 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-red-500/30 focus:border-red-500 transition-colors"
          />
        </div>

        <div class="flex gap-3 justify-end">
          <AppButton variant="secondary" @click="showDeleteModal = false; deletePassword = ''; deleteError = ''">
            Hủy
          </AppButton>
          <AppButton variant="danger" :loading="deletingAccount" @click="deleteAccount">
            Xóa tài khoản
          </AppButton>
        </div>
      </div>
    </AppModal>

  </div>
</template>
