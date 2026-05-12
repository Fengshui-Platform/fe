import api from './api'
import type { User } from '@/types/user.types'

export const userService = {
  async updateProfile(dto: { full_name: string; phone?: string; birth_date?: string | null; gender?: string | null }): Promise<User> {
    const { data } = await api.put('/users/profile', dto)
    return data.data
  },

  async changePassword(dto: { current_password: string; new_password: string }): Promise<void> {
    await api.put('/users/change-password', dto)
  },

  async uploadAvatar(file: File): Promise<User> {
    const form = new FormData()
    form.append('avatar', file)
    const { data } = await api.post('/users/avatar', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data.data
  },

  async deleteAvatar(): Promise<User> {
    const { data } = await api.delete('/users/avatar')
    return data.data
  },

  async deleteAccount(password: string): Promise<void> {
    await api.delete('/users/account', { data: { password } })
  },
}
