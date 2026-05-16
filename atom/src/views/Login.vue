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
  <div class="login-layout">
    <div class="login-visual">
      <div class="visual-content">
        <div class="brand-logo animate-fade-in">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="32" height="32">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
        </div>
        <h1 class="visual-title animate-slide-up">Accelerate Your Enterprise Performance.</h1>
        <p class="visual-subtitle animate-slide-up" style="animation-delay: 100ms;">
          AtomQuest aligns teams, tracks goals, and drives measurable outcomes across your entire organization.
        </p>
        
        <div class="visual-decorative animate-slide-up" style="animation-delay: 200ms;">
          <div class="glass-card stat-mock">
            <div class="mock-header">
              <div class="mock-dot"></div>
              <div class="mock-dot"></div>
              <div class="mock-dot"></div>
            </div>
            <div class="mock-body">
              <div class="mock-line primary" style="width: 60%"></div>
              <div class="mock-line success" style="width: 80%"></div>
              <div class="mock-line warning" style="width: 40%"></div>
            </div>
          </div>
        </div>
      </div>
      <div class="visual-overlay"></div>
    </div>
    
    <div class="login-panel animate-fade-in">
      <div class="login-form-container">
        <!-- Mobile Logo -->
        <div class="mobile-logo">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="24" height="24">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
        </div>
        
        <div class="form-header">
          <h2>Welcome back</h2>
          <p>Please sign in to your account</p>
        </div>

        <div class="form-content">
          <div class="form-group mb-lg">
            <label class="form-label">Select Workspace Persona</label>
            <div class="custom-select-container">
              <select v-model="selectedUserId" class="form-select user-select">
                <option value="" disabled>Choose an account to continue...</option>
                <optgroup label="Employees">
                  <option v-for="user in auth.users.filter(u => u.role === 'employee')" :key="user.id" :value="user.id">
                    {{ user.name }} — {{ user.department }}
                  </option>
                </optgroup>
                <optgroup label="Managers">
                  <option v-for="user in auth.users.filter(u => u.role === 'manager')" :key="user.id" :value="user.id">
                    {{ user.name }} — {{ user.department }} Manager
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
            class="btn btn-primary btn-lg w-full sign-in-btn"
            :disabled="!selectedUserId"
            @click="handleLogin"
          >
            Sign in
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </button>
        </div>

        <div class="form-footer">
          <p class="text-xs text-muted">Protected by Enterprise Security</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Keyframes for subtle animations */
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.animate-fade-in {
  animation: fadeIn 0.8s ease forwards;
}

.animate-slide-up {
  opacity: 0;
  animation: fadeInUp 0.8s ease forwards;
}

.login-layout {
  display: flex;
  min-height: 100vh;
  background: var(--bg-primary);
}

