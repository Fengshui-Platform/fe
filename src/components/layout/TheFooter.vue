<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<template>
  <footer class="relative mt-auto">
    <!-- Gradient top border -->
    <div class="h-px bg-gradient-to-r from-transparent via-mystic/60 via-40% to-transparent" />

    <!-- Bagua trigrams bar -->
    <div class="bg-bg-card/50 border-b border-border-subtle py-3">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-center gap-5 sm:gap-8 text-lg text-text-muted/30 select-none tracking-widest">
          <span>☰</span>
          <span>☱</span>
          <span>☲</span>
          <span>☳</span>
          <span>☴</span>
          <span>☵</span>
          <span>☶</span>
          <span>☷</span>
        </div>
      </div>
    </div>

    <div class="bg-bg-card">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-10">

          <!-- Brand -->
          <div class="md:col-span-2">
            <div class="flex items-center gap-2.5 mb-4">
              <span class="text-2xl animate-shimmer-gold select-none">☯</span>
              <div class="leading-none">
                <span class="font-serif text-xl text-gold block">Phong Thuỷ Tâm Đức</span>
                <span class="text-[9px] text-text-muted tracking-widest uppercase">Thiên Cơ · Huyền Mệnh</span>
              </div>
            </div>
            <p class="text-sm text-text-muted max-w-xs leading-relaxed mb-5">
              Khám phá vận mệnh và phong thuỷ theo phương pháp truyền thống, phân tích cá nhân hoá chuyên sâu.
            </p>
            <!-- Celestial glyphs -->
            <div class="flex gap-3 text-base text-text-muted/35 select-none font-serif">
              <span title="Mệnh Số">命</span>
              <span title="Tình Duyên">緣</span>
              <span title="Tài Lộc">財</span>
              <span title="Phong Thuỷ">水</span>
              <span title="Tinh Tú">✦</span>
            </div>
          </div>

          <!-- Dịch vụ -->
          <div>
            <h4 class="text-[10px] font-semibold text-gold/60 uppercase tracking-widest mb-4">Dịch vụ</h4>
            <ul class="space-y-2.5 text-sm text-text-muted">
              <li>
                <RouterLink to="/" class="hover:text-gold transition-colors inline-flex items-center gap-1.5">
                  <span class="text-xs text-gold/40">✦</span> Thần số học
                </RouterLink>
              </li>
              <li>
                <RouterLink to="/buy-credits" class="hover:text-gold transition-colors inline-flex items-center gap-1.5">
                  <span class="text-xs text-gold/40">☽</span> Tình duyên
                </RouterLink>
              </li>
              <li>
                <RouterLink to="/buy-credits" class="hover:text-gold transition-colors inline-flex items-center gap-1.5">
                  <span class="text-xs text-gold/40">☉</span> Tài lộc
                </RouterLink>
              </li>
              <li>
                <RouterLink to="/buy-credits" class="hover:text-gold transition-colors inline-flex items-center gap-1.5">
                  <span class="text-xs text-gold/40">☿</span> Sim phong thuỷ
                </RouterLink>
              </li>
              <li>
                <RouterLink to="/buy-credits" class="hover:text-gold transition-colors inline-flex items-center gap-1.5">
                  <span class="text-xs text-gold/40">⊕</span> Phong thuỷ nhà
                </RouterLink>
              </li>
            </ul>
          </div>

          <!-- Tài khoản -->
          <div>
            <h4 class="text-[10px] font-semibold text-gold/60 uppercase tracking-widest mb-4">Tài khoản</h4>
            <ul class="space-y-2.5 text-sm text-text-muted">
              <li>
                <RouterLink to="/login" class="hover:text-gold transition-colors">Đăng nhập</RouterLink>
              </li>
              <li>
                <RouterLink to="/register" class="hover:text-gold transition-colors">Đăng ký miễn phí</RouterLink>
              </li>
              <li>
                <RouterLink to="/buy-credits" class="hover:text-gold transition-colors">Mua lượt xem</RouterLink>
              </li>
              <li>
                <RouterLink to="/history" class="hover:text-gold transition-colors">Lịch sử tra cứu</RouterLink>
              </li>
            </ul>
          </div>

        </div>

        <!-- Bottom bar -->
        <div class="mt-10 pt-6 border-t border-border-subtle flex flex-col sm:flex-row justify-between items-center gap-3">
          <p class="text-xs text-text-muted">
            © {{ new Date().getFullYear() }} Phong Thuỷ Tâm Đức. Mọi quyền được bảo lưu.
          </p>
          <div class="flex gap-4 text-xs text-text-muted/25 select-none tracking-widest">
            <span>☰</span>
            <span>☱</span>
            <span>☲</span>
            <span>☳</span>
            <span>☴</span>
            <span>☵</span>
            <span>☶</span>
            <span>☷</span>
          </div>
        </div>
      </div>
    </div>
  </footer>
</template>
