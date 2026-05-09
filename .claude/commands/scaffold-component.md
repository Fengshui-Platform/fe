# scaffold-component

## Mục đích
Tạo mới một Vue 3 reusable component với TypeScript, tuân thủ dark design system, dùng `defineProps<{}>()` và `defineEmits`, hỗ trợ slots, và có variants khi phù hợp. Dùng khi cần thêm component vào `components/common/`, `components/reading/`, `components/payment/`, hoặc `components/admin/`.

## Cách dùng
`/scaffold-component [ComponentName] [--dir=common|reading|payment|admin|layout] [--variants]`

Ví dụ:
- `/scaffold-component AppAlert --dir=common --variants` → alert với primary/warning/error variants
- `/scaffold-component NumberCard --dir=reading` → card hiển thị số phong thủy
- `/scaffold-component CreditBadge --dir=common` → badge hiển thị credits

## Các bước thực hiện

1. **Xác định component name và directory**
   - ComponentName phải PascalCase
   - `--dir` xác định thư mục: mặc định `common` nếu không chỉ định
   - Path: `fe/src/components/[dir]/[ComponentName].vue`

2. **Thiết kế Props interface**
   - Dùng `defineProps<{ ... }>()` với TypeScript generics (KHÔNG dùng `defineProps({...})` runtime syntax)
   - Đặt giá trị mặc định với `withDefaults(defineProps<...>(), { ... })`
   - Nếu có variants: prop `variant: 'primary' | 'secondary' | 'ghost' | 'danger'`
   - Nếu có sizes: prop `size: 'sm' | 'md' | 'lg'`

3. **Thiết kế Emits**
   - Dùng `defineEmits<{ ... }>()` với TypeScript generics
   - Luôn emit theo event naming: `update:modelValue`, `click`, `submit`, `close`, `change`

4. **Xây dựng template**
   - KHÔNG hardcode màu hex trong class
   - Dùng computed cho dynamic classes (variant map, size map)
   - Cung cấp `<slot>` và named slots khi phù hợp
   - Áp dụng `transition-all duration-300` cho hover/active states

5. **Nếu `--variants` flag**: tạo variantClasses map**
   - Map variant → Tailwind token classes
   - Dùng computed để pick đúng classes

6. **Đăng ký global nếu là common component** (hướng dẫn, không tự động)
   - Ghi chú ở cuối file nếu cần import thủ công ở `main.ts`

## Convention & Patterns

### Pattern cơ bản (AppBadge ví dụ):
```vue
<template>
  <span :class="badgeClasses">
    <slot />
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  variant?: 'default' | 'gold' | 'mystic' | 'success' | 'warning' | 'danger'
  size?: 'sm' | 'md' | 'lg'
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  size: 'md',
})

const variantClasses: Record<NonNullable<Props['variant']>, string> = {
  default:  'bg-bg-elevated text-text-secondary border-border-subtle',
  gold:     'bg-accent-gold/10 text-accent-gold border-accent-gold/30',
  mystic:   'bg-accent-mystic/10 text-accent-mystic border-accent-mystic/30',
  success:  'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  warning:  'bg-amber-500/10 text-amber-400 border-amber-500/30',
  danger:   'bg-red-500/10 text-red-400 border-red-500/30',
}

const sizeClasses: Record<NonNullable<Props['size']>, string> = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-2.5 py-1',
  lg: 'text-base px-3 py-1.5',
}

const badgeClasses = computed(() => [
  'inline-flex items-center gap-1 rounded-full border font-medium',
  variantClasses[props.variant],
  sizeClasses[props.size],
])
</script>
```

### Pattern cho interactive component (AppButton):
```vue
<template>
  <button
    :class="buttonClasses"
    :disabled="disabled || loading"
    @click="emit('click', $event)"
  >
    <AppSpinner v-if="loading" size="sm" class="mr-2" />
    <slot />
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import AppSpinner from './AppSpinner.vue'

interface Props {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
  fullWidth?: boolean
}

interface Emits {
  (e: 'click', event: MouseEvent): void
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  disabled: false,
  loading: false,
  fullWidth: false,
})

const emit = defineEmits<Emits>()

const variantClasses: Record<NonNullable<Props['variant']>, string> = {
  primary:   'gradient-gold text-bg-base font-semibold shadow-glow-gold hover:shadow-glow-gold/80',
  secondary: 'bg-bg-elevated border border-border-glow text-text-primary hover:bg-bg-surface',
  ghost:     'bg-transparent text-text-secondary hover:text-text-primary hover:bg-bg-elevated',
  danger:    'bg-red-600/20 border border-red-500/30 text-red-400 hover:bg-red-600/30',
}

const sizeClasses: Record<NonNullable<Props['size']>, string> = {
  sm: 'text-sm px-3 py-1.5 rounded-lg',
  md: 'text-base px-5 py-2.5 rounded-xl',
  lg: 'text-lg px-7 py-3.5 rounded-xl',
}

const buttonClasses = computed(() => [
  'inline-flex items-center justify-center transition-all duration-300',
  'disabled:opacity-50 disabled:cursor-not-allowed',
  variantClasses[props.variant],
  sizeClasses[props.size],
  props.fullWidth && 'w-full',
])
</script>
```

