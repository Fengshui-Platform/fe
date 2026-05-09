# add-store

## Mục đích
Tạo một Pinia store mới với TypeScript theo composition API style (`defineStore` + setup function). Store phải có: typed state với `ref`/`computed`, actions async với loading/error handling, và tích hợp với axios instance từ `api.ts`. Dùng khi cần quản lý state shared giữa nhiều components/pages.

## Cách dùng
`/add-store [storeName] [--entity=TypeName]`

Ví dụ:
- `/add-store reading --entity=ReadingResult` → store cho readings
- `/add-store payment --entity=CreditOrder` → store cho payment
- `/add-store admin --entity=User` → store cho admin panel

## Các bước thực hiện

1. **Xác định store name và entity type**
   - storeName: camelCase (ví dụ: `reading`, `payment`, `admin`)
   - File: `fe/src/stores/[storeName].ts`
   - Store ID: `'[storeName]'` (string literal)
   - Entity type từ `fe/src/types/*.types.ts`

2. **Import đúng dependencies**
   - `import { defineStore } from 'pinia'`
   - `import { ref, computed } from 'vue'`
   - Import service functions từ `@/services/[name].service.ts`
   - Import types từ `@/types/[name].types.ts`
   - KHÔNG import axios trực tiếp vào store — dùng service layer

3. **Tạo state với ref()**
   - Data list: `ref<EntityType[]>([])`
   - Single item: `ref<EntityType | null>(null)`
   - Loading flags: `ref<boolean>(false)` — đặt tên cụ thể: `isLoading`, `isSubmitting`, `isFetching`
   - Error: `ref<string | null>(null)`
   - Pagination nếu cần: `ref<PaginationMeta>({ page: 1, limit: 20, total: 0 })`

4. **Tạo computed getters**
   - Derived state từ data
   - Boolean flags: `hasData`, `isEmpty`, `isError`
   - Filtered/sorted views nếu cần

5. **Tạo actions**
   - Pattern: `async function fetchXxx()` - không phải arrow function để có `this` nếu cần
   - Luôn: set loading true → try/catch → finally set loading false
   - Lỗi 401: interceptor trong `api.ts` tự handle (auto-refresh) — KHÔNG xử lý ở store
   - Lỗi 402: có thể check `error.response?.status === 402` cho credits error
   - Reset error trước mỗi action: `error.value = null`

6. **Export store và types cần thiết**
   - Export `useXxxStore` function
   - Không export state trực tiếp

## Convention & Patterns

### Store template đầy đủ:
```typescript
// fe/src/stores/reading.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { ReadingResult, ReadingModule } from '@/types/reading.types'
import { readingService } from '@/services/reading.service'

export const useReadingStore = defineStore('reading', () => {
  // ─── State ───────────────────────────────────────────────
  const currentResult = ref<ReadingResult | null>(null)
  const history = ref<ReadingResult[]>([])
  const isLoading = ref(false)
  const isSubmitting = ref(false)
  const error = ref<string | null>(null)

  // ─── Getters ─────────────────────────────────────────────
  const hasResult = computed(() => currentResult.value !== null)
  const historyCount = computed(() => history.value.length)
  const isEmpty = computed(() => !isLoading.value && history.value.length === 0)

  // ─── Actions ─────────────────────────────────────────────
  async function submitReading(module: ReadingModule, payload: Record<string, unknown>) {
    try {
      isSubmitting.value = true
      error.value = null
      const result = await readingService.submit(module, payload)
      currentResult.value = result
      return result
    } catch (err: unknown) {
      if (isApiError(err) && err.response?.status === 402) {
        const code = err.response?.data?.error_code
        error.value = code === 'CREDITS_FROZEN'
          ? 'Tài khoản credits bị đóng băng'
          : 'Bạn không đủ credits để thực hiện yêu cầu này'
      } else {
        error.value = err instanceof Error ? err.message : 'Có lỗi xảy ra'
      }
      throw err // re-throw để caller có thể xử lý
    } finally {
      isSubmitting.value = false
    }
  }

  async function fetchHistory(page = 1, limit = 20) {
    try {
      isLoading.value = true
      error.value = null
      const response = await readingService.getHistory({ page, limit })
      history.value = response.data
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Không thể tải lịch sử'
    } finally {
      isLoading.value = false
    }
  }

  function clearResult() {
    currentResult.value = null
    error.value = null
  }

  function $reset() {
    currentResult.value = null
    history.value = []
    isLoading.value = false
    isSubmitting.value = false
    error.value = null
  }

  return {
    // State (expose as readonly khi có thể)
    currentResult,
    history,
    isLoading,
    isSubmitting,
    error,
    // Getters
    hasResult,
    historyCount,
    isEmpty,
    // Actions
    submitReading,
    fetchHistory,
    clearResult,
    $reset,
  }
})

// ─── Helper ──────────────────────────────────────────────────
function isApiError(err: unknown): err is { response?: { status: number; data?: { error_code?: string } } } {
  return typeof err === 'object' && err !== null && 'response' in err
}
```

