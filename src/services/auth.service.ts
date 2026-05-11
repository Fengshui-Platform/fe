import api from './api'
import type { User, RegisterDto, LoginDto } from '@/types/user.types'

export const authService = {
  async register(dto: RegisterDto): Promise<void> {
    await api.post('/auth/register', dto)
  },

  async login(dto: LoginDto): Promise<User> {
    const { data } = await api.post('/auth/login', dto)
    return data.data
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout')
  },

  async getMe(): Promise<User> {
    const { data } = await api.get('/auth/me')
    return data.data
  },

  async verifyEmail(token: string): Promise<void> {
    await api.post('/auth/verify-email', { token })
  },

  async resendVerification(email: string): Promise<void> {
    await api.post('/auth/resend-verification', { email })
  },

  async forgotPassword(email: string): Promise<void> {
    await api.post('/auth/forgot-password', { email })
  },

  async resetPassword(token: string, new_password: string): Promise<void> {
    await api.post('/auth/reset-password', { token, new_password })
  },
}
