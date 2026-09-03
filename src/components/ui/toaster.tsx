"use client"

import { Toast as ToastPrimitives } from "@base-ui/react/toast"

import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

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
    <ToastPrimitives.Portal>
      <ToastViewport>
        <ToastList />
      </ToastViewport>
    </ToastPrimitives.Portal>
  )
}
