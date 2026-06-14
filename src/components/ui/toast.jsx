import * as React from "react"
import * as ToastPrimitives from "@radix-ui/react-toast"
import { cva } from "class-variance-authority"
import { X } from "lucide-react"

// Toast 消息系统 - 先定义，确保其他组件可以使用
let toastId = 0
const toasts = []
const listeners = new Set()

function showToast(options) {
  const id = String(++toastId)
  const toastData = {
    id,
    message: options.description || options.message || '',
    variant: options.variant || 'default',
    className: options.className,
  }
  toasts.push(toastData)
  listeners.forEach(listener => listener([...toasts]))
  
  setTimeout(() => {
    const index = toasts.findIndex(t => t.id === id)
    if (index !== -1) {
      toasts.splice(index, 1)
      listeners.forEach(listener => listener([...toasts]))
    }
  }, options.duration || 3000)
  
  return {
    id,
    dismiss: () => {
      const index = toasts.findIndex(t => t.id === id)
      if (index !== -1) {
        toasts.splice(index, 1)
        listeners.forEach(listener => listener([...toasts]))
      }
    }
  }
}

showToast.subscribe = (listener) => {
  listeners.add(listener)
  listener([...toasts])
  return () => listeners.delete(listener)
}

const toast = showToast

const ToastProvider = ToastPrimitives.Provider

const ToastViewport = React.forwardRef(({ className, ...props }, ref) => {
  const [toastsState, setToastsState] = React.useState([])
  
  React.useEffect(() => {
    const unsubscribe = toast.subscribe((newToasts) => {
      setToastsState(newToasts)
    })
    return unsubscribe
  }, [])
  
  return (
    <ToastPrimitives.Viewport
      ref={ref}
      className={`fixed top-4 right-4 z-50 flex max-h-screen w-80 flex-col gap-2 overflow-hidden rounded-md p-2 shadow-lg ${className}`}
      {...props}
    >
      {toastsState.map((t) => (
        <Toast
          key={t.id}
          variant={t.variant}
          className={t.className}
        >
          <div className="flex-1">
            {t.message}
          </div>
          <ToastClose className="ml-2">
            <X className="h-4 w-4" />
          </ToastClose>
        </Toast>
      ))}
    </ToastPrimitives.Viewport>
  )
})
ToastViewport.displayName = ToastPrimitives.Viewport.displayName

const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-center justify-between gap-2 rounded-md border border-slate-200 bg-white p-4 pr-8 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:slide-in-from-right-full data-[state=closed]:slide-out-to-right-full",
  {
    variants: {
      variant: {
        default: "border-slate-200 bg-white text-slate-950",
        destructive: "border-red-200 bg-red-50 text-red-900",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Toast = React.forwardRef(({ className, variant, ...props }, ref) => (
  <ToastPrimitives.Root
    ref={ref}
    className={toastVariants({ variant, className })}
    {...props}
  />
))
Toast.displayName = ToastPrimitives.Root.displayName

const ToastTitle = React.forwardRef(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className="text-sm font-semibold leading-none tracking-tight"
    {...props}
  />
))
ToastTitle.displayName = ToastPrimitives.Title.displayName

const ToastDescription = React.forwardRef(({ className, ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    className="text-sm text-slate-500 leading-relaxed"
    {...props}
  />
))
ToastDescription.displayName = ToastPrimitives.Description.displayName

const ToastClose = React.forwardRef(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className={`absolute right-2 top-2 rounded-full p-1 text-slate-400 opacity-0 transition-opacity hover:text-slate-900 hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-slate-950/20 group-hover:opacity-100 ${className}`}
    {...props}
  >
    <X className="h-4 w-4" />
  </ToastPrimitives.Close>
))
ToastClose.displayName = ToastPrimitives.Close.displayName

export {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  toast,
  toastVariants,
}
