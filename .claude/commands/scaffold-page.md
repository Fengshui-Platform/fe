# scaffold-page

## Mục đích
Tạo mới một Vue 3 page component với TypeScript đầy đủ: dark design system, Pinia store integration, route registration, service import, và proper layout classes. Dùng khi cần thêm một trang mới vào ứng dụng.

## Cách dùng
`/scaffold-page [PageName] [--auth] [--admin] [--no-auth]`

Ví dụ:
- `/scaffold-page BuyCreditsPage --auth` → trang cần đăng nhập
- `/scaffold-page AdminUsersPage --admin` → trang admin
- `/scaffold-page AboutPage --no-auth` → trang public

## Các bước thực hiện

1. **Xác định page name và requirements**
   - Parse PageName (PascalCase, phải kết thúc bằng `Page`)
   - Xác định route path từ tên (BuyCreditsPage → `/buy-credits`)
   - Xác định auth requirement từ flag: `--auth` → `requiresAuth: true`, `--admin` → `requiresAdmin: true`

2. **Tạo file page tại `fe/src/pages/[PageName].vue`**
   - Dùng `<script setup lang="ts">` syntax
   - Import stores cần thiết từ `@/stores/`
   - Import services từ `@/services/`
   - Import types từ `@/types/`
   - Root element PHẢI có class `bg-bg-base min-h-screen`

3. **Tạo cấu trúc template**
   - Wrapper: `<div class="bg-bg-base min-h-screen">`
   - Content container: `<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">`
   - Page title dùng `text-text-primary font-serif` (Cormorant Garamond cho tiêu đề mystical)
   - Cards dùng glassmorphism pattern

4. **Implement loading state**
   - Dùng `ref<boolean>(false)` cho `isLoading`
   - Show `<AppSpinner />` khi loading
   - Wrap fetch trong `onMounted`

5. **Đăng ký route trong `fe/src/router/index.ts`**
   - Thêm vào đúng section (user routes / admin routes)
   - Thêm `meta` object với flags tương ứng
   - Dùng lazy import: `component: () => import('@/pages/PageName.vue')`

6. **Kiểm tra guards trong router/index.ts**
   - `requiresAuth: true` → redirect `/login` nếu chưa đăng nhập
   - `requiresAdmin: true` → redirect `/` nếu không phải admin

## Convention & Patterns

### Template cơ bản (--auth page):
```vue
<template>
  <div class="bg-bg-base min-h-screen">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Page Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-serif text-text-primary mb-2">
          Tiêu đề trang
        </h1>
        <p class="text-text-secondary">Mô tả ngắn về trang</p>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="flex justify-center py-20">
        <AppSpinner size="lg" />
      </div>

      <!-- Content -->
      <div v-else class="space-y-6">
        <!-- Card glassmorphism -->
        <div class="backdrop-blur-md bg-bg-card/80 border border-border-glow rounded-xl p-6 shadow-card">
          <!-- nội dung -->
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useUIStore } from '@/stores/ui'
import AppSpinner from '@/components/common/AppSpinner.vue'
// import thêm service nếu cần
// import { someService } from '@/services/some.service'

const router = useRouter()
const authStore = useAuthStore()
const uiStore = useUIStore()

const isLoading = ref(false)
const error = ref<string | null>(null)

// Data
const data = ref<SomeType[]>([])

onMounted(async () => {
  await fetchData()
})

async function fetchData() {
  try {
    isLoading.value = true
    error.value = null
    // data.value = await someService.getAll()
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'Có lỗi xảy ra'
  } finally {
    isLoading.value = false
  }
}
</script>
```

### Route entry trong `router/index.ts`:
```typescript
// User route (requiresAuth)
{
  path: '/buy-credits',
  name: 'BuyCredits',
  component: () => import('@/pages/BuyCreditsPage.vue'),
  meta: { requiresAuth: true, title: 'Mua Credits' }
},

// Admin route (requiresAdmin)
{
  path: '/admin/users',
  name: 'AdminUsers',
  component: () => import('@/pages/admin/AdminUsersPage.vue'),
  meta: { requiresAuth: true, requiresAdmin: true, title: 'Quản lý Users' }
},
```

### Guard pattern trong router:
```typescript
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  if (to.meta.requiresAuth && !authStore.isLoggedIn) {
    return next({ name: 'Login', query: { redirect: to.fullPath } })
  }

  if (to.meta.requiresAdmin && authStore.user?.role !== 'admin') {
    return next({ name: 'Home' })
  }

  next()
})
```

### Import store pattern:
```typescript
// LUÔN dùng composition store (defineStore với setup function)
import { useAuthStore } from '@/stores/auth'
const authStore = useAuthStore()

// Truy cập state
authStore.user          // User | null
authStore.isLoggedIn    // boolean (computed)
authStore.hasActiveCredits  // boolean (computed)
authStore.hasFrozenCredits  // boolean (computed)
await authStore.fetchMe()   // refresh user data
```

### Credits state trong page:
```typescript
// Kiểm tra credits trước khi cho phép action
const canPerformAction = computed(() => authStore.hasActiveCredits)

// Hiển thị thông báo tương ứng
// active → cho phép
// frozen → show "Tài khoản bị đóng băng, liên hệ hỗ trợ"
// empty → redirect đến /buy-credits
```

## Design System Rules

- **KHÔNG** dùng màu hex trực tiếp. LUÔN dùng Tailwind token class
- Background page: `bg-bg-base` (#08080f)
- Cards: `bg-bg-card` (#0f0f1a) hoặc glassmorphism `backdrop-blur-md bg-bg-card/80`
- Elevated content: `bg-bg-surface` (#161625) hoặc `bg-bg-elevated` (#1e1e30)
- Text chính: `text-text-primary` (#f1f0ff)
- Text phụ: `text-text-secondary` (#9590b8)
- Text mờ: `text-text-muted` (#4b4870)
- Border: `border-border-subtle` hoặc `border-border-glow`
- Accent: `text-accent-gold`, `text-accent-mystic`, `text-accent-neon`
- Số phong thủy: `font-serif` (Cormorant Garamond)
- Hover transition: `transition-all duration-300`

## Checklist sau khi hoàn thành

- [ ] File tạo tại đúng path `fe/src/pages/[PageName].vue`
- [ ] Root element có `bg-bg-base min-h-screen`
- [ ] `<script setup lang="ts">` được dùng
- [ ] Import stores từ `@/stores/` (không import trực tiếp file)
- [ ] Route đã được thêm vào `router/index.ts` với đúng meta
- [ ] Loading state (`isLoading`) và error state được xử lý
- [ ] Không có màu hex hardcode trong template
- [ ] Không dùng `localStorage` để lưu token
- [ ] Credits state được handle nếu page cần credits
- [ ] Lazy import trong router (`() => import(...)`)
- [ ] Page title tag cập nhật nếu router hỗ trợ `meta.title`
