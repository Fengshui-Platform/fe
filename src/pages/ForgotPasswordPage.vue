<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { authService } from '@/services/auth.service'
import { type AxiosError } from 'axios'
import AppButton from '@/components/common/AppButton.vue'
import AppInput from '@/components/common/AppInput.vue'

const email = ref('')
const emailError = ref('')
const generalError = ref('')
const isLoading = ref(false)
const sent = ref(false)

async function submit() {
  emailError.value = ''
  generalError.value = ''
  if (!/\S+@\S+\.\S+/.test(email.value)) {
    emailError.value = 'Email không hợp lệ'
    return
  }
  isLoading.value = true
  try {
    await authService.forgotPassword(email.value)
    sent.value = true
  } catch (err) {
    const e = err as AxiosError<{ error?: { message?: string } }>
    generalError.value = e.response?.data?.error?.message ?? 'Có lỗi xảy ra, vui lòng thử lại'
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
      <div class="absolute bottom-1/4 right-1/4 w-60 h-60 bg-gold/5 rounded-full blur-3xl" />
    </div>

    <!-- Floating symbols -->
    <div class="absolute inset-0 pointer-events-none overflow-hidden select-none">
      <span class="absolute top-14 left-10 text-text-muted/8 text-3xl animate-float">🔐</span>
      <span class="absolute bottom-20 right-10 text-text-muted/6 text-3xl animate-drift">🔑</span>
      <span class="absolute top-1/2 left-8 text-text-muted/5 text-2xl animate-float">✦</span>
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
      <div v-if="sent" class="backdrop-blur-md bg-bg-card/85 border border-emerald-500/30 rounded-2xl shadow-card overflow-hidden">
        <div class="h-0.5 bg-gradient-to-r from-emerald-500/30 via-emerald-400 to-emerald-500/30" />
        <div class="p-8 text-center">
          <div class="text-5xl mb-4">📬</div>
          <h2 class="text-xl font-semibold text-text-primary mb-2">Đã gửi email!</h2>
          <p class="text-text-secondary text-sm mb-6">
            Kiểm tra hộp thư <strong class="text-text-primary">{{ email }}</strong><br/>
            và bấm vào link đặt lại mật khẩu.<br/>
            <span class="text-text-muted text-xs">Link có hiệu lực trong 1 giờ.</span>
          </p>
          <RouterLink to="/login">
            <AppButton variant="secondary">Quay lại đăng nhập</AppButton>
          </RouterLink>
        </div>
      </div>

      <!-- Form -->
      <div v-else class="backdrop-blur-md bg-bg-card/85 border border-border-glow rounded-2xl shadow-glow-mystic overflow-hidden">
        <div class="h-0.5 bg-gradient-to-r from-mystic/60 via-gold to-mystic/60" />
        <div class="p-6">
          <div class="flex items-center gap-3 mb-2">
            <div class="w-9 h-9 rounded-xl bg-mystic/20 border border-mystic/40 flex items-center justify-center text-lg">🔐</div>
            <h1 class="text-xl font-semibold text-text-primary">Quên mật khẩu</h1>
          </div>
          <p class="text-text-secondary text-sm mb-6 pl-12">Nhập email để nhận link đặt lại mật khẩu</p>

          <form @submit.prevent="submit" class="space-y-4">
            <div v-if="generalError" class="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-400">
              {{ generalError }}
            </div>

            <AppInput
              v-model="email"
              label="Email"
              type="email"
              placeholder="your@email.com"
              :error="emailError"
              required
            />

            <AppButton type="submit" size="lg" class="w-full" :loading="isLoading">
              Gửi link đặt lại mật khẩu
            </AppButton>
          </form>

          <p class="text-center text-sm text-text-muted mt-5">
            <RouterLink to="/login" class="text-mystic-glow hover:text-gold transition-colors inline-flex items-center gap-1">
              <span>←</span> Quay lại đăng nhập
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
