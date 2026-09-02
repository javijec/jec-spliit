import * as React from "react"
import { Toast as ToastPrimitives } from "@base-ui/react/toast"

import type {
  ToastActionElement,
  ToastProps,
} from "@/components/ui/toast"

const TOAST_LIMIT = 1
const TOAST_REMOVE_DELAY = 1000000

type ToastVariant = NonNullable<ToastProps["variant"]>

type ToastOptions = Omit<ToastProps, "toast"> & {
  id?: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
  duration?: number
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

type ToastData = {
  action?: ToastActionElement
}

const toastManager = ToastPrimitives.createToastManager<ToastData>()

let count = 0

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER
  return count.toString()
}

function getBaseType(variant: ToastVariant | null | undefined) {
  return variant === "destructive" ? "destructive" : "default"
}

function toast({
  id = genId(),
  variant = "default",
  action,
  duration,
  open,
  onOpenChange,
  ...props
}: ToastOptions) {
  toastManager.add({
    id,
    ...props,
    type: getBaseType(variant),
    priority: variant === "destructive" ? "high" : "low",
    timeout: duration ?? undefined,
    data: { action },
    onClose: () => onOpenChange?.(false),
  })

  if (open === false) {
    toastManager.close(id)
  }

  const dismiss = () => toastManager.close(id)
  const update = (updates: Partial<ToastOptions>) => {
    const {
      variant: nextVariant,
      action: nextAction,
      duration: nextDuration,
      open: nextOpen,
      onOpenChange: nextOnOpenChange,
      id: _id,
      ...nextProps
    } = updates

    toastManager.update(id, {
      ...nextProps,
      ...(nextVariant === undefined
        ? {}
        : {
            type: getBaseType(nextVariant),
            priority: nextVariant === "destructive" ? "high" : "low",
          }),
      ...(nextDuration === undefined ? {} : { timeout: nextDuration }),
      ...(nextAction === undefined ? {} : { data: { action: nextAction } }),
      ...(nextOnOpenChange === undefined
        ? {}
        : { onClose: () => nextOnOpenChange(false) }),
    })

    if (nextOpen === false) {
      dismiss()
    }
  }

  return { id, dismiss, update }
}

function useToast() {
  const { toasts, close } = ToastPrimitives.useToastManager<ToastData>()

  return {
    toasts,
    toast,
    dismiss: close,
  }
}

export {
  TOAST_LIMIT,
  TOAST_REMOVE_DELAY,
  toastManager,
  useToast,
  toast,
}
