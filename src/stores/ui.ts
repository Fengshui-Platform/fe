import { defineStore } from 'pinia'
import { ref } from 'vue'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: number
  type: ToastType
  message: string
  duration?: number
}

let toastId = 0

export const useUIStore = defineStore('ui', () => {
  const toasts = ref<Toast[]>([])
  const isPageLoading = ref(false)

  function addToast(message: string, type: ToastType = 'info', duration = 4000) {
    const id = ++toastId
    toasts.value.push({ id, type, message, duration })
    setTimeout(() => removeToast(id), duration)
    return id
  }

  function removeToast(id: number) {
    const idx = toasts.value.findIndex(t => t.id === id)
    if (idx !== -1) toasts.value.splice(idx, 1)
  }

  const toast = {
    success: (msg: string) => addToast(msg, 'success'),
    error:   (msg: string) => addToast(msg, 'error'),
    warning: (msg: string) => addToast(msg, 'warning'),
    info:    (msg: string) => addToast(msg, 'info'),
  }

  return { toasts, isPageLoading, addToast, removeToast, toast }
})
