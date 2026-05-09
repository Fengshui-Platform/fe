# add-service

## Mục đích
Tạo một API service file mới trong `fe/src/services/`. Service phải: import axios instance từ `api.ts` (đã có `withCredentials: true` và auto-refresh interceptor), type request params và response bằng types từ `fe/src/types/`, export named functions (không export class), để lỗi 401 bubble up tự nhiên (interceptor xử lý).

## Cách dùng
`/add-service [serviceName] [--entity=TypeName]`

Ví dụ:
- `/add-service credit --entity=CreditPackage` → credit service
- `/add-service admin --entity=User` → admin service
- `/add-service reading --entity=ReadingResult` → reading service

## Các bước thực hiện

1. **Xác định service name và domain**
   - File: `fe/src/services/[serviceName].service.ts`
   - Xác định base URL prefix cho API (ví dụ: `/credits`, `/readings`, `/admin/users`)
   - Map entity type từ `fe/src/types/*.types.ts`

2. **Import axios instance từ api.ts**
   - `import api from '@/services/api'` — đây là instance đã config sẵn
   - KHÔNG import `axios` từ package trực tiếp
   - KHÔNG tạo axios instance mới

3. **Import types cần thiết**
   - Request types: params, body types
   - Response types: API response wrapper và entity types
   - Từ `@/types/*.types.ts` — KHÔNG define inline trong service

4. **Tạo type aliases cho response**
   - Dùng generic response wrapper nếu backend trả về `{ data: T, message: string }`
   - Hoặc type trực tiếp nếu backend trả về entity
   - Luôn type rõ ràng, không dùng `any`

5. **Export named functions**
   - Mỗi function = một API endpoint
   - Async/await syntax (không dùng `.then()`)
   - Destructure response: `const { data } = await api.get(...)`
   - Return typed data, không return raw axios response

6. **Error handling**
   - KHÔNG try/catch trong service functions
   - Để lỗi bubble up tự nhiên → store/composable sẽ catch
   - Interceptor trong `api.ts` xử lý 401 → auto refresh token
   - 402, 403, 422, 500 → bubble up để caller xử lý

## Convention & Patterns

### api.ts — Axios instance (KHÔNG chỉnh sửa):
```typescript
// fe/src/services/api.ts — CHỈ ĐỌC ĐỂ HIỂU, KHÔNG SỬA
import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,  // Cookie-based auth — KHÔNG dùng localStorage
  headers: { 'Content-Type': 'application/json' },
})

// Request interceptor (nếu có)
// Response interceptor: auto refresh token khi 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true
      try {
        await api.post('/auth/refresh')         // refresh token cookie
        return api(error.config)                 // retry original request
      } catch {
        // Refresh thất bại → redirect login (handled elsewhere)
      }
    }
    return Promise.reject(error)
  }
)

export default api
```

### Service template đầy đủ (credit.service.ts):
```typescript
// fe/src/services/credit.service.ts
import api from '@/services/api'
import type {
  CreditPackage,
  CreditOrder,
  QRPaymentData,
  CreditsBalance,
} from '@/types/subscription.types'

// ─── Type definitions ─────────────────────────────────────────
interface CreateOrderPayload {
  package_id: string
}

interface OrderStatusResponse {
  order_id: string
  status: 'pending' | 'completed' | 'failed' | 'expired'
  amount: number
  credits: number
}

interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
}

// ─── Service functions ────────────────────────────────────────

/**
 * Lấy danh sách gói credits available
 */
export async function getPackages(): Promise<CreditPackage[]> {
  const { data } = await api.get<CreditPackage[]>('/credits/packages')
  return data
}

/**
 * Tạo đơn hàng QR payment
 */
export async function createOrder(packageId: string): Promise<CreditOrder> {
  const payload: CreateOrderPayload = { package_id: packageId }
  const { data } = await api.post<CreditOrder>('/credits/orders', payload)
  return data
}

/**
 * Poll trạng thái đơn hàng (gọi mỗi 10s từ usePayment composable)
 */
export async function checkOrderStatus(orderId: string): Promise<OrderStatusResponse> {
  const { data } = await api.get<OrderStatusResponse>(`/credits/orders/${orderId}/status`)
  return data
}

/**
 * Lấy lịch sử giao dịch
 */
export async function getTransactionHistory(params?: {
  page?: number
  limit?: number
}): Promise<PaginatedResponse<CreditOrder>> {
  const { data } = await api.get<PaginatedResponse<CreditOrder>>('/credits/transactions', { params })
  return data
}

/**
 * Lấy thông tin credits hiện tại của user
 */
export async function getCreditsBalance(): Promise<CreditsBalance> {
  const { data } = await api.get<CreditsBalance>('/credits/balance')
  return data
}
```

