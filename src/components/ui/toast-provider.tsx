"use client"

import type { ReactNode } from 'react'
import { Toast as ToastPrimitives } from '@base-ui/react/toast'

import { TOAST_LIMIT, toastManager } from './use-toast'

export function ToastProvider({ children }: { children: ReactNode }) {
  return (
    <ToastPrimitives.Provider toastManager={toastManager} limit={TOAST_LIMIT}>
      {children}
    </ToastPrimitives.Provider>
  )
}
