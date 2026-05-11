<script setup lang="ts">
import { ref, computed } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useUIStore } from '@/stores/ui'
import { authService } from '@/services/auth.service'
import AppBadge from '@/components/common/AppBadge.vue'

const auth = useAuthStore()
const ui = useUIStore()
const router = useRouter()
const menuOpen = ref(false)

const creditsLabel = computed(() => {
  if (!auth.user) return null
  const { credits_balance, credits_status } = auth.user
  if (credits_status === 'active')  return `${credits_balance} lượt`
  if (credits_status === 'frozen')  return `${credits_balance} lượt (đóng băng)`
  return 'Hết lượt'
})


async function logout() {
  try {
    await authService.logout()
  } catch { /* ignore */ }
  auth.clearUser()
  router.push({ name: 'Home' })
  ui.toast.success('Đã đăng xuất')
}
</script>

<template>
  <nav class="sticky top-0 z-40 bg-bg-card/85 backdrop-blur-xl relative">
    <!-- Celestial gradient bottom border -->
    <div class="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-mystic/60 via-40% to-transparent pointer-events-none" />

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16">

        <!-- Logo -->
        <RouterLink to="/" class="flex items-center gap-2.5 group">
          <span class="text-2xl animate-shimmer-gold select-none">☯</span>
          <div class="flex flex-col leading-none">
            <span class="font-serif font-semibold text-base text-gold group-hover:drop-shadow-[0_0_12px_rgba(245,200,66,0.7)] transition-all duration-300">
              Phong Thuỷ Tâm Đức
            </span>
            <span class="text-[9px] text-text-muted tracking-widest uppercase mt-0.5">Thiên Cơ · Huyền Mệnh</span>
          </div>
        </RouterLink>

        <!-- Desktop nav -->
        <div class="hidden md:flex items-center gap-6">
          <RouterLink
            v-if="auth.isLoggedIn"
            to="/history"
            class="text-sm text-text-secondary hover:text-gold transition-colors relative group py-1"
          >
            Lịch sử
            <span class="absolute -bottom-0.5 left-0 w-0 h-px bg-gold group-hover:w-full transition-all duration-300 rounded-full" />
          </RouterLink>

          <!-- Guest -->
          <template v-if="!auth.isLoggedIn">
            <RouterLink
              to="/login"
              class="text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              Đăng nhập
            </RouterLink>
            <RouterLink
              to="/register"
              class="text-sm px-4 py-2 rounded-xl bg-gradient-to-r from-gold to-amber-600 text-bg-base font-semibold hover:scale-105 transition-all shadow-glow-gold"
            >
              Đăng ký
            </RouterLink>
          </template>

          <!-- Logged in -->
          <template v-else>
            <!-- Credits badge — chỉ hiện khi đang active -->
            <RouterLink v-if="auth.hasActiveCredits" to="/buy-credits" class="hover:opacity-80 transition-opacity">
              <AppBadge variant="active">
                ✦ {{ creditsLabel }}
              </AppBadge>
            </RouterLink>

            <!-- User menu -->
            <div class="relative">
              <button
                @click="menuOpen = !menuOpen"
                class="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
              >
                <div class="w-8 h-8 rounded-full bg-mystic/20 border border-mystic/50 flex items-center justify-center text-mystic-glow font-semibold text-sm overflow-hidden ring-1 ring-mystic/20 ring-offset-1 ring-offset-bg-card">
                  <img v-if="auth.user?.avatar_url" :src="auth.user.avatar_url" :alt="auth.user.full_name" class="w-full h-full object-cover" />
                  <span v-else>{{ auth.user?.full_name?.[0]?.toUpperCase() }}</span>
                </div>
                <svg class="w-3.5 h-3.5 text-text-muted transition-transform duration-200" :class="menuOpen ? 'rotate-180' : ''" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                </svg>
              </button>

              <Transition name="dropdown">
                <div
                  v-if="menuOpen"
                  @click.stop
                  v-click-outside="() => menuOpen = false"
                  class="absolute right-0 top-full mt-2 w-52 bg-bg-card/95 backdrop-blur-xl border border-border-glow rounded-xl shadow-glow-mystic overflow-hidden"
                >
                  <!-- Gradient top accent -->
                  <div class="h-0.5 bg-gradient-to-r from-gold/60 via-mystic to-neon/60" />

                  <div class="px-4 py-3 border-b border-border-subtle">
                    <p class="text-sm font-medium text-text-primary truncate">{{ auth.user?.full_name }}</p>
                    <p class="text-xs text-text-muted truncate">{{ auth.user?.email }}</p>
                  </div>
                  <RouterLink
                    to="/profile"
                    @click="menuOpen = false"
                    class="flex items-center gap-2.5 px-4 py-2.5 text-sm text-text-secondary hover:text-gold hover:bg-bg-elevated transition-colors"
                  >
                    <span>👤</span> Hồ sơ
                  </RouterLink>
                  <RouterLink
                    to="/buy-credits"
                    @click="menuOpen = false"
                    class="flex items-center gap-2.5 px-4 py-2.5 text-sm text-text-secondary hover:text-gold hover:bg-bg-elevated transition-colors"
                  >
                    <span>✦</span> Mua lượt
                  </RouterLink>
                  <RouterLink
                    to="/history?tab=orders"
                    @click="menuOpen = false"
                    class="flex items-center gap-2.5 px-4 py-2.5 text-sm text-text-secondary hover:text-gold hover:bg-bg-elevated transition-colors"
                  >
                    <span>💳</span> Lịch sử giao dịch
                  </RouterLink>
                  <RouterLink
                    v-if="auth.isAdmin"
                    to="/admin"
                    @click="menuOpen = false"
                    class="flex items-center gap-2.5 px-4 py-2.5 text-sm text-mystic-glow hover:bg-bg-elevated transition-colors"
                  >
                    <span>🛡</span> Admin
                  </RouterLink>
                  <hr class="border-border-subtle mx-3" />
                  <button
                    @click="logout(); menuOpen = false"
                    class="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <span>🚪</span> Đăng xuất
                  </button>
                </div>
              </Transition>
            </div>
          </template>
        </div>

        <!-- Mobile hamburger -->
        <button
          @click="menuOpen = !menuOpen"
          class="md:hidden text-text-secondary hover:text-gold p-2 transition-colors"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path v-if="!menuOpen" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
            <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <!-- Mobile menu -->
      <Transition name="slide">
        <div v-if="menuOpen" class="md:hidden pb-4 space-y-1 border-t border-border-subtle pt-3">
          <RouterLink
            to="/history"
            @click="menuOpen=false"
            class="flex items-center gap-2 py-2.5 px-3 text-sm text-text-secondary hover:text-gold rounded-lg hover:bg-bg-elevated transition-colors"
          >
            ☯ Lịch sử
          </RouterLink>
          <template v-if="!auth.isLoggedIn">
            <RouterLink
              to="/login"
              @click="menuOpen=false"
              class="flex items-center gap-2 py-2.5 px-3 text-sm text-text-secondary hover:text-gold rounded-lg hover:bg-bg-elevated transition-colors"
            >
              Đăng nhập
            </RouterLink>
            <RouterLink
              to="/register"
              @click="menuOpen=false"
              class="flex items-center gap-2 py-2.5 px-3 text-sm text-gold rounded-lg hover:bg-bg-elevated transition-colors"
            >
              ✦ Đăng ký
            </RouterLink>
          </template>
          <template v-else>
            <RouterLink
              v-if="auth.hasActiveCredits"
              to="/buy-credits"
              @click="menuOpen=false"
              class="flex items-center gap-2 py-2.5 px-3 text-sm text-text-secondary hover:text-gold rounded-lg hover:bg-bg-elevated transition-colors"
            >
              ✦ {{ creditsLabel }}
            </RouterLink>
            <RouterLink
              to="/profile"
              @click="menuOpen=false"
              class="flex items-center gap-2 py-2.5 px-3 text-sm text-text-secondary hover:text-gold rounded-lg hover:bg-bg-elevated transition-colors"
            >
              👤 Hồ sơ
            </RouterLink>
            <button
              @click="logout(); menuOpen=false"
              class="w-full flex items-center gap-2 py-2.5 px-3 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
            >
              🚪 Đăng xuất
            </button>
          </template>
        </div>
      </Transition>
    </div>
  </nav>
</template>

<style scoped>
.dropdown-enter-active, .dropdown-leave-active { transition: all 0.15s ease; }
.dropdown-enter-from, .dropdown-leave-to { opacity: 0; transform: translateY(-8px); }
.slide-enter-active, .slide-leave-active { transition: all 0.2s ease; }
.slide-enter-from, .slide-leave-to { opacity: 0; transform: translateY(-8px); }
</style>
