<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useUIStore } from '@/stores/ui'
import { creditService } from '@/services/credit.service'
import { type AxiosError } from 'axios'
import type { CreditPackage, CreateOrderResponse } from '@/types/subscription.types'
import AppButton from '@/components/common/AppButton.vue'
import AppBadge from '@/components/common/AppBadge.vue'
import AppSpinner from '@/components/common/AppSpinner.vue'
import AppModal from '@/components/common/AppModal.vue'
import { formatCurrency, timeUntil } from '@/utils/format'

const auth = useAuthStore()
const ui = useUIStore()

const packages = ref<CreditPackage[]>([])
const isLoading = ref(true)
const ordering = ref(false)
const selectedPkg = ref<CreditPackage | null>(null)

// QR Modal state
const showQR = ref(false)
const qrData = ref<CreateOrderResponse | null>(null)
const pollResult = ref<{ paid: boolean } | null>(null)
const expiredQr = ref(false)
const pollTimer = ref<ReturnType<typeof setInterval> | null>(null)
const countdown = ref('')
const countdownTimer = ref<ReturnType<typeof setInterval> | null>(null)

onMounted(async () => {
  try {
    packages.value = await creditService.getPackages()
  } catch {
    ui.toast.error('Không thể tải danh sách gói lượt')
  } finally {
    isLoading.value = false
  }
})

onUnmounted(() => {
  stopPolling()
  stopCountdown()
})

const popularIndex = computed(() => {
  const sorted = [...packages.value].sort((a, b) => b.credits - a.credits)
  return packages.value.indexOf(sorted[1] ?? sorted[0])
})

async function selectPackage(pkg: CreditPackage) {
  if (ordering.value) return
  selectedPkg.value = pkg
  ordering.value = true
  try {
    const data = await creditService.createOrder(pkg.id)
    qrData.value = data
    showQR.value = true
    startPolling(data.order_id)
    startCountdown(data.qr_expires_at)
  } catch (err) {
    const e = err as AxiosError<{ error?: { message?: string } }>
    ui.toast.error(e.response?.data?.error?.message ?? 'Không thể tạo đơn hàng')
  } finally {
    ordering.value = false
  }
}

function startPolling(orderId: number) {
  stopPolling()
  pollTimer.value = setInterval(async () => {
    try {
      const res = await creditService.pollOrder(orderId)
      if (res.paid) {
        stopPolling()
        stopCountdown()
        pollResult.value = { paid: true }
        await auth.fetchMe()
        ui.toast.success(`🎉 Thanh toán thành công! Đã cộng ${qrData.value?.credits} lượt`)
      } else if (res.status === 'expired' || res.status === 'failed') {
        stopPolling()
        stopCountdown()
        expiredQr.value = true
      }
    } catch { /* ignore */ }
  }, 10000)
}

function stopPolling() {
  if (pollTimer.value) { clearInterval(pollTimer.value); pollTimer.value = null }
}

function startCountdown(expiresAt: string) {
  stopCountdown()
  countdownTimer.value = setInterval(() => {
    countdown.value = timeUntil(expiresAt)
    if (countdown.value === 'Đã hết hạn') stopCountdown()
  }, 1000)
}

function stopCountdown() {
  if (countdownTimer.value) { clearInterval(countdownTimer.value); countdownTimer.value = null }
}

function closeQR() {
  showQR.value = false
  stopPolling()
  stopCountdown()
  qrData.value = null
  pollResult.value = null
  expiredQr.value = false
  selectedPkg.value = null
}
</script>

