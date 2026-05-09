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
      <div v-if="sent" class="backdrop-blur-md bg-bg-card/80 border border-emerald-500/30 rounded-2xl p-8 text-center shadow-card">
        <div class="text-5xl mb-4">📬</div>
        <h2 class="text-xl font-semibold text-text-primary mb-2">Đã gửi email!</h2>
        <p class="text-text-secondary text-sm mb-6">
          Kiểm tra hộp thư <strong class="text-text-primary">{{ email }}</strong> và bấm vào link đặt lại mật khẩu.<br/>
          Link có hiệu lực trong 1 giờ.
        </p>
        <RouterLink to="/login">
          <AppButton variant="secondary">Quay lại đăng nhập</AppButton>
        </RouterLink>
      </div>

      <!-- Form -->
      <div v-else class="backdrop-blur-md bg-bg-card/80 border border-border-glow rounded-2xl p-6 shadow-glow-mystic">
        <h1 class="text-xl font-semibold text-text-primary mb-2">Quên mật khẩu</h1>
        <p class="text-text-secondary text-sm mb-6">Nhập email để nhận link đặt lại mật khẩu</p>

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
          <RouterLink to="/login" class="text-mystic-glow hover:text-gold transition-colors">
            ← Quay lại đăng nhập
          </RouterLink>
        </p>
      </div>
    </div>
  </div>
</template>