### Auth service pattern:
```typescript
// fe/src/services/auth.service.ts
import api from '@/services/api'
import type { User } from '@/types/user.types'

interface LoginPayload {
  email: string
  password: string
}

interface RegisterPayload {
  full_name: string
  email: string
  password: string
}

// Cookies được set bởi server — client chỉ cần gọi endpoint
export async function login(payload: LoginPayload): Promise<void> {
  await api.post('/auth/login', payload)
  // Server set httpOnly cookies — không cần xử lý token ở FE
}

export async function register(payload: RegisterPayload): Promise<User> {
  const { data } = await api.post<User>('/auth/register', payload)
  return data
}

export async function logout(): Promise<void> {
  await api.post('/auth/logout')
  // Server xóa cookies
}

export async function getMe(): Promise<User> {
  const { data } = await api.get<User>('/auth/me')
  return data
}
```

### Reading service pattern:
```typescript
// fe/src/services/reading.service.ts
import api from '@/services/api'
import type { ReadingResult, ReadingModule } from '@/types/reading.types'

interface ReadingPayload {
  module: ReadingModule
  input_data: Record<string, unknown>
}

interface ReadingHistoryParams {
  page?: number
  limit?: number
  module?: ReadingModule
}

export async function submitReading(
  module: ReadingModule,
  inputData: Record<string, unknown>
): Promise<ReadingResult> {
  const payload: ReadingPayload = { module, input_data: inputData }
  // 402 sẽ bubble up → store catch và check error_code
  const { data } = await api.post<ReadingResult>('/readings', payload)
  return data
}

export async function getHistory(params?: ReadingHistoryParams) {
  const { data } = await api.get('/readings/history', { params })
  return data
}

export async function getReadingById(id: string): Promise<ReadingResult> {
  const { data } = await api.get<ReadingResult>(`/readings/${id}`)
  return data
}
```

### Admin service pattern:
```typescript
// fe/src/services/admin.service.ts
import api from '@/services/api'
import type { User } from '@/types/user.types'

interface UserListParams {
  page?: number
  limit?: number
  search?: string
  role?: 'user' | 'admin'
  credits_status?: 'active' | 'frozen' | 'empty'
}

interface PaginatedUsers {
  data: User[]
  total: number
  page: number
  limit: number
}

interface DashboardStats {
  total_users: number
  active_users: number
  total_readings: number
  total_revenue: number
}

export async function getUsers(params?: UserListParams): Promise<PaginatedUsers> {
  const { data } = await api.get<PaginatedUsers>('/admin/users', { params })
  return data
}

export async function getUserById(id: string): Promise<User> {
  const { data } = await api.get<User>(`/admin/users/${id}`)
  return data
}

export async function updateUser(id: string, payload: Partial<User>): Promise<User> {
  const { data } = await api.patch<User>(`/admin/users/${id}`, payload)
  return data
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const { data } = await api.get<DashboardStats>('/admin/stats')
  return data
}
```

### Cách import trong store/composable:
```typescript
// Trong store — import named functions
import { getPackages, createOrder, checkOrderStatus } from '@/services/credit.service'

// KHÔNG dùng:
// import creditService from '@/services/credit.service' // default export — không có
// import axios from 'axios' // KHÔNG import thẳng axios
```

## Checklist sau khi hoàn thành

- [ ] File tạo tại `fe/src/services/[serviceName].service.ts`
- [ ] Import `api` từ `@/services/api` (không phải từ `axios`)
- [ ] KHÔNG tạo axios instance mới
- [ ] KHÔNG có `try/catch` trong service functions — bubble up errors
- [ ] KHÔNG set header Authorization thủ công (cookie tự động)
- [ ] KHÔNG dùng `localStorage` trong service
- [ ] Tất cả functions đều `async` và dùng `await`
- [ ] Response destructured: `const { data } = await api.get<Type>(...)` 
- [ ] Request params và response types đều được type rõ ràng
- [ ] Types import từ `@/types/*.types.ts` (không define inline)
- [ ] Export named functions (không export class, không default export object)
- [ ] `null | string` cho optional fields (không phải chỉ `string`)
- [ ] Base path nhất quán với backend API (kiểm tra với backend dev)
