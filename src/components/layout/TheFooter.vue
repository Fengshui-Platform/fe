<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<template>
  <footer class="border-t border-border-subtle bg-bg-card mt-auto">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div class="flex flex-col md:flex-row justify-between gap-8">
        <!-- Brand -->
        <div>
          <div class="flex items-center gap-2 mb-3">
            <span class="text-2xl">☯</span>
            <span class="font-serif text-xl text-gold">Phong Thủy AI</span>
          </div>
          <p class="text-sm text-text-muted max-w-xs">
            Khám phá vận mệnh và phong thuỷ cá nhân hoá thông qua AI hiện đại.
          </p>
        </div>

        <!-- Links -->
        <div class="flex gap-12">
          <div>
            <h4 class="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">Dịch vụ</h4>
            <ul class="space-y-2 text-sm text-text-muted">
              <li><RouterLink to="/" class="hover:text-text-primary transition-colors">Thần số học</RouterLink></li>
              <li><RouterLink to="/buy-credits" class="hover:text-text-primary transition-colors">Tình duyên</RouterLink></li>
              <li><RouterLink to="/buy-credits" class="hover:text-text-primary transition-colors">Tài lộc</RouterLink></li>
              <li><RouterLink to="/buy-credits" class="hover:text-text-primary transition-colors">Sim phong thuỷ</RouterLink></li>
            </ul>
          </div>
          <div>
            <h4 class="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">Tài khoản</h4>
            <ul class="space-y-2 text-sm text-text-muted">
              <li><RouterLink to="/login" class="hover:text-text-primary transition-colors">Đăng nhập</RouterLink></li>
              <li><RouterLink to="/register" class="hover:text-text-primary transition-colors">Đăng ký</RouterLink></li>
              <li><RouterLink to="/buy-credits" class="hover:text-text-primary transition-colors">Mua lượt</RouterLink></li>
              <li><RouterLink to="/history" class="hover:text-text-primary transition-colors">Lịch sử</RouterLink></li>
            </ul>
          </div>
        </div>
      </div>

      <div class="mt-8 pt-6 border-t border-border-subtle flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-text-muted">
        <p>© {{ new Date().getFullYear() }} Phong Thủy AI. Mọi quyền được bảo lưu.</p>
        <p>Kết quả mang tính tham khảo, không thay thế tư vấn chuyên nghiệp.</p>
      </div>
    </div>
  </footer>
</template>
