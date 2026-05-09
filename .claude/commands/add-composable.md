# add-composable

## Mục đích
Tạo một Vue composable (`useXxx.ts`) với TypeScript. Composable phải: cleanup timers/intervals trong `onUnmounted`, xử lý async với try/catch, return typed reactive state. Dùng cho logic tái sử dụng giữa nhiều components như polling, form validation, clipboard, confirmation dialogs.

## Cách dùng
`/add-composable [composableName] [--polling] [--async] [--form]`

Ví dụ:
- `/add-composable usePayment --polling` → QR payment với interval polling
- `/add-composable useConfirm` → confirmation dialog composable
- `/add-composable useClipboard --async` → clipboard với async operations
- `/add-composable useReadingForm --form` → form state management

## Các bước thực hiện

1. **Xác định composable name**
   - Tên phải bắt đầu bằng `use` (camelCase)
   - File: `fe/src/composables/[composableName].ts`
   - Nếu tên đã tồn tại, kiểm tra xem có nên extend hay tạo mới

2. **Import lifecycle hooks phù hợp**
   - `onMounted` nếu cần init khi component mount
   - `onUnmounted` — LUÔN LUÔN nếu có timer, interval, hoặc event listener
   - `onBeforeUnmount` cho cleanup cần xảy ra trước destroy

3. **Xác định state cần thiết**
   - `ref()` cho primitive values
   - `reactive()` chỉ khi có object với nhiều fields liên quan chặt chẽ
   - `computed()` cho derived values
   - Không expose implementation details ra ngoài

4. **Implement cleanup pattern**
   - Lưu reference của interval/timer: `let intervalId: ReturnType<typeof setInterval> | null = null`
   - Trong `onUnmounted`: `if (intervalId) { clearInterval(intervalId); intervalId = null }`
   - Expose `stop()` function để caller có thể cleanup sớm hơn nếu cần

5. **Handle async operations**
   - `isLoading ref<boolean>(false)` cho mỗi async operation riêng biệt
   - `error ref<string | null>(null)` — reset trước mỗi call
   - `try/catch/finally` — trong finally luôn set loading false

6. **Return typed object**
   - Return object (không return array như React hooks trừ khi tuple thực sự phù hợp)
   - Destructurable: `const { isLoading, start, stop } = usePayment()`
   - Readonly refs khi state không nên bị mutate bên ngoài: `readonly(isLoading)`

## Convention & Patterns

### Pattern cơ bản: usePayment (QR polling — PATTERN CHUẨN của project):
```typescript
// fe/src/composables/usePayment.ts
import { ref, readonly, onUnmounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { creditService } from '@/services/credit.service'
import type { QRPaymentData, CreditOrder } from '@/types/subscription.types'

const POLL_INTERVAL_MS = 10_000 // 10 giây theo spec

export function usePayment() {
  const authStore = useAuthStore()

  // State
  const qrData = ref<QRPaymentData | null>(null)
  const currentOrder = ref<CreditOrder | null>(null)
  const paymentStatus = ref<'idle' | 'pending' | 'success' | 'failed'>('idle')
  const isCreatingOrder = ref(false)
  const isPolling = ref(false)
  const error = ref<string | null>(null)

  // Interval reference — PHẢI cleanup
  let pollIntervalId: ReturnType<typeof setInterval> | null = null

  // ─── Actions ─────────────────────────────────────────────
  async function createOrder(packageId: string) {
    try {
      isCreatingOrder.value = true
      error.value = null

      const order = await creditService.createOrder(packageId)
      currentOrder.value = order
      qrData.value = order.qr_data
      paymentStatus.value = 'pending'

      // Bắt đầu polling sau khi có order
      startPolling(order.id)
      return order
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Không thể tạo đơn hàng'
      paymentStatus.value = 'failed'
      throw err
    } finally {
      isCreatingOrder.value = false
    }
  }

  function startPolling(orderId: string) {
    stopPolling() // Clear any existing interval first
    isPolling.value = true

    pollIntervalId = setInterval(async () => {
      await pollOrderStatus(orderId)
    }, POLL_INTERVAL_MS)
  }

  async function pollOrderStatus(orderId: string) {
    try {
      const result = await creditService.checkOrderStatus(orderId)

      if (result.status === 'completed') {
        paymentStatus.value = 'success'
        stopPolling()
        // Refresh auth store để cập nhật credits_balance mới
        await authStore.fetchMe()
      } else if (result.status === 'failed' || result.status === 'expired') {
        paymentStatus.value = 'failed'
        stopPolling()
      }
    } catch {
      // Silent fail — tiếp tục polling, không crash UI
    }
  }

  function stopPolling() {
    if (pollIntervalId !== null) {
      clearInterval(pollIntervalId)
      pollIntervalId = null
    }
    isPolling.value = false
  }

  function reset() {
    stopPolling()
    qrData.value = null
    currentOrder.value = null
    paymentStatus.value = 'idle'
    isCreatingOrder.value = false
    error.value = null
  }

  // ─── QUAN TRỌNG: Cleanup khi component unmount ────────────
  onUnmounted(() => {
    stopPolling()
  })

  return {
    // State (readonly để tránh mutation bên ngoài)
    qrData: readonly(qrData),
    currentOrder: readonly(currentOrder),
    paymentStatus: readonly(paymentStatus),
    isCreatingOrder: readonly(isCreatingOrder),
    isPolling: readonly(isPolling),
    error: readonly(error),
    // Actions
    createOrder,
    startPolling,
    stopPolling,
    reset,
  }
}
```

