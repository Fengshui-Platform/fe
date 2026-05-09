# review-fe

## Mục đích
Review một frontend file hoặc component để đảm bảo tuân thủ toàn bộ conventions của Fengshui Platform: không dùng localStorage cho auth, không hardcode màu, TypeScript strict compliance, cleanup timers/intervals, Pinia state mutation đúng cách, axios calls qua service layer, và credits state handling đầy đủ. Xuất ra danh sách vấn đề cụ thể với dòng code và cách sửa.

## Cách dùng
`/review-fe [file-path] [--strict] [--fix]`

Ví dụ:
- `/review-fe src/pages/BuyCreditsPage.vue` → review trang buy credits
- `/review-fe src/components/layout/TheNavbar.vue` → review navbar
- `/review-fe src/stores/auth.ts` → review auth store
- `/review-fe src/composables/usePayment.ts` → review payment composable
- `/review-fe src/services/credit.service.ts` → review service file
- `/review-fe src/pages/admin/AdminUsersPage.vue --fix` → review và tự fix

## Các bước thực hiện

1. **Đọc toàn bộ file** được chỉ định
2. **Chạy 10 bộ kiểm tra** theo thứ tự dưới đây
3. **Tổng hợp issues** theo severity: CRITICAL / WARNING / INFO
4. Nếu có flag `--fix`: tự động sửa các issues có thể sửa an toàn
5. **Báo cáo** với format rõ ràng: file, line number, issue, fix

## 10 Bộ Kiểm Tra

### Check 1: localStorage / sessionStorage Usage
**Mức độ: CRITICAL**

Tìm kiếm mọi dùng của `localStorage` hoặc `sessionStorage` cho mục đích auth/token.

```
❌ BUG patterns:
localStorage.setItem('token', ...)
localStorage.getItem('access_token')
sessionStorage.setItem('user', ...)
localStorage.removeItem('refresh_token')

✓ ĐÚNG patterns:
// Auth hoàn toàn qua cookies (withCredentials: true trong api.ts)
// KHÔNG cần lưu token ở FE
// User data lưu trong Pinia store (in-memory, không persist)
```

**Note**: Chỉ flag localStorage nếu dùng cho token/auth. Dùng localStorage cho preferences UI (theme, locale) có thể chấp nhận được nhưng cần flag với INFO.

---

### Check 2: Hardcoded Colors
**Mức độ: WARNING**

Tìm mọi màu hex, rgb, rgba, hsl không phải từ design tokens.

```
❌ BUG patterns (trong class attribute hoặc :class binding):
class="bg-[#08080f]"           // arbitrary Tailwind
class="text-[#f5c842]"
style="color: #f5c842"
style="background: rgba(124, 58, 237, 0.4)"
class="bg-white text-black"   // light mode colors không được dùng

✓ ĐÚNG patterns:
class="bg-bg-base"
class="text-accent-gold"
class="border-border-glow"
class="text-text-primary"
```

**Allowed exceptions**: QR code container (`bg-white` là hợp lệ vì QR cần nền trắng, cần ghi chú trong code)

---

### Check 3: TypeScript Strict Compliance
**Mức độ: WARNING**

```
❌ BUG patterns:
const data: any = response     // any type
function foo(x: any) {}        // any parameter
;(response as any).data        // unnecessary any cast
arr.map((item: any) => ...)    // any in callbacks
const result = data as SomeType // unsafe cast mà không check

❌ Missing null checks:
authStore.user.credits_balance // user có thể null
response.data.items.length     // items có thể undefined

✓ ĐÚNG patterns:
const data: User = response
authStore.user?.credits_balance ?? 0
response.data?.items?.length ?? 0
```

**Specific checks**:
- Mọi `?.` optional chaining đều đúng chỗ
- `?? defaultValue` cho nullable fields
- Type guards trước khi access (`if (isApiError(err))`)
- `ref<Type>()` với explicit generic (không inference sai)

---

### Check 4: Interval/Timer Cleanup
**Mức độ: CRITICAL**

```
❌ BUG patterns:
// setInterval không cleanup
onMounted(() => {
  setInterval(fetchData, 10000)  // interval bị leak!
})

// setTimeout không cleanup  
setTimeout(redirect, 3000)  // nếu component unmount trước khi chạy

✓ ĐÚNG patterns:
let intervalId: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  intervalId = setInterval(fetchData, 10000)
})

onUnmounted(() => {
  if (intervalId !== null) {
    clearInterval(intervalId)
    intervalId = null
  }
})
```

