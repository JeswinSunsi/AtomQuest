import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useToastStore = defineStore('toast', () => {
  const toasts = ref([])
  let _id = 0

  function show(message, type = 'info', duration = 3500) {
    const id = ++_id
    toasts.value.push({ id, message, type })
    setTimeout(() => {
      remove(id)
    }, duration)
  }

  function success(message) { show(message, 'success') }
  function error(message) { show(message, 'error') }
  function warning(message) { show(message, 'warning') }
  function info(message) { show(message, 'info') }

  function remove(id) {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }

  return { toasts, show, success, error, warning, info, remove }
})
