import axios, { type AxiosInstance, type AxiosError } from 'axios'

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api/v1'

// Instance riêng cho refresh — không có interceptor, tránh deadlock
const refreshApi = axios.create({ baseURL: BASE_URL, withCredentials: true })

let isRefreshing = false
let failedQueue: Array<{ resolve: () => void; reject: (e: unknown) => void }> = []

function processQueue(error: unknown) {
  failedQueue.forEach(p => error ? p.reject(error) : p.resolve())
  failedQueue = []
}

const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  timeout: 30000,
})

api.interceptors.response.use(
  res => res,
  async (error: AxiosError) => {
    const original = error.config as typeof error.config & { _retry?: boolean }

    const url = original?.url ?? ''
    const isAuthEndpoint = url.includes('/login') ||
                           url.includes('/register') ||
                           url.includes('/refresh') ||
                           url.includes('/logout')

    if (error.response?.status === 401 && !original?._retry && !isAuthEndpoint) {
      if (isRefreshing) {
        return new Promise<void>((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then(() => api(original!))
          .catch(e => Promise.reject(e))
      }

      original!._retry = true
      isRefreshing = true

      try {
        await refreshApi.post('/auth/refresh')
        processQueue(null)
        return api(original!)
      } catch (refreshError) {
        processQueue(refreshError)
        const { useAuthStore } = await import('@/stores/auth')
        useAuthStore().clearUser()
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export default api
