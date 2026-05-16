<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'

const router = useRouter()
const auth = useAuthStore()
const selectedUserId = ref('')

function handleLogin() {
  if (!selectedUserId.value) return
  auth.login(selectedUserId.value)
  router.push('/dashboard')
}
</script>

<template>
  <div class="login-page">
    <div class="login-container animate-fade-in">
      <div class="login-header">
        <div class="login-logo">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="24" height="24">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
        </div>
        <h1>Sign in to AtomQuest</h1>
        <p>Enterprise Goal Management</p>
      </div>

      <div class="login-body">
        <div class="form-group mb-lg">
          <label class="form-label">Select User Account</label>
          <div class="user-select-wrapper">
            <select v-model="selectedUserId" class="form-select user-select">
              <option value="" disabled>Choose an account to continue...</option>
              <optgroup label="Employees">
                <option v-for="user in auth.users.filter(u => u.role === 'employee')" :key="user.id" :value="user.id">
                  {{ user.name }} — {{ user.department }}
                </option>
              </optgroup>
              <optgroup label="Managers">
                <option v-for="user in auth.users.filter(u => u.role === 'manager')" :key="user.id" :value="user.id">
                  {{ user.name }} — Manager, {{ user.department }}
                </option>
              </optgroup>
              <optgroup label="Administrators">
                <option v-for="user in auth.users.filter(u => u.role === 'admin')" :key="user.id" :value="user.id">
                  {{ user.name }} — System Admin
                </option>
              </optgroup>
            </select>
          </div>
        </div>

        <button
          class="btn btn-primary btn-lg w-full"
          :disabled="!selectedUserId"
          @click="handleLogin"
        >
          Continue
        </button>
      </div>
      
      <div class="login-footer">
        <p class="text-xs text-muted">Single Sign-On (SSO) Demo Environment</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-primary);
  padding: var(--space-md);
}

.login-container {
  width: 100%;
  max-width: 440px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
  overflow: hidden;
}

.login-header {
  text-align: center;
  padding: var(--space-xl) var(--space-xl) var(--space-md);
}

.login-logo {
  width: 48px;
  height: 48px;
  margin: 0 auto var(--space-md);
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--brand-surface);
  color: var(--brand-primary);
  border-radius: var(--radius-lg);
}

.login-header h1 {
  font-size: 1.5rem;
  margin-bottom: var(--space-xs);
  color: var(--text-primary);
}

.login-header p {
  color: var(--text-muted);
  font-size: 0.95rem;
}

.login-body {
  padding: var(--space-md) var(--space-xl) var(--space-xl);
}

.user-select {
  padding: 12px 14px;
  font-size: 0.95rem;
  border-color: var(--border-light);
}

.login-footer {
  text-align: center;
  padding: var(--space-md);
  background: var(--bg-tertiary);
  border-top: 1px solid var(--border-subtle);
}
</style>
