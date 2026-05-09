# scaffold-admin-page

## Mục đích
Tạo một admin panel page với đầy đủ: AdminLayout wrapper, DataTable cho list views, StatsCard cho metrics, ChartLine/ChartBar cho analytics, pagination, loading skeletons, và route với `requiresAdmin: true`. Dùng khi cần thêm trang quản lý mới vào admin panel.

## Cách dùng
`/scaffold-admin-page [PageName] [--type=list|stats|mixed]`

Ví dụ:
- `/scaffold-admin-page AdminUsersPage --type=list` → trang quản lý users dạng table
- `/scaffold-admin-page AdminDashboardPage --type=stats` → trang dashboard với stats cards
- `/scaffold-admin-page AdminReadingsPage --type=mixed` → trang có cả table và charts

## Các bước thực hiện

1. **Xác định page name và type**
   - PageName: phải bắt đầu bằng `Admin` và kết thúc bằng `Page`
   - File: `fe/src/pages/admin/[PageName].vue`
   - Kiểm tra admin.service.ts đã có endpoints chưa — nếu chưa, tạo trước

2. **Tạo file với AdminLayout wrapper**
   - Root element LUÔN là `<AdminLayout>`
   - AdminLayout cung cấp sidebar, topbar, content area
   - Không cần tự thêm bg-bg-base vì AdminLayout đã handle

3. **Import và setup admin.service.ts**
   - Import functions cần từ `@/services/admin.service`
   - Định nghĩa types cho response data

4. **Implement DataTable nếu type=list hoặc mixed**
   - Định nghĩa `columns` array
   - Bind `data`, `isLoading`, `total`
   - Kết nối pagination với `AppPagination`

5. **Implement StatsCard nếu type=stats hoặc mixed**
   - Grid layout 2-4 cột
   - Mỗi card có: title, value, change (trend), icon

6. **Implement Charts nếu cần analytics**
   - ChartLine cho time-series data
   - ChartBar cho comparison data
   - Cung cấp responsive container

7. **Đăng ký route trong router/index.ts**
   - Path: `/admin/[kebab-case]`
   - meta: `{ requiresAuth: true, requiresAdmin: true }`

## Convention & Patterns

### AdminLayout wrapper (BẮTBUỘC):
```vue
<template>
  <AdminLayout>
    <template #header>
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-serif text-text-primary">Quản lý Users</h1>
          <p class="text-text-muted text-sm mt-1">Danh sách và quản lý người dùng hệ thống</p>
        </div>
        <!-- Header actions -->
        <div class="flex items-center gap-3">
          <AppButton variant="ghost" size="sm" @click="exportData">
            Xuất CSV
          </AppButton>
        </div>
      </div>
    </template>

    <!-- Page content goes here -->
    <div class="space-y-6">
      ...
    </div>
  </AdminLayout>
</template>
```