**Kiểm tra**:
- Mọi `setInterval` đều có cleanup trong `onUnmounted`
- Mọi `setTimeout` trong component đều có cleanup nếu component có thể unmount
- Event listeners (`addEventListener`) đều có `removeEventListener` trong `onUnmounted`

---

### Check 5: Pinia State Mutation
**Mức độ: WARNING**

```
❌ BUG patterns:
// Mutate state trực tiếp bên ngoài store actions
authStore.user = newUser          // mutation trực tiếp
readingStore.history = []         // mutation trực tiếp
readingStore.history.push(item)   // mutation thông qua ref

// Destructure mà không dùng storeToRefs (mất reactivity)
const { user, isLoading } = authStore    // mất reactivity!

✓ ĐÚNG patterns:
// Gọi actions thay vì mutate trực tiếp
await authStore.fetchMe()
readingStore.$reset()

// Destructure đúng cách
import { storeToRefs } from 'pinia'
const { user, isLoading } = storeToRefs(authStore)
const { fetchMe, logout } = authStore  // actions không cần storeToRefs
```

---

### Check 6: Axios Calls qua Service Layer
**Mức độ: CRITICAL**

```
❌ BUG patterns:
// Import axios trực tiếp trong component/page
import axios from 'axios'
const response = await axios.get('/api/users')

// Import axios trực tiếp trong store
import axios from 'axios'
axios.post('/readings', payload)

// Không dùng api instance từ api.ts
const response = await fetch('/api/credits')

✓ ĐÚNG patterns:
// Component chỉ gọi store actions hoặc composables
await readingStore.submitReading(module, payload)

// Store gọi service functions
import { submitReading } from '@/services/reading.service'
const result = await submitReading(module, payload)

// Service import api instance
import api from '@/services/api'
const { data } = await api.post('/readings', payload)
```

---

### Check 7: Credits State — 3 States Coverage
**Mức độ: WARNING**

Bất kỳ component nào display hoặc react đến credits state phải handle đủ 3 states.

```
❌ BUG patterns:
// Chỉ handle active, bỏ qua frozen và empty
<div v-if="authStore.hasActiveCredits">{{ credits }}</div>
// Không có v-else cho frozen/empty

// Chỉ kiểm tra credits_balance, bỏ qua credits_status
<div v-if="user.credits_balance > 0">...</div>
// Không check nếu status là 'frozen'

✓ ĐÚNG patterns:
<!-- Handle đủ 3 states -->
<template v-if="authStore.hasActiveCredits">
  <!-- Active: show balance + expiry -->
</template>
<template v-else-if="authStore.hasFrozenCredits">
  <!-- Frozen: show warning + contact support -->
</template>
<template v-else>
  <!-- Empty: show buy CTA -->
</template>
```

**Kiểm tra**:
- Navbar credits badge: 3 colors khác nhau
- Action buttons bị disable khi frozen hoặc empty
- 402 error handler kiểm tra `error_code` field

---

### Check 8: 402 Error Handling
**Mức độ: WARNING**

```
❌ BUG patterns:
// Bỏ qua 402 errors
catch (err) {
  error.value = 'Có lỗi xảy ra'  // generic, không distinguish 402
}

// Không kiểm tra error_code
if (err.response?.status === 402) {
  error.value = 'Không đủ credits'  // bỏ qua CREDITS_FROZEN case
}

✓ ĐÚNG patterns:
catch (err: unknown) {
  if (isApiError(err) && err.response.status === 402) {
    const code = err.response.data?.error_code
    if (code === 'CREDITS_FROZEN') {
      error.value = 'Tài khoản credits bị đóng băng'
    } else {
      // NO_CREDITS
      error.value = 'Không đủ credits. Vui lòng mua thêm.'
    }
  } else {
    error.value = 'Có lỗi xảy ra'
  }
}
```

---

### Check 9: Component Import Paths
**Mức độ: INFO**