<template>
  <div class="flex flex-col flex-1">
    <div class="max-w-4xl mx-auto w-full px-4 py-10 flex-1">

      <!-- Header -->
      <div class="text-center mb-12 relative">
        <!-- Decorative glyphs -->
        <div class="flex justify-center gap-6 text-text-muted/15 text-lg select-none mb-4">
          <span class="animate-float">☽</span>
          <span class="animate-shimmer-gold">✦</span>
          <span class="animate-drift">☉</span>
          <span class="animate-float">✦</span>
          <span class="animate-shimmer-gold">☿</span>
        </div>

        <h1 class="font-serif text-3xl md:text-4xl gradient-text-gold mb-3">Mua lượt xem vận mệnh</h1>
        <p class="text-text-secondary max-w-md mx-auto text-sm leading-relaxed">
          Chọn gói phù hợp — lượt không hết, chỉ đóng băng sau 50 ngày nếu không dùng
        </p>

        <!-- Current balance -->
        <div v-if="auth.user" class="inline-flex items-center gap-2 mt-5 px-4 py-2 bg-bg-card border border-border-glow rounded-xl shadow-glow-mystic">
          <span class="text-text-muted text-sm">Số dư hiện tại:</span>
          <AppBadge :variant="auth.user.credits_status">
            ✦ {{ auth.user.credits_balance }} lượt
          </AppBadge>
          <span v-if="auth.user.credits_status === 'frozen'" class="text-xs text-amber-400">
            (đóng băng — mua thêm để giải băng)
          </span>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="isLoading" class="flex justify-center py-20">
        <AppSpinner size="lg" />
      </div>

      <!-- Packages grid -->
      <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div
          v-for="(pkg, i) in packages"
          :key="pkg.id"
          :class="[
            'relative rounded-2xl p-6 flex flex-col transition-all duration-300 cursor-pointer',
            i === popularIndex
              ? 'bg-bg-card border border-mystic shadow-glow-mystic scale-[1.03]'
              : 'bg-bg-card border border-border-subtle hover:border-border-glow hover:shadow-card hover:-translate-y-1',
          ]"
          @click="selectPackage(pkg)"
        >
          <!-- Popular gradient top bar -->
          <div v-if="i === popularIndex" class="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-gold/60 via-mystic to-neon/60" />

          <!-- Popular badge -->
          <div v-if="i === popularIndex" class="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
            <span class="px-3 py-1 bg-gradient-to-r from-mystic to-neon text-white text-xs font-semibold rounded-full shadow-glow-mystic">
              ✦ Phổ biến nhất
            </span>
          </div>

          <!-- Package content -->
          <div class="mb-4">
            <h3 class="font-semibold text-text-primary mb-1">{{ pkg.name }}</h3>
            <div class="flex items-baseline gap-1 mb-1">
              <span class="font-serif text-5xl" :class="i === popularIndex ? 'gradient-text-gold' : 'text-gold'">{{ pkg.credits }}</span>
              <span class="text-text-muted text-sm">lượt</span>
            </div>
            <p class="text-xs text-text-muted">
              ~{{ Math.round(pkg.price / pkg.credits).toLocaleString('vi-VN') }}đ/lượt · Hiệu lực {{ pkg.validity_days }} ngày
            </p>
          </div>

          <div class="mt-auto">
            <div class="text-2xl font-bold text-text-primary mb-3">{{ formatCurrency(pkg.price) }}</div>
            <AppButton
              class="w-full"
              :loading="ordering && selectedPkg?.id === pkg.id"
              :variant="i === popularIndex ? 'primary' : 'secondary'"
            >
              Chọn gói này
            </AppButton>
          </div>
        </div>
      </div>

      <!-- Note box with gold left border -->
      <div class="mt-10 border-l-4 border-gold/60 bg-gold/4 rounded-r-xl pl-5 pr-5 py-4 space-y-2">
        <p class="text-xs font-semibold text-gold/70 uppercase tracking-widest mb-3">Lưu ý quan trọng</p>
        <p class="text-sm text-text-secondary flex items-start gap-2"><span class="text-emerald-400 shrink-0">✓</span> Lượt không hết — chỉ đóng băng sau 50 ngày nếu không dùng</p>
        <p class="text-sm text-text-secondary flex items-start gap-2"><span class="text-emerald-400 shrink-0">✓</span> Mua thêm bất kỳ gói → tự động giải băng + cộng dồn + gia hạn 50 ngày</p>
        <p class="text-sm text-text-secondary flex items-start gap-2"><span class="text-emerald-400 shrink-0">✓</span> Xem lại kết quả cũ trong lịch sử không tốn lượt</p>
        <p class="text-sm text-text-secondary flex items-start gap-2"><span class="text-emerald-400 shrink-0">✓</span> Thanh toán QR tự động xác nhận trong 1–2 phút sau khi chuyển khoản</p>
      </div>
    </div>

    <!-- QR Payment Modal -->
    <AppModal :show="showQR" title="Thanh toán QR" @close="closeQR" size="lg">
      <!-- Success state -->
      <div v-if="pollResult?.paid" class="text-center py-8">
        <div class="text-6xl mb-4">🎉</div>
        <h3 class="text-xl font-semibold text-emerald-400 mb-2">Thanh toán thành công!</h3>
        <p class="text-text-secondary text-sm mb-6">
          Đã cộng <span class="text-gold font-bold font-serif text-xl">{{ qrData?.credits }}</span> lượt vào tài khoản của bạn.
        </p>
        <AppButton @click="closeQR">Đóng</AppButton>
      </div>

      <!-- Expired / failed state -->
      <div v-else-if="expiredQr" class="text-center py-8">
        <div class="text-5xl mb-4">⏳</div>
        <h3 class="text-lg font-semibold text-amber-400 mb-2">QR đã hết hạn</h3>
        <p class="text-text-secondary text-sm mb-6">Vui lòng đóng và chọn lại gói để tạo đơn mới.</p>
        <AppButton variant="secondary" @click="closeQR">Đóng</AppButton>
      </div>

      <!-- QR state: 2-column layout -->
      <div v-else-if="qrData" class="flex flex-col sm:flex-row gap-5">
        <!-- Left: QR image -->
        <div class="flex-shrink-0 w-full sm:w-52">
          <div class="relative">
            <img
              v-if="qrData.qr_data_url"
              :src="qrData.qr_data_url"
              alt="QR thanh toán"
              class="w-full rounded-xl border border-border-subtle"
            />
            <img
              v-else-if="qrData.qr_url"
              :src="qrData.qr_url"
              alt="QR thanh toán"
              class="w-full rounded-xl border border-border-subtle"
            />
          </div>
          <!-- Countdown under QR -->
          <div class="text-center mt-3">
            <p class="text-xs text-text-muted">QR hết hạn sau</p>
            <p class="text-base font-mono font-bold text-amber-400">{{ countdown }}</p>
          </div>
        </div>

        <!-- Right: info + status -->
        <div class="flex-1 flex flex-col gap-3">
          <!-- Order summary -->
          <div class="bg-bg-surface rounded-xl p-3 space-y-1.5 text-sm">
            <div class="flex justify-between">
              <span class="text-text-muted">Gói:</span>
              <span class="text-text-primary font-medium">{{ selectedPkg?.name }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-text-muted">Số lượt:</span>
              <span class="text-text-primary">{{ qrData.credits }} lượt</span>
            </div>
            <div class="flex justify-between border-t border-border-subtle pt-1.5 mt-1">
              <span class="text-text-muted">Số tiền:</span>
              <span class="text-gold font-bold text-base">{{ formatCurrency(qrData.amount) }}</span>
            </div>
          </div>

          <!-- Bank info -->
          <div class="bg-bg-surface rounded-xl p-3 space-y-1.5 text-sm">
            <div class="flex justify-between">
              <span class="text-text-muted">Ngân hàng:</span>
              <span class="text-text-primary font-medium">{{ qrData.bank_name }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-text-muted">Số TK:</span>
              <span class="text-text-primary font-mono">{{ qrData.bank_number }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-text-muted">Chủ TK:</span>
              <span class="text-text-primary">{{ qrData.bank_account_holder }}</span>
            </div>
          </div>

          <!-- Transfer content — gold highlight box -->
          <div class="border-l-4 border-gold/70 bg-gold/6 rounded-r-xl pl-4 pr-3 py-3">
            <p class="text-xs text-text-muted mb-1.5 uppercase tracking-wider">Nội dung chuyển khoản</p>
            <p class="text-gold font-mono font-bold text-sm tracking-wide">{{ qrData.topup_code }}</p>
          </div>

          <!-- Status -->
          <div class="flex items-center gap-2 text-xs text-text-muted">
            <AppSpinner size="sm" />
            Đang chờ xác nhận — kiểm tra mỗi 10 giây
          </div>

          <p class="text-xs text-amber-400/80">
            ⚠ Ghi đúng nội dung CK để hệ thống xác nhận tự động. Lượt được cộng trong 1–2 phút.
          </p>
        </div>
      </div>
    </AppModal>

  </div>
</template>
