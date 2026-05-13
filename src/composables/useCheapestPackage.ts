import { ref, computed } from 'vue'
import { creditService } from '@/services/credit.service'
import { formatCurrency } from '@/utils/format'
import type { CreditPackage } from '@/types/subscription.types'

// Module-level cache — chỉ fetch 1 lần dù nhiều component dùng
const packages = ref<CreditPackage[]>([])
let fetched = false

export function useCheapestPackage() {
  async function fetchIfNeeded() {
    if (fetched) return
    fetched = true
    try {
      packages.value = await creditService.getPackages()
    } catch {
      fetched = false // retry next time nếu fail
    }
  }

  const cheapest = computed<CreditPackage | null>(() => {
    if (!packages.value.length) return null
    return packages.value.reduce((min, p) => Number(p.price) < Number(min.price) ? p : min)
  })

  // "Từ 2.000đ / 20 lượt"
  const cheapestFromLabel = computed(() => {
    if (!cheapest.value) return ''
    return `Từ ${formatCurrency(cheapest.value.price)} / ${cheapest.value.credits} lượt`
  })

  // "Mua 20 lượt chỉ 2.000đ"
  const cheapestBuyLabel = computed(() => {
    if (!cheapest.value) return ''
    return `Mua ${cheapest.value.credits} lượt chỉ ${formatCurrency(cheapest.value.price)}`
  })

  return { cheapest, cheapestFromLabel, cheapestBuyLabel, fetchIfNeeded }
}
