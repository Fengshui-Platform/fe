<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useReadingStore } from '@/stores/reading'
import { useAuthStore } from '@/stores/auth'
import { useUIStore } from '@/stores/ui'
import { readingService } from '@/services/reading.service'
import { type AxiosError } from 'axios'
import AppButton from '@/components/common/AppButton.vue'
import AppInput from '@/components/common/AppInput.vue'
import AppDatePicker from '@/components/common/AppDatePicker.vue'
import AstroBackground from '@/components/layout/AstroBackground.vue'
import { useReadingForm } from '@/composables/useReadingForm'
import { useCheapestPackage } from '@/composables/useCheapestPackage'

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

const { isForOther, viewForOther, viewForSelf } = useReadingForm(() => auth.user, form)

const { cheapestFromLabel, fetchIfNeeded } = useCheapestPackage()
onMounted(fetchIfNeeded)

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
      for_other: isForOther.value || undefined,
    }

    if (auth.hasActiveCredits) {
      // User has active credits → skip free, return full paid result (no locked sections)
      const { readingId, result } = await readingService.paidReading('numerology', input)
      readingStore.setResult(readingId, 'numerology', result, input)
      await auth.fetchMe()
      router.push({ name: 'Result' })
    } else {
      // No credits or not logged in → try free reading
      const { readingId, result } = await readingService.freeReading('numerology', input)
      readingStore.setResult(readingId, 'numerology', result, input)
      router.push({ name: 'Result' })
    }
  } catch (err) {
    const e = err as AxiosError<{ error?: { code?: string; message?: string } }>
    const code = e.response?.data?.error?.code
    if (code === 'FREE_LIMIT') {
      if (!auth.isLoggedIn) {
        ui.toast.warning('Bạn đã dùng hết lượt miễn phí hôm nay. Đăng nhập và mua lượt để xem đầy đủ.')
      } else {
        ui.toast.warning('Bạn đã dùng hết lượt miễn phí hôm nay. Mua lượt để xem đầy đủ không giới hạn.')
        router.push({ name: 'BuyCredits' })
      }
    } else if (e.response?.status === 402) {
      if (code === 'CREDITS_FROZEN') {
        ui.toast.warning('Lượt của bạn đang bị đóng băng. Gia hạn để tiếp tục.')
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

const modules = [
  { symbol: '☽',  symbolClass: 'text-rose-300',     frameClass: 'border-rose-400/40 text-rose-300', element: '姻緣', elemClass: 'text-rose-300/80 bg-rose-500/8 border-rose-400/25', name: 'Tình duyên',      desc: 'Luận tương hợp theo ngày sinh, hợp số và con đường tình cảm', free: false, route: 'love' },
  { symbol: '☉',  symbolClass: 'text-amber-300',    frameClass: 'border-amber-400/40 text-amber-300', element: '財祿', elemClass: 'text-amber-300/80 bg-amber-500/8 border-amber-400/25', name: 'Tài lộc',        desc: 'Năm tài lộc vượng suy, tháng tốt xấu, hướng phát tài theo mệnh số', free: false, route: 'finance' },
  { symbol: '☿',  symbolClass: 'text-cyan-300',     frameClass: 'border-cyan-400/40 text-cyan-300', element: '水靈', elemClass: 'text-cyan-300/80 bg-cyan-500/8 border-cyan-400/25',   name: 'Sim phong thuỷ', desc: 'Giải mã năng lượng ẩn sau dãy số điện thoại theo thần số học', free: false, route: 'sim' },
  { symbol: '⊕',  symbolClass: 'text-emerald-300',  frameClass: 'border-emerald-400/40 text-emerald-300', element: '風水', elemClass: 'text-emerald-300/80 bg-emerald-500/8 border-emerald-400/25', name: 'Phong thuỷ nhà ở', desc: 'Hướng nhà vượng khí, bố trí nội thất hài hoà theo bát quái và cung mệnh', free: false, route: 'fengshui_home' },
  { symbol: '✦',  symbolClass: 'text-purple-300',   frameClass: 'border-purple-400/40 text-purple-300', element: '紫微', elemClass: 'text-purple-300/80 bg-purple-500/8 border-purple-400/25', name: 'Tử vi năm',      desc: 'Lá số tử vi, luận vận hạn từng năm và những bước ngoặt định mệnh', free: false, route: 'horoscope' },
  { symbol: '♈',  symbolClass: 'text-indigo-300',  frameClass: 'border-indigo-400/40 text-indigo-300', element: '星座', elemClass: 'text-indigo-300/80 bg-indigo-500/8 border-indigo-400/25', name: 'Cung Hoàng Đạo', desc: 'Khám phá bí mật 12 cung hoàng đạo phương Tây, kết hợp thần số để hiểu sâu vận mệnh', free: false, route: 'zodiac' },
]

function goToModule(mod: typeof modules[0]) {
  if (mod.free) {
    // scroll to form
    document.querySelector('form')?.scrollIntoView({ behavior: 'smooth' })
    return
  }
  if (!auth.isLoggedIn) {
    router.push({ name: 'Login', query: { redirect: `/reading/${mod.route}` } })
    return
  }
  router.push({ name: 'Reading', params: { module: mod.route! } })
}
</script>

<template>
  <div class="flex flex-col flex-1">

    <!-- ══════════════════════════════════════════════════
         HERO
    ══════════════════════════════════════════════════ -->
    <section class="relative flex-1 flex flex-col items-center justify-center px-4 py-24 overflow-hidden min-h-[92vh]">

      <!-- Cinematic astro background -->
      <AstroBackground />

      <!-- ── Badge ── -->
      <div class="relative mb-10 text-center">
        <div class="inline-flex items-center gap-3 px-6 py-2.5
                    bg-bg-card/70 backdrop-blur-md
                    border border-gold/25 rounded-full
                    text-sm shadow-glow-gold/15">
          <span class="text-gold animate-shimmer-gold text-base">✦</span>
          <span class="font-serif tracking-widest text-gold/85 uppercase text-xs">Thiên Cơ · Huyền Cơ · Tâm Đức</span>
          <span class="text-gold animate-shimmer-gold text-base" style="animation-delay:1.8s">✦</span>
        </div>
      </div>

      <!-- ── Heading ── -->
      <div class="relative text-center mb-12 max-w-3xl">
        <h1 class="font-serif font-bold text-5xl md:text-7xl text-text-primary leading-[1.12] tracking-tight mb-6">
          Phong Thuỷ<br/>
          <span class="gradient-text-gold">Tâm Đức</span>
        </h1>
        <p class="text-text-secondary text-lg md:text-xl leading-relaxed max-w-xl mx-auto">
          Khai mở thiên cơ · Định hướng vận mệnh · Huyền học phương Đông —
          <span class="text-mystic-glow italic">chính xác · cá nhân hoá · chuyên sâu</span>
        </p>

        <!-- Ornate divider below heading -->
        <div class="divider-mystic mt-8 px-8 md:px-20">
          <span class="text-gold/50 text-xl leading-none">☯</span>
        </div>
      </div>

      <!-- ── Oracle form card ── -->
      <div class="relative w-full max-w-md">
        <!-- Outer pulse ring -->
        <div class="absolute -inset-3 rounded-3xl bg-mystic/8 animate-pulse-ring blur-lg -z-10" />

        <!-- Card -->
        <div class="divination-card bg-bg-card/92 backdrop-blur-xl rounded-2xl shadow-glow-mystic overflow-hidden">
          <!-- Top accent bar -->
          <div class="h-px bg-gradient-to-r from-transparent via-gold/60 to-transparent" />

          <div class="p-7">
            <!-- Card header -->
            <div class="text-center mb-7">
              <div class="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-mystic/15 border border-mystic/35 mb-4 text-2xl animate-shimmer-gold text-gold">
                ✦
              </div>
              <h2 class="font-serif text-xl text-gold mb-1">
                Thần Số Học
              </h2>
              <p class="text-xs text-white/50 tracking-wider uppercase">
                {{ auth.hasActiveCredits ? 'Luận giải đầy đủ · 1 lượt' : 'Miễn phí · 1 lần / ngày' }}
              </p>
            </div>

            <!-- Who are you viewing for? (logged-in only) -->
            <div v-if="auth.isLoggedIn" class="flex items-center justify-between mb-4 px-3 py-2 rounded-lg bg-bg-elevated/60 border border-border-subtle">
              <div class="flex items-center gap-2 text-xs text-text-secondary">
                <span class="text-gold">✦</span>
                <span v-if="!isForOther">Đang xem cho: <span class="text-text-primary font-medium">{{ auth.user?.full_name }}</span></span>
                <span v-else class="text-text-muted">Đang xem cho người khác</span>
              </div>
              <button
                type="button"
                class="text-xs text-mystic-glow hover:text-mystic transition-colors font-medium"
                @click="isForOther ? viewForSelf() : viewForOther()"
              >
                {{ isForOther ? '← Xem cho bản thân' : 'Xem cho người khác →' }}
              </button>
            </div>

            <form @submit.prevent="submit" class="space-y-4">
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
                  Đang luận giải...
                </template>
                <template v-else-if="auth.hasActiveCredits">
                  ✦ Xem đầy đủ — 1 lượt
                </template>
                <template v-else>
                  ✦ Xem ngay — Miễn phí
                </template>
              </AppButton>
            </form>

            <p class="text-xs text-white/40 text-center mt-4 leading-relaxed">
              <template v-if="auth.hasActiveCredits">
                Tốn 1 lượt · Kết quả đầy đủ · Còn {{ auth.user?.credits_balance }} lượt
              </template>
              <template v-else>
                Miễn phí 1 lần / ngày · Không cần đăng ký
              </template>
            </p>
          </div>

          <!-- Bottom accent bar -->
          <div class="h-px bg-gradient-to-r from-transparent via-mystic/40 to-transparent" />
        </div>
      </div>
    </section>

    <!-- ══════════════════════════════════════════════════
         SECTION SEPARATOR
    ══════════════════════════════════════════════════ -->
    <div class="relative py-6 overflow-hidden">
      <div class="absolute inset-0 bg-gradient-to-r from-transparent via-mystic/5 to-transparent" />
      <div class="divider-mystic max-w-4xl mx-auto px-8">
        <span class="text-gold/40 font-serif text-2xl leading-none tracking-widest">☰ ☱ ☲ ☳ ☴ ☵ ☶ ☷</span>
      </div>
    </div>

    <!-- ══════════════════════════════════════════════════
         MODULES
    ══════════════════════════════════════════════════ -->
    <section class="py-20 px-4 relative overflow-hidden">
      <!-- Ambient glow -->
      <div class="absolute inset-0 pointer-events-none overflow-hidden">
        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-mystic/5 rounded-full blur-[100px]" />
      </div>

      <div class="max-w-6xl mx-auto relative">
        <!-- Section header -->
        <div class="text-center mb-14">
          <p class="text-xs text-gold/60 tracking-[0.3em] uppercase mb-3 font-serif">Thiên Cơ Luận Giải</p>
          <h2 class="font-serif text-4xl md:text-5xl text-text-primary mb-4">
            Thiên Cơ <span class="gradient-text-celestial">Huyền Học</span>
          </h2>
          <p class="text-text-secondary max-w-lg mx-auto">
            6 bộ môn phân tích chuyên sâu — trả phí 1 lượt, cá nhân hoá hoàn toàn
          </p>
        </div>

        <!-- Module grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <button
            v-for="mod in modules"
            :key="mod.name"
            type="button"
            @click="goToModule(mod)"
            class="module-card bg-bg-card border border-border-subtle rounded-2xl p-6 text-left group
                   hover:border-border-glow hover:shadow-glow-mystic"
          >
            <!-- Top row: symbol frame + element badge -->
            <div class="flex items-start justify-between mb-5">
              <!-- Symbol frame -->
              <div :class="`symbol-frame ${mod.frameClass} text-2xl font-serif`">
                {{ mod.symbol }}
              </div>
              <!-- Badges -->
              <div class="flex flex-col items-end gap-1.5">
                <span :class="`text-xs px-2 py-0.5 rounded-full border font-serif tracking-wider ${mod.elemClass}`">
                  {{ mod.element }}
                </span>
                <span
                  v-if="mod.free"
                  class="text-xs px-2 py-0.5 bg-emerald-500/12 text-emerald-300 border border-emerald-500/25 rounded-full"
                >
                  Miễn phí
                </span>
                <span
                  v-else
                  class="text-xs px-2 py-0.5 bg-gold/8 text-gold/80 border border-gold/20 rounded-full"
                >
                  1 lượt
                </span>
              </div>
            </div>

            <!-- Name + desc -->
            <h3 class="font-serif text-lg text-text-primary mb-2 group-hover:text-gold transition-colors duration-300">
              {{ mod.name }}
            </h3>
            <p class="text-sm text-text-secondary leading-relaxed">{{ mod.desc }}</p>

            <!-- Hover arrow -->
            <div class="flex items-center gap-1.5 mt-4 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-0 group-hover:translate-x-1">
              <span class="text-xs text-mystic-glow tracking-wider">Xem ngay</span>
              <span class="text-mystic-glow text-sm">→</span>
            </div>
          </button>
        </div>

        <!-- CTA -->
        <div class="text-center mt-12">
          <RouterLink to="/buy-credits">
            <AppButton size="lg">
              ✦ Mua lượt — {{ cheapestFromLabel || 'Xem ngay' }}
            </AppButton>
          </RouterLink>
          <p class="text-xs text-text-muted mt-3">Không giới hạn · Không hết hạn trong 50 ngày · Hoàn tiền nếu lỗi</p>
        </div>
      </div>
    </section>

    <!-- ══════════════════════════════════════════════════
         HOW IT WORKS
    ══════════════════════════════════════════════════ -->
    <section class="py-20 px-4 relative overflow-hidden">
      <!-- Background pattern -->
      <div class="absolute inset-0 pointer-events-none">
        <div class="absolute inset-0 bg-bg-surface/40" />
        <div class="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-mystic/20 to-transparent" />
        <div class="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/15 to-transparent" />
      </div>

      <div class="max-w-5xl mx-auto relative">
        <div class="text-center mb-14">
          <p class="text-xs text-gold/60 tracking-[0.3em] uppercase mb-3 font-serif">Quy Trình</p>
          <h2 class="font-serif text-4xl text-text-primary">Cách hoạt động</h2>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6 relative">
          <!-- Connector line (desktop only) -->
          <div class="hidden md:block absolute top-12 left-1/6 right-1/6 h-px bg-gradient-to-r from-transparent via-mystic/30 to-transparent" />

          <div
            v-for="(step, i) in [
              { num: '一', symbol: '✍', title: 'Nhập thông tin', desc: 'Điền họ tên và ngày sinh — hai yếu tố căn bản để luận giải vận số' },
              { num: '二', symbol: '☯', title: 'Thiên cơ luận giải', desc: 'Hệ thống phân tích chuyên sâu theo phương pháp phong thuỷ truyền thống' },
              { num: '三', symbol: '✦', title: 'Nhận kết quả', desc: 'Xem phân tích cá nhân hoá — vận mệnh, hướng đi và những lời khuyên huyền diệu' },
            ]"
            :key="i"
            class="flex flex-col items-center text-center"
          >
            <!-- Step icon -->
            <div class="relative mb-6">
              <div class="w-24 h-24 rounded-2xl bg-bg-card border border-border-glow flex items-center justify-center text-4xl text-gold/80 shadow-glow-mystic animate-glow-breathe"
                   :style="`animation-delay: ${i * 1.3}s`">
                {{ step.symbol }}
              </div>
              <!-- Chinese numeral -->
              <div class="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-bg-card border border-gold/30 flex items-center justify-center font-serif text-gold/70 text-sm">
                {{ step.num }}
              </div>
            </div>

            <h3 class="font-serif text-xl text-text-primary mb-3">{{ step.title }}</h3>
            <p class="text-sm text-text-secondary leading-relaxed max-w-xs">{{ step.desc }}</p>
          </div>
        </div>
      </div>
    </section>

  </div>
</template>
