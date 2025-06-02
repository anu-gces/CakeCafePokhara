import { type ClassValue, clsx } from 'clsx'
import { useEffect } from 'react'
import { toast } from 'sonner'
import { twMerge } from 'tailwind-merge'
import { Loader } from 'lucide-react'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function useLoadingSpinner(isLoading: boolean) {
  useEffect(() => {
    let toastId = null

    if (isLoading) {
      toastId = toast('', {
        style: {
          background: 'transparent',
          boxShadow: 'none',
          border: 0,
        },
        duration: Number.POSITIVE_INFINITY,
        icon: (
          <div className="right-0 bottom-0 fixed animate-spin">
            <Loader size={48} />
          </div>
        ),
        closeButton: false,
      })
    } else {
      if (toastId) {
        toast.dismiss(toastId)
      }
    }

    return () => {
      toast.dismiss() // This will dismiss all toasts
    }
  }, [isLoading])
}
