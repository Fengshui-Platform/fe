<script setup lang="ts">
defineProps<{ size?: 'sm' | 'md' | 'lg' }>()
</script>

<template>
  <div class="flex items-center justify-center">
    <div
      :class="{
        'w-5 h-5 border-2': size === 'sm',
        'w-8 h-8 border-2': !size || size === 'md',
        'w-12 h-12 border-3': size === 'lg',
      }"
      class="rounded-full border-mystic/30 border-t-mystic animate-spin"
    />
  </div>
</template>
