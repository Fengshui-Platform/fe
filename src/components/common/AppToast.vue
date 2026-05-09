<script setup lang="ts">
import type { Toast } from '@/stores/ui'
import { useUIStore } from '@/stores/ui'

defineProps<{ toast: Toast }>()
const uiStore = useUIStore()

const icons: Record<string, string> = {
  success: '✓',
  error:   '✕',
  warning: '⚠',
  info:    'ℹ',
}

const colors: Record<string, string> = {
  success: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
  error:   'border-red-500/40 bg-red-500/10 text-red-300',
  warning: 'border-amber-500/40 bg-amber-500/10 text-amber-300',
  info:    'border-mystic/40 bg-mystic/10 text-mystic-glow',
}
</script>

<template>
  <div
    :class="[
      'flex items-start gap-3 px-4 py-3 rounded-xl border backdrop-blur-md shadow-card',
      colors[toast.type],
    ]"
  >
    <span class="font-bold text-sm mt-0.5">{{ icons[toast.type] }}</span>
    <p class="text-sm flex-1">{{ toast.message }}</p>
    <button @click="uiStore.removeToast(toast.id)" class="opacity-60 hover:opacity-100 transition-opacity">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
      </svg>
    </button>
  </div>
</template>
