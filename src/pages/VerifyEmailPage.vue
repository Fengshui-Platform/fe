<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { authService } from '@/services/auth.service'
import AppButton from '@/components/common/AppButton.vue'

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
  <div class="bg-bg-base min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden">
    <!-- Background glows -->
    <div class="absolute inset-0 pointer-events-none">
      <div class="absolute top-1/3 left-1/2 -translate-x-1/2 w-80 h-80 bg-mystic/10 rounded-full blur-3xl" />
      <div class="absolute bottom-1/4 left-1/4 w-60 h-60 bg-gold/5 rounded-full blur-3xl" />
    </div>

    <!-- Floating symbols -->
    <div class="absolute inset-0 pointer-events-none overflow-hidden select-none">
      <span class="absolute top-14 right-10 text-text-muted/8 text-3xl animate-float">✉</span>
      <span class="absolute bottom-20 left-10 text-text-muted/6 text-2xl animate-drift">✦</span>
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

      <!-- Loading -->
      <div v-if="status === 'loading'" class="backdrop-blur-md bg-bg-card/85 border border-border-glow rounded-2xl shadow-glow-mystic overflow-hidden">
        <div class="h-0.5 bg-gradient-to-r from-gold/60 via-mystic to-neon/60" />
        <div class="p-10 text-center">
          <div class="text-5xl mb-5 animate-spin-slow inline-block select-none">☯</div>
          <p class="text-text-secondary">Đang xác thực email của bạn...</p>
          <p class="text-text-muted text-xs mt-1">Vui lòng chờ trong giây lát</p>
        </div>
      </div>

      <!-- Success -->
      <div v-else-if="status === 'success'" class="backdrop-blur-md bg-bg-card/85 border border-emerald-500/30 rounded-2xl shadow-card overflow-hidden">
        <div class="h-0.5 bg-gradient-to-r from-emerald-500/30 via-emerald-400 to-emerald-500/30" />
        <div class="p-8 text-center">
          <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-3xl mb-4">✅</div>
          <h2 class="text-xl font-semibold text-text-primary mb-2">Xác thực thành công!</h2>
          <p class="text-text-secondary text-sm mb-2">
            Email của bạn đã được xác thực.
          </p>
          <p class="text-text-muted text-xs mb-6">
            Bạn có thể đăng nhập và sử dụng đầy đủ tính năng của <span class="text-gold">Phong Thuỷ Tâm Đức</span>.
          </p>
          <RouterLink to="/login">
            <AppButton>✨ Đăng nhập ngay</AppButton>
          </RouterLink>
        </div>
      </div>

      <!-- Error -->
      <div v-else class="backdrop-blur-md bg-bg-card/85 border border-red-500/30 rounded-2xl shadow-card overflow-hidden">
        <div class="h-0.5 bg-gradient-to-r from-red-500/40 via-red-400 to-red-500/40" />
        <div class="p-8 text-center">
          <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 text-3xl mb-4">❌</div>
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

      <!-- Bagua footer -->
      <div class="text-center mt-6 flex justify-center gap-4 text-text-muted/20 text-sm select-none">
        <span>☰</span><span>☱</span><span>☲</span><span>☳</span><span>☴</span><span>☵</span><span>☶</span><span>☷</span>
      </div>
    </div>
  </div>
</template>
