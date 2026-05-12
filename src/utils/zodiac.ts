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

export function getTimeOfDay(): TimeOfDay {
  const h = new Date().getHours()
  if (h >= 5  && h < 8)  return 'dawn'
  if (h >= 8  && h < 12) return 'morning'
  if (h >= 12 && h < 17) return 'afternoon'
  if (h >= 17 && h < 20) return 'evening'
  return 'night'
}