### List page đầy đủ (AdminUsersPage):
```vue
<template>
  <AdminLayout>
    <template #header>
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-serif text-text-primary">Quản lý Users</h1>
        <div class="flex items-center gap-3">
          <!-- Search -->
          <AppInput
            v-model="searchQuery"
            placeholder="Tìm kiếm..."
            class="w-64"
            @update:model-value="debouncedSearch"
          />
          <!-- Filter -->
          <select
            v-model="statusFilter"
            class="bg-bg-elevated border border-border-subtle text-text-primary rounded-lg px-3 py-2 text-sm"
            @change="fetchData(1)"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="active">Active</option>
            <option value="frozen">Frozen</option>
            <option value="empty">Empty</option>
          </select>
        </div>
      </div>
    </template>

    <!-- Stats row -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <StatsCard title="Tổng Users" :value="stats.total_users" icon="👥" />
      <StatsCard title="Active" :value="stats.active_users" icon="✓" trend="+12%" trendUp />
      <StatsCard title="Frozen" :value="stats.frozen_users" icon="❄" variant="warning" />
      <StatsCard title="Doanh thu" :value="formatCurrency(stats.total_revenue)" icon="₫" />
    </div>

    <!-- DataTable -->
    <div class="backdrop-blur-md bg-bg-card/80 border border-border-glow rounded-xl overflow-hidden">
      <DataTable
        :columns="columns"
        :data="users"
        :is-loading="isLoading"
        :empty-message="'Không tìm thấy user nào'"
      >
        <!-- Custom cell renders -->
        <template #cell-credits_status="{ row }">
          <AppBadge :variant="creditsBadgeVariant(row.credits_status)">
            {{ row.credits_status }}
          </AppBadge>
        </template>

        <template #cell-role="{ row }">
          <AppBadge :variant="row.role === 'admin' ? 'mystic' : 'default'">
            {{ row.role }}
          </AppBadge>
        </template>

        <template #cell-actions="{ row }">
          <div class="flex items-center gap-2">
            <AppButton variant="ghost" size="sm" @click="viewUser(row)">
              Xem
            </AppButton>
            <AppButton variant="ghost" size="sm" @click="editUser(row)">
              Sửa
            </AppButton>
          </div>
        </template>
      </DataTable>

      <!-- Pagination -->
      <div class="p-4 border-t border-border-subtle">
        <AppPagination
          :current-page="currentPage"
          :total="totalUsers"
          :per-page="perPage"
          @page-change="fetchData"
        />
      </div>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import DataTable from '@/components/admin/DataTable.vue'
import StatsCard from '@/components/admin/StatsCard.vue'
import AppBadge from '@/components/common/AppBadge.vue'
import AppButton from '@/components/common/AppButton.vue'
import AppInput from '@/components/common/AppInput.vue'
import AppPagination from '@/components/common/AppPagination.vue'
import { getUsers, getDashboardStats } from '@/services/admin.service'
import type { User } from '@/types/user.types'
import type { CreditsStatus } from '@/types/user.types'
import { formatCurrency } from '@/utils/format'

// ─── State ───────────────────────────────────────────────────
const users = ref<User[]>([])
const stats = ref({
  total_users: 0,
  active_users: 0,
  frozen_users: 0,
  total_revenue: 0,
})
const isLoading = ref(false)
const currentPage = ref(1)
const totalUsers = ref(0)
const perPage = 20
const searchQuery = ref('')
const statusFilter = ref('')

// ─── Table columns definition ─────────────────────────────────
const columns = [
  { key: 'full_name', label: 'Tên', sortable: true },
  { key: 'email', label: 'Email', sortable: true },
  { key: 'role', label: 'Role', width: '100px' },
  { key: 'credits_balance', label: 'Credits', sortable: true, align: 'right' },
  { key: 'credits_status', label: 'Trạng thái', width: '120px' },
  { key: 'created_at', label: 'Ngày tạo', sortable: true },
  { key: 'actions', label: '', width: '120px' },
]

// ─── Lifecycle ────────────────────────────────────────────────
onMounted(async () => {
  await Promise.all([fetchData(), fetchStats()])
})

// ─── Actions ─────────────────────────────────────────────────
async function fetchData(page = 1) {
  try {
    isLoading.value = true
    currentPage.value = page
    const response = await getUsers({
      page,
      limit: perPage,
      search: searchQuery.value || undefined,
      credits_status: statusFilter.value as CreditsStatus || undefined,
    })
    users.value = response.data
    totalUsers.value = response.total
  } catch {
    // handle error
  } finally {
    isLoading.value = false
  }
}

async function fetchStats() {
  const data = await getDashboardStats()
  stats.value = data
}

function creditsBadgeVariant(status: CreditsStatus) {
  const map: Record<CreditsStatus, 'success' | 'warning' | 'danger'> = {
    active: 'success',
    frozen: 'warning',
    empty: 'danger',
  }
  return map[status]
}

// Debounce search
let searchTimeout: ReturnType<typeof setTimeout>
function debouncedSearch() {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => fetchData(1), 400)
}

function viewUser(user: User) {
  // navigate to detail
}

function editUser(user: User) {
  // open edit modal
}
</script>
```

