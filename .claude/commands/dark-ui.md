# dark-ui

## Mục đích
Thiết kế mới hoặc review một component/page theo dark mode design system của Fengshui Platform. Đảm bảo: chỉ dùng design tokens đã định nghĩa, glassmorphism đúng pattern, glow effects, font phân cấp đúng, và transition animation nhất quán. App LUÔN dark — KHÔNG có light mode toggle.

## Cách dùng
`/dark-ui [design|review] [ComponentName or description]`

Ví dụ:
- `/dark-ui design CreditPackageCard` → thiết kế card gói credits
- `/dark-ui design QRPaymentModal` → thiết kế modal QR payment
- `/dark-ui review TheNavbar.vue` → review navbar component
- `/dark-ui design ReadingResultHero` → hero section kết quả đọc

## Các bước thực hiện

### Khi `design`:
1. Xác định component type (card, modal, form, hero, badge, button, etc.)
2. Chọn background layer phù hợp với component hierarchy
3. Áp dụng glassmorphism nếu là card/modal/overlay
4. Xác định accent color phù hợp với context (gold cho CTA/premium, mystic cho spiritual, neon cho interactive)
5. Apply glow effects và transitions
6. Xử lý empty/loading/error states với dark theme
7. Đảm bảo text hierarchy đúng (primary → secondary → muted)

### Khi `review`:
1. Đọc file component
2. Kiểm tra mọi class màu — flag bất kỳ hex/rgb/arbitrary color nào
3. Kiểm tra glassmorphism pattern đúng cú pháp
4. Kiểm tra có transition trên interactive elements không
5. Kiểm tra font hierarchy (serif cho numbers, sans cho UI text)
6. Báo cáo vi phạm và đề xuất fix

## Design Token Reference

### Background Layers (từ ngoài vào trong):
```
bg-bg-base     #08080f  ← Page background, root element
bg-bg-card     #0f0f1a  ← Cards, panels
bg-bg-surface  #161625  ← Nested sections, table rows
bg-bg-elevated #1e1e30  ← Dropdowns, tooltips, hover states
```

### Accent Colors:
```
text-accent-gold       #f5c842  ← Primary CTA, premium features, highlights
text-accent-gold-dim   #a8882d  ← Muted gold, secondary gold elements
text-accent-mystic     #7c3aed  ← Spiritual/mystical elements, borders
text-accent-mystic-glow #a855f7 ← Glow states, active mystic elements
text-accent-neon       #06b6d4  ← Interactive elements, links, neon accents
```

### Text Hierarchy:
```
text-text-primary    #f1f0ff  ← Headings, important content
text-text-secondary  #9590b8  ← Body text, descriptions
text-text-muted      #4b4870  ← Placeholders, disabled, captions
```

### Borders:
```
border-border-subtle  #1e1e30  ← Dividers, subtle separation
border-border-glow    #7c3aed40 ← Card borders, glow effect
```

### Shadows (Tailwind custom utilities):
```
shadow-glow-gold   ← Gold aura: drop-shadow cho primary CTAs
shadow-glow-mystic ← Purple aura: drop-shadow cho mystic elements
shadow-glow-neon   ← Cyan aura: drop-shadow cho neon elements
shadow-card        ← Standard card shadow (dark, subtle)
```

### Gradients (custom Tailwind utilities):
```
gradient-mystic ← Purple → Cyan (từ accent-mystic đến accent-neon)
gradient-gold   ← Gold gradient (primary CTA background)
gradient-dark   ← Dark overlay gradient
```

### Typography:
```
font-sans  ← Inter — UI text, labels, buttons, body
font-serif ← Cormorant Garamond — Numerology numbers, mystical headings
```

## Design Patterns

### Glassmorphism Card (CHUẨN):
```html
<!-- Card cơ bản -->
<div class="backdrop-blur-md bg-bg-card/80 border border-border-glow rounded-xl p-6 shadow-card">
  ...
</div>

<!-- Card với hover glow -->
<div class="backdrop-blur-md bg-bg-card/80 border border-border-glow rounded-xl p-6 shadow-card
            transition-all duration-300 hover:shadow-glow-mystic hover:border-accent-mystic/50">
  ...
</div>

<!-- Card premium (gold accent) -->
<div class="backdrop-blur-md bg-bg-card/80 border border-accent-gold/30 rounded-xl p-6
            shadow-glow-gold transition-all duration-300">
  ...
</div>
```

### Primary CTA Button (Gold):
```html
<!-- Gold gradient button -->
<button class="gradient-gold text-bg-base font-semibold px-6 py-3 rounded-xl
               shadow-glow-gold transition-all duration-300
               hover:shadow-glow-gold/60 hover:scale-105
               disabled:opacity-50 disabled:cursor-not-allowed">
  Mua Credits
</button>

<!-- Mystic gradient button -->
<button class="gradient-mystic text-white font-semibold px-6 py-3 rounded-xl
               shadow-glow-mystic transition-all duration-300
               hover:shadow-glow-mystic/80">
  Xem Kết Quả
</button>
```

### Numerology Number Display:
```html
<!-- Con số chính — font-serif BẮTBUỘC -->
<div class="text-7xl font-serif text-accent-gold shadow-glow-gold text-center
            transition-all duration-300">
  {{ lifePathNumber }}
</div>

<!-- Con số phụ -->
<span class="text-3xl font-serif text-accent-mystic-glow">{{ expressionNumber }}</span>

<!-- Con số trong card nhỏ -->
<div class="text-4xl font-serif text-accent-gold mb-2">{{ number }}</div>
```