```
❌ BUG patterns:
import AppButton from '../../../components/common/AppButton.vue'  // relative deep
import { useAuthStore } from '../../stores/auth'                   // relative

✓ ĐÚNG patterns:
import AppButton from '@/components/common/AppButton.vue'          // alias @
import { useAuthStore } from '@/stores/auth'
import type { User } from '@/types/user.types'
```

---

### Check 10: Dark Mode Compliance
**Mức độ: WARNING**

```
❌ BUG patterns:
class="dark:bg-gray-800"     // dark: prefix — không cần, app luôn dark
class="bg-gray-900"          // dùng Tailwind default gray, không phải token
class="text-gray-300"        // dùng Tailwind default gray
class="bg-white text-black"  // light mode colors (trừ QR container)

// Số phong thủy không dùng font-serif
<div class="text-6xl text-yellow-400">{{ lifePathNumber }}</div>

✓ ĐÚNG patterns:
class="bg-bg-base"            // design token
class="text-text-primary"     // design token
class="border-border-glow"    // design token
<div class="text-6xl font-serif text-accent-gold">{{ lifePathNumber }}</div>
```

## Output Format

Kết quả review phải theo format:

```
## Review: [filename]

### CRITICAL Issues (phải sửa ngay)
[C1] Line XX: [mô tả vấn đề]
     Code hiện tại: `...`
     Nên sửa thành: `...`

### WARNING Issues (nên sửa)
[W1] Line XX: [mô tả vấn đề]
     Code hiện tại: `...`
     Nên sửa thành: `...`

### INFO (cân nhắc)
[I1] Line XX: [mô tả vấn đề]

### Tổng kết
- CRITICAL: X issues
- WARNING: Y issues
- INFO: Z issues
- Overall: PASS / NEEDS FIXES / FAIL
```

## Severity Guidelines

| Mức | Ý nghĩa |
|-----|---------|
| CRITICAL | Security issue (localStorage token), memory leak (interval không cleanup), broken functionality (axios bypass) |
| WARNING | Design system violation, TypeScript `any`, Pinia mutation, missing credits state |
| INFO | Import path style, naming convention, optimization suggestion |

## Quick Reference — Common Fixes

### Fix localStorage token usage:
```typescript
// TRƯỚC (sai)
localStorage.setItem('token', response.data.token)
const token = localStorage.getItem('token')

// SAU (đúng) — token là httpOnly cookie, FE không cần xử lý
// Chỉ cần gọi fetchMe() để lấy user data
await authStore.fetchMe()
```

### Fix interval leak:
```typescript
// TRƯỚC (sai)
onMounted(() => { setInterval(poll, 10000) })

// SAU (đúng)
let id: ReturnType<typeof setInterval> | null = null
onMounted(() => { id = setInterval(poll, 10000) })
onUnmounted(() => { if (id) { clearInterval(id); id = null } })
```

### Fix hardcoded color:
```html
<!-- TRƯỚC (sai) -->
<div class="bg-[#0f0f1a] text-[#f1f0ff]">

<!-- SAU (đúng) -->
<div class="bg-bg-card text-text-primary">
```

### Fix Pinia mutation:
```typescript
// TRƯỚC (sai)
authStore.user = null
authStore.user.credits_balance = 100

// SAU (đúng)
authStore.logout()        // gọi action
await authStore.fetchMe() // refresh từ server
```

### Fix TypeScript any:
```typescript
// TRƯỚC (sai)
catch (err: any) {
  console.error(err.message)
}

// SAU (đúng)
catch (err: unknown) {
  const message = err instanceof Error ? err.message : 'Unknown error'
  console.error(message)
}
```

## Checklist nhanh (Quick Scan)

Scan nhanh file để tìm:
- [ ] `localStorage` → CRITICAL nếu liên quan token
- [ ] `#[0-9a-fA-F]{3,6}` (regex hex color) → WARNING
- [ ] `: any` hoặc `as any` → WARNING
- [ ] `setInterval` không có `clearInterval` → CRITICAL
- [ ] `import axios from 'axios'` trong non-service file → CRITICAL
- [ ] `authStore.user =` (direct mutation) → WARNING
- [ ] `dark:` prefix trong classes → WARNING
- [ ] `bg-white` hoặc `bg-black` (trừ QR container) → WARNING
- [ ] Số hiển thị numerology không có `font-serif` → INFO
- [ ] `../../../` relative import path → INFO
