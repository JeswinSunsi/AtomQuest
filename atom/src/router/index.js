import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'

const routes = [
  {
    path: '/',
    redirect: '/dashboard',
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { public: true },
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('@/views/shared/Dashboard.vue'),
    meta: { roles: ['employee', 'manager', 'admin'] },
  },

  {
    path: '/goals/create',
    name: 'GoalSheet',
    component: () => import('@/views/employee/GoalSheet.vue'),
    meta: { roles: ['employee'] },
  },
  {
    path: '/goals/my',
    name: 'MyGoals',
    component: () => import('@/views/employee/MyGoals.vue'),
    meta: { roles: ['employee'] },
  },
  {
    path: '/checkin',
    name: 'CheckIn',
    component: () => import('@/views/employee/CheckIn.vue'),
    meta: { roles: ['employee'] },
  },

  {
    path: '/goals/team',
    name: 'TeamGoals',
    component: () => import('@/views/manager/TeamGoals.vue'),
    meta: { roles: ['manager'] },
  },
  {
    path: '/goals/review/:employeeId',
    name: 'ReviewGoal',
    component: () => import('@/views/manager/ReviewGoal.vue'),
    meta: { roles: ['manager'] },
    props: true,
  },
  {
    path: '/checkin/team',
    name: 'TeamCheckins',
    component: () => import('@/views/manager/TeamCheckins.vue'),
    meta: { roles: ['manager'] },
  },

  {
    path: '/admin/push-kpi',
    name: 'PushKPI',
    component: () => import('@/views/admin/PushKPI.vue'),
    meta: { roles: ['admin', 'manager'] },
  },
  {
    path: '/admin/audit',
    name: 'AuditTrail',
    component: () => import('@/views/admin/AuditTrail.vue'),
    meta: { roles: ['admin'] },
  },
  {
    path: '/reports',
    name: 'Reports',
    component: () => import('@/views/admin/Reports.vue'),
    meta: { roles: ['admin', 'manager'] },
  },
  {
    path: '/admin/analytics',
    name: 'Analytics',
    component: () => import('@/views/admin/Analytics.vue'),
    meta: { roles: ['admin', 'manager'] },
  },

  {
    path: '/admin/escalation-rules',
    name: 'EscalationRules',
    component: () => import('@/views/admin/EscalationRules.vue'),
    meta: { roles: ['admin'] },
  },
  {
    path: '/admin/escalation-log',
    name: 'EscalationLog',
    component: () => import('@/views/admin/EscalationLog.vue'),
    meta: { roles: ['admin'] },
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})


router.beforeEach((to, from, next) => {
  const auth = useAuthStore()

  if (to.meta.public) {
    if (auth.isAuthenticated && to.name === 'Login') {
      return next('/dashboard')
    }
    return next()
  }

  if (!auth.isAuthenticated) {
    return next('/login')
  }

  if (to.meta.roles && !to.meta.roles.includes(auth.currentUser.role)) {
    return next('/dashboard')
  }

  next()
})

export default router
