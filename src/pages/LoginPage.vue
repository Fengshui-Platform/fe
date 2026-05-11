<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useUIStore } from '@/stores/ui'
import { authService } from '@/services/auth.service'
import { type AxiosError } from 'axios'
import AppButton from '@/components/common/AppButton.vue'
import AppInput from '@/components/common/AppInput.vue'

const router = useRouter()
const auth = useAuthStore()
const ui = useUIStore()

const form = reactive({ email: '', password: '' })
const errors = reactive({ email: '', password: '', general: '' })
const isLoading = ref(false)
const showPassword = ref(false)
const emailNotVerified = ref(false)
const resendLoading = ref(false)

function validate() {
  errors.email   = /\S+@\S+\.\S+/.test(form.email) ? '' : 'Email không hợp lệ'
  errors.password = form.password ? '' : 'Vui lòng nhập mật khẩu'
  return !errors.email && !errors.password
}

async function submit() {
  if (!validate()) return
  errors.general = ''
  emailNotVerified.value = false
  isLoading.value = true
  try {
    const user = await authService.login({ email: form.email, password: form.password })
    auth.setUser(user)
    ui.toast.success('Đăng nhập thành công!')
    const redirect = (router.currentRoute.value.query.redirect as string) || '/'
    router.push(redirect)
  } catch (err) {
    const e = err as AxiosError<{ error?: { code?: string; message?: string } }>
    const code = e.response?.data?.error?.code
    if (code === 'EMAIL_NOT_VERIFIED') {
      emailNotVerified.value = true
    } else {
      errors.general = e.response?.data?.error?.message ?? 'Đăng nhập thất bại'
    }
  } finally {
    isLoading.value = false
  }
}

async function resendVerification() {
  resendLoading.value = true
  try {
    await authService.resendVerification(form.email)
    ui.toast.success('Email xác thực đã được gửi lại!')
  } catch {
    ui.toast.error('Không thể gửi lại email, thử lại sau.')
  } finally {
    resendLoading.value = false
  }
}
</script>

<template>
  <div class="bg-bg-base min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden">
    <!-- Background glows -->
    <div class="absolute inset-0 pointer-events-none">
      <div class="absolute top-1/4 left-1/3 w-80 h-80 bg-mystic/10 rounded-full blur-3xl" />
      <div class="absolute bottom-1/3 right-1/4 w-64 h-64 bg-gold/6 rounded-full blur-3xl" />
      <div class="absolute top-2/3 left-1/5 w-48 h-48 bg-neon/5 rounded-full blur-3xl" />
    </div>

    <!-- Floating bagua symbols -->
    <div class="absolute inset-0 pointer-events-none overflow-hidden select-none">
      <span class="absolute top-16 left-8 text-text-muted/8 text-3xl animate-float">☰</span>
      <span class="absolute top-24 right-12 text-text-muted/8 text-2xl animate-drift">☷</span>
      <span class="absolute bottom-20 left-12 text-text-muted/6 text-3xl animate-float">☵</span>
      <span class="absolute bottom-28 right-8 text-text-muted/6 text-2xl animate-drift">☲</span>
      <span class="absolute top-1/2 right-6 text-text-muted/5 text-4xl animate-float">✦</span>
    </div>

    <div class="relative w-full max-w-md">
      <!-- Logo -->
      <div class="text-center mb-8">
        <RouterLink to="/" class="inline-flex flex-col items-center gap-1 group">
          <span class="text-4xl animate-shimmer-gold select-none">☯</span>
          <span class="font-serif text-lg text-gold group-hover:drop-shadow-[0_0_12px_rgba(245,200,66,0.6)] transition-all">Phong Thuỷ Tâm Đức</span>
          <span class="text-[9px] text-text-muted tracking-widest uppercase">Thiên Cơ · Tâm Đức · Huyền Mệnh</span>
        </RouterLink>
        <p class="text-text-muted mt-3 text-sm">Đăng nhập để khám phá vận mệnh</p>
      </div>

      <!-- Card -->
      <div class="backdrop-blur-md bg-bg-card/85 border border-border-glow rounded-2xl shadow-glow-mystic overflow-hidden">
        <div class="h-0.5 bg-gradient-to-r from-gold/60 via-mystic to-neon/60" />
        <div class="p-6">
          <h1 class="text-xl font-semibold text-text-primary mb-6">Đăng nhập</h1>

          <form @submit.prevent="submit" class="space-y-4">
            <!-- General error -->
            <div v-if="errors.general" class="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-400">
              {{ errors.general }}
            </div>

            <!-- Email not verified -->
            <div v-if="emailNotVerified" class="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-sm text-amber-300 space-y-2">
              <p>⚠ Email chưa được xác thực. Vui lòng kiểm tra hộp thư và bấm vào link xác thực.</p>
              <button
                type="button"
                :disabled="resendLoading"
                @click="resendVerification"
                class="text-xs underline underline-offset-2 hover:text-amber-200 disabled:opacity-50 transition-colors"
              >
                {{ resendLoading ? 'Đang gửi...' : 'Gửi lại email xác thực' }}
              </button>
            </div>

            <AppInput
              v-model="form.email"
              label="Email"
              type="email"
              placeholder="your@email.com"
              :error="errors.email"
              required
            />

            <div class="space-y-1.5">
              <label class="block text-sm font-medium text-text-secondary">
                Mật khẩu <span class="text-gold">*</span>
              </label>
              <div class="relative">
                <input
                  v-model="form.password"
                  :type="showPassword ? 'text' : 'password'"
                  placeholder="••••••••"
                  class="w-full bg-bg-elevated border rounded-lg px-4 py-2.5 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 transition-colors pr-10"
                  :class="errors.password
                    ? 'border-red-500/60 focus:border-red-500 focus:ring-red-500/30'
                    : 'border-border-subtle focus:border-mystic focus:ring-mystic/30'"
                />
                <button
                  type="button"
                  @click="showPassword = !showPassword"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
                >
                  {{ showPassword ? '🙈' : '👁' }}
                </button>
              </div>
              <p v-if="errors.password" class="text-xs text-red-400">⚠ {{ errors.password }}</p>
            </div>

            <div class="flex justify-end">
              <RouterLink to="/forgot-password" class="text-xs text-text-muted hover:text-gold transition-colors">
                Quên mật khẩu?
              </RouterLink>
            </div>

            <AppButton type="submit" size="lg" class="w-full" :loading="isLoading">
              Đăng nhập
            </AppButton>
          </form>

          <p class="text-center text-sm text-text-muted mt-5">
            Chưa có tài khoản?
            <RouterLink to="/register" class="text-mystic-glow hover:text-gold transition-colors ml-1">
              Đăng ký ngay
            </RouterLink>
          </p>
        </div>
      </div>

      <!-- Bagua footer -->
      <div class="text-center mt-6 flex justify-center gap-4 text-text-muted/20 text-sm select-none">
        <span>☰</span><span>☱</span><span>☲</span><span>☳</span><span>☴</span><span>☵</span><span>☶</span><span>☷</span>
      </div>
    </div>
  </div>
</template>
