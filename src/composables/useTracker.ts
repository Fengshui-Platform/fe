const TRACK_URL = `${import.meta.env.VITE_API_BASE_URL ?? '/api/v1'}/track`

function send(payload: Record<string, unknown>) {
  const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' })
  if (navigator.sendBeacon) {
    navigator.sendBeacon(TRACK_URL, blob)
    return
  }
  // sendBeacon not available — use keepalive fetch (fire and forget)
  fetch(TRACK_URL, {
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
      send({ type: 'pageview', page, referrer: document.referrer || undefined })
    } catch { /* silent fail */ }
  }

  function trackEvent(event_type: string, module?: string, meta?: Record<string, unknown>) {
    try {
      send({ type: 'event', event_type, module, meta })
    } catch { /* silent fail */ }
  }

  return { trackPage, trackEvent }
}
