<script setup lang="ts">
defineProps<{
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
}>()
</script>

<template>
  <button
    :type="type ?? 'button'"
    :disabled="disabled || loading"
    :class="[
      'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed',
      {
        'px-3 py-1.5 text-sm': size === 'sm',
        'px-5 py-2.5 text-sm': !size || size === 'md',
        'px-8 py-3.5 text-base': size === 'lg',
      },
      {
        'bg-gradient-to-r from-gold to-amber-600 text-bg-base shadow-glow-gold hover:scale-105 hover:shadow-[0_0_30px_rgba(245,200,66,0.5)]':
          !variant || variant === 'primary',
        'bg-bg-elevated border border-border-glow text-text-primary hover:border-mystic hover:bg-bg-surface':
          variant === 'secondary',
        'text-text-secondary hover:text-text-primary hover:bg-bg-elevated':
          variant === 'ghost',
        'bg-red-600/20 border border-red-600/40 text-red-400 hover:bg-red-600/30':
          variant === 'danger',
      },
    ]"
  >
    <span v-if="loading" class="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
    <slot />
  </button>
</template>
