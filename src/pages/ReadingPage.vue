<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useReadingStore } from '@/stores/reading'
import { useAuthStore } from '@/stores/auth'
import { useUIStore } from '@/stores/ui'
import { readingService } from '@/services/reading.service'
import type { ReadingModule, ReadingInputDto } from '@/types/reading.types'
import { MODULE_LABELS, MODULE_ICONS } from '@/types/reading.types'
import type { AxiosError } from 'axios'
import AppButton from '@/components/common/AppButton.vue'
import AppInput from '@/components/common/AppInput.vue'
import AppDatePicker from '@/components/common/AppDatePicker.vue'
import AppSpinner from '@/components/common/AppSpinner.vue'

const route = useRoute()
const router = useRouter()
const readingStore = useReadingStore()
const auth = useAuthStore()
const ui = useUIStore()

const module = computed(() => route.params.module as ReadingModule)
const moduleLabel = computed(() => MODULE_LABELS[module.value] ?? module.value)
const moduleIcon  = computed(() => MODULE_ICONS[module.value] ?? '✨')

const VALID_MODULES: ReadingModule[] = ['numerology', 'love', 'finance', 'sim', 'fengshui_home', 'horoscope']

const HOUSE_DIRECTIONS = [
  'Bắc', 'Nam', 'Đông', 'Tây',
  'Đông Bắc', 'Đông Nam', 'Tây Bắc', 'Tây Nam',
]

const MODULE_DESC: Record<ReadingModule, string> = {
  numerology:    'Phân tích con số vận mệnh, đường đời và linh hồn của bạn',
  love:          'Phân tích sự tương hợp tình duyên giữa bạn và người ấy',
  finance:       'Dự báo vận tài lộc và định hướng tài chính phù hợp nhất',
  sim:           'Đánh giá năng lượng phong thuỷ của số điện thoại bạn đang dùng',
  fengshui_home: 'Phân tích phong thuỷ nhà ở theo hướng nhà và bản mệnh gia chủ',
  horoscope:     'Luận tử vi và dự báo vận hạn toàn diện cho năm hiện tại',
}

const form = reactive<ReadingInputDto & { partner_name: string; partner_birth_date: string; house_direction: string }>({
  full_name: '',
  birth_date: '',
  phone: '',
  gender: '',
  partner_name: '',
  partner_birth_date: '',
  house_direction: '',
})

const errors = reactive<Record<string, string>>({})
const isLoading = ref(false)

function validate(): boolean {
  const e: Record<string, string> = {}
  if (!form.full_name.trim())  e.full_name  = 'Vui lòng nhập họ tên'
  if (!form.birth_date)        e.birth_date = 'Vui lòng chọn ngày sinh'
  if (module.value === 'love') {
    if (!form.partner_name.trim())  e.partner_name  = 'Vui lòng nhập tên người thân / bạn đời'
    if (!form.partner_birth_date)   e.partner_birth_date = 'Vui lòng chọn ngày sinh của họ'
  }
  if (module.value === 'sim' && !form.phone?.trim()) {
    e.phone = 'Vui lòng nhập số điện thoại cần luận'
  }
  if (module.value === 'fengshui_home' && !form.house_direction) {
    e.house_direction = 'Vui lòng chọn hướng nhà'
  }
  Object.assign(errors, e)
  return Object.keys(e).length === 0
}

async function submit() {
  Object.keys(errors).forEach(k => delete errors[k])
  if (!validate()) return
  if (!auth.isLoggedIn) {
    router.push({ name: 'Login', query: { redirect: route.fullPath } })
    return
  }
  if (auth.user?.credits_status !== 'active') {
    ui.toast.warning('Bạn cần có lượt xem còn hiệu lực. Mua lượt để tiếp tục.')
    router.push({ name: 'BuyCredits' })
    return
  }

  isLoading.value = true
  try {
    const input: ReadingInputDto = {
      full_name:  form.full_name.trim(),
      birth_date: form.birth_date,
      phone:      form.phone?.trim() || undefined,
      gender:     form.gender || undefined,
    }
    if (module.value === 'love') {
      input.partner_name        = form.partner_name.trim()
      input.partner_birth_date  = form.partner_birth_date
    }
    if (module.value === 'fengshui_home') {
      input.house_direction = form.house_direction
    }

    const { readingId, result } = await readingService.paidReading(module.value, input)
    readingStore.setResult(readingId, module.value, result, input)
    await auth.fetchMe()
    router.push({ name: 'Result' })
  } catch (err) {
    const e = err as AxiosError<{ error?: { code?: string; message?: string } }>
    const code = e.response?.data?.error?.code
    if (e.response?.status === 402) {
      if (code === 'CREDITS_FROZEN') {
        ui.toast.warning('Lượt của bạn đang bị đóng băng. Mua thêm để giải băng.')
      } else {
        ui.toast.warning('Bạn đã hết lượt xem. Mua thêm để tiếp tục.')
      }
      router.push({ name: 'BuyCredits' })
    } else {
      ui.toast.error(e.response?.data?.error?.message ?? 'Có lỗi xảy ra, vui lòng thử lại')
    }
  } finally {
    isLoading.value = false
  }
}

// Redirect if module unknown
if (!VALID_MODULES.includes(module.value)) {
  router.replace({ name: 'Home' })
}
</script>

