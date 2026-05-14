import type { ZodiacKey, NguHanh, TimeOfDay } from '@/utils/zodiac'
import type { ReadingModule } from '@/types/reading.types'

export type AIMood = 'bright' | 'neutral' | 'dark'

export interface ParticleConfig {
  type: 'ember' | 'leaf' | 'petal' | 'spark' | 'coin' | 'star' | 'ripple' | 'dust' | 'snow'
  color: string
  secondaryColor?: string
  count: number
  speed: 'slow' | 'medium' | 'fast'
  direction: 'up' | 'float' | 'diagonal-left' | 'diagonal-right' | 'radial'
  size: 'sm' | 'md' | 'lg'
}

export interface ThemeConfig {
  // Identity
  zodiac: ZodiacKey | null
  nguHanh: NguHanh | null
  mood: AIMood
  timeOfDay: TimeOfDay
  module: ReadingModule

  // Colors (raw hex / rgba strings)
  primaryColor: string
  accentColor: string
  glassBackground: string   // for card backdrop
  glowColor: string         // for box-shadow / text-shadow
  textAccent: string        // heading accent color

  // Background layers
  baseGradient: string      // full-page gradient
  heroGradient: string      // hero section overlay
  moodOverlay: string       // rgba overlay based on mood

  // Particles
  particles: ParticleConfig
  secondaryParticles?: ParticleConfig

  // Silhouette
  silhouetteOpacity: number
  silhouettePosition: 'bottom-right' | 'bottom-left' | 'bottom-center' | 'full-right'

  // Atmosphere
  fogIntensity: 'none' | 'light' | 'medium' | 'heavy'
  hasLightRays: boolean
  hasVignette: boolean
}

// ── Module base themes ────────────────────────────────────────────────────────

const MODULE_BASES: Record<ReadingModule, Pick<ThemeConfig,
  'primaryColor' | 'accentColor' | 'glassBackground' | 'glowColor' | 'textAccent' |
  'baseGradient' | 'heroGradient' | 'hasLightRays'
