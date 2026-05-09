# fix-credits-ui

## Mục đích
Implement hoặc fix credit-related UI. Xử lý đầy đủ 3 trạng thái credits (active/frozen/empty), handle 402 API errors với error codes, update Navbar credits badge, implement QR payment modal với polling 10s, và refresh auth store sau khi thanh toán thành công. Dùng khi cần implement credit system từ đầu hoặc sửa lỗi liên quan đến credits display/flow.

## Cách dùng
`/fix-credits-ui [target]`

Ví dụ:
- `/fix-credits-ui navbar` → fix credits badge trong navbar
- `/fix-credits-ui buy-credits-page` → fix trang mua credits
- `/fix-credits-ui qr-modal` → fix QR payment modal + polling
- `/fix-credits-ui 402-handling` → fix error handling cho 402 responses
- `/fix-credits-ui all` → fix toàn bộ credits UI

## Các bước thực hiện

1. **Kiểm tra auth store** — đảm bảo có đủ computed properties
   - `hasActiveCredits`: `credits_status === 'active'`
   - `hasFrozenCredits`: `credits_status === 'frozen'`
   - `hasEmptyCredits`: `credits_status === 'empty'` hoặc `credits_balance === 0`

2. **Fix Navbar credits badge** — 3 visual states với màu khác nhau

3. **Fix BuyCreditsPage** — list packages, trigger QR modal

4. **Fix QRPaymentModal** — hiển thị QR, poll mỗi 10s dùng `usePayment` composable

5. **Fix 402 error handling** — trong store actions và pages hiển thị message phù hợp

6. **Refresh after payment** — gọi `authStore.fetchMe()` sau khi `paymentStatus === 'success'`

7. **Test 3 states** — verify UI đúng cho từng state

## 3 Credits States — Visual Reference

### State 1: ACTIVE (green/teal)
- User có credits và chưa expired
- Show: số dư credits + ngày hết hạn
- Color: emerald/teal palette
- CTA: "Mua thêm" (secondary, không urgent)

### State 2: FROZEN (amber/orange)
- Credits bị đóng băng bởi admin
- Show: badge "Đóng băng" + "Liên hệ hỗ trợ"
- Color: amber/orange palette
- CTA: link đến support, KHÔNG show buy button

### State 3: EMPTY (red)
- Credits = 0 hoặc chưa mua bao giờ
- Show: "0 credits" + CTA mua ngay
- Color: red palette
- CTA: "Mua Credits" (primary, urgent)

## Convention & Patterns

### Auth Store (đảm bảo có đủ getters):
```typescript
// fe/src/stores/auth.ts
export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)

  const isLoggedIn = computed(() => user.value !== null)

  // Ba computed cho credits status
  const hasActiveCredits = computed(() =>
    user.value?.credits_status === 'active' && (user.value?.credits_balance ?? 0) > 0
  )
  const hasFrozenCredits = computed(() =>
    user.value?.credits_status === 'frozen'
  )
  const hasEmptyCredits = computed(() =>
    user.value?.credits_status === 'empty' ||
    (!user.value?.credits_status && user.value !== null)
  )

  // Credits info helpers
  const creditsBalance = computed(() => user.value?.credits_balance ?? 0)
  const creditsExpiresAt = computed(() => user.value?.credits_expires_at ?? null)

  async function fetchMe() {
    const data = await authService.getMe()
    user.value = data
  }

  return {
    user, isLoggedIn,
    hasActiveCredits, hasFrozenCredits, hasEmptyCredits,
    creditsBalance, creditsExpiresAt,
    fetchMe,
  }
})
```

### Navbar Credits Badge — 3 states:
```vue
<!-- fe/src/components/layout/TheNavbar.vue -->
<template>
  <!-- Credits badge trong navbar -->
  <RouterLink
    v-if="authStore.isLoggedIn"
    to="/buy-credits"
    class="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-300"
    :class="creditsBadgeClasses"
  >
    <!-- Icon trạng thái -->
    <span v-if="authStore.hasFrozenCredits" class="text-xs">❄</span>
    <span v-else-if="authStore.hasEmptyCredits" class="text-xs">!</span>
    <span v-else class="w-1.5 h-1.5 rounded-full bg-emerald-400" />

    <!-- Số credits -->
    <span class="font-semibold">{{ authStore.creditsBalance }}</span>
    <span class="text-xs opacity-70">credits</span>
  </RouterLink>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

const creditsBadgeClasses = computed(() => {
  if (authStore.hasFrozenCredits) {
    return 'bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20'
  }
  if (authStore.hasEmptyCredits) {
    return 'bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 animate-pulse'
  }
  // active
  return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20'
})
</script>
```

