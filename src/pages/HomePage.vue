<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useReadingStore } from '@/stores/reading'
import { useAuthStore } from '@/stores/auth'
import { useUIStore } from '@/stores/ui'
import { readingService } from '@/services/reading.service'
import { type AxiosError } from 'axios'
import AppButton from '@/components/common/AppButton.vue'
import AppInput from '@/components/common/AppInput.vue'
import AppSpinner from '@/components/common/AppSpinner.vue'

const router = useRouter()
const readingStore = useReadingStore()
const auth = useAuthStore()
const ui = useUIStore()

const form = reactive({
  full_name: '',
  birth_date: '',
  phone: '',
  gender: '',
})

const errors = reactive({ full_name: '', birth_date: '' })
const isLoading = ref(false)

function validate(): boolean {
  errors.full_name = form.full_name.trim() ? '' : 'Vui lòng nhập họ tên'
  errors.birth_date = form.birth_date ? '' : 'Vui lòng chọn ngày sinh'
  return !errors.full_name && !errors.birth_date
}

async function submit() {
  if (!validate()) return
  isLoading.value = true
  try {
    const input = {
      full_name: form.full_name.trim(),
      birth_date: form.birth_date,
      phone: form.phone || undefined,
      gender: form.gender || undefined,
    }
    const { readingId, result } = await readingService.freeReading('numerology', input)
    readingStore.setResult(readingId, 'numerology', result, input)
    router.push({ name: 'Result' })
  } catch (err) {
    const e = err as AxiosError<{ error?: { code?: string; message?: string } }>
    const code = e.response?.data?.error?.code
    if (code === 'FREE_LIMIT') {
      ui.toast.warning('Bạn đã dùng hết lượt miễn phí hôm nay. Đăng nhập và mua lượt để tiếp tục.')
    } else {
      ui.toast.error(e.response?.data?.error?.message ?? 'Có lỗi xảy ra, vui lòng thử lại')
    }
  } finally {
    isLoading.value = false
  }
}

const modules = [
  { icon: '🔢', name: 'Thần số học', desc: 'Khám phá con số vận mệnh, đường đời, linh hồn', free: true },
  { icon: '💕', name: 'Tình duyên', desc: 'Tương hợp theo ngày sinh và con số huyền bí', free: false },
  { icon: '💰', name: 'Tài lộc', desc: 'Năm tài lộc, tháng tốt xấu, hướng phát tài', free: false },
  { icon: '📱', name: 'Sim phong thuỷ', desc: 'Đánh giá số điện thoại theo thần số học', free: false },
  { icon: '🏠', name: 'Phong thuỷ nhà ở', desc: 'Hướng nhà, bố trí nội thất theo mệnh', free: false },
  { icon: '⭐', name: 'Tử vi năm', desc: 'Lá số tử vi, dự đoán vận hạn theo năm', free: false },
]
</script>