### Stats-only page (AdminDashboardPage):
```vue
<template>
  <AdminLayout>
    <template #header>
      <h1 class="text-2xl font-serif text-text-primary">Dashboard</h1>
    </template>

    <!-- Stats Grid -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <StatsCard
        v-for="stat in statsCards"
        :key="stat.key"
        :title="stat.title"
        :value="stat.value"
        :icon="stat.icon"
        :trend="stat.trend"
        :trend-up="stat.trendUp"
        :is-loading="isLoading"
      />
    </div>

    <!-- Charts Row -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- Line Chart: Readings over time -->
      <div class="backdrop-blur-md bg-bg-card/80 border border-border-glow rounded-xl p-6">
        <h3 class="text-text-primary font-medium mb-4">Readings theo ngày</h3>
        <ChartLine :data="readingsChartData" :is-loading="isLoading" />
      </div>

      <!-- Bar Chart: Revenue by package -->
      <div class="backdrop-blur-md bg-bg-card/80 border border-border-glow rounded-xl p-6">
        <h3 class="text-text-primary font-medium mb-4">Doanh thu theo gói</h3>
        <ChartBar :data="revenueChartData" :is-loading="isLoading" />
      </div>
    </div>
  </AdminLayout>
</template>
```

### Loading skeleton cho admin page:
```vue
<!-- Khi isLoading = true, show skeleton -->
<template>
  <div v-if="isLoading" class="animate-pulse space-y-4">
    <!-- Stats skeleton -->
    <div class="grid grid-cols-4 gap-4">
      <div v-for="i in 4" :key="i" class="h-24 bg-bg-elevated rounded-xl" />
    </div>
    <!-- Table skeleton -->
    <div class="bg-bg-card rounded-xl overflow-hidden">
      <div class="h-12 bg-bg-elevated mb-px" />
      <div v-for="i in 8" :key="i" class="h-14 bg-bg-surface border-b border-border-subtle" />
    </div>
  </div>
</template>
```

### Route entry cho admin page:
```typescript
// fe/src/router/index.ts
{
  path: '/admin/users',
  name: 'AdminUsers',
  component: () => import('@/pages/admin/AdminUsersPage.vue'),
  meta: {
    requiresAuth: true,
    requiresAdmin: true,   // BẮTBUỘC cho tất cả admin pages
    title: 'Quản lý Users'
  }
},
{
  path: '/admin/dashboard',
  name: 'AdminDashboard',
  component: () => import('@/pages/admin/AdminDashboardPage.vue'),
  meta: {
    requiresAuth: true,
    requiresAdmin: true,
    title: 'Dashboard'
  }
},
```

### AdminLayout expected slot API:
```vue
<!-- AdminLayout.vue dự kiến sẽ có: -->
<AdminLayout>
  <template #header>
    <!-- Page title và actions -->
  </template>

  <!-- Default slot: page content -->
  <div>...</div>
</AdminLayout>
```

## Design System Rules (Admin context)

- AdminLayout tự quản lý sidebar và top navigation — không thêm TheNavbar
- Content area vẫn dùng dark tokens: `bg-bg-base` cho page, cards dùng glassmorphism
- DataTable: header `bg-bg-surface`, rows `bg-bg-card` alternating với `bg-bg-surface`
- StatsCard: sử dụng glassmorphism với accent color cho value
- Charts: đảm bảo chart colors dùng accent tokens (gold, mystic, neon) không dùng hex
- Pagination: `bg-bg-elevated` cho active page button, `text-accent-gold` cho selected

## Checklist sau khi hoàn thành

- [ ] File tạo tại `fe/src/pages/admin/[PageName].vue`
- [ ] Tên bắt đầu bằng `Admin`, kết thúc bằng `Page`
- [ ] Root là `<AdminLayout>` (không phải `bg-bg-base div`)
- [ ] `#header` slot được điền đầy đủ (title + actions)
- [ ] Route có `requiresAdmin: true` VÀ `requiresAuth: true`
- [ ] Route path bắt đầu bằng `/admin/`
- [ ] `getUsers`/`getDashboardStats` import từ `@/services/admin.service`
- [ ] Columns array định nghĩa đầy đủ keys và labels
- [ ] DataTable bind đúng: `:data`, `:is-loading`, `:empty-message`
- [ ] AppPagination kết nối với `fetchData(page)` function
- [ ] Loading skeleton hiển thị khi `isLoading = true`
- [ ] Search có debounce (400ms)
- [ ] Error state được xử lý
- [ ] `Promise.all()` khi fetch nhiều data cùng lúc (stats + list)
- [ ] Không có màu hex hardcode
- [ ] Model Test Panel nếu page cần test AI models (`ModelTestPanel` component)
