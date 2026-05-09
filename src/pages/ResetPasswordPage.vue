<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { authService } from '@/services/auth.service'
import { type AxiosError } from 'axios'
import AppButton from '@/components/common/AppButton.vue'

const route = useRoute()
const router = useRouter()

const token = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)
const passwordError = ref('')
const confirmError = ref('')
const generalError = ref('')
const isLoading = ref(false)
const success = ref(false)

onMounted(() => {
  token.value = (route.query.token as string) ?? ''
  if (!token.value) {
    generalError.value = 'Link không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu link mới.'
  }
})

function validate() {
  passwordError.value = newPassword.value.length >= 6 ? '' : 'Mật khẩu tối thiểu 6 ký tự'
  confirmError.value = newPassword.value === confirmPassword.value ? '' : 'Mật khẩu xác nhận không khớp'
  return !passwordError.value && !confirmError.value
}

async function submit() {
  if (!validate()) return
  generalError.value = ''
  isLoading.value = true
  try {
    await authService.resetPassword(token.value, newPassword.value)
    success.value = true
  } catch (err) {
    const e = err as AxiosError<{ error?: { message?: string } }>
    generalError.value = e.response?.data?.error?.message ?? 'Link không hợp lệ hoặc đã hết hạn'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="bg-bg-base min-h-screen flex items-center justify-center px-4 py-12">
    <div class="absolute inset-0 pointer-events-none overflow-hidden">
      <div class="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-mystic/10 rounded-full blur-3xl" />
    </div>

    <div class="relative w-full max-w-md">
      <div class="text-center mb-8">
        <RouterLink to="/" class="inline-flex items-center gap-2">
          <span class="text-3xl">☯</span>
          <span class="font-serif text-2xl text-gold">Phong Thủy AI</span>
        </RouterLink>
      </div>

      <!-- Success -->
      <div v-if="success" class="backdrop-blur-md bg-bg-card/80 border border-emerald-500/30 rounded-2xl p-8 text-center shadow-card">
        <div class="text-5xl mb-4">✅</div>
        <h2 class="text-xl font-semibold text-text-primary mb-2">Đặt lại mật khẩu thành công!</h2>
        <p class="text-text-secondary text-sm mb-6">Bạn có thể đăng nhập bằng mật khẩu mới ngay bây giờ.</p>
        <RouterLink to="/login">
          <AppButton>Đăng nhập</AppButton>
        </RouterLink>
      </div>

      <!-- Form -->
      <div v-else class="backdrop-blur-md bg-bg-card/80 border border-border-glow rounded-2xl p-6 shadow-glow-mystic">
        <h1 class="text-xl font-semibold text-text-primary mb-2">Đặt lại mật khẩu</h1>
        <p class="text-text-secondary text-sm mb-6">Nhập mật khẩu mới của bạn</p>

        <form @submit.prevent="submit" class="space-y-4">
          <div v-if="generalError" class="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-400">
            {{ generalError }}
            <RouterLink v-if="!token" to="/forgot-password" class="block mt-2 underline text-red-300">
              Yêu cầu link mới
            </RouterLink>
          </div>

          <div v-if="token" class="space-y-4">
            <!-- New password -->
            <div class="space-y-1.5">
              <label class="block text-sm font-medium text-text-secondary">
                Mật khẩu mới <span class="text-gold">*</span>
              </label>
              <div class="relative">
                <input
                  v-model="newPassword"
                  :type="showPassword ? 'text' : 'password'"
                  placeholder="Tối thiểu 6 ký tự"
                  class="w-full bg-bg-elevated border rounded-lg px-4 py-2.5 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 transition-colors pr-10"
                  :class="passwordError ? 'border-red-500/60 focus:border-red-500 focus:ring-red-500/30' : 'border-border-subtle focus:border-mystic focus:ring-mystic/30'"
                />
                <button type="button" @click="showPassword = !showPassword" class="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted">
                  {{ showPassword ? '🙈' : '👁' }}
                </button>
              </div>
              <p v-if="passwordError" class="text-xs text-red-400">⚠ {{ passwordError }}</p>
            </div>

            <!-- Confirm password -->
            <div class="space-y-1.5">
              <label class="block text-sm font-medium text-text-secondary">
                Xác nhận mật khẩu <span class="text-gold">*</span>
              </label>
              <input
                v-model="confirmPassword"
                :type="showPassword ? 'text' : 'password'"
                placeholder="Nhập lại mật khẩu"
                class="w-full bg-bg-elevated border rounded-lg px-4 py-2.5 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 transition-colors"
                :class="confirmError ? 'border-red-500/60 focus:border-red-500 focus:ring-red-500/30' : 'border-border-subtle focus:border-mystic focus:ring-mystic/30'"
              />
              <p v-if="confirmError" class="text-xs text-red-400">⚠ {{ confirmError }}</p>
            </div>

            <AppButton type="submit" size="lg" class="w-full" :loading="isLoading" :disabled="!token">
              Đặt lại mật khẩu
            </AppButton>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
