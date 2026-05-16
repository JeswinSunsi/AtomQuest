import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import './assets/index.css'

import { useAuthStore } from './stores/authStore'
import { useGoalStore } from './stores/goalStore'
import { useCheckinStore } from './stores/checkinStore'
import { useKpiStore } from './stores/kpiStore'
import { useAuditStore } from './stores/auditStore'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

// Initialize all stores
const authStore = useAuthStore()
const goalStore = useGoalStore()
const checkinStore = useCheckinStore()
const kpiStore = useKpiStore()
const auditStore = useAuditStore()

authStore.init()
goalStore.init()
checkinStore.init()
kpiStore.init()
auditStore.init()

app.mount('#app')
