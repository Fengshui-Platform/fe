import { onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api/v1'
const TRACK_URL     = `${BASE_URL}/track`
const HEARTBEAT_URL = `${BASE_URL}/heartbeat`
const HEARTBEAT_INTERVAL = 30_000

function fireBeacon(url: string, payload: Record<string, unknown>) {
  const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' })
  if (navigator.sendBeacon) {
    navigator.sendBeacon(url, blob)
    return
  }
  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    keepalive: true,
    credentials: 'include',
  }).catch(() => { /* silent fail */ })
}

export function useTracker() {
  function trackPage(page: string) {
    try {
      fireBeacon(TRACK_URL, { type: 'pageview', page, referrer: document.referrer || undefined })
    } catch { /* silent fail */ }
  }

  function trackEvent(event_type: string, module?: string, meta?: Record<string, unknown>) {
    try {
      fireBeacon(TRACK_URL, { type: 'event', event_type, module, meta })
    } catch { /* silent fail */ }
  }

  return { trackPage, trackEvent }
}

export function useOnlineTracker() {
  const router = useRouter()
  let timer: ReturnType<typeof setInterval> | null = null

  function beat() {
    try {
      const page = typeof router.currentRoute.value.name === 'string'
        ? router.currentRoute.value.name
        : router.currentRoute.value.path
      fireBeacon(HEARTBEAT_URL, { page })
    } catch { /* silent fail */ }
  }

  onMounted(() => {
    beat()
    timer = setInterval(beat, HEARTBEAT_INTERVAL)
  })

  onUnmounted(() => {
    if (timer) clearInterval(timer)
  })
}
