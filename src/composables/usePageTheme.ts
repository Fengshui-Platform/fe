import { computed } from 'vue'
import { getZodiacInfo, getTimeOfDay } from '@/utils/zodiac'
import { buildTheme, type AIMood } from '@/config/themeConfig'
import type { ReadingModule, ReadingResult } from '@/types/reading.types'

const BRIGHT_KEYWORDS = ['thuận lợi','tốt lành','phát đạt','thịnh vượng','may mắn','hanh thông','hưng vượng','bội thu','tốt đẹp','rực rỡ','xuất sắc','mạnh mẽ','thuận']
const DARK_KEYWORDS  = ['khó khăn','cẩn thận','trở ngại','thách thức','gian nan','bất lợi','trắc trở','hao tốn','xui','mệt mỏi','phức tạp','nguy cơ']

function detectMood(result: ReadingResult | null): AIMood {
  if (!result) return 'neutral'
  const text = (result.summary ?? '').toLowerCase()
  const brightScore = BRIGHT_KEYWORDS.filter(k => text.includes(k)).length
  const darkScore   = DARK_KEYWORDS.filter(k => text.includes(k)).length
  if (brightScore > darkScore && brightScore >= 2) return 'bright'
  if (darkScore > brightScore && darkScore >= 2)   return 'dark'
  return 'neutral'
}

export function usePageTheme(
  getBirthDate: () => string | undefined,
  getModule: () => ReadingModule,
  getResult: () => ReadingResult | null,
) {
  const theme = computed(() => {
    const zodiacInfo = getZodiacInfo(getBirthDate() ?? '')
    const mood = detectMood(getResult())
    return buildTheme(
      getModule(),
      zodiacInfo?.nguHanh ?? null,
      zodiacInfo?.key ?? null,
      mood,
      getTimeOfDay(),
    )
  })

  const zodiacInfo = computed(() => getZodiacInfo(getBirthDate() ?? ''))

  return { theme, zodiacInfo }
}
