<script setup lang="ts">
import { computed } from 'vue'
import DatePicker from 'primevue/datepicker'

const props = defineProps<{
  modelValue: string  // '' | 'YYYY-MM-DD'
  label?: string
  error?: string
  required?: boolean
}>()

const emit = defineEmits<{ (e: 'update:modelValue', val: string): void }>()

const currentYear = new Date().getFullYear()

const dateModel = computed<Date | null>({
  get() {
    if (!props.modelValue) return null
    const [y, m, d] = props.modelValue.split('-').map(Number)
    if (!y || !m || !d) return null
    return new Date(y, m - 1, d)
  },
  set(val: Date | null) {
    if (!val) { emit('update:modelValue', ''); return }
    const y = val.getFullYear()
    const m = String(val.getMonth() + 1).padStart(2, '0')
    const d = String(val.getDate()).padStart(2, '0')
    emit('update:modelValue', `${y}-${m}-${d}`)
  },
})
</script>

<template>
  <div class="space-y-1.5">
    <label v-if="label" class="block text-sm font-medium text-text-secondary">
      {{ label }}
      <span v-if="required" class="text-gold ml-0.5">*</span>
    </label>

    <DatePicker
      v-model="dateModel"
      date-format="dd/mm/yy"
      show-icon
      icon-display="input"
      placeholder="DD/MM/YYYY"
      :max-date="new Date()"
      :min-date="new Date(currentYear - 100, 0, 1)"
      :invalid="!!error"
      :manual-input="true"
      show-button-bar
      class="fsp-datepicker"
    />

    <p v-if="error" class="text-xs text-red-400 flex items-center gap-1">
      <span>⚠</span> {{ error }}
    </p>
  </div>
</template>

<style>
/* ── Root fluid width ─────────────────────────────────── */
.fsp-datepicker,
.fsp-datepicker .p-datepicker {
  width: 100%;
}

/* ── Input wrapper ────────────────────────────────────── */
.fsp-datepicker .p-datepicker-input {
  width: 100%;
  background: #1e1e30 !important;
  border: 1px solid #1e1e30 !important;
  border-radius: 0.5rem !important;
  padding: 0.625rem 1rem !important;
  color: #f1f0ff !important;
  font-family: inherit !important;
  font-size: 0.875rem !important;
  outline: none !important;
  box-shadow: none !important;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.fsp-datepicker .p-datepicker-input::placeholder {
  color: #4b4870 !important;
}

.fsp-datepicker .p-datepicker-input:focus {
  border-color: #7c3aed !important;
  box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.2) !important;
}

/* ── Icon button inside input ─────────────────────────── */
.fsp-datepicker .p-datepicker-input-icon-container {
  color: #4b4870;
}

/* ── Invalid state ────────────────────────────────────── */
.fsp-datepicker .p-invalid .p-datepicker-input,
.fsp-datepicker.p-invalid .p-datepicker-input {
  border-color: rgba(239, 68, 68, 0.6) !important;
}

/* ── Popup panel ──────────────────────────────────────── */
.p-datepicker-panel {
  background: #161625 !important;
  border: 1px solid #1e1e30 !important;
  border-radius: 1rem !important;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6) !important;
  color: #f1f0ff !important;
  font-family: inherit !important;
}

/* ── Month/year header ────────────────────────────────── */
.p-datepicker-panel .p-datepicker-header {
  background: transparent !important;
  border-bottom: 1px solid #1e1e30 !important;
  color: #f1f0ff !important;
}

.p-datepicker-panel .p-datepicker-title button,
.p-datepicker-panel .p-datepicker-prev-button,
.p-datepicker-panel .p-datepicker-next-button {
  background: transparent !important;
  border: none !important;
  color: #9590b8 !important;
  border-radius: 0.5rem !important;
  transition: background 0.15s, color 0.15s;
}

.p-datepicker-panel .p-datepicker-title button:hover,
.p-datepicker-panel .p-datepicker-prev-button:hover,
.p-datepicker-panel .p-datepicker-next-button:hover {
  background: #1e1e30 !important;
  color: #f1f0ff !important;
}

/* ── Day-of-week header ───────────────────────────────── */
.p-datepicker-panel .p-datepicker-weekday {
  color: #4b4870 !important;
  font-size: 0.75rem !important;
}

/* ── Day cells ────────────────────────────────────────── */
.p-datepicker-panel .p-datepicker-day-cell span {
  border-radius: 0.5rem !important;
  transition: background 0.15s, color 0.15s;
}

.p-datepicker-panel .p-datepicker-day-cell span:hover {
  background: #1e1e30 !important;
  color: #f1f0ff !important;
}

.p-datepicker-panel .p-datepicker-day-cell.p-datepicker-today span {
  border: 1px solid #f5c842 !important;
  color: #f5c842 !important;
  background: transparent !important;
}

.p-datepicker-panel .p-datepicker-day-cell span.p-datepicker-day-selected {
  background: #7c3aed !important;
  color: #ffffff !important;
}

/* ── Other-month days ─────────────────────────────────── */
.p-datepicker-panel .p-datepicker-day-cell.p-datepicker-other-month span {
  color: #4b4870 !important;
}

/* ── Month/year overlay cells ─────────────────────────── */
.p-datepicker-panel .p-datepicker-month,
.p-datepicker-panel .p-datepicker-year {
  border-radius: 0.5rem !important;
  color: #f1f0ff !important;
  transition: background 0.15s;
}

.p-datepicker-panel .p-datepicker-month:hover,
.p-datepicker-panel .p-datepicker-year:hover {
  background: #1e1e30 !important;
}

.p-datepicker-panel .p-datepicker-month.p-datepicker-month-selected,
.p-datepicker-panel .p-datepicker-year.p-datepicker-year-selected {
  background: #7c3aed !important;
  color: #ffffff !important;
}

/* ── Button bar (Today / Clear) ───────────────────────── */
.p-datepicker-panel .p-datepicker-buttonbar {
  border-top: 1px solid #1e1e30 !important;
}

.p-datepicker-panel .p-datepicker-today-button,
.p-datepicker-panel .p-datepicker-clear-button {
  font-family: inherit !important;
  font-size: 0.8rem !important;
  color: #a855f7 !important;
  background: transparent !important;
  border: none !important;
}

.p-datepicker-panel .p-datepicker-today-button:hover,
.p-datepicker-panel .p-datepicker-clear-button:hover {
  color: #7c3aed !important;
  text-decoration: underline;
}
</style>
