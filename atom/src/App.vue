<script setup>
import { useAuthStore } from '@/stores/authStore'
import { useToastStore } from '@/stores/toastStore'
import AppLayout from '@/components/layout/AppLayout.vue'
import { onMounted } from 'vue'

const auth = useAuthStore()
const toast = useToastStore()

onMounted(() => {
  const savedTheme = localStorage.getItem('theme')
  if (savedTheme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark')
  } else {
    document.documentElement.setAttribute('data-theme', 'light')
    localStorage.setItem('theme', 'light')
  }
})
</script>

<template>
  <div id="atom-app">
    <!-- Toast Notifications -->
    <div class="toast-container">
      <transition-group name="toast">
        <div
          v-for="t in toast.toasts"
          :key="t.id"
          class="toast"
          :class="'toast-' + t.type"
        >
          <span class="toast-message">{{ t.message }}</span>
          <button class="toast-close" @click="toast.remove(t.id)">&times;</button>
        </div>
      </transition-group>
    </div>

    <!-- Layout or Login -->
    <AppLayout v-if="auth.isAuthenticated" />
    <router-view v-else />
  </div>
</template>

<style>
.toast-enter-active {
  animation: slideInRight 300ms ease;
}
.toast-leave-active {
  animation: fadeOut 200ms ease;
}
</style>