### Credits Status Banner — dùng trong pages cần credits:
```vue
<!-- Component tái sử dụng: fe/src/components/common/CreditStatusBanner.vue -->
<template>
  <!-- ACTIVE: chỉ show nếu sắp hết hạn -->
  <div
    v-if="authStore.hasActiveCredits && isExpiringSoon"
    class="backdrop-blur-md bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-6
           flex items-center justify-between"
  >
    <div class="flex items-center gap-3">
      <span class="text-amber-400 text-lg">⚠</span>
      <div>
        <p class="text-amber-400 font-medium text-sm">Credits sắp hết hạn</p>
        <p class="text-text-muted text-xs">Hết hạn {{ formatDate(authStore.creditsExpiresAt) }}</p>
      </div>
    </div>
    <RouterLink to="/buy-credits">
      <AppButton variant="ghost" size="sm" class="text-amber-400 border-amber-400/30">
        Gia hạn
      </AppButton>
    </RouterLink>
  </div>

  <!-- FROZEN: luôn show -->
  <div
    v-else-if="authStore.hasFrozenCredits"
    class="backdrop-blur-md bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-6
           flex items-center justify-between"
  >
    <div class="flex items-center gap-3">
      <span class="text-amber-400 text-2xl">❄</span>
      <div>
        <p class="text-amber-400 font-medium">Tài khoản credits bị đóng băng</p>
        <p class="text-text-muted text-sm">Liên hệ hỗ trợ để mở khóa tài khoản</p>
      </div>
    </div>
    <a href="mailto:support@fengshui.vn">
      <AppButton variant="ghost" size="sm">Liên hệ</AppButton>
    </a>
  </div>

  <!-- EMPTY: luôn show -->
  <div
    v-else-if="authStore.hasEmptyCredits"
    class="backdrop-blur-md bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6
           flex items-center justify-between"
  >
    <div class="flex items-center gap-3">
      <span class="text-red-400 text-lg font-serif">0</span>
      <div>
        <p class="text-red-400 font-medium">Bạn chưa có credits</p>
        <p class="text-text-muted text-sm">Mua credits để trải nghiệm đầy đủ tính năng</p>
      </div>
    </div>
    <RouterLink to="/buy-credits">
      <AppButton variant="primary" size="sm">Mua ngay</AppButton>
    </RouterLink>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { format, isAfter, addDays } from 'date-fns'

const authStore = useAuthStore()

const isExpiringSoon = computed(() => {
  if (!authStore.creditsExpiresAt) return false
  const expiresAt = new Date(authStore.creditsExpiresAt)
  const threeDaysFromNow = addDays(new Date(), 3)
  return isAfter(threeDaysFromNow, expiresAt)
})

function formatDate(dateStr: string | null): string {
  if (!dateStr) return ''
  return format(new Date(dateStr), 'dd/MM/yyyy')
}
</script>
```

### 402 Error Handling trong store:
```typescript
// fe/src/stores/reading.ts — xử lý 402 khi submit reading
import { isApiError } from '@/types/api.types'

async function submitReading(module: ReadingModule, payload: Record<string, unknown>) {
  try {
    isSubmitting.value = true
    error.value = null
    const result = await readingService.submitReading(module, payload)
    currentResult.value = result
    return result
  } catch (err: unknown) {
    if (isApiError(err) && err.response.status === 402) {
      const errorCode = err.response.data?.error_code

      if (errorCode === 'CREDITS_FROZEN') {
        error.value = 'Tài khoản credits của bạn đang bị đóng băng. Vui lòng liên hệ hỗ trợ.'
        creditError.value = 'frozen'
      } else {
        // NO_CREDITS hoặc thiếu credits
        error.value = 'Bạn không đủ credits để thực hiện. Hãy mua thêm credits.'
        creditError.value = 'empty'
      }
    } else {
      error.value = err instanceof Error ? err.message : 'Có lỗi xảy ra'
    }
    throw err
  } finally {
    isSubmitting.value = false
  }
}
```