### Pattern có named slots (AppModal):
```vue
<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="modelValue"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <!-- Backdrop -->
        <div
          class="absolute inset-0 bg-bg-base/80 backdrop-blur-sm"
          @click="emit('update:modelValue', false)"
        />

        <!-- Modal Panel -->
        <div class="relative z-10 w-full max-w-lg backdrop-blur-md bg-bg-card/90 border border-border-glow rounded-2xl shadow-glow-mystic">
          <!-- Header -->
          <div class="flex items-center justify-between p-6 border-b border-border-subtle">
            <slot name="header">
              <h2 class="text-xl font-serif text-text-primary">{{ title }}</h2>
            </slot>
            <button
              class="text-text-muted hover:text-text-primary transition-colors"
              @click="emit('update:modelValue', false)"
            >
              <span class="sr-only">Đóng</span>
              ✕
            </button>
          </div>

          <!-- Body -->
          <div class="p-6">
            <slot />
          </div>

          <!-- Footer -->
          <div v-if="$slots.footer" class="p-6 pt-0">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
interface Props {
  modelValue: boolean
  title?: string
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()
</script>
```

### Pattern cho reading/numerology component (NumberCard):
```vue
<template>
  <div class="backdrop-blur-md bg-bg-card/80 border border-border-glow rounded-xl p-6 shadow-card transition-all duration-300 hover:shadow-glow-mystic hover:border-accent-mystic/50">
    <!-- Con số - dùng font-serif (Cormorant Garamond) -->
    <div class="text-6xl font-serif text-accent-gold shadow-glow-gold text-center mb-4">
      {{ number }}
    </div>
    <h3 class="text-lg font-semibold text-text-primary text-center mb-2">{{ title }}</h3>
    <p class="text-text-secondary text-sm text-center">{{ description }}</p>
  </div>
</template>

<script setup lang="ts">
interface Props {
  number: number | string
  title: string
  description?: string
  glowColor?: 'gold' | 'mystic' | 'neon'
}

withDefaults(defineProps<Props>(), {
  description: '',
  glowColor: 'gold',
})
</script>
```

## Design System Rules

- **TUYỆT ĐỐI không** dùng màu hex hoặc RGB trực tiếp trong class
- Glassmorphism: `backdrop-blur-md bg-bg-card/80 border border-border-glow rounded-xl shadow-card`
- Hover glow: `hover:shadow-glow-gold`, `hover:shadow-glow-mystic`, `hover:shadow-glow-neon`
- Primary CTA: `gradient-gold text-bg-base shadow-glow-gold`
- Mystic CTA: `gradient-mystic text-white shadow-glow-mystic`
- Số phong thủy: `font-serif` class (maps to Cormorant Garamond)
- Transition: `transition-all duration-300` trên mọi interactive element
- Border glow: `border-border-glow` (rgba của mystic) cho cards, `border-border-subtle` cho dividers

## Checklist sau khi hoàn thành

- [ ] File tạo đúng path `fe/src/components/[dir]/[ComponentName].vue`
- [ ] `defineProps<{}>()` dùng TypeScript generics (không dùng runtime syntax)
- [ ] `defineEmits<{}>()` có đầy đủ events cần thiết
- [ ] `withDefaults()` cho tất cả optional props
- [ ] Không có màu hex hardcode trong template hoặc style
- [ ] Có `<slot>` và named slots khi phù hợp
- [ ] Variant map dùng object literal (không dùng if/else chain)
- [ ] `transition-all duration-300` trên interactive elements
- [ ] Số phong thủy dùng `font-serif` class
- [ ] Component có thể dùng độc lập (không phụ thuộc vào store trừ khi thực sự cần)
