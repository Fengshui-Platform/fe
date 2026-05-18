import api from '@/services/api'
import type { PaginatedData } from '@/types/api.types'

export interface AdminStats {
  total_users: number
  new_users_7d: number
  new_users_30d: number
  total_revenue: number
  revenue_this_month: number
  total_readings: number
  readings_today: number
  pending_orders: number
}

export interface DailyStatRow { date: string; count: number; revenue: number }
export interface DailyStats { readings: DailyStatRow[]; revenue: DailyStatRow[] }
export interface ModuleRow { module: string; count: number }
export interface UserDailyRow { date: string; count: number }
export interface MonthlyRow { month: string; revenue: number; orders: number; readings: number; new_users: number }

export interface AdminUser {
  id: number
  full_name: string
  email: string
  phone: string | null
  role: 'user' | 'admin'
  credits_balance: number
  credits_expires_at: string | null
  credits_status: 'active' | 'frozen' | 'empty'
  is_verified: number
  created_at: string
}

export interface AdminReading {
  id: number
  user_id: number | null
  session_id: string | null
  ip_address: string | null
  module: string
  is_free: number
  credits_used: number
  created_at: string
  input_data: string
  result_data: string
  full_name: string | null
  email: string | null
}

export interface AdminOrder {
  id: number
  user_id: number
  full_name: string
  email: string
  package_name: string | null
  credits: number
  amount: number
  topup_code: string
  status: string
  created_at: string
  paid_at: string | null
}

export interface CreditPackage {
  id: number
  name: string
  credits: number
  price: number
  validity_days: number
  is_active: number
  sort_order: number
}

export interface AIModel {
  id: number
  name: string
  provider: string
  model_id: string
  is_active: number
  is_default: number
  priority: number
  max_tokens: number
  temperature: number
  total_tokens: number
  created_at: string
}

export const adminService = {
  async getDashboard(): Promise<AdminStats> {
    const { data } = await api.get('/admin/stats/overview')
    return data.data
  },

  async getDailyStats(days = 30): Promise<DailyStats> {
    const { data } = await api.get('/admin/stats/daily', { params: { days } })
    return data.data
  },

  async getModuleStats(): Promise<ModuleRow[]> {
    const { data } = await api.get('/admin/stats/modules')
    return data.data
  },

  async getUsersDaily(days = 30): Promise<UserDailyRow[]> {
    const { data } = await api.get('/admin/stats/users', { params: { days } })
    return data.data
  },

  async getMonthlyStats(months = 12): Promise<MonthlyRow[]> {
    const { data } = await api.get('/admin/stats/monthly', { params: { months } })
    return data.data
  },

  async getUsers(params?: {
    page?: number
    limit?: number
    search?: string
    is_active?: number
  }): Promise<PaginatedData<AdminUser>> {
    const { data } = await api.get('/admin/users', { params })
    return data.data
  },

  async getUserDetail(id: number): Promise<AdminUser> {
    const { data } = await api.get(`/admin/users/${id}`)
    return data.data
  },

  async updateUser(id: number, dto: { is_verified?: number; role?: string }): Promise<AdminUser> {
    const { data } = await api.put(`/admin/users/${id}`, dto)
    return data.data
  },

  async deleteUser(id: number): Promise<void> {
    await api.delete(`/admin/users/${id}`)
  },

  async grantCredits(id: number, dto: { credits: number; reason: string }): Promise<void> {
    await api.post(`/admin/users/${id}/grant-credits`, dto)
  },

  async getReadings(params?: {
    page?: number
    limit?: number
    module?: string
    is_free?: number
  }): Promise<PaginatedData<AdminReading>> {
    const { data } = await api.get('/admin/readings', { params })
    return data.data
  },

  async getOrders(params?: {
    page?: number
    limit?: number
    status?: string
  }): Promise<PaginatedData<AdminOrder>> {
    const { data } = await api.get('/admin/credit-orders', { params })
    return data.data
  },

  async confirmOrder(id: number): Promise<void> {
    await api.put(`/admin/credit-orders/${id}/confirm`)
  },

  async getPackages(): Promise<CreditPackage[]> {
    const { data } = await api.get('/admin/credit-packages')
    return data.data
  },

  async createPackage(dto: Omit<CreditPackage, 'id' | 'sort_order'>): Promise<CreditPackage> {
    const { data } = await api.post('/admin/credit-packages', dto)
    return data.data
  },

  async updatePackage(id: number, dto: Partial<CreditPackage>): Promise<CreditPackage> {
    const { data } = await api.put(`/admin/credit-packages/${id}`, dto)
    return data.data
  },

  async deletePackage(id: number): Promise<void> {
    await api.delete(`/admin/credit-packages/${id}`)
  },

  async getAIModels(): Promise<AIModel[]> {
    const { data } = await api.get('/admin/ai-models')
    return data.data
  },

  async fetchProviderModels(provider: string, apiKey: string): Promise<string[]> {
    const { data } = await api.post('/admin/ai-models/fetch-models', { provider, api_key: apiKey })
    return data.data.models
  },

  async createAIModel(dto: Record<string, unknown>): Promise<AIModel> {
    const { data } = await api.post('/admin/ai-models', dto)
    return data.data
  },

  async updateAIModel(id: number, dto: Record<string, unknown>): Promise<AIModel> {
    const { data } = await api.put(`/admin/ai-models/${id}`, dto)
    return data.data
  },

  async deleteAIModel(id: number): Promise<void> {
    await api.delete(`/admin/ai-models/${id}`)
  },

  async testAIModel(id: number, dto: { prompt: string }): Promise<{ output: string; tokens_used: number }> {
    const { data } = await api.post(`/admin/ai-models/${id}/test`, dto)
    return data.data
  },

  async getSettings(): Promise<Record<string, string>> {
    const { data } = await api.get('/admin/settings')
    return data.data
  },

  async updateSettings(settings: Record<string, string>): Promise<void> {
    await api.put('/admin/settings', settings)
  },

  async getTrafficOverview(from: string, to: string) {
    const { data } = await api.get('/admin/traffic/overview', { params: { from, to } })
    return data.data as {
      total_views: number; unique_sessions: number; logged_in_users: number
      login_rate: number; total_events: number; reading_starts: number
      buy_initiations: number; period: { from: string; to: string }
    }
  },

  async getTrafficDaily(from: string, to: string) {
    const { data } = await api.get('/admin/traffic/daily', { params: { from, to } })
    return data.data as Array<{ date: string; total_views: number; unique_sessions: number; logged_in_users: number }>
  },

  async getTrafficPages(from: string, to: string, limit = 10) {
    const { data } = await api.get('/admin/traffic/pages', { params: { from, to, limit } })
    return data.data as Array<{ page: string; views: number }>
  },

  async getTrafficFeatures(from: string, to: string) {
    const { data } = await api.get('/admin/traffic/features', { params: { from, to } })
    return data.data as Array<{ event_type: string; module: string | null; count: number }>
  },

  async getTrafficFunnel(from: string, to: string) {
    const { data } = await api.get('/admin/traffic/funnel', { params: { from, to } })
    return data.data as { steps: Array<{ step: string; count: number; pct: number }>; period: { from: string; to: string } }
  },

  async getTrafficRetention(from: string, to: string) {
    const { data } = await api.get('/admin/traffic/retention', { params: { from, to } })
    return data.data as Array<{ date: string; returning: number }>
  },
}
