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

function validate() {
  errors.email   = /\S+@\S+\.\S+/.test(form.email) ? '' : 'Email không hợp lệ'
  errors.password = form.password ? '' : 'Vui lòng nhập mật khẩu'
  return !errors.email && !errors.password
}

async function submit() {
  if (!validate()) return
  errors.general = ''
  isLoading.value = true
  try {
    const user = await authService.login({ email: form.email, password: form.password })
    auth.setUser(user)
    ui.toast.success('Đăng nhập thành công!')
    const redirect = (router.currentRoute.value.query.redirect as string) || '/'
    router.push(redirect)
  } catch (err) {
    const e = err as AxiosError<{ error?: { message?: string } }>
    errors.general = e.response?.data?.error?.message ?? 'Đăng nhập thất bại'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="bg-bg-base min-h-screen flex items-center justify-center px-4 py-12">
    <!-- BG effects -->
    <div class="absolute inset-0 pointer-events-none overflow-hidden">
      <div class="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-mystic/10 rounded-full blur-3xl" />
    </div>

    <div class="relative w-full max-w-md">
      <!-- Logo -->
      <div class="text-center mb-8">
        <RouterLink to="/" class="inline-flex items-center gap-2 group">
          <span class="text-3xl">☯</span>
          <span class="font-serif text-2xl text-gold">Phong Thủy AI</span>
        </RouterLink>
        <p class="text-text-muted mt-2 text-sm">Đăng nhập để khám phá vận mệnh</p>
      </div>

      <!-- Card -->
      <div class="backdrop-blur-md bg-bg-card/80 border border-border-glow rounded-2xl p-6 shadow-glow-mystic">
        <h1 class="text-xl font-semibold text-text-primary mb-6">Đăng nhập</h1>

        <form @submit.prevent="submit" class="space-y-4">
          <!-- General error -->
          <div v-if="errors.general" class="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-400">
            {{ errors.general }}
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
                class="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary"
              >
                {{ showPassword ? '🙈' : '👁' }}
              </button>
            </div>
            <p v-if="errors.password" class="text-xs text-red-400">⚠ {{ errors.password }}</p>
          </div>

          <div class="flex justify-end">
            <RouterLink to="/forgot-password" class="text-xs text-text-muted hover:text-mystic-glow transition-colors">
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
  </div>
</template>
