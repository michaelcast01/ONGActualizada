import { ref } from 'vue'

const toasts = ref([])

export function useToast() {
  const addToast = (message, type = 'info', duration = 3000) => {
    const id = Date.now()
    toasts.value.push({ id, message, type, duration })
    
    if (duration > 0) {
      setTimeout(() => {
        toasts.value = toasts.value.filter(t => t.id !== id)
      }, duration)
    }
    
    return id
  }

  const success = (message, duration = 3000) => addToast(message, 'success', duration)
  const error = (message, duration = 5000) => addToast(message, 'error', duration)
  const warning = (message, duration = 4000) => addToast(message, 'warning', duration)
  const info = (message, duration = 3000) => addToast(message, 'info', duration)

  const remove = (id) => {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }

  return {
    toasts,
    addToast,
    success,
    error,
    warning,
    info,
    remove
  }
}
