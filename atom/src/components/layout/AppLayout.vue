<script setup>
import { computed, ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const isDark = ref(false)

onMounted(() => {
  isDark.value = document.documentElement.getAttribute('data-theme') === 'dark'
})

function toggleTheme() {
  isDark.value = !isDark.value
  const newTheme = isDark.value ? 'dark' : 'light'
  document.documentElement.setAttribute('data-theme', newTheme)
  localStorage.setItem('theme', newTheme)
}

const navItems = computed(() => {
  const role = auth.currentUser?.role
  const items = []

  items.push({ label: 'Dashboard', icon: 'dashboard', path: '/dashboard', roles: ['employee', 'manager', 'admin'] })

  if (role === 'employee') {
    items.push({ label: 'Create Goals', icon: 'target', path: '/goals/create', roles: ['employee'] })
    items.push({ label: 'My Goals', icon: 'list', path: '/goals/my', roles: ['employee'] })
    items.push({ label: 'Check-in', icon: 'checkin', path: '/checkin', roles: ['employee'] })
  }

  if (role === 'manager') {
    items.push({ label: 'Team Goals', icon: 'team', path: '/goals/team', roles: ['manager'] })
    items.push({ label: 'Team Check-ins', icon: 'checkin', path: '/checkin/team', roles: ['manager'] })
  }

  if (role === 'admin' || role === 'manager') {
    items.push({ label: 'Push KPI', icon: 'push', path: '/admin/push-kpi', roles: ['admin', 'manager'] })
    items.push({ label: 'Reports', icon: 'report', path: '/reports', roles: ['admin', 'manager'] })
  }

  if (role === 'admin') {
    items.push({ label: 'Audit Trail', icon: 'audit', path: '/admin/audit', roles: ['admin'] })
  }

  return items
})

function handleLogout() {
  auth.logout()
  router.push('/login')
}
</script>

<template>
  <div class="layout">
    <!-- Sidebar -->
    <aside class="sidebar">
      <div class="sidebar-brand">
        <div class="brand-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
        </div>
        <div class="brand-text">
          <span class="brand-name">AtomQuest</span>
        </div>
      </div>

      <nav class="sidebar-nav">
        <router-link
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          class="nav-item"
          :class="{ active: route.path === item.path }"
        >
          <span class="nav-icon">
            <svg v-if="item.icon === 'dashboard'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
            <svg v-else-if="item.icon === 'target'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
            <svg v-else-if="item.icon === 'list'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
            <svg v-else-if="item.icon === 'checkin'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>
            <svg v-else-if="item.icon === 'team'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
            <svg v-else-if="item.icon === 'push'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 19V5m0 0l-7 7m7-7l7 7"/></svg>
            <svg v-else-if="item.icon === 'report'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>
            <svg v-else-if="item.icon === 'audit'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          </span>
          <span class="nav-label">{{ item.label }}</span>
        </router-link>
      </nav>

      <div class="sidebar-footer">
        <div class="user-card">
          <div class="user-avatar-initials">{{ auth.currentUser?.avatar }}</div>
          <div class="user-info">
            <span class="user-name">{{ auth.currentUser?.name }}</span>
            <span class="user-role">{{ auth.currentUser?.role }}</span>
          </div>
        </div>
        <div class="footer-actions">
          <button class="btn-action" @click="toggleTheme" :title="isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'">
            <svg v-if="isDark" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
            <svg v-else viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
          </button>
          <button class="btn-action" @click="handleLogout" title="Logout">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          </button>
        </div>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="main-content">
      <router-view v-slot="{ Component }">
        <component :is="Component" />
      </router-view>
    </main>
  </div>
</template>

<style scoped>
.layout {
  display: flex;
  min-height: 100vh;
  background: var(--bg-primary);
}

.sidebar {
  width: var(--sidebar-width);
  background: var(--bg-secondary);
  border-right: 1px solid var(--border-subtle);
  display: flex;
  flex-direction: column;
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  z-index: 100;
}

.sidebar-brand {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: 20px var(--space-lg);
  border-bottom: 1px solid var(--border-subtle);
}

.brand-icon {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--brand-primary);
}

.brand-icon svg {
  width: 100%;
  height: 100%;
}

.brand-name {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.02em;
}

.sidebar-nav {
  flex: 1;
  padding: var(--space-md) var(--space-sm);
  display: flex;
  flex-direction: column;
  gap: 4px;
  overflow-y: auto;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: 8px 12px;
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  font-size: 0.875rem;
  font-weight: 500;
}

.nav-item:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
  text-decoration: none;
}

.nav-item.active {
  background: var(--brand-surface);
  color: var(--brand-primary);
  font-weight: 600;
}

.nav-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
}

.nav-icon svg {
  width: 100%;
  height: 100%;
}

.sidebar-footer {
  padding: var(--space-md);
  border-top: 1px solid var(--border-subtle);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.user-card {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  min-width: 0;
}

.user-avatar-initials {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-full);
  background: var(--brand-primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 600;
  flex-shrink: 0;
}

.user-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.user-name {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-role {
  font-size: 0.7rem;
  color: var(--text-muted);
  text-transform: capitalize;
}

.footer-actions {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
}

.btn-action {
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 6px;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
}

.btn-action:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.main-content {
  flex: 1;
  margin-left: var(--sidebar-width);
  padding: var(--space-xl) var(--space-2xl);
  min-height: 100vh;
  max-width: calc(100vw - var(--sidebar-width));
}

@media (max-width: 768px) {
  .sidebar {
    width: 100%;
    height: auto;
    position: relative;
    flex-direction: row;
    overflow-x: auto;
    border-right: none;
    border-bottom: 1px solid var(--border-subtle);
  }

  .main-content {
    margin-left: 0;
    max-width: 100vw;
    padding: var(--space-lg);
  }

  .sidebar-brand { display: none; }
  .sidebar-nav { flex-direction: row; padding: var(--space-sm); gap: var(--space-sm); }
  .nav-label { display: none; }
  .sidebar-footer { display: none; }
}
</style>