>> = {
  numerology: {
    primaryColor:    '#7c3aed',
    accentColor:     '#a855f7',
    glassBackground: 'rgba(30,10,60,0.45)',
    glowColor:       'rgba(124,58,237,0.5)',
    textAccent:      '#f5c842',
    baseGradient:    'radial-gradient(ellipse 80% 60% at 20% 10%, rgba(60,10,100,0.35) 0%, transparent 70%), radial-gradient(ellipse 60% 50% at 80% 80%, rgba(30,5,80,0.30) 0%, transparent 70%)',
    heroGradient:    'radial-gradient(ellipse 100% 80% at 50% -5%, rgba(124,58,237,0.55) 0%, transparent 65%)',
    hasLightRays:    false,
  },
  horoscope: {
    primaryColor:    '#312e81',
    accentColor:     '#818cf8',
    glassBackground: 'rgba(10,8,40,0.50)',
    glowColor:       'rgba(99,102,241,0.5)',
    textAccent:      '#c7d2fe',
    baseGradient:    'radial-gradient(ellipse 80% 60% at 15% 15%, rgba(30,27,75,0.40) 0%, transparent 70%), radial-gradient(ellipse 60% 50% at 85% 75%, rgba(49,46,129,0.30) 0%, transparent 70%)',
    heroGradient:    'radial-gradient(ellipse 100% 75% at 50% -5%, rgba(79,70,229,0.50) 0%, transparent 65%)',
    hasLightRays:    false,
  },
  love: {
    primaryColor:    '#9d174d',
    accentColor:     '#f472b6',
    glassBackground: 'rgba(60,5,30,0.45)',
    glowColor:       'rgba(244,114,182,0.45)',
    textAccent:      '#fda4af',
    baseGradient:    'radial-gradient(ellipse 80% 60% at 20% 10%, rgba(120,10,50,0.35) 0%, transparent 70%), radial-gradient(ellipse 60% 50% at 80% 80%, rgba(80,5,35,0.30) 0%, transparent 70%)',
    heroGradient:    'radial-gradient(ellipse 100% 80% at 50% -5%, rgba(190,24,93,0.52) 0%, transparent 65%)',
    hasLightRays:    true,
  },
  finance: {
    primaryColor:    '#92400e',
    accentColor:     '#f5c842',
    glassBackground: 'rgba(40,25,0,0.50)',
    glowColor:       'rgba(245,200,66,0.50)',
    textAccent:      '#fde68a',
    baseGradient:    'radial-gradient(ellipse 80% 60% at 20% 10%, rgba(100,60,0,0.38) 0%, transparent 70%), radial-gradient(ellipse 60% 50% at 80% 80%, rgba(60,30,0,0.30) 0%, transparent 70%)',
    heroGradient:    'radial-gradient(ellipse 100% 80% at 50% -5%, rgba(146,64,14,0.55) 0%, transparent 65%)',
    hasLightRays:    true,
  },
  fengshui_home: {
    primaryColor:    '#065f46',
    accentColor:     '#34d399',
    glassBackground: 'rgba(0,30,15,0.50)',
    glowColor:       'rgba(52,211,153,0.40)',
    textAccent:      '#6ee7b7',
    baseGradient:    'radial-gradient(ellipse 80% 60% at 20% 10%, rgba(0,60,30,0.35) 0%, transparent 70%), radial-gradient(ellipse 60% 50% at 80% 80%, rgba(0,40,20,0.28) 0%, transparent 70%)',
    heroGradient:    'radial-gradient(ellipse 100% 80% at 50% -5%, rgba(6,95,70,0.50) 0%, transparent 65%)',
    hasLightRays:    false,
  },
  sim: {
    primaryColor:    '#0e7490',
    accentColor:     '#22d3ee',
    glassBackground: 'rgba(0,25,35,0.50)',
    glowColor:       'rgba(34,211,238,0.40)',
    textAccent:      '#67e8f9',
    baseGradient:    'radial-gradient(ellipse 80% 60% at 20% 10%, rgba(0,60,80,0.35) 0%, transparent 70%), radial-gradient(ellipse 60% 50% at 80% 80%, rgba(0,40,60,0.28) 0%, transparent 70%)',
    heroGradient:    'radial-gradient(ellipse 100% 80% at 50% -5%, rgba(14,116,144,0.50) 0%, transparent 65%)',
    hasLightRays:    false,
  },
  zodiac: {
    primaryColor:    '#1e1b4b',
    accentColor:     '#a5b4fc',
    glassBackground: 'rgba(10,8,50,0.50)',
    glowColor:       'rgba(165,180,252,0.45)',
    textAccent:      '#f5c842',
    baseGradient:    'radial-gradient(ellipse 80% 60% at 20% 10%, rgba(30,27,90,0.45) 0%, transparent 70%), radial-gradient(ellipse 60% 50% at 80% 80%, rgba(50,10,90,0.35) 0%, transparent 70%)',
    heroGradient:    'radial-gradient(ellipse 100% 75% at 50% -5%, rgba(99,102,241,0.55) 0%, transparent 65%)',
    hasLightRays:    true,
  },
}

// ── Ngũ hành particle overrides ───────────────────────────────────────────────

const NGU_HANH_PARTICLES: Record<NguHanh, ParticleConfig> = {
  Hoả: { type: 'ember',  color: '#f97316', secondaryColor: '#ef4444', count: 35, speed: 'medium', direction: 'up',            size: 'sm' },
  Thuỷ: { type: 'ripple', color: '#22d3ee', secondaryColor: '#0ea5e9', count: 18, speed: 'slow',   direction: 'radial',        size: 'md' },
  Mộc:  { type: 'leaf',   color: '#4ade80', secondaryColor: '#86efac', count: 22, speed: 'slow',   direction: 'diagonal-left', size: 'md' },
  Kim:  { type: 'spark',  color: '#e2e8f0', secondaryColor: '#f5c842', count: 28, speed: 'fast',   direction: 'radial',        size: 'sm' },
  Thổ:  { type: 'dust',   color: '#d97706', secondaryColor: '#b45309', count: 20, speed: 'slow',   direction: 'float',         size: 'sm' },
}

// ── Module-specific particle overrides ────────────────────────────────────────