<template>
  <div class="flex flex-col flex-1">
    <!-- Hero -->
    <section class="relative flex-1 flex flex-col items-center justify-center px-4 py-20 overflow-hidden">
      <!-- BG glow effects -->
      <div class="absolute inset-0 pointer-events-none">
        <div class="absolute top-1/4 left-1/4 w-96 h-96 bg-mystic/10 rounded-full blur-3xl" />
        <div class="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gold/5 rounded-full blur-3xl" />
      </div>

      <!-- Heading -->
      <div class="relative text-center mb-10 max-w-2xl">
        <div class="inline-flex items-center gap-2 px-4 py-1.5 bg-mystic/20 border border-mystic/30 rounded-full text-sm text-mystic-glow mb-6">
          <span class="animate-pulse">✨</span> Phong thuỷ & Thần số học AI
        </div>
        <h1 class="font-serif text-4xl md:text-6xl text-text-primary mb-4 leading-tight">
          Khám phá <span class="gradient-text-gold">Vận mệnh</span><br/>của bạn
        </h1>
        <p class="text-text-secondary text-lg">
          Nhập thông tin cá nhân để nhận phân tích thần số học miễn phí ngay hôm nay
        </p>
      </div>

      <!-- Form card -->
      <div class="relative w-full max-w-md backdrop-blur-md bg-bg-card/80 border border-border-glow rounded-2xl p-6 shadow-glow-mystic">
        <h2 class="text-lg font-semibold text-text-primary mb-5 text-center">Xem thần số học miễn phí</h2>

        <form @submit.prevent="submit" class="space-y-4">
          <AppInput
            v-model="form.full_name"
            label="Họ và tên"
            placeholder="Nguyễn Văn An"
            :error="errors.full_name"
            required
          />

          <AppInput
            v-model="form.birth_date"
            label="Ngày sinh"
            type="date"
            :error="errors.birth_date"
            required
          />

          <AppInput
            v-model="form.phone"
            label="Số điện thoại (tùy chọn)"
            placeholder="0901234567"
            type="tel"
          />

          <div class="space-y-1.5">
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

          <AppButton type="submit" size="lg" class="w-full mt-2" :loading="isLoading">
            <template v-if="isLoading">
              <AppSpinner size="sm" /> Đang phân tích...
            </template>
            <template v-else>
              ✨ Xem ngay — Miễn phí
            </template>
          </AppButton>
        </form>

        <p class="text-xs text-text-muted text-center mt-4">
          Miễn phí 1 lần/ngày · Không cần đăng ký
        </p>
      </div>
    </section>

    <!-- Modules -->
    <section class="py-20 px-4 bg-bg-surface/50">
      <div class="max-w-6xl mx-auto">
        <div class="text-center mb-12">
          <h2 class="font-serif text-3xl text-text-primary mb-3">Khám phá toàn bộ vận mệnh</h2>
          <p class="text-text-secondary">6 module phân tích chuyên sâu — từ 79.000đ</p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            v-for="mod in modules"
            :key="mod.name"
            class="bg-bg-card border border-border-subtle rounded-xl p-5 hover:border-border-glow hover:shadow-glow-mystic transition-all duration-300 group"
          >
            <div class="flex items-start justify-between mb-3">
              <span class="text-3xl">{{ mod.icon }}</span>
              <span
                v-if="mod.free"
                class="text-xs px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full"
              >
                Miễn phí
              </span>
              <span
                v-else
                class="text-xs px-2 py-0.5 bg-gold/10 text-gold border border-gold/20 rounded-full"
              >
                1 lượt
              </span>
            </div>
            <h3 class="font-semibold text-text-primary mb-1 group-hover:text-gold transition-colors">{{ mod.name }}</h3>
            <p class="text-sm text-text-secondary">{{ mod.desc }}</p>
          </div>
        </div>

        <div class="text-center mt-10">
          <RouterLink to="/buy-credits">
            <AppButton size="lg">
              ⚡ Xem tất cả — Mua 20 lượt chỉ 79.000đ
            </AppButton>
          </RouterLink>
        </div>
      </div>
    </section>

    <!-- How it works -->
    <section class="py-16 px-4">
      <div class="max-w-4xl mx-auto text-center">
        <h2 class="font-serif text-3xl text-text-primary mb-10">Cách hoạt động</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div v-for="(step, i) in [
            { icon: '📝', title: 'Nhập thông tin', desc: 'Điền họ tên và ngày sinh của bạn vào form đơn giản' },
            { icon: '🤖', title: 'AI phân tích', desc: 'Hệ thống AI cao cấp phân tích con số và phong thuỷ của bạn' },
            { icon: '✨', title: 'Nhận kết quả', desc: 'Xem phân tích chuyên sâu và gợi ý cá nhân hoá' },
          ]" :key="i" class="flex flex-col items-center">
            <div class="w-16 h-16 rounded-2xl bg-mystic/20 border border-mystic/30 flex items-center justify-center text-3xl mb-4">
              {{ step.icon }}
            </div>
            <h3 class="font-semibold text-text-primary mb-2">{{ step.title }}</h3>
            <p class="text-sm text-text-secondary">{{ step.desc }}</p>
          </div>
        </div>
      </div>
    </section>

  </div>
</template>
