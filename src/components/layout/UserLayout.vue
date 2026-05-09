<script setup lang="ts">
import TheNavbar from '@/components/layout/TheNavbar.vue'
import TheFooter from '@/components/layout/TheFooter.vue'
</script>

<template>
  <div class="bg-bg-base min-h-screen flex flex-col font-sans text-text-primary">
    <TheNavbar />
    <RouterView />
    <TheFooter />
  </div>
</template>
