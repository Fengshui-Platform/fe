export type ReadingModule = 'numerology' | 'love' | 'finance' | 'sim' | 'fengshui_home' | 'horoscope'

export interface ReadingInputDto {
  full_name: string
  birth_date: string   // YYYY-MM-DD
  phone?: string
  gender?: string
  for_other?: boolean  // true = don't save to user profile
  // Love module
  partner_name?: string
  partner_birth_date?: string
  // Fengshui home
  house_direction?: string
}

export interface ReadingSection {
  visible: boolean
  locked?: boolean
  content?: Record<string, unknown>
  teaser?: string
  credits_required?: number
}

export interface ReadingResult {
  life_path_number?: number
  soul_number?: number
  personality_number?: number
  destiny_number?: number
  summary: string
  sections: Record<string, ReadingSection>
  [key: string]: unknown
}

export interface Reading {
  id?: number
  reading_id?: number
  module: ReadingModule
  input_data?: string
  result_data?: string
  result?: ReadingResult
  is_free?: boolean
  credits_used?: number
  created_at?: string
}

export const MODULE_LABELS: Record<ReadingModule, string> = {
  numerology:    'Thần số học',
  love:          'Tình duyên',
  finance:       'Tài lộc',
  sim:           'Sim phong thuỷ',
  fengshui_home: 'Phong thuỷ nhà ở',
  horoscope:     'Tử vi năm',
}

export const MODULE_ICONS: Record<ReadingModule, string> = {
  numerology:    '🔢',
  love:          '💕',
  finance:       '💰',
  sim:           '📱',
  fengshui_home: '🏠',
  horoscope:     '⭐',
}
