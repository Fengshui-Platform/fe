<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  modelValue: string  // '' | 'YYYY-MM-DD'
  label?: string
  error?: string
  required?: boolean
}>()

const emit = defineEmits<{ (e: 'update:modelValue', val: string): void }>()

const displayValue = ref('')

function toDisplay(iso: string): string {
  if (!iso) return ''
  const parts = iso.split('-')
  if (parts.length !== 3) return ''
  const [y, m, d] = parts
  if (!y || !m || !d) return ''
  return `${d}/${m}/${y}`
}

function toISO(display: string): string {
  // Accept both dd/mm/yyyy and dd-mm-yyyy
  const normalized = display.replace(/-/g, '/')
  const parts = normalized.split('/')
  if (parts.length !== 3) return ''
  const [d, m, y] = parts
  if (d.length !== 2 || m.length !== 2 || y.length !== 4) return ''
  const dd = parseInt(d), mm = parseInt(m), yyyy = parseInt(y)
  if (dd < 1 || dd > 31 || mm < 1 || mm > 12 || yyyy < 1900 || yyyy > new Date().getFullYear()) return ''
  return `${y}-${m}-${d}`
}

watch(() => props.modelValue, (val) => {
  const display = toDisplay(val)
  if (display !== displayValue.value) displayValue.value = display
}, { immediate: true })

function handleInput(e: Event) {
  const input = e.target as HTMLInputElement

  // Normalize separators (dash/dot → slash), strip non-digit/non-slash
  let raw = input.value.replace(/[.\-]/g, '/').replace(/[^0-9/]/g, '')

  // Re-build from raw digits only to handle auto-slash
  const digits = raw.replace(/\//g, '')

  let formatted = digits.slice(0, 2)
  if (digits.length > 2) formatted += '/' + digits.slice(2, 4)
  if (digits.length > 4) formatted += '/' + digits.slice(4, 8)

  displayValue.value = formatted
  // Sync DOM value to formatted string
  input.value = formatted

  emit('update:modelValue', toISO(formatted))
}

function handleNativeChange(e: Event) {
  const val = (e.target as HTMLInputElement).value // YYYY-MM-DD from native picker
  if (!val) return
  displayValue.value = toDisplay(val)
  emit('update:modelValue', val)
}

const maxDate = new Date().toISOString().split('T')[0]
const minDate = `${new Date().getFullYear() - 100}-01-01`
</script>

<template>
  <div class="space-y-1.5">
    <label v-if="label" class="block text-sm font-medium text-text-secondary">
      {{ label }}<span v-if="required" class="text-gold ml-0.5">*</span>
    </label>

    <div class="relative">
      <!-- Text input: shows numeric keyboard on mobile, accepts typing on desktop -->
      <input
        type="text"
        inputmode="numeric"
        :value="displayValue"
        placeholder="DD/MM/YYYY"
        maxlength="10"
        autocomplete="off"
        class="w-full bg-bg-elevated border rounded-lg px-4 py-2.5 pr-10 text-text-primary text-sm outline-none transition-all duration-200 placeholder:text-text-muted"
        :class="error
          ? 'border-red-400/60 focus:border-red-400/80 focus:ring-1 focus:ring-red-400/20'
          : 'border-border-subtle focus:border-mystic focus:ring-1 focus:ring-mystic/20'"
        @input="handleInput"
      />

      <!-- Calendar icon — wraps a transparent native date input for the picker -->
      <label
        class="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-text-muted hover:text-text-secondary transition-colors"
        title="Chọn từ lịch"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="w-4 h-4 pointer-events-none"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
        <!-- Native date input overlaid on the icon — triggers OS date picker on click -->
        <input
          type="date"
          :value="modelValue"
          :max="maxDate"
          :min="minDate"
          class="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
          tabindex="-1"
          @change="handleNativeChange"
        />
      </label>
    </div>

    <p v-if="error" class="text-xs text-red-400 flex items-center gap-1">
      <span>⚠</span> {{ error }}
    </p>
  </div>
</template>
