import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User } from '@/types/user.types'
import { authService } from '@/services/auth.service'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)

  const isLoggedIn = computed(() => !!user.value)
  const isAdmin = computed(() => user.value?.role === 'admin')
  const hasActiveCredits = computed(() => user.value?.credits_status === 'active')
  const hasFrozenCredits = computed(
    () => user.value?.credits_status === 'frozen' && (user.value?.credits_balance ?? 0) > 0
  )

  async function fetchMe() {
    try {
      user.value = await authService.getMe()
    } catch {
      user.value = null
    }
  }

  function setUser(u: User) { user.value = u }
  function clearUser() { user.value = null }

  return {
    user, isLoggedIn, isAdmin, hasActiveCredits, hasFrozenCredits,
    fetchMe, setUser, clearUser,
  }
})
