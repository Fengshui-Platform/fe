<script setup lang="ts">
import { RouterView } from 'vue-router'
import AdminSidebar from '@/components/layout/AdminSidebar.vue'
</script>

<template>
  <div class="bg-bg-base min-h-screen flex font-sans text-text-primary">
    <AdminSidebar />
    <div class="ml-64 flex-1 flex flex-col min-h-screen">
      <div class="flex-1 p-6">
        <RouterView />
      </div>
    </div>
  </div>
</template>