### Input Field (Dark theme):
```html
<input
  class="w-full bg-bg-surface border border-border-subtle rounded-lg px-4 py-3
         text-text-primary placeholder-text-muted
         focus:outline-none focus:border-accent-mystic focus:ring-1 focus:ring-accent-mystic/30
         transition-all duration-300"
  placeholder="Nhập tên đầy đủ..."
/>
```

### Modal Overlay:
```html
<div class="fixed inset-0 z-50 flex items-center justify-center p-4">
  <!-- Backdrop -->
  <div class="absolute inset-0 bg-bg-base/80 backdrop-blur-sm" />

  <!-- Modal Panel -->
  <div class="relative z-10 w-full max-w-lg
              backdrop-blur-md bg-bg-card/90 border border-border-glow
              rounded-2xl shadow-glow-mystic">
    <!-- Header -->
    <div class="p-6 border-b border-border-subtle">
      <h2 class="text-xl font-serif text-text-primary">Tiêu đề</h2>
    </div>
    <!-- Body -->
    <div class="p-6">...</div>
  </div>
</div>
```

### Credits Badge / Status Indicators:
```html
<!-- Active credits (green/teal) -->
<span class="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400
             border border-emerald-500/30 rounded-full px-3 py-1 text-sm font-medium">
  <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
  {{ creditsBalance }} credits
</span>

<!-- Frozen credits (amber) -->
<span class="inline-flex items-center gap-1.5 bg-amber-500/10 text-amber-400
             border border-amber-500/30 rounded-full px-3 py-1 text-sm font-medium">
  <span>❄</span>
  Đóng băng
</span>

<!-- Empty credits (red) -->
<span class="inline-flex items-center gap-1.5 bg-red-500/10 text-red-400
             border border-red-500/30 rounded-full px-3 py-1 text-sm font-medium">
  0 credits
</span>
```

### Navbar Credits Display:
```html
<!-- Trong TheNavbar.vue -->
<RouterLink
  to="/buy-credits"
  :class="[
    'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-300',
    authStore.hasActiveCredits
      ? 'bg-accent-gold/10 text-accent-gold hover:bg-accent-gold/20'
      : authStore.hasFrozenCredits
        ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'
        : 'bg-red-500/10 text-red-400 hover:bg-red-500/20 animate-pulse'
  ]"
>
  <span>{{ authStore.user?.credits_balance ?? 0 }}</span>
  <span class="text-xs opacity-70">credits</span>
</RouterLink>
```

### Loading Skeleton (Dark theme):
```html
<!-- Skeleton loading -->
<div class="animate-pulse space-y-4">
  <div class="h-6 bg-bg-elevated rounded-lg w-3/4" />
  <div class="h-4 bg-bg-elevated rounded-lg w-1/2" />
  <div class="grid grid-cols-3 gap-4">
    <div class="h-32 bg-bg-elevated rounded-xl" />
    <div class="h-32 bg-bg-elevated rounded-xl" />
    <div class="h-32 bg-bg-elevated rounded-xl" />
  </div>
</div>
```

### Empty State:
```html
<div class="flex flex-col items-center justify-center py-20 text-center">
  <div class="text-6xl mb-4 opacity-30">✦</div>
  <h3 class="text-xl font-serif text-text-secondary mb-2">Chưa có dữ liệu</h3>
  <p class="text-text-muted mb-6">Bắt đầu khám phá hành trình phong thủy của bạn</p>
  <AppButton variant="primary">Bắt đầu ngay</AppButton>
</div>
```

### QR Payment Modal:
```html
<div class="backdrop-blur-md bg-bg-card/90 border border-border-glow rounded-2xl p-8
            shadow-glow-mystic text-center">
  <!-- QR Code container -->
  <div class="bg-white rounded-xl p-4 inline-block mb-6 shadow-glow-gold">
    <img :src="qrData.qr_url" alt="QR Code thanh toán" class="w-48 h-48" />
  </div>

  <!-- Amount -->
  <div class="text-3xl font-serif text-accent-gold mb-2">
    {{ formatCurrency(qrData.amount) }}
  </div>

  <!-- Polling indicator -->
  <div class="flex items-center justify-center gap-2 text-text-muted text-sm">
    <span class="w-2 h-2 rounded-full bg-accent-neon animate-pulse" />
    Đang chờ thanh toán...
  </div>
</div>
```

## Checklist sau khi hoàn thành

- [ ] KHÔNG có màu hex/rgb/hsl trực tiếp trong class (kể cả trong `style=""`)
- [ ] KHÔNG có `bg-white`, `bg-black`, `text-white`, `text-black` (dùng token thay thế)
- [ ] Background hierarchy đúng: base → card → surface → elevated
- [ ] Glassmorphism: `backdrop-blur-md bg-bg-card/80 border border-border-glow`
- [ ] Primary CTA: `gradient-gold text-bg-base shadow-glow-gold`
- [ ] Số phong thủy: `font-serif` (Cormorant Garamond) — KHÔNG dùng font-sans
- [ ] `transition-all duration-300` trên MỌI interactive elements
- [ ] Hover states có glow effect phù hợp context
- [ ] Credits: 3 states (active/frozen/empty) đều có màu riêng biệt (emerald/amber/red)
- [ ] Loading state dùng animate-pulse với bg-bg-elevated
- [ ] Empty state có font-serif và icon
- [ ] KHÔNG có light mode classes (dark: prefix không được dùng — app luôn dark)
- [ ] Modal: backdrop `bg-bg-base/80 backdrop-blur-sm`