<template>
  <div class="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] px-4 py-12 relative">
    <!-- BG glows -->
    <div class="fixed inset-0 pointer-events-none">
      <div class="absolute top-1/4 left-1/4 w-96 h-96 bg-mystic/8 rounded-full blur-3xl" />
      <div class="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gold/5 rounded-full blur-3xl" />
      <div class="absolute top-1/2 left-1/2 -translate-x-1/2 w-64 h-64 bg-neon/4 rounded-full blur-3xl" />
    </div>

    <div class="relative w-full max-w-lg">
      <!-- Header -->
      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-mystic/20 border border-mystic/40 text-4xl mb-4 animate-glow-breathe">
          {{ moduleIcon }}
        </div>
        <h1 class="font-serif text-3xl gradient-text-gold mb-2">{{ moduleLabel }}</h1>
        <p class="text-text-secondary text-sm max-w-sm mx-auto">{{ MODULE_DESC[module] }}</p>

        <div class="inline-flex items-center gap-1.5 mt-3 px-3 py-1 bg-gold/10 border border-gold/25 rounded-full">
          <span class="text-gold text-sm">✦</span>
          <span class="text-gold text-xs font-medium">1 lượt · Bạn còn {{ auth.user?.credits_balance ?? 0 }} lượt</span>
        </div>
      </div>

      <!-- Form card with divination border -->
      <div class="divination-card rounded-2xl">
        <div class="backdrop-blur-md bg-bg-card/90 border border-border-glow rounded-2xl overflow-hidden shadow-glow-mystic">
          <div class="h-0.5 bg-gradient-to-r from-gold/60 via-mystic to-neon/60" />
          <div class="p-6">
            <form @submit.prevent="submit" class="space-y-4">

              <!-- Common fields -->
              <AppInput
                v-model="form.full_name"
                label="Họ và tên"
                placeholder="Nguyễn Văn An"
                :error="errors.full_name"
                required
              />
              <AppDatePicker
                v-model="form.birth_date"
                label="Ngày sinh"
                :error="errors.birth_date"
                required
              />

              <!-- Gender (most modules) -->
              <div v-if="module !== 'sim'" class="space-y-1.5">
                <label class="block text-sm font-medium text-text-secondary">Giới tính (tùy chọn)</label>
                <select
                  v-model="form.gender"
                  class="w-full bg-bg-elevated border border-border-subtle rounded-lg px-4 py-2.5 text-text-primary focus:outline-none focus:border-mystic focus:ring-1 focus:ring-mystic/30 transition-colors"
                >
                  <option value="">Chọn giới tính</option>
                  <option value="male">Nam</option>
                  <option value="female">Nữ</option>
                  <option value="other">Khác</option>
                </select>
              </div>

              <!-- Love: partner info -->
              <template v-if="module === 'love'">
                <div class="border-t border-border-subtle pt-4 mt-2">
                  <p class="text-xs text-text-muted mb-3 flex items-center gap-1.5">
                    <span class="text-mystic-glow">💕</span> Thông tin người thân / bạn đời
                  </p>
                  <div class="space-y-4">
                    <AppInput
                      v-model="form.partner_name"
                      label="Họ và tên"
                      placeholder="Trần Thị Bình"
                      :error="errors.partner_name"
                      required
                    />
                    <AppDatePicker
                      v-model="form.partner_birth_date"
                      label="Ngày sinh"
                      :error="errors.partner_birth_date"
                      required
                    />
                  </div>
                </div>
              </template>

              <!-- Sim: phone number to analyze -->
              <template v-else-if="module === 'sim'">
                <AppInput
                  v-model="form.phone"
                  label="Số điện thoại cần luận"
                  placeholder="0901234567"
                  type="tel"
                  :error="errors.phone"
                  required
                />
              </template>

              <!-- Fengshui home: house direction -->
              <template v-else-if="module === 'fengshui_home'">
                <div class="space-y-1.5">
                  <label class="block text-sm font-medium text-text-secondary">
                    Hướng nhà <span class="text-gold">*</span>
                  </label>
                  <select
                    v-model="form.house_direction"
                    class="w-full bg-bg-elevated border rounded-lg px-4 py-2.5 text-text-primary focus:outline-none focus:border-mystic focus:ring-1 focus:ring-mystic/30 transition-colors"
                    :class="errors.house_direction ? 'border-red-500' : 'border-border-subtle'"
                  >
                    <option value="">Chọn hướng nhà</option>
                    <option v-for="dir in HOUSE_DIRECTIONS" :key="dir" :value="dir">{{ dir }}</option>
                  </select>
                  <p v-if="errors.house_direction" class="text-xs text-red-400">{{ errors.house_direction }}</p>
                </div>
              </template>

              <!-- Submit -->
              <AppButton type="submit" size="lg" class="w-full mt-2" :loading="isLoading">
                <template v-if="isLoading">
                  <AppSpinner size="sm" /> Đang phân tích...
                </template>
                <template v-else>
                  ✨ Phân tích {{ moduleLabel }}
                </template>
              </AppButton>
            </form>

            <p class="text-xs text-text-muted text-center mt-4">
              Sẽ tiêu 1 lượt · Kết quả được lưu trong lịch sử
            </p>
          </div>
        </div>
      </div>

      <!-- Back link -->
      <div class="text-center mt-5">
        <RouterLink to="/" class="text-sm text-text-muted hover:text-gold transition-colors">
          ← Về trang chủ
        </RouterLink>
      </div>
    </div>
  </div>
</template>