### QRPaymentModal với polling:
```vue
<!-- fe/src/components/payment/QRPaymentModal.vue -->
<template>
  <AppModal v-model="modelValue" title="Thanh toán QR">
    <!-- Step 1: Chờ tạo order -->
    <div v-if="isCreatingOrder" class="text-center py-8">
      <AppSpinner size="lg" class="mx-auto mb-4" />
      <p class="text-text-secondary">Đang tạo đơn hàng...</p>
    </div>

    <!-- Step 2: Show QR -->
    <div v-else-if="qrData && paymentStatus === 'pending'" class="text-center space-y-6">
      <!-- QR Code -->
      <div class="bg-white rounded-xl p-4 inline-block shadow-glow-gold">
        <img :src="qrData.qr_url" alt="QR Code" class="w-48 h-48 object-contain" />
      </div>

      <!-- Amount -->
      <div>
        <div class="text-3xl font-serif text-accent-gold">
          {{ formatCurrency(qrData.amount) }}
        </div>
        <p class="text-text-muted text-sm mt-1">{{ qrData.description }}</p>
      </div>

      <!-- Bank info -->
      <div class="backdrop-blur-md bg-bg-surface/80 border border-border-subtle rounded-lg p-4 text-left space-y-2">
        <div class="flex justify-between text-sm">
          <span class="text-text-muted">Ngân hàng</span>
          <span class="text-text-primary font-medium">{{ qrData.bank_name }}</span>
        </div>
        <div class="flex justify-between text-sm">
          <span class="text-text-muted">Số tài khoản</span>
          <span class="text-text-primary font-mono">{{ qrData.account_number }}</span>
        </div>
        <div class="flex justify-between text-sm">
          <span class="text-text-muted">Chủ tài khoản</span>
          <span class="text-text-primary">{{ qrData.account_name }}</span>
        </div>
      </div>

      <!-- Polling indicator -->
      <div class="flex items-center justify-center gap-2 text-text-muted text-sm">
        <span class="w-2 h-2 rounded-full bg-accent-neon animate-pulse" />
        Đang chờ xác nhận thanh toán (tự động kiểm tra mỗi 10 giây)
      </div>
    </div>

    <!-- Step 3: Success -->
    <div v-else-if="paymentStatus === 'success'" class="text-center py-8 space-y-4">
      <div class="text-6xl">✓</div>
      <h3 class="text-xl font-serif text-emerald-400">Thanh toán thành công!</h3>
      <p class="text-text-secondary">Credits đã được cộng vào tài khoản của bạn.</p>
      <AppButton variant="primary" @click="handleClose">Tiếp tục</AppButton>
    </div>

    <!-- Step 4: Failed -->
    <div v-else-if="paymentStatus === 'failed'" class="text-center py-8 space-y-4">
      <div class="text-5xl text-red-400">✕</div>
      <h3 class="text-xl font-serif text-red-400">Thanh toán thất bại</h3>
      <p class="text-text-secondary">Đơn hàng đã hết hạn hoặc bị hủy.</p>
      <AppButton variant="secondary" @click="handleRetry">Thử lại</AppButton>
    </div>
  </AppModal>
</template>

<script setup lang="ts">
import { watch } from 'vue'
import { usePayment } from '@/composables/usePayment'
import { formatCurrency } from '@/utils/format'
import AppModal from '@/components/common/AppModal.vue'
import AppButton from '@/components/common/AppButton.vue'
import AppSpinner from '@/components/common/AppSpinner.vue'

interface Props {
  modelValue: boolean
  packageId: string
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'success'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const { qrData, paymentStatus, isCreatingOrder, createOrder, reset } = usePayment()

// Tạo order khi modal mở
watch(() => props.modelValue, async (isOpen) => {
  if (isOpen && props.packageId) {
    await createOrder(props.packageId)
  } else if (!isOpen) {
    reset()
  }
})

// Emit success event khi payment thành công
watch(paymentStatus, (status) => {
  if (status === 'success') {
    emit('success')  // Parent sẽ refresh auth store
  }
})

function handleClose() {
  emit('update:modelValue', false)
}

function handleRetry() {
  reset()
  createOrder(props.packageId)
}
</script>
```

### BuyCreditsPage — sử dụng modal và refresh:
```vue
<!-- fe/src/pages/BuyCreditsPage.vue -->
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import { getPackages } from '@/services/credit.service'
import type { CreditPackage } from '@/types/subscription.types'
import QRPaymentModal from '@/components/payment/QRPaymentModal.vue'

const authStore = useAuthStore()
const { success } = useToast()

const packages = ref<CreditPackage[]>([])
const selectedPackageId = ref<string | null>(null)
const showQRModal = ref(false)
const isLoading = ref(false)

onMounted(async () => {
  isLoading.value = true
  packages.value = await getPackages()
  isLoading.value = false
})

function selectPackage(pkg: CreditPackage) {
  selectedPackageId.value = pkg.id
  showQRModal.value = true
}

// QUAN TRỌNG: Refresh auth store sau khi payment thành công
async function handlePaymentSuccess() {
  showQRModal.value = false
  await authStore.fetchMe()  // Cập nhật credits_balance mới
  success('Thanh toán thành công! Credits đã được cộng vào tài khoản.')
}
</script>
```

## Checklist sau khi hoàn thành

- [ ] Auth store có đủ 3 computed: `hasActiveCredits`, `hasFrozenCredits`, `hasEmptyCredits`
- [ ] Navbar badge hiển thị đúng màu cho 3 states (emerald/amber/red)
- [ ] Navbar badge `animate-pulse` khi empty state
- [ ] 402 error handler kiểm tra `error_code`: 'NO_CREDITS' vs 'CREDITS_FROZEN'
- [ ] Frozen state: KHÔNG show buy button — show "Liên hệ hỗ trợ"
- [ ] Empty state: show "Mua Credits" CTA
- [ ] QR Modal polling dùng `usePayment` composable (interval 10s)
- [ ] `usePayment.stopPolling()` được gọi khi modal đóng
- [ ] `authStore.fetchMe()` được gọi sau khi `paymentStatus === 'success'`
- [ ] QR image background là `bg-white` (QR code cần nền trắng)
- [ ] Expiry date displayed cho active credits (format `dd/MM/yyyy`)
- [ ] Credits balance là số, không phải string
- [ ] Payment failed state có "Thử lại" button
- [ ] `onUnmounted` trong `usePayment` cleanup interval (đã implement trong composable)