### Pattern: useToast (notification system):
```typescript
// fe/src/composables/useToast.ts
import { ref } from 'vue'

interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
  duration?: number
}

// Shared state — singleton pattern cho composable
const toasts = ref<Toast[]>([])
const timeoutMap = new Map<string, ReturnType<typeof setTimeout>>()

export function useToast() {
  function show(message: string, type: Toast['type'] = 'info', duration = 4000) {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`
    toasts.value.push({ id, message, type, duration })

    if (duration > 0) {
      const timeout = setTimeout(() => remove(id), duration)
      timeoutMap.set(id, timeout)
    }

    return id
  }

  function remove(id: string) {
    toasts.value = toasts.value.filter(t => t.id !== id)
    const timeout = timeoutMap.get(id)
    if (timeout) {
      clearTimeout(timeout)
      timeoutMap.delete(id)
    }
  }

  // Convenience methods
  const success = (msg: string, duration?: number) => show(msg, 'success', duration)
  const error = (msg: string, duration?: number) => show(msg, 'error', duration)
  const warning = (msg: string, duration?: number) => show(msg, 'warning', duration)
  const info = (msg: string, duration?: number) => show(msg, 'info', duration)

  return { toasts, show, remove, success, error, warning, info }
}
```

### Pattern: useConfirm (dialog composable):
```typescript
// fe/src/composables/useConfirm.ts
import { ref } from 'vue'

interface ConfirmOptions {
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'info'
}

type ConfirmResolver = (value: boolean) => void

const isOpen = ref(false)
const options = ref<ConfirmOptions>({ message: '' })
let resolver: ConfirmResolver | null = null

export function useConfirm() {
  async function confirm(opts: ConfirmOptions): Promise<boolean> {
    options.value = opts
    isOpen.value = true

    return new Promise<boolean>((resolve) => {
      resolver = resolve
    })
  }

  function onConfirm() {
    isOpen.value = false
    resolver?.(true)
    resolver = null
  }

  function onCancel() {
    isOpen.value = false
    resolver?.(false)
    resolver = null
  }

  return { isOpen, options, confirm, onConfirm, onCancel }
}

// Usage trong component:
// const { confirm } = useConfirm()
// const ok = await confirm({ message: 'Bạn có chắc muốn xóa?', variant: 'danger' })
// if (ok) { await deleteItem() }
```

### Pattern: useAuth (wraps auth store + router):
```typescript
// fe/src/composables/useAuth.ts
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { authService } from '@/services/auth.service'
import { useToast } from './useToast'

export function useAuth() {
  const router = useRouter()
  const authStore = useAuthStore()
  const { success, error: showError } = useToast()

  const user = computed(() => authStore.user)
  const isLoggedIn = computed(() => authStore.isLoggedIn)
  const hasActiveCredits = computed(() => authStore.hasActiveCredits)

  async function login(email: string, password: string) {
    await authService.login({ email, password })
    await authStore.fetchMe()
    success('Đăng nhập thành công!')
    await router.push({ name: 'Home' })
  }

  async function logout() {
    await authService.logout()
    authStore.logout()
    await router.push({ name: 'Login' })
  }

  return { user, isLoggedIn, hasActiveCredits, login, logout }
}
```

### Pattern có interval + event listener cleanup:
```typescript
export function useAutoRefresh(intervalMs = 30_000) {
  const lastRefreshed = ref<Date | null>(null)
  let intervalId: ReturnType<typeof setInterval> | null = null

  function handleVisibilityChange() {
    // Refresh khi tab được focus lại
    if (document.visibilityState === 'visible') {
      doRefresh()
    }
  }

  async function doRefresh() {
    // ... fetch data
    lastRefreshed.value = new Date()
  }

  onMounted(() => {
    doRefresh()
    intervalId = setInterval(doRefresh, intervalMs)
    document.addEventListener('visibilitychange', handleVisibilityChange)
  })

  onUnmounted(() => {
    // Cleanup cả interval VÀ event listener
    if (intervalId) clearInterval(intervalId)
    document.removeEventListener('visibilitychange', handleVisibilityChange)
  })

  return { lastRefreshed, doRefresh }
}
```

## Checklist sau khi hoàn thành

- [ ] File tạo tại `fe/src/composables/[composableName].ts`
- [ ] Tên function bắt đầu bằng `use` (camelCase)
- [ ] `onUnmounted` cleanup MỌI interval, setTimeout, event listener
- [ ] Mỗi interval reference lưu vào biến với type `ReturnType<typeof setInterval>`
- [ ] Async operations có `isLoading`, `error` state riêng biệt
- [ ] `error.value = null` reset trước mỗi async call
- [ ] `try/catch/finally` — finally luôn set loading false
- [ ] Return object (không return array trừ khi có lý do)
- [ ] `readonly()` wrap state mà caller không nên mutate
- [ ] Không có side effects ngoài `onMounted`/`onUnmounted`
- [ ] Polling interval: 10_000ms (10 giây) theo spec QR payment
- [ ] Sau payment success: gọi `authStore.fetchMe()` để refresh credits
- [ ] `stopPolling()` expose ra để caller có thể cancel sớm
