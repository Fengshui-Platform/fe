import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useTracker } from '@/composables/useTracker'
import UserLayout from '@/components/layout/UserLayout.vue'
import AuthLayout from '@/components/layout/AuthLayout.vue'
import AdminLayout from '@/components/layout/AdminLayout.vue'

const router = createRouter({
  history: createWebHistory(),
  scrollBehavior: () => ({ top: 0 }),
  routes: [
    // ── Auth pages (no navbar) ─────────────────────────────────
    {
      path: '/auth',
      component: AuthLayout,
      children: [
        { path: '/login',           name: 'Login',           component: () => import('@/pages/LoginPage.vue'),          meta: { guestOnly: true } },
        { path: '/register',        name: 'Register',        component: () => import('@/pages/RegisterPage.vue'),       meta: { guestOnly: true } },
        { path: '/forgot-password', name: 'ForgotPassword',  component: () => import('@/pages/ForgotPasswordPage.vue'), meta: { guestOnly: true } },
        { path: '/reset-password',  name: 'ResetPassword',   component: () => import('@/pages/ResetPasswordPage.vue') },
        { path: '/verify-email',    name: 'VerifyEmail',     component: () => import('@/pages/VerifyEmailPage.vue') },
      ],
    },

    // ── User pages (with navbar + footer) ──────────────────────
    {
      path: '/',
      component: UserLayout,
      children: [
        { path: '',                  name: 'Home',        component: () => import('@/pages/HomePage.vue') },
        { path: '/result',           name: 'Result',      component: () => import('@/pages/ResultPage.vue') },
        { path: '/reading/:module',  name: 'Reading',     component: () => import('@/pages/ReadingPage.vue'), meta: { requiresAuth: true } },
        { path: '/buy-credits',      name: 'BuyCredits',  component: () => import('@/pages/BuyCreditsPage.vue'), meta: { requiresAuth: true } },
        { path: '/history',          name: 'History',     component: () => import('@/pages/HistoryPage.vue'),    meta: { requiresAuth: true } },
        { path: '/profile',          name: 'Profile',     component: () => import('@/pages/ProfilePage.vue'),    meta: { requiresAuth: true } },
      ],
    },

    // ── Admin pages ────────────────────────────────────────────
    {
      path: '/admin',
      component: AdminLayout,
      meta: { requiresAdmin: true },
      children: [
        { path: '',               name: 'AdminDashboard', component: () => import('@/pages/admin/DashboardPage.vue') },
        { path: 'users',          name: 'AdminUsers',     component: () => import('@/pages/admin/UsersPage.vue') },
        { path: 'users/:id',      name: 'AdminUserDetail', component: () => import('@/pages/admin/UserDetailPage.vue') },
        { path: 'readings',       name: 'AdminReadings',  component: () => import('@/pages/admin/ReadingsPage.vue') },
        { path: 'credit-orders',  name: 'AdminOrders',    component: () => import('@/pages/admin/CreditOrdersPage.vue') },
        { path: 'credit-packages', name: 'AdminPackages', component: () => import('@/pages/admin/CreditPackagesPage.vue') },
        { path: 'ai-models',      name: 'AdminAIModels',  component: () => import('@/pages/admin/AIModelsPage.vue') },
        { path: 'settings',       name: 'AdminSettings',  component: () => import('@/pages/admin/SettingsPage.vue') },
        { path: 'traffic',        name: 'AdminTraffic',   component: () => import('@/pages/admin/TrafficPage.vue') },
      ],
    },

    // ── Catch-all ──────────────────────────────────────────────
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

router.beforeEach(async to => {
  const auth = useAuthStore()

  // Skip fetchMe on guest-only pages to avoid unnecessary 401 → refresh cycle
  if (auth.user === null && !to.meta.guestOnly) {
    await auth.fetchMe()
  }

  if (to.meta.requiresAuth && !auth.isLoggedIn) {
    return { name: 'Login', query: { redirect: to.fullPath } }
  }
  if (to.meta.requiresAdmin && auth.user?.role !== 'admin') {
    return { name: 'Home' }
  }
  if (to.meta.guestOnly && auth.isLoggedIn) {
    return { name: 'Home' }
  }
})

router.afterEach(to => {
  const { trackPage } = useTracker()
  const pageName = typeof to.name === 'string' ? to.name : to.path
  trackPage(pageName)
})

export default router
