<script setup lang="ts">
import { ref, reactive } from 'vue'
import { RouterLink } from 'vue-router'
import { authService } from '@/services/auth.service'
import { type AxiosError } from 'axios'
import AppButton from '@/components/common/AppButton.vue'
import AppInput from '@/components/common/AppInput.vue'

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
    await authService.register({
      full_name: form.full_name.trim(),
      email: form.email,
      password: form.password,
      phone: form.phone || undefined,
    })
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
  <div class="bg-bg-base min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden">
    <!-- Background glows -->
    <div class="absolute inset-0 pointer-events-none">
      <div class="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-mystic/10 rounded-full blur-3xl" />
      <div class="absolute bottom-1/4 left-1/4 w-64 h-64 bg-gold/6 rounded-full blur-3xl" />
      <div class="absolute top-1/4 right-1/5 w-48 h-48 bg-neon/5 rounded-full blur-3xl" />
    </div>

    <!-- Floating symbols -->
    <div class="absolute inset-0 pointer-events-none overflow-hidden select-none">
      <span class="absolute top-12 left-10 text-text-muted/8 text-3xl animate-drift">☱</span>
      <span class="absolute top-20 right-10 text-text-muted/8 text-2xl animate-float">☴</span>
      <span class="absolute bottom-16 left-10 text-text-muted/6 text-3xl animate-float">☶</span>
      <span class="absolute bottom-24 right-8 text-text-muted/6 text-2xl animate-drift">☳</span>
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

      <!-- Success state -->
      <div v-if="registered" class="backdrop-blur-md bg-bg-card/85 border border-emerald-500/30 rounded-2xl shadow-card overflow-hidden">
        <div class="h-0.5 bg-gradient-to-r from-emerald-500/30 via-emerald-400 to-emerald-500/30" />
        <div class="p-8 text-center">
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
      </div>

      <!-- Form -->
      <div v-else class="backdrop-blur-md bg-bg-card/85 border border-border-glow rounded-2xl shadow-glow-mystic overflow-hidden">
        <div class="h-0.5 bg-gradient-to-r from-gold/60 via-mystic to-neon/60" />
        <div class="p-6">
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
                <button type="button" @click="showPassword = !showPassword" class="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors">
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

      <!-- Bagua footer -->
      <div class="text-center mt-6 flex justify-center gap-4 text-text-muted/20 text-sm select-none">
        <span>☰</span><span>☱</span><span>☲</span><span>☳</span><span>☴</span><span>☵</span><span>☶</span><span>☷</span>
      </div>
    </div>
  </div>
</template>
