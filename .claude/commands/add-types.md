# add-types

## Mục đích
Thêm hoặc cập nhật TypeScript type definitions cho project. Types phải: tổ chức trong `fe/src/types/*.types.ts`, phân biệt rõ API response types và internal state types, dùng `string | null` cho nullable fields, dùng `as const` assertions cho literal unions. Dùng khi backend thay đổi response, thêm entity mới, hoặc cần refine type existing.

## Cách dùng
`/add-types [action] [description]`

Ví dụ:
- `/add-types add CreditPackage` → thêm type mới
- `/add-types update User --add-field credits_tier` → cập nhật type có sẵn
- `/add-types review reading.types.ts` → review và fix type issues
- `/add-types add AdminStats` → thêm admin stats type

## Các bước thực hiện

1. **Xác định file type phù hợp**
   - Entity liên quan đến user/auth → `user.types.ts`
   - Entity liên quan đến reading/numerology → `reading.types.ts`
   - Entity liên quan đến credits/payment → `subscription.types.ts`
   - Generic API types → `api.types.ts`
   - Admin-specific types → có thể thêm vào `admin.types.ts`

2. **Phân loại type:**
   - **Entity type**: shape của object từ backend (User, CreditPackage, ReadingResult)
   - **API Response type**: wrapper của response (có thể có `data`, `message`, `pagination`)
   - **Internal state type**: derived từ entity, dùng trong store/component (không nhất thiết 1:1 với API)
   - **Form/Input type**: payload gửi lên backend

3. **Nullable fields**
   - Bất kỳ field nào backend có thể trả `null` → `string | null` KHÔNG phải `string`
   - Optional fields trong request payload → `field?: Type` (dùng optional chaining)
   - Phân biệt: `field?: string` (optional property) vs `field: string | null` (required but nullable)

4. **Literal types với const assertions**
   - Union string literals: dùng `as const` object map thay vì enum
   - Enum không nên dùng (tree-shaking issue với TypeScript enum)
   - Export cả type và values nếu cần runtime access

5. **Cập nhật exports**
   - Mỗi file type export tất cả types
   - Barrel import nếu project có `types/index.ts`

## Convention & Patterns

### user.types.ts — Entity types:
```typescript
// fe/src/types/user.types.ts

// ─── Literal union types ──────────────────────────────────────
export const USER_ROLES = ['user', 'admin'] as const
export type UserRole = typeof USER_ROLES[number]
// → 'user' | 'admin'

export const CREDITS_STATUS = ['active', 'frozen', 'empty'] as const
export type CreditsStatus = typeof CREDITS_STATUS[number]
// → 'active' | 'frozen' | 'empty'

// ─── Entity type (matches backend response) ───────────────────
export interface User {
  id: string
  full_name: string
  email: string
  role: UserRole
  credits_balance: number
  credits_expires_at: string | null  // ISO string hoặc null nếu chưa set
  credits_status: CreditsStatus
  avatar_url: string | null          // nullable — không phải chỉ string
  created_at: string
  updated_at: string
}

// ─── Internal state types ─────────────────────────────────────
// Khi FE cần shape khác với API response
export interface UserProfile extends Omit<User, 'updated_at'> {
  // Thêm computed fields nếu cần
  displayName: string  // derived từ full_name
}

// ─── Form/Request types ───────────────────────────────────────
export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload {
  full_name: string
  email: string
  password: string
  confirm_password?: string  // optional — chỉ validate ở FE
}

export interface UpdateProfilePayload {
  full_name?: string
  avatar_url?: string | null
}
```

### subscription.types.ts — Credits/Payment types:
```typescript
// fe/src/types/subscription.types.ts

// ─── Credit Package ───────────────────────────────────────────
export interface CreditPackage {
  id: string
  name: string
  credits: number
  price: number              // VND
  validity_days: number
  is_popular?: boolean       // optional highlight flag
  description: string | null
}

// ─── Credit Order ─────────────────────────────────────────────
export const ORDER_STATUS = ['pending', 'completed', 'failed', 'expired'] as const
export type OrderStatus = typeof ORDER_STATUS[number]

export interface CreditOrder {
  id: string
  package_id: string
  user_id: string
  amount: number             // VND
  credits: number            // credits được cấp khi hoàn thành
  status: OrderStatus
  qr_data: QRPaymentData
  created_at: string
  expires_at: string         // QR hết hạn
  completed_at: string | null  // null nếu chưa hoàn thành
}

// ─── QR Payment ───────────────────────────────────────────────
export interface QRPaymentData {
  qr_url: string             // URL ảnh QR
  bank_name: string
  account_number: string
  account_name: string
  amount: number
  description: string        // Nội dung chuyển khoản
}

// ─── Balance (từ /credits/balance endpoint) ───────────────────
export interface CreditsBalance {
  credits_balance: number
  credits_expires_at: string | null
  credits_status: CreditsStatus
}

// Import CreditsStatus từ user.types
import type { CreditsStatus } from './user.types'
export type { CreditsStatus }
```