/* --- Left Side: Visual/Branding --- */
.login-visual {
  display: none;
  flex: 1.2;
  position: relative;
  background-color: #f4f8ff;
  background-image: 
    radial-gradient(at 0% 0%, #ffffff 0px, transparent 50%),
    radial-gradient(at 100% 0%, #e6f0ff 0px, transparent 50%),
    radial-gradient(at 100% 100%, #dce8ff 0px, transparent 50%),
    radial-gradient(at 0% 100%, #f0f6ff 0px, transparent 50%);
  color: var(--text-primary);
  overflow: hidden;
  border-right: 1px solid var(--border-subtle);
}

[data-theme="dark"] .login-visual {
  background-color: #020617;
  background-image: 
    radial-gradient(at 0% 0%, #0f172a 0px, transparent 50%),
    radial-gradient(at 100% 0%, #172a5a 0px, transparent 50%),
    radial-gradient(at 100% 100%, #020617 0px, transparent 50%),
    radial-gradient(at 0% 100%, #0f172a 0px, transparent 50%);
  color: #ffffff;
  border-right: 1px solid var(--border-subtle);
}

@media (min-width: 1024px) {
  .login-visual {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 4rem;
  }
}

.visual-content {
  position: relative;
  z-index: 2;
  max-width: 520px;
  width: 100%;
}

.brand-logo {
  width: 64px;
  height: 64px;
  background: var(--bg-secondary);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-radius: var(--radius-xl);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 2.5rem;
  border: 1px solid var(--border-subtle);
  color: var(--brand-primary);
  box-shadow: var(--shadow-sm);
}

[data-theme="dark"] .brand-logo {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #ffffff;
}

.visual-title {
  font-size: 3rem;
  font-weight: 700;
  line-height: 1.15;
  margin-bottom: 1.5rem;
  color: var(--text-primary);
}

[data-theme="dark"] .visual-title {
  color: #ffffff;
}

.visual-subtitle {
  font-size: 1.125rem;
  line-height: 1.6;
  opacity: 0.85;
  margin-bottom: 3.5rem;
  color: var(--text-secondary);
}

[data-theme="dark"] .visual-subtitle {
  color: #ffffff;
}

.visual-decorative {
  position: relative;
}

.glass-card {
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.8);
  border-radius: var(--radius-lg);
  padding: 1.75rem;
  width: 100%;
  max-width: 340px;
  box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.08);
  transform: rotate(-2deg);
  transition: transform var(--transition-base), box-shadow var(--transition-base);
}

[data-theme="dark"] .glass-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.35);
}

.glass-card:hover {
  transform: rotate(0deg) translateY(-5px);
  box-shadow: 0 30px 60px -15px rgba(0, 0, 0, 0.12);
}

[data-theme="dark"] .glass-card:hover {
  box-shadow: 0 30px 60px -15px rgba(0, 0, 0, 0.4);
}

.mock-header {
  display: flex;
  gap: 8px;
  margin-bottom: 1.5rem;
}

.mock-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--border-light);
}

.mock-dot:nth-child(1) { background: #ff5f56; }
.mock-dot:nth-child(2) { background: #ffbd2e; }
.mock-dot:nth-child(3) { background: #27c93f; }

[data-theme="dark"] .mock-dot { background: rgba(255, 255, 255, 0.25); }

.mock-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.mock-line {
  height: 10px;
  border-radius: 5px;
  background: var(--border-subtle);
}

.mock-line.primary { background: var(--brand-primary); }
.mock-line.success { background: var(--color-success); }
.mock-line.warning { background: var(--color-warning); }

[data-theme="dark"] .mock-line { background: rgba(255, 255, 255, 0.2); }

/* Background Abstract Shapes */
.visual-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: 
    radial-gradient(rgba(15, 98, 254, 0.08) 1px, transparent 1px);
  background-size: 24px 24px;
  pointer-events: none;
  z-index: 1;
  opacity: 0.6;
}

[data-theme="dark"] .visual-overlay {
  background-image: 
    radial-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px);
}

/* --- Right Side: Form Panel --- */
.login-panel {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: var(--bg-primary);
}

.login-form-container {
  width: 100%;
  max-width: 400px;
}

.mobile-logo {
  display: none;
}

@media (max-width: 1023px) {
  .mobile-logo {
    display: flex;
    width: 56px;
    height: 56px;
    background: var(--brand-surface);
    color: var(--brand-primary);
    border-radius: var(--radius-lg);
    align-items: center;
    justify-content: center;
    margin-bottom: 2rem;
  }
}

.form-header {
  margin-bottom: 2.5rem;
}

.form-header h2 {
  font-size: 2rem;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.form-header p {
  color: var(--text-secondary);
  font-size: 1rem;
}

.form-content {
  background: var(--bg-secondary);
  padding: 2.5rem 2rem;
  border-radius: var(--radius-xl);
  border: 1px solid var(--border-subtle);
  box-shadow: var(--shadow-md);
}

.user-select {
  padding: 14px 16px;
  font-size: 0.95rem;
  border-color: var(--border-light);
  border-radius: var(--radius-md);
  background-color: var(--bg-primary);
  transition: all var(--transition-base);
  cursor: pointer;
  width: 100%;
}

.user-select:hover {
  border-color: var(--brand-primary);
}

.user-select:focus {
  box-shadow: 0 0 0 3px var(--brand-surface);
  border-color: var(--brand-primary);
  outline: none;
}

.sign-in-btn {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  padding: 14px;
  font-size: 1rem;
  font-weight: 600;
  border-radius: var(--radius-md);
  margin-top: 1rem;
  transition: transform var(--transition-fast), background-color var(--transition-fast), box-shadow var(--transition-fast);
}

.sign-in-btn:not(:disabled):hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(15, 98, 254, 0.25);
}

.sign-in-btn:disabled {
  background: var(--bg-tertiary);
  color: var(--text-muted);
  border: 1px solid var(--border-subtle);
  box-shadow: none;
  transform: none;
}

.sign-in-btn:disabled svg {
  opacity: 0.5;
}

.form-footer {
  margin-top: 2.5rem;
  text-align: center;
}

.form-footer p {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
}

.form-footer p::before {
  content: '';
  display: block;
  width: 14px;
  height: 16px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='11' width='18' height='11' rx='2' ry='2'%3E%3C/rect%3E%3Cpath d='M7 11V7a5 5 0 0 1 10 0v4'%3E%3C/path%3E%3C/svg%3E");
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
}

[data-theme="dark"] .form-footer p::before {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='11' width='18' height='11' rx='2' ry='2'%3E%3C/rect%3E%3Cpath d='M7 11V7a5 5 0 0 1 10 0v4'%3E%3C/path%3E%3C/svg%3E");
}
</style>
