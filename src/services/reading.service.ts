import api from './api'
import type { ReadingInputDto, ReadingResult, Reading, ReadingModule } from '@/types/reading.types'
import type { PaginatedData } from '@/types/api.types'

export const readingService = {
  async freeReading(module: ReadingModule, input: ReadingInputDto): Promise<{ readingId: number; result: ReadingResult }> {
    const { data } = await api.post(`/readings/free/${module}`, input)
    return data.data
  },

  async paidReading(module: ReadingModule, input: ReadingInputDto): Promise<{ readingId: number; result: ReadingResult }> {
    const { data } = await api.post(`/readings/paid/${module}`, input)
    return data.data
  },

  async getHistory(params?: { module?: ReadingModule; page?: number; limit?: number }): Promise<PaginatedData<Reading>> {
    const { data } = await api.get('/readings/history', { params })
    return data.data
  },

  async getById(id: number): Promise<Reading> {
    const { data } = await api.get(`/readings/${id}`)
    return data.data
  },
}
