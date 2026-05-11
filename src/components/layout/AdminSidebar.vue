<script setup lang="ts">
import { RouterLink, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { authService } from '@/services/auth.service'
import { useUIStore } from '@/stores/ui'

const auth = useAuthStore()
const ui = useUIStore()
const router = useRouter()

const navItems = [
  { icon: '📊', label: 'Tổng quan',      name: 'AdminDashboard' },
  { icon: '👥', label: 'Người dùng',     name: 'AdminUsers' },
  { icon: '📖', label: 'Lịch sử xem',   name: 'AdminReadings' },
  { icon: '💳', label: 'Đơn mua lượt',  name: 'AdminOrders' },
  { icon: '📦', label: 'Gói lượt',       name: 'AdminPackages' },
  { icon: '⚙️', label: 'Mô hình',         name: 'AdminAIModels' },
  { icon: '⚙️', label: 'Cài đặt',       name: 'AdminSettings' },
]

async function logout() {
  try {
    await authService.logout()
  } catch {
    // ignore
  } finally {
    auth.clearUser()
    router.push('/')
  }
}
</script>

<template>
  <aside class="w-64 bg-bg-surface border-r border-border-subtle h-screen fixed top-0 left-0 flex flex-col z-40">
    <!-- Header -->
    <div class="px-5 py-6 border-b border-border-subtle">
      <RouterLink :to="{ name: 'Home' }" class="flex items-center gap-2">
        <span class="font-serif text-xl text-gold">☯ Admin Panel</span>
      </RouterLink>
      <p class="text-xs text-text-muted mt-1">Phong Thuỷ Tâm Đức</p>
    </div>

    <!-- Nav -->
    <nav class="flex-1 py-4 overflow-y-auto">
      <ul class="space-y-1">
        <li v-for="item in navItems" :key="item.name">
          <RouterLink
            :to="{ name: item.name }"
            active-class="router-link-active"
            class="flex items-center gap-3 px-4 py-3 text-text-secondary hover:text-text-primary hover:bg-bg-elevated rounded-xl mx-2 transition-all"
            :class="{ 'bg-mystic/20 !text-mystic-glow border-l-2 border-mystic': $route.name === item.name }"
          >
            <span class="text-lg leading-none">{{ item.icon }}</span>
            <span class="text-sm font-medium">{{ item.label }}</span>
          </RouterLink>
        </li>
      </ul>
    </nav>

    <!-- Bottom: user info + logout -->
    <div class="p-4 border-t border-border-subtle">
      <div class="flex items-center gap-3 mb-3 px-2">
        <div class="w-8 h-8 rounded-full bg-mystic/30 flex items-center justify-center text-mystic-glow text-sm font-bold">
          {{ auth.user?.full_name?.charAt(0)?.toUpperCase() ?? 'A' }}
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-xs font-medium text-text-primary truncate">{{ auth.user?.full_name }}</p>
          <p class="text-xs text-text-muted truncate">{{ auth.user?.email }}</p>
        </div>
      </div>
      <button
        @click="logout"
        class="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-all"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
        Đăng xuất
      </button>
    </div>
  </aside>
</template>