### reading.types.ts — Reading/Numerology types:
```typescript
// fe/src/types/reading.types.ts

// ─── Module types ─────────────────────────────────────────────
export const READING_MODULES = [
  'numerology',
  'love',
  'finance',
  'sim',
  'fengshui_home',
  'horoscope',
] as const
export type ReadingModule = typeof READING_MODULES[number]

// ─── Reading Result ───────────────────────────────────────────
export interface ReadingSection {
  title: string
  content: string
  is_locked: boolean        // true nếu user cần thêm credits/plan để xem
}

export interface ReadingResult {
  id: string
  module: ReadingModule
  input_data: Record<string, unknown>  // varies by module
  sections: ReadingSection[]
  created_at: string
  credits_used: number
  // Numerology specific
  numbers?: NumerologyNumbers
}

export interface NumerologyNumbers {
  life_path: number
  expression: number
  soul_urge: number
  personality: number
  birth_day: number
}

// ─── Reading Input (varies by module) ────────────────────────
export interface NumerologyInput {
  full_name: string
  birth_date: string          // YYYY-MM-DD format
}

export interface LoveInput {
  person1_name: string
  person1_birth_date: string
  person2_name: string
  person2_birth_date: string
}

export interface SimInput {
  phone_number: string
}

// ─── History list item (abbreviated, không phải full result) ──
export interface ReadingHistoryItem {
  id: string
  module: ReadingModule
  created_at: string
  credits_used: number
  summary: string | null      // nullable brief summary
}
```

### api.types.ts — Generic API types:
```typescript
// fe/src/types/api.types.ts

// ─── Pagination ───────────────────────────────────────────────
export interface PaginationMeta {
  page: number
  limit: number
  total: number
  total_pages: number
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: PaginationMeta
}

// ─── API Error Response ───────────────────────────────────────
export const API_ERROR_CODES = [
  'UNAUTHORIZED',
  'FORBIDDEN',
  'NOT_FOUND',
  'VALIDATION_ERROR',
  'NO_CREDITS',        // 402 — credits = 0
  'CREDITS_FROZEN',    // 402 — credits bị freeze
  'INTERNAL_ERROR',
] as const
export type ApiErrorCode = typeof API_ERROR_CODES[number]

export interface ApiError {
  error_code: ApiErrorCode
  message: string
  details?: Record<string, string[]>  // validation errors
}

// ─── Generic success response ─────────────────────────────────
export interface ApiResponse<T> {
  data: T
  message?: string
}

// ─── Type guard ───────────────────────────────────────────────
export function isApiError(err: unknown): err is { response: { data: ApiError; status: number } } {
  return (
    typeof err === 'object' &&
    err !== null &&
    'response' in err &&
    typeof (err as Record<string, unknown>).response === 'object'
  )
}
```

### Patterns KHÔNG nên dùng:
```typescript
// ❌ SAI: dùng enum
enum CreditsStatus { Active = 'active', Frozen = 'frozen', Empty = 'empty' }

// ✓ ĐÚNG: dùng as const
export const CREDITS_STATUS = ['active', 'frozen', 'empty'] as const
export type CreditsStatus = typeof CREDITS_STATUS[number]

// ❌ SAI: nullable field không explicit
interface User { avatar_url: string }  // sẽ crash khi backend trả null

// ✓ ĐÚNG: explicit nullable
interface User { avatar_url: string | null }

// ❌ SAI: any type
function processData(data: any) { ... }

// ✓ ĐÚNG: unknown với type guard
function processData(data: unknown) {
  if (isApiError(data)) { ... }
}

// ❌ SAI: optional khi thực ra required-but-nullable
interface Order { completed_at?: string }

// ✓ ĐÚNG: required-but-nullable
interface Order { completed_at: string | null }
```

### Cách import types:
```typescript
// Trong services/stores/components — dùng import type
import type { User, CreditsStatus } from '@/types/user.types'
import type { CreditPackage, CreditOrder } from '@/types/subscription.types'
import type { ReadingResult, ReadingModule } from '@/types/reading.types'
import type { PaginatedResponse, ApiError, isApiError } from '@/types/api.types'
// isApiError là function → dùng import thường (không phải import type)
import { isApiError } from '@/types/api.types'
```

## Checklist sau khi hoàn thành

- [ ] Types đặt trong đúng file `fe/src/types/*.types.ts`
- [ ] KHÔNG define types inline trong store, service, hoặc component
- [ ] Dùng `as const` + `typeof X[number]` thay vì `enum`
- [ ] Nullable fields dùng `Type | null` (không dùng `Type?` cho required-but-nullable)
- [ ] Optional payload fields dùng `field?: Type`
- [ ] KHÔNG có `any` type — dùng `unknown` với type guard
- [ ] Entity types match backend response (verify với backend dev/docs)
- [ ] API Response types có wrapper nếu backend dùng wrapper
- [ ] Internal state types tách khỏi API response types nếu shape khác
- [ ] `isApiError` type guard export từ `api.types.ts`
- [ ] Import types dùng `import type` syntax (tree-shaking friendly)
- [ ] `ApiErrorCode` có 'NO_CREDITS' và 'CREDITS_FROZEN' cho 402 handling
- [ ] `ReadingModule` union có đủ 6 modules: numerology, love, finance, sim, fengshui_home, horoscope
