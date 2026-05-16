<script setup>
import { computed } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import { useGoalStore } from '@/stores/goalStore'

const auth = useAuthStore()
const goalStore = useGoalStore()
const sheet = computed(() => goalStore.getSheet(auth.currentUser?.id))

const currentQuarter = computed(() => {
  const m = new Date().getMonth() + 1
  if (m >= 5 && m <= 7) return 'Q1'
  if (m >= 8 && m <= 10) return 'Q2'
  if (m >= 11 || m <= 1) return 'Q3'
  return 'Q4'
})

function getStatusClass(s) {
  return { draft: 'badge-neutral', submitted: 'badge-info', approved: 'badge-success', returned: 'badge-warning', locked: 'badge-primary' }[s] || 'badge-neutral'
}

function getGoalStatusClass(s) {
  return { not_started: 'badge-neutral', on_track: 'badge-info', completed: 'badge-success' }[s] || 'badge-neutral'
}

function formatUom(u) {
  return { numeric: 'Numeric', percentage: 'Percentage', timeline: 'Timeline', zero: 'Zero-Based' }[u] || u
}
</script>

<template>
  <div class="my-goals animate-fade-in">
    <div class="page-header">
      <h1>My Goals</h1>
      <p>View your goals and track progress throughout the year.</p>
    </div>

    <div v-if="!sheet || !sheet.goals.length" class="empty-state card">
      <h3>No Goals Yet</h3>
      <p class="text-sm text-muted">Create your goal sheet to get started.</p>
      <router-link to="/goals/create" class="btn btn-primary mt-md">Create Goal Sheet</router-link>
    </div>

    <template v-else>
      <div class="card mb-lg flex justify-between items-center">
        <div>
          <span class="form-label">Sheet Status</span>
          <div class="mt-sm">
            <span class="badge" :class="getStatusClass(sheet.status)" style="font-size: 0.9rem; padding: 8px 16px;">
              {{ sheet.status.toUpperCase() }}
            </span>
          </div>
        </div>
        <div class="text-right">
          <span class="form-label">Total Goals</span>
          <div class="stat-value" style="font-size: 1.5rem;">{{ sheet.goals.length }}</div>
        </div>
      </div>

      <div v-for="(goal, index) in sheet.goals" :key="goal.id"
        class="card mb-md animate-slide-up" :style="{ animationDelay: (index * 60) + 'ms' }">
        <div class="flex justify-between items-start mb-md">
          <div class="flex items-center gap-sm">
            <span class="goal-num">{{ index + 1 }}</span>
            <div>
              <h3 style="font-size: 1rem;">{{ goal.title }}</h3>
              <span class="tag mt-sm">{{ goal.thrustArea }}</span>
            </div>
          </div>
          <div class="flex gap-sm">
            <span v-if="goal.isSharedKPI" class="badge badge-primary">Shared KPI</span>
            <span class="badge" :class="getGoalStatusClass(goal.goalStatus)">{{ goal.goalStatus?.replace('_', ' ') }}</span>
          </div>
        </div>

        <p v-if="goal.description" class="text-sm text-secondary mb-md">{{ goal.description }}</p>

        <div class="meta-grid">
          <div><span class="form-label">UoM</span><span class="text-sm font-medium">{{ formatUom(goal.uom) }}</span></div>
          <div><span class="form-label">Target</span><span class="text-sm font-medium">{{ goal.uom === 'zero' ? '0' : goal.target }}{{ goal.uom === 'percentage' ? '%' : '' }}</span></div>
          <div><span class="form-label">Weightage</span><span class="text-sm font-bold" style="color: var(--accent-primary);">{{ goal.weightage }}%</span></div>
          <div><span class="form-label">{{ currentQuarter }} Score</span><span class="text-sm font-bold">{{ goalStore.computeScore(goal, currentQuarter) !== null ? goalStore.computeScore(goal, currentQuarter).toFixed(1) + '%' : '—' }}</span></div>
        </div>

        <div class="mt-md">
          <span class="form-label">Quarterly Achievements</span>
          <div class="q-grid mt-sm">
            <div v-for="q in ['Q1','Q2','Q3','Q4']" :key="q" class="q-cell">
              <span class="text-xs text-muted">{{ q }}</span>
              <span class="text-sm font-medium">{{ goal.achievements[q] !== null && goal.achievements[q] !== undefined ? goal.achievements[q] : '—' }}</span>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.my-goals { max-width: 1000px; }
.goal-num {
  display: inline-flex; align-items: center; justify-content: center;
  width: 28px; height: 28px; background: var(--accent-gradient);
  color: white; border-radius: var(--radius-full); font-size: 0.8rem; font-weight: 700; flex-shrink: 0;
}
.meta-grid {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--space-md);
  padding: var(--space-md); background: var(--bg-glass); border-radius: var(--radius-md);
}
.meta-grid > div { display: flex; flex-direction: column; gap: 4px; }
.q-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--space-sm); }
.q-cell {
  display: flex; flex-direction: column; align-items: center; gap: 2px;
  padding: var(--space-sm); background: var(--bg-glass); border-radius: var(--radius-sm);
}
@media (max-width: 768px) { .meta-grid { grid-template-columns: repeat(2, 1fr); } }
</style>
