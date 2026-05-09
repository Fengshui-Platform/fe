<script setup lang="ts">
import { ref, reactive } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useUIStore } from '@/stores/ui'
import { authService } from '@/services/auth.service'
import { type AxiosError } from 'axios'
import AppButton from '@/components/common/AppButton.vue'
import AppInput from '@/components/common/AppInput.vue'

const auth = useAuthStore()
const ui = useUIStore()

const form = reactive({ full_name: '', email: '', password: '', phone: '' })
const errors = reactive({ full_name: '', email: '', password: '', general: '' })
const isLoading = ref(false)
const registered = ref(false)
const showPassword = ref(false)

function validate() {
  errors.full_name = form.full_name.trim() ? '' : 'Vui lòng nhập họ tên'
  errors.email     = /\S+@\S+\.\S+/.test(form.email) ? '' : 'Email không hợp lệ'
  errors.password  = form.password.length >= 6 ? '' : 'Mật khẩu tối thiểu 6 ký tự'
  return !errors.full_name && !errors.email && !errors.password
}

async function submit() {
  if (!validate()) return
  errors.general = ''
  isLoading.value = true
  try {
    const user = await authService.register({
      full_name: form.full_name.trim(),
      email: form.email,
      password: form.password,
      phone: form.phone || undefined,
    })
    auth.setUser(user)
    registered.value = true
  } catch (err) {
    const e = err as AxiosError<{ error?: { message?: string } }>
    errors.general = e.response?.data?.error?.message ?? 'Đăng ký thất bại'
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

      <!-- Success state -->
      <div v-if="registered" class="backdrop-blur-md bg-bg-card/80 border border-emerald-500/30 rounded-2xl p-8 text-center shadow-card">
        <div class="text-5xl mb-4">📬</div>
        <h2 class="text-xl font-semibold text-text-primary mb-2">Đăng ký thành công!</h2>
        <p class="text-text-secondary text-sm mb-6">
          Chúng tôi đã gửi email xác thực tới <strong class="text-text-primary">{{ form.email }}</strong>.<br/>
          Vui lòng kiểm tra hộp thư và bấm vào link xác thực.
        </p>
        <RouterLink to="/">
          <AppButton>Về trang chủ</AppButton>
        </RouterLink>
      </div>

      <!-- Form -->
      <div v-else class="backdrop-blur-md bg-bg-card/80 border border-border-glow rounded-2xl p-6 shadow-glow-mystic">
        <h1 class="text-xl font-semibold text-text-primary mb-6">Tạo tài khoản</h1>

        <form @submit.prevent="submit" class="space-y-4">
          <div v-if="errors.general" class="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-400">
            {{ errors.general }}
          </div>

          <AppInput v-model="form.full_name" label="Họ và tên" placeholder="Nguyễn Văn An" :error="errors.full_name" required />
          <AppInput v-model="form.email" label="Email" type="email" placeholder="your@email.com" :error="errors.email" required />
          <AppInput v-model="form.phone" label="Số điện thoại (tùy chọn)" type="tel" placeholder="0901234567" />

          <div class="space-y-1.5">
            <label class="block text-sm font-medium text-text-secondary">Mật khẩu <span class="text-gold">*</span></label>
            <div class="relative">
              <input
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="Tối thiểu 6 ký tự"
                class="w-full bg-bg-elevated border rounded-lg px-4 py-2.5 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 transition-colors pr-10"
                :class="errors.password ? 'border-red-500/60 focus:border-red-500 focus:ring-red-500/30' : 'border-border-subtle focus:border-mystic focus:ring-mystic/30'"
              />
              <button type="button" @click="showPassword = !showPassword" class="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted">
                {{ showPassword ? '🙈' : '👁' }}
              </button>
            </div>
            <p v-if="errors.password" class="text-xs text-red-400">⚠ {{ errors.password }}</p>
          </div>

          <AppButton type="submit" size="lg" class="w-full" :loading="isLoading">
            Đăng ký
          </AppButton>
        </form>

        <p class="text-center text-sm text-text-muted mt-5">
          Đã có tài khoản?
          <RouterLink to="/login" class="text-mystic-glow hover:text-gold transition-colors ml-1">Đăng nhập</RouterLink>
        </p>
      </div>
    </div>
  </div>
</template>
