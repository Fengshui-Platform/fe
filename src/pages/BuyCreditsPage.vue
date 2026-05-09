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
      }
    } catch { /* ignore */ }
  }, 10000) // poll mỗi 10 giây
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
  selectedPkg.value = null
}
</script>

<template>
  <div class="flex flex-col flex-1">
    <div class="max-w-4xl mx-auto w-full px-4 py-10 flex-1">
      <!-- Header -->
      <div class="text-center mb-10">
        <h1 class="font-serif text-3xl md:text-4xl text-text-primary mb-3">Mua lượt xem phong thuỷ</h1>
        <p class="text-text-secondary">Chọn gói phù hợp — lượt không hết, chỉ đóng băng sau 50 ngày</p>

        <!-- Current balance -->
        <div v-if="auth.user" class="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-bg-card border border-border-subtle rounded-xl">
          <span class="text-text-muted text-sm">Số dư hiện tại:</span>
          <AppBadge :variant="auth.user.credits_status">
            ⚡ {{ auth.user.credits_balance }} lượt
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
      <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div
          v-for="(pkg, i) in packages"
          :key="pkg.id"
          :class="[
            'relative bg-bg-card border rounded-2xl p-6 flex flex-col transition-all duration-300 cursor-pointer',
            i === popularIndex
              ? 'border-mystic shadow-glow-mystic scale-105'
              : 'border-border-subtle hover:border-border-glow hover:shadow-card',
          ]"
          @click="selectPackage(pkg)"
        >
          <!-- Popular badge -->
          <div v-if="i === popularIndex" class="absolute -top-3 left-1/2 -translate-x-1/2">
            <span class="px-3 py-1 bg-gradient-to-r from-mystic to-neon text-white text-xs font-semibold rounded-full">
              Phổ biến nhất
            </span>
          </div>

          <h3 class="font-semibold text-text-primary mb-1">{{ pkg.name }}</h3>
          <div class="flex items-baseline gap-1 mb-1">
            <span class="font-serif text-4xl text-gold">{{ pkg.credits }}</span>
            <span class="text-text-muted text-sm">lượt</span>
          </div>
          <p class="text-xs text-text-muted mb-4">
            ~{{ Math.round(pkg.price / pkg.credits).toLocaleString('vi-VN') }}đ/lượt · Hiệu lực {{ pkg.validity_days }} ngày
          </p>

          <div class="mt-auto">
            <div class="text-2xl font-bold text-text-primary mb-3">{{ formatCurrency(pkg.price) }}</div>
            <AppButton
              class="w-full"
              :loading="ordering && selectedPkg?.id === pkg.id"
              :variant="i === popularIndex ? 'primary' : 'secondary'"
            >
              Chọn gói
            </AppButton>
          </div>
        </div>
      </div>

      <!-- Note -->
      <div class="mt-8 p-4 bg-bg-surface rounded-xl border border-border-subtle text-sm text-text-muted space-y-1">
        <p>✅ Lượt không hết — chỉ đóng băng sau 50 ngày nếu không dùng</p>
        <p>✅ Mua thêm bất kỳ gói → tự động giải băng + cộng dồn + gia hạn 50 ngày</p>
        <p>✅ Xem lại kết quả cũ trong lịch sử không tốn lượt</p>
      </div>
    </div>

    <!-- QR Payment Modal -->
    <AppModal :show="showQR" title="Thanh toán QR" @close="closeQR" size="md">
      <!-- Success state -->
      <div v-if="pollResult?.paid" class="text-center py-6">
        <div class="text-6xl mb-4">🎉</div>
        <h3 class="text-xl font-semibold text-emerald-400 mb-2">Thanh toán thành công!</h3>
        <p class="text-text-secondary text-sm mb-5">Đã cộng {{ qrData?.credits }} lượt vào tài khoản của bạn.</p>
        <AppButton @click="closeQR">Đóng</AppButton>
      </div>

      <!-- QR state -->
      <div v-else-if="qrData" class="space-y-4">
        <div class="flex items-center justify-between text-sm">
          <span class="text-text-muted">Gói:</span>
          <span class="text-text-primary font-medium">{{ selectedPkg?.name }} — {{ qrData.credits }} lượt</span>
        </div>
        <div class="flex items-center justify-between text-sm">
          <span class="text-text-muted">Số tiền:</span>
          <span class="text-gold font-bold text-lg">{{ formatCurrency(qrData.amount) }}</span>
        </div>

        <!-- QR Image -->
        <div class="flex justify-center">
          <img
            v-if="qrData.qr_data_url"
            :src="qrData.qr_data_url"
            alt="QR thanh toán"
            class="w-56 h-56 rounded-xl border border-border-subtle"
          />
          <img
            v-else-if="qrData.qr_url"
            :src="qrData.qr_url"
            alt="QR thanh toán"
            class="w-56 h-56 rounded-xl border border-border-subtle"
          />
        </div>

        <!-- Bank info -->
        <div class="bg-bg-surface rounded-xl p-4 space-y-2 text-sm">
          <div class="flex justify-between">
            <span class="text-text-muted">Ngân hàng:</span>
            <span class="text-text-primary">{{ qrData.bank_name }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-text-muted">Số tài khoản:</span>
            <span class="text-text-primary font-mono">{{ qrData.bank_number }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-text-muted">Nội dung CK:</span>
            <span class="text-gold font-mono font-semibold">{{ qrData.topup_code }}</span>
          </div>
        </div>

        <div class="text-center">
          <p class="text-xs text-text-muted mb-1">QR hết hạn sau</p>
          <p class="text-lg font-mono font-bold text-amber-400">{{ countdown }}</p>
        </div>

        <div class="flex items-center gap-2 text-xs text-text-muted justify-center">
          <AppSpinner size="sm" />
          Đang chờ xác nhận thanh toán...
        </div>

        <p class="text-xs text-text-muted text-center">
          ⚠ Ghi đúng nội dung chuyển khoản để hệ thống xác nhận tự động
        </p>
      </div>
    </AppModal>

  </div>
</template>
