<script setup lang="ts">
defineProps<{
  variant?: 'active' | 'frozen' | 'empty' | 'gold' | 'mystic' | 'neon' | 'default'
  size?: 'sm' | 'md'
}>()
</script>

<template>
  <span
    :class="[
      'inline-flex items-center gap-1 font-semibold rounded-full',
      size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-xs',
      {
        'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30': variant === 'active',
        'bg-amber-500/20 text-amber-300 border border-amber-500/30':       variant === 'frozen',
        'bg-red-500/20 text-red-300 border border-red-500/30':             variant === 'empty',
        'bg-gold/20 text-gold border border-gold/30':                      variant === 'gold',
        'bg-mystic/20 text-mystic-glow border border-mystic/30':           variant === 'mystic',
        'bg-neon/20 text-neon border border-neon/30':                      variant === 'neon',
        'bg-bg-elevated text-text-secondary border border-border-subtle':  !variant || variant === 'default',
      },
    ]"
  >
    <slot />
  </span>
</template>
