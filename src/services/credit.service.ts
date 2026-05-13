import api from './api'
import type { CreditPackage, CreditOrder, CreateOrderResponse, PollOrderResponse } from '@/types/subscription.types'
import type { CreditsBalance } from '@/types/user.types'
import type { PaginatedData } from '@/types/api.types'

export const creditService = {
  async getPackages(): Promise<CreditPackage[]> {
    const { data } = await api.get('/credits/packages')
    return (data.data as CreditPackage[]).map(p => ({ ...p, price: Number(p.price) }))
  },

  async getBalance(): Promise<CreditsBalance> {
    const { data } = await api.get('/credits/balance')
    return data.data
  },

  async createOrder(packageId: number): Promise<CreateOrderResponse> {
    const { data } = await api.post('/credits/orders', { package_id: packageId })
    return data.data
  },

  async pollOrder(orderId: number): Promise<PollOrderResponse> {
    const { data } = await api.get(`/credits/orders/${orderId}/poll`)
    return data.data
  },

  async getOrders(params?: { page?: number; limit?: number }): Promise<PaginatedData<CreditOrder>> {
    const { data } = await api.get('/credits/orders', { params })
    return data.data
  },
}