### Auth store pattern (hiện có — để tham khảo):
```typescript
// fe/src/stores/auth.ts — PATTERN CHUẨN
export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)

  // Computed từ user.credits_status
  const isLoggedIn = computed(() => user.value !== null)
  const hasActiveCredits = computed(() => user.value?.credits_status === 'active')
  const hasFrozenCredits = computed(() => user.value?.credits_status === 'frozen')
  const hasEmptyCredits = computed(() => user.value?.credits_status === 'empty')

  async function fetchMe() {
    const data = await authService.getMe() // 401 → interceptor auto refresh
    user.value = data
  }

  function logout() {
    user.value = null
  }

  return { user, isLoggedIn, hasActiveCredits, hasFrozenCredits, hasEmptyCredits, fetchMe, logout }
})
```

### Payment store pattern (với polling state):
```typescript
// fe/src/stores/payment.ts
export const usePaymentStore = defineStore('payment', () => {
  const packages = ref<CreditPackage[]>([])
  const currentOrder = ref<CreditOrder | null>(null)
  const qrData = ref<QRPaymentData | null>(null)
  const paymentStatus = ref<'idle' | 'pending' | 'success' | 'failed'>('idle')
  const isLoading = ref(false)
  const isPolling = ref(false)
  const error = ref<string | null>(null)

  async function fetchPackages() {
    try {
      isLoading.value = true
      packages.value = await creditService.getPackages()
    } catch (err) {
      error.value = 'Không thể tải danh sách gói credits'
    } finally {
      isLoading.value = false
    }
  }

  async function createOrder(packageId: string) {
    try {
      isLoading.value = true
      error.value = null
      const order = await creditService.createOrder(packageId)
      currentOrder.value = order
      qrData.value = order.qr_data
      paymentStatus.value = 'pending'
      return order
    } finally {
      isLoading.value = false
    }
  }

  async function checkPaymentStatus(orderId: string) {
    const result = await creditService.checkOrderStatus(orderId)
    if (result.status === 'completed') {
      paymentStatus.value = 'success'
    }
    return result
  }

  function resetPayment() {
    currentOrder.value = null
    qrData.value = null
    paymentStatus.value = 'idle'
    error.value = null
  }

  return {
    packages, currentOrder, qrData, paymentStatus,
    isLoading, isPolling, error,
    fetchPackages, createOrder, checkPaymentStatus, resetPayment,
  }
})
```

### Sử dụng store trong component:
```typescript
// Trong component/page
import { useReadingStore } from '@/stores/reading'

const readingStore = useReadingStore()

// KHÔNG mutate state trực tiếp bên ngoài actions
// ❌ SAI: readingStore.history = []
// ✓ ĐÚNG: readingStore.clearResult() hoặc readingStore.$reset()

// Dùng storeToRefs để destructure reactive state
import { storeToRefs } from 'pinia'
const { currentResult, isLoading, error } = storeToRefs(readingStore)
// Actions không cần storeToRefs
const { submitReading, fetchHistory } = readingStore
```

## Checklist sau khi hoàn thành

- [ ] File tạo tại `fe/src/stores/[storeName].ts`
- [ ] Dùng `defineStore('id', () => { ... })` — composition API style
- [ ] State dùng `ref<Type>()` — không dùng `reactive({})`
- [ ] Getters dùng `computed(() => ...)` — không return raw value
- [ ] Mỗi async action có `isLoading`/`isSubmitting` riêng biệt tên rõ ràng
- [ ] `error.value = null` reset trước mỗi action
- [ ] `try/catch/finally` đầy đủ trong mọi async action
- [ ] KHÔNG import axios trực tiếp — dùng service functions
- [ ] KHÔNG xử lý 401 (interceptor trong api.ts lo)
- [ ] 402 error xử lý: check `error_code` ('NO_CREDITS' | 'CREDITS_FROZEN')
- [ ] `$reset()` function để reset toàn bộ state
- [ ] Export `useXxxStore` function (không export state trực tiếp)
- [ ] Types import từ `@/types/*.types.ts` (không define inline trong store)
