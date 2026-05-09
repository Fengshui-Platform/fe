<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { authService } from '@/services/auth.service'
import AppButton from '@/components/common/AppButton.vue'
import AppSpinner from '@/components/common/AppSpinner.vue'

const route = useRoute()

const status = ref<'loading' | 'success' | 'error'>('loading')
const errorMessage = ref('')

onMounted(async () => {
  const token = (route.query.token as string) ?? ''
  if (!token) {
    status.value = 'error'
    errorMessage.value = 'Link xác thực không hợp lệ.'
    return
  }
  try {
    await authService.verifyEmail(token)
    status.value = 'success'
  } catch (err: unknown) {
    status.value = 'error'
    const e = err as { response?: { data?: { error?: { message?: string } } } }
    errorMessage.value = e.response?.data?.error?.message ?? 'Link xác thực không hợp lệ hoặc đã hết hạn.'
  }
})
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

      <!-- Loading -->
      <div v-if="status === 'loading'" class="backdrop-blur-md bg-bg-card/80 border border-border-glow rounded-2xl p-8 text-center shadow-card">
        <AppSpinner size="lg" class="mx-auto mb-4" />
        <p class="text-text-secondary">Đang xác thực email...</p>
      </div>

      <!-- Success -->
      <div v-else-if="status === 'success'" class="backdrop-blur-md bg-bg-card/80 border border-emerald-500/30 rounded-2xl p-8 text-center shadow-card">
        <div class="text-5xl mb-4">✅</div>
        <h2 class="text-xl font-semibold text-text-primary mb-2">Xác thực thành công!</h2>
        <p class="text-text-secondary text-sm mb-6">
          Email của bạn đã được xác thực. Bạn có thể đăng nhập và sử dụng đầy đủ tính năng.
        </p>
        <RouterLink to="/login">
          <AppButton>Đăng nhập ngay</AppButton>
        </RouterLink>
      </div>

      <!-- Error -->
      <div v-else class="backdrop-blur-md bg-bg-card/80 border border-red-500/30 rounded-2xl p-8 text-center shadow-card">
        <div class="text-5xl mb-4">❌</div>
        <h2 class="text-xl font-semibold text-text-primary mb-2">Xác thực thất bại</h2>
        <p class="text-text-secondary text-sm mb-6">{{ errorMessage }}</p>
        <div class="flex gap-3 justify-center">
          <RouterLink to="/login">
            <AppButton variant="secondary">Đăng nhập</AppButton>
          </RouterLink>
          <RouterLink to="/register">
            <AppButton>Đăng ký lại</AppButton>
          </RouterLink>
        </div>
      </div>
    </div>
  </div>
</template>
