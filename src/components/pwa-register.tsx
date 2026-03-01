'use client'

import { useEffect } from 'react'

export function PwaRegister() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    const isLocalhost =
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname === '[::1]'

    if (window.location.protocol !== 'https:' && !isLocalhost) {
      console.warn(
        'PWA install disabled: service workers require HTTPS on non-localhost origins.',
      )
      return
    }

    const register = async () => {
      try {
        await navigator.serviceWorker.register('/sw.js', { scope: '/' })
      } catch (error) {
        console.error('Service worker registration failed', error)
      }
    }

    void register()
  }, [])

  return null
}
