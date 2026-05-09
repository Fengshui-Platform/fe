# Fengshui Platform — Frontend

Vue 3 + TypeScript + Vite + Pinia + Tailwind CSS. Đọc file này trước khi viết bất kỳ code nào.

---

## Stack & Tools

- **Framework**: Vue 3 (Composition API, `<script setup lang="ts">`)
- **State**: Pinia (composition API style)
- **Router**: Vue Router 4
- **HTTP**: Axios với `withCredentials: true` — **KHÔNG dùng localStorage để lưu token**
- **Styling**: Tailwind CSS — **LUÔN dark mode, không có light mode**
- **Build**: Vite
- **Types**: TypeScript strict
- **Path alias**: `@/` → `src/`

---

## Cấu trúc thư mục

```
src/
  assets/fonts/, assets/images/
  components/
    common/    # AppButton, AppInput, AppModal, AppToast, AppSpinner, AppBadge, AppPagination
    layout/    # TheNavbar, TheFooter, AdminSidebar, AdminLayout
    reading/   # ReadingForm, ResultHero, ResultSection, LockedSection, UpsellBanner, NumberCard
    payment/   # QRPaymentModal, CreditPackageCard, PaymentStatus
    admin/     # DataTable, StatsCard, ChartLine, ChartBar, ModelTestPanel
  composables/ # useAuth.ts, useReading.ts, usePayment.ts, useToast.ts, useConfirm.ts
  pages/       # HomePage, ResultPage, LoginPage, RegisterPage, ProfilePage,
               # HistoryPage, BuyCreditsPage, PaymentSuccessPage, admin/*
  router/      # index.ts
  stores/      # auth.ts, reading.ts, ui.ts
  services/    # api.ts, auth.service.ts, reading.service.ts, credit.service.ts, admin.service.ts
  types/       # user.types.ts, reading.types.ts, subscription.types.ts, api.types.ts
  utils/       # format.ts, numerology.ts
```

---

## Design System — Dark Mode Tokens

**KHÔNG dùng màu hex trực tiếp. CHỈ dùng class Tailwind đã định nghĩa.**

### Màu nền

```html
bg-bg-base        <!-- #08080f — nền tối nhất, dùng cho body/page -->
bg-bg-card        <!-- #0f0f1a — nền card -->
bg-bg-surface     <!-- #161625 — nền surface -->
bg-bg-elevated    <!-- #1e1e30 — hover state, input bg -->
```

### Màu accent

```html
text-gold          <!-- #f5c842 — vàng chủ đạo, heading quan trọng -->
text-mystic        <!-- #7c3aed — tím huyền bí -->
text-mystic-glow   <!-- #a855f7 — tím sáng -->
text-neon          <!-- #06b6d4 — cyan neon -->
```

### Màu chữ

```html
text-text-primary    <!-- #f1f0ff — chữ chính -->
text-text-secondary  <!-- #9590b8 — chữ phụ -->
text-text-muted      <!-- #4b4870 — chữ mờ, placeholder -->
```

### Border

```html
border-border-subtle  <!-- #1e1e30 — border nhẹ -->
border-border-glow    <!-- #7c3aed40 — border tím glow -->
```

### Shadows / Glow

```html
shadow-glow-gold    <!-- vàng glow -->
shadow-glow-mystic  <!-- tím glow -->
shadow-glow-neon    <!-- cyan glow -->
shadow-card         <!-- card shadow tối -->
```

### Gradients

```html
bg-gradient-mystic   <!-- purple → cyan -->
bg-gradient-gold     <!-- gold gradient — dùng cho CTA button chính -->
bg-gradient-dark     <!-- dark background gradient -->
```

### Font

```html
font-sans   <!-- Inter — body, UI -->
font-serif  <!-- Cormorant Garamond — số vận mệnh, heading lớn phong thuỷ -->
```

### Patterns hay dùng

```html
<!-- Glassmorphism card -->
<div class="backdrop-blur-md bg-bg-card/80 border border-border-glow rounded-2xl p-6">

<!-- CTA button chính -->
<button class="bg-gradient-gold text-bg-base font-bold px-6 py-3 rounded-xl shadow-glow-gold hover:scale-105 transition-all duration-300">

<!-- Input dark -->
<input class="bg-bg-elevated border border-border-subtle rounded-lg px-4 py-2 text-text-primary focus:border-mystic focus:ring-1 focus:ring-mystic outline-none">

<!-- Số vận mệnh lớn -->
<span class="font-serif text-9xl text-gold drop-shadow-[0_0_30px_rgba(245,200,66,0.5)]">
```

---

## Quy tắc bắt buộc khi viết code

### 1. Auth — Cookie, KHÔNG localStorage

```typescript
// api.ts — axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,  // tự động gửi cookie httpOnly
})
// Interceptor tự refresh token 401 → POST /auth/refresh → retry
```

**KHÔNG** làm:
```typescript
localStorage.setItem('token', ...)       // ❌
headers: { Authorization: `Bearer ...` } // ❌ (trừ khi server yêu cầu)
```

