"use client"

import { Toast as ToastPrimitives } from "@base-ui/react/toast"

import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { TOAST_LIMIT, toastManager } from "@/components/ui/use-toast"

function ToastList() {
  const { toasts } = ToastPrimitives.useToastManager()

  return toasts.map((toast) => (
    <Toast
      key={toast.id}
      toast={toast}
      variant={toast.type === "destructive" ? "destructive" : "default"}
    >
      <ToastPrimitives.Content className="flex items-center justify-between space-x-4">
        <div className="grid gap-1">
          {toast.title && <ToastTitle>{toast.title}</ToastTitle>}
          {toast.description && (
            <ToastDescription>{toast.description}</ToastDescription>
          )}
        </div>
        {toast.data?.action}
        <ToastClose />
      </ToastPrimitives.Content>
    </Toast>
  ))
}

export function Toaster() {
  return (
    <ToastProvider toastManager={toastManager} limit={TOAST_LIMIT}>
      <ToastPrimitives.Portal>
        <ToastViewport>
          <ToastList />
        </ToastViewport>
      </ToastPrimitives.Portal>
    </ToastProvider>
  )
}
