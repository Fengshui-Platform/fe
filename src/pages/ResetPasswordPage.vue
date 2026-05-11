<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { authService } from '@/services/auth.service'
import { type AxiosError } from 'axios'
import AppButton from '@/components/common/AppButton.vue'

const route = useRoute()

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
  <div class="bg-bg-base min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden">
    <!-- Background glows -->
    <div class="absolute inset-0 pointer-events-none">
      <div class="absolute top-1/3 left-1/2 -translate-x-1/2 w-80 h-80 bg-mystic/10 rounded-full blur-3xl" />
      <div class="absolute bottom-1/4 right-1/3 w-60 h-60 bg-gold/5 rounded-full blur-3xl" />
    </div>

    <!-- Floating symbols -->
    <div class="absolute inset-0 pointer-events-none overflow-hidden select-none">
      <span class="absolute top-16 left-8 text-text-muted/8 text-2xl animate-float">🔑</span>
      <span class="absolute bottom-20 right-10 text-text-muted/6 text-3xl animate-drift">🔐</span>
    </div>

    <div class="relative w-full max-w-md">
      <!-- Logo -->
      <div class="text-center mb-8">
        <RouterLink to="/" class="inline-flex flex-col items-center gap-1 group">
          <span class="text-4xl animate-shimmer-gold select-none">☯</span>
          <span class="font-serif text-lg text-gold group-hover:drop-shadow-[0_0_12px_rgba(245,200,66,0.6)] transition-all">Phong Thuỷ Tâm Đức</span>
          <span class="text-[9px] text-text-muted tracking-widest uppercase">Thiên Cơ · Tâm Đức · Huyền Mệnh</span>
        </RouterLink>
      </div>

      <!-- Success -->
      <div v-if="success" class="backdrop-blur-md bg-bg-card/85 border border-emerald-500/30 rounded-2xl shadow-card overflow-hidden">
        <div class="h-0.5 bg-gradient-to-r from-emerald-500/30 via-emerald-400 to-emerald-500/30" />
        <div class="p-8 text-center">
          <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-3xl mb-4">✅</div>
          <h2 class="text-xl font-semibold text-text-primary mb-2">Đặt lại mật khẩu thành công!</h2>
          <p class="text-text-secondary text-sm mb-6">Bạn có thể đăng nhập bằng mật khẩu mới ngay bây giờ.</p>
          <RouterLink to="/login">
            <AppButton>✨ Đăng nhập</AppButton>
          </RouterLink>
        </div>
      </div>

      <!-- Form -->
      <div v-else class="backdrop-blur-md bg-bg-card/85 border border-border-glow rounded-2xl shadow-glow-mystic overflow-hidden">
        <div class="h-0.5 bg-gradient-to-r from-mystic/60 via-gold to-mystic/60" />
        <div class="p-6">
          <div class="flex items-center gap-3 mb-2">
            <div class="w-9 h-9 rounded-xl bg-mystic/20 border border-mystic/40 flex items-center justify-center text-lg">🔑</div>
            <h1 class="text-xl font-semibold text-text-primary">Đặt lại mật khẩu</h1>
          </div>
          <p class="text-text-secondary text-sm mb-6 pl-12">Nhập mật khẩu mới của bạn</p>

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
                  <button type="button" @click="showPassword = !showPassword" class="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors">
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

      <!-- Bagua footer -->
      <div class="text-center mt-6 flex justify-center gap-4 text-text-muted/20 text-sm select-none">
        <span>☰</span><span>☱</span><span>☲</span><span>☳</span><span>☴</span><span>☵</span><span>☶</span><span>☷</span>
      </div>
    </div>
  </div>
</template>