### 2. Component — `<script setup lang="ts">`

```vue
<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import type { User } from '@/types/user.types'

const props = defineProps<{ user: User; size?: 'sm' | 'md' | 'lg' }>()
const emit = defineEmits<{ (e: 'update', val: string): void }>()
</script>
```

### 3. Pinia store — Composition API

```typescript
export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const isLoggedIn = computed(() => !!user.value)
  const hasActiveCredits = computed(() => user.value?.credits_status === 'active')
  const hasFrozenCredits = computed(
    () => user.value?.credits_status === 'frozen' && (user.value?.credits_balance ?? 0) > 0
  )

  async function fetchMe() { /* ... */ }
  function setUser(u: User) { user.value = u }
  function clearUser() { user.value = null }

  return { user, isLoggedIn, hasActiveCredits, hasFrozenCredits, fetchMe, setUser, clearUser }
})
```

### 4. Services — import api.ts, không try/catch

```typescript
// credit.service.ts
import api from './api'
import type { CreditPackage, QRPaymentData } from '@/types/subscription.types'

export async function getPackages(): Promise<CreditPackage[]> {
  const { data } = await api.get('/credits/packages')
  return data.data
}
// Error được xử lý bởi interceptor hoặc caller
```

### 5. Credits — luôn xử lý đủ 3 trạng thái

```typescript
// Trong component/composable
const authStore = useAuthStore()

// Hiển thị
if (authStore.user?.credits_status === 'active')  { /* badge xanh, cho dùng */ }
if (authStore.user?.credits_status === 'frozen')  { /* badge cam, CTA gia hạn */ }
if (authStore.user?.credits_status === 'empty')   { /* badge đỏ, CTA mua */ }

// Xử lý lỗi API 402
if (error.response?.status === 402) {
  const code = error.response.data.error.code
  if (code === 'CREDITS_FROZEN') { /* hiện modal giải băng */ }
  if (code === 'NO_CREDITS')     { /* hiện modal mua lượt */ }
}
```

### 6. Composable — cleanup interval/timer

```typescript
export function usePayment() {
  let pollTimer: ReturnType<typeof setInterval> | null = null

  onUnmounted(() => {
    if (pollTimer) clearInterval(pollTimer)  // LUÔN cleanup
  })
}
```

### 7. Router guards

```typescript
// Trong route definition
{ path: '/profile', meta: { requiresAuth: true } }
{ path: '/admin', meta: { requiresAdmin: true } }

// Guard tự động xử lý trong router/index.ts
```

### 8. Không hardcode màu

```html
<!-- ❌ SAI -->
<div style="background: #0f0f1a">
<div class="bg-[#0f0f1a]">

<!-- ✅ ĐÚNG -->
<div class="bg-bg-card">
```

---

## TypeScript Types chính

```typescript
// User
interface User {
  id: number; full_name: string; email: string | null
  credits_balance: number; credits_expires_at: string | null
  credits_status: 'active' | 'frozen' | 'empty'
  role: 'user' | 'admin'; avatar_url: string | null
}

// Credits
interface CreditPackage { id: number; name: string; credits: number; price: number; validity_days: number }
interface QRPaymentData { order_id: number; qr_image_base64: string; qr_expires_at: string; amount: number; topup_code: string; bank_info: {...} }
type OrderStatus = 'pending' | 'paid' | 'failed' | 'expired'

// Reading
type ReadingModule = 'numerology' | 'love' | 'finance' | 'sim' | 'fengshui_home' | 'horoscope'
```

---

## Khi viết tính năng mới

**Chỉ cần mô tả bằng ngôn ngữ tự nhiên**, Claude tự theo convention:

Ví dụ:
- "Tạo trang /buy-credits hiển thị 3 gói lượt" → Claude tạo BuyCreditsPage.vue + CreditPackageCard + service + route
- "Thêm credits badge vào Navbar" → Claude thêm vào TheNavbar.vue với đủ 3 trạng thái
- "Viết QRPaymentModal với đếm ngược 30 phút" → Claude dùng usePayment composable, poll 10s, cleanup

**Slash commands** (cho task phức tạp):
- `/scaffold-page PageName` — tạo page mới với route + store + service
- `/scaffold-component ComponentName` — component tái sử dụng
- `/add-store storeName` — Pinia store mới
- `/add-composable useXxx` — composable mới
- `/add-service serviceName` — API service mới
- `/dark-ui` — review/fix dark mode UI
- `/add-types` — thêm/cập nhật types
- `/fix-credits-ui` — implement credit UI (3 states + QR modal)
- `/scaffold-admin-page PageName` — trang admin
- `/review-fe` — review toàn diện file/component

---

## Biến môi trường

```env
VITE_API_BASE_URL=https://yourdomain.com/api/v1
VITE_APP_NAME=Phong Thuỷ AI
```

## Scripts

```bash
npm run dev        # Vite dev server
npm run build      # vue-tsc --noEmit && vite build
npm run typecheck  # vue-tsc --noEmit
npm run lint       # eslint src
```
