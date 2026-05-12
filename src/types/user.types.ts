export type UserRole = 'user' | 'admin'
export type CreditsStatus = 'active' | 'frozen' | 'empty'

export interface User {
  id: number
  full_name: string
  email: string | null
  phone: string | null
  birth_date: string | null
  gender: string | null
  avatar_url: string | null
  role: UserRole
  credits_balance: number
  credits_expires_at: string | null
  credits_status: CreditsStatus
  is_verified: boolean
  created_at: string
}

export interface RegisterDto {
  full_name: string
  email: string
  password: string
  phone?: string
}

export interface LoginDto {
  email: string
  password: string
}

export interface CreditsBalance {
  credits_balance: number
  credits_expires_at: string | null
  credits_status: CreditsStatus
  days_remaining: number | null
}