const MODULE_PARTICLES: Record<ReadingModule, ParticleConfig> = {
  numerology:    { type: 'star',   color: '#a855f7', secondaryColor: '#f5c842', count: 25, speed: 'slow',   direction: 'float',          size: 'sm' },
  horoscope:     { type: 'star',   color: '#818cf8', secondaryColor: '#c7d2fe', count: 30, speed: 'slow',   direction: 'float',          size: 'sm' },
  love:          { type: 'petal',  color: '#f472b6', secondaryColor: '#fda4af', count: 28, speed: 'slow',   direction: 'diagonal-left',  size: 'md' },
  finance:       { type: 'coin',   color: '#f5c842', secondaryColor: '#fde68a', count: 20, speed: 'medium', direction: 'diagonal-right', size: 'md' },
  fengshui_home: { type: 'leaf',   color: '#34d399', secondaryColor: '#86efac', count: 18, speed: 'slow',   direction: 'diagonal-left',  size: 'md' },
  sim:           { type: 'spark',  color: '#22d3ee', secondaryColor: '#67e8f9', count: 22, speed: 'medium', direction: 'radial',         size: 'sm' },
  zodiac:        { type: 'star',   color: '#a5b4fc', secondaryColor: '#f5c842', count: 80, speed: 'slow',   direction: 'float',          size: 'sm' },
}

// ── Silhouette positions per zodiac ───────────────────────────────────────────

const SILHOUETTE_POSITIONS: Record<ZodiacKey, ThemeConfig['silhouettePosition']> = {
  dragon:  'full-right',
  snake:   'bottom-right',
  tiger:   'bottom-right',
  horse:   'bottom-left',
  rat:     'bottom-right',
  ox:      'bottom-center',
  rabbit:  'bottom-center',
  goat:    'bottom-center',
  monkey:  'bottom-right',
  rooster: 'bottom-right',
  dog:     'bottom-left',
  pig:     'bottom-center',
}

// ── Mood overlay ──────────────────────────────────────────────────────────────

const MOOD_OVERLAYS: Record<AIMood, string> = {
  bright:  'rgba(245,200,66,0.04)',
  neutral: 'rgba(0,0,0,0)',
  dark:    'rgba(0,0,0,0.20)',
}

// ── Time-of-day brightness tweak (CSS filter string, applied to hero) ─────────

export const TIME_FILTERS: Record<TimeOfDay, string> = {
  dawn:      'brightness(1.05) saturate(1.1)',
  morning:   'brightness(1.0)  saturate(1.0)',
  afternoon: 'brightness(0.95) saturate(0.95)',
  evening:   'brightness(1.0)  saturate(1.15)',
  night:     'brightness(0.88) saturate(0.90)',
}

// ── Build final ThemeConfig ───────────────────────────────────────────────────

export function buildTheme(
  module: ReadingModule,
  nguHanh: NguHanh | null,
  zodiac: ZodiacKey | null,
  mood: AIMood,
  timeOfDay: TimeOfDay,
): ThemeConfig {
  const base = MODULE_BASES[module]

  // Particles: ngũ hành takes priority over module default
  const particles = nguHanh ? NGU_HANH_PARTICLES[nguHanh] : MODULE_PARTICLES[module]
  // Finance always gets coin as secondary regardless of ngũ hành
  const secondaryParticles = module === 'finance' && nguHanh
    ? MODULE_PARTICLES.finance
    : module === 'love' && nguHanh
    ? MODULE_PARTICLES.love
    : undefined

  return {
    zodiac,
    nguHanh,
    mood,
    timeOfDay,
    module,
    ...base,
    moodOverlay: MOOD_OVERLAYS[mood],
    particles,
    secondaryParticles,
    silhouetteOpacity: zodiac === 'dragon' ? 0.12 : zodiac === 'tiger' ? 0.10 : 0.08,
    silhouettePosition: zodiac ? SILHOUETTE_POSITIONS[zodiac] : 'bottom-right',
    fogIntensity: mood === 'dark' ? 'medium' : mood === 'bright' ? 'none' : 'light',
    hasLightRays: base.hasLightRays && mood !== 'dark',
    hasVignette: true,
  }
}
