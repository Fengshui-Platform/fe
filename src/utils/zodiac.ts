export type ZodiacKey = 'rat' | 'ox' | 'tiger' | 'rabbit' | 'dragon' | 'snake'
                      | 'horse' | 'goat' | 'monkey' | 'rooster' | 'dog' | 'pig'
export type NguHanh = 'Hoả' | 'Thuỷ' | 'Mộc' | 'Kim' | 'Thổ'
export type TimeOfDay = 'dawn' | 'morning' | 'afternoon' | 'evening' | 'night'

const CHI_KEYS: ZodiacKey[] = ['rat','ox','tiger','rabbit','dragon','snake','horse','goat','monkey','rooster','dog','pig']
const CHI_NAMES = ['Tý','Sửu','Dần','Mão','Thìn','Tỵ','Ngọ','Mùi','Thân','Dậu','Tuất','Hợi']
const CAN_NGU_HANH: NguHanh[] = ['Mộc','Mộc','Hoả','Hoả','Thổ','Thổ','Kim','Kim','Thuỷ','Thuỷ']

export interface ZodiacInfo {
  key: ZodiacKey
  name: string       // Tý, Sửu, ...
  nguHanh: NguHanh
  year: number
}

export function getZodiacInfo(birthDate: string): ZodiacInfo | null {
  if (!birthDate) return null
  const year = parseInt(birthDate.split('-')[0], 10)
  if (isNaN(year) || year < 1900 || year > 2100) return null
  const chiIdx = ((year - 4) % 12 + 12) % 12
  const canIdx = ((year - 4) % 10 + 10) % 10
  return {
    key: CHI_KEYS[chiIdx],
    name: CHI_NAMES[chiIdx],
    nguHanh: CAN_NGU_HANH[canIdx],
    year,
  }
}

// ── Western Zodiac (12 cung hoàng đạo phương Tây) ────────────────────────────

export type WesternZodiacKey =
  | 'aries' | 'taurus' | 'gemini' | 'cancer' | 'leo' | 'virgo'
  | 'libra' | 'scorpio' | 'sagittarius' | 'capricorn' | 'aquarius' | 'pisces'

export interface WesternZodiacInfo {
  key: WesternZodiacKey
  nameVi: string
  symbol: string
  element: 'Fire' | 'Earth' | 'Air' | 'Water'
  elementVi: string
  elementColor: string
}

const WESTERN_SIGNS: Array<WesternZodiacInfo & { from: [number, number]; to: [number, number] }> = [
  { key: 'aries',       nameVi: 'Bạch Dương', symbol: '♈', element: 'Fire',  elementVi: 'Lửa',  elementColor: '#ef4444', from: [3,21], to: [4,19]  },
  { key: 'taurus',      nameVi: 'Kim Ngưu',   symbol: '♉', element: 'Earth', elementVi: 'Đất',  elementColor: '#84cc16', from: [4,20], to: [5,20]  },
  { key: 'gemini',      nameVi: 'Song Tử',    symbol: '♊', element: 'Air',   elementVi: 'Khí',  elementColor: '#06b6d4', from: [5,21], to: [6,20]  },
  { key: 'cancer',      nameVi: 'Cự Giải',    symbol: '♋', element: 'Water', elementVi: 'Nước', elementColor: '#3b82f6', from: [6,21], to: [7,22]  },
  { key: 'leo',         nameVi: 'Sư Tử',      symbol: '♌', element: 'Fire',  elementVi: 'Lửa',  elementColor: '#ef4444', from: [7,23], to: [8,22]  },
  { key: 'virgo',       nameVi: 'Xử Nữ',      symbol: '♍', element: 'Earth', elementVi: 'Đất',  elementColor: '#84cc16', from: [8,23], to: [9,22]  },
  { key: 'libra',       nameVi: 'Thiên Bình', symbol: '♎', element: 'Air',   elementVi: 'Khí',  elementColor: '#06b6d4', from: [9,23], to: [10,22] },
  { key: 'scorpio',     nameVi: 'Bọ Cạp',     symbol: '♏', element: 'Water', elementVi: 'Nước', elementColor: '#3b82f6', from: [10,23], to: [11,21] },
  { key: 'sagittarius', nameVi: 'Nhân Mã',    symbol: '♐', element: 'Fire',  elementVi: 'Lửa',  elementColor: '#ef4444', from: [11,22], to: [12,21] },
  { key: 'capricorn',   nameVi: 'Ma Kết',     symbol: '♑', element: 'Earth', elementVi: 'Đất',  elementColor: '#84cc16', from: [12,22], to: [1,19]  },
  { key: 'aquarius',    nameVi: 'Bảo Bình',   symbol: '♒', element: 'Air',   elementVi: 'Khí',  elementColor: '#06b6d4', from: [1,20], to: [2,18]  },
  { key: 'pisces',      nameVi: 'Song Ngư',   symbol: '♓', element: 'Water', elementVi: 'Nước', elementColor: '#3b82f6', from: [2,19], to: [3,20]  },
]

export function getWesternZodiacSign(birthDate: string): WesternZodiacInfo | null {
  if (!birthDate) return null
  const parts = birthDate.split('-').map(Number)
  const month = parts[1]
  const day   = parts[2]
  if (!month || !day) return null
  const md = month * 100 + day

  for (const z of WESTERN_SIGNS) {
    const from = z.from[0] * 100 + z.from[1]
    const to   = z.to[0]   * 100 + z.to[1]
    if (from <= to) {
      if (md >= from && md <= to) return { key: z.key, nameVi: z.nameVi, symbol: z.symbol, element: z.element, elementVi: z.elementVi, elementColor: z.elementColor }
    } else {
      if (md >= from || md <= to) return { key: z.key, nameVi: z.nameVi, symbol: z.symbol, element: z.element, elementVi: z.elementVi, elementColor: z.elementColor }
    }
  }
  return null
}

export function getTimeOfDay(): TimeOfDay {
  const h = new Date().getHours()
  if (h >= 5  && h < 8)  return 'dawn'
  if (h >= 8  && h < 12) return 'morning'
  if (h >= 12 && h < 17) return 'afternoon'
  if (h >= 17 && h < 20) return 'evening'
  return 'night'
}
