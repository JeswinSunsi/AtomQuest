<script setup>
import { computed } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import { useGoalStore, SHEET_STATUS } from '@/stores/goalStore'
import { useCheckinStore, CHECK_IN_WINDOWS, QUARTERS } from '@/stores/checkinStore'
import { useEscalationStore } from '@/stores/escalationStore'

const auth = useAuthStore()
const goalStore = useGoalStore()
const checkinStore = useCheckinStore()
const escalationStore = useEscalationStore()

const user = computed(() => auth.currentUser)


const mySheet = computed(() => goalStore.getSheet(user.value?.id))
const myGoalCount = computed(() => mySheet.value?.goals?.length || 0)
const mySheetStatus = computed(() => mySheet.value?.status || 'none')
const myWeightedScore = computed(() => {
  const q = currentQuarter.value
  return q ? goalStore.computeWeightedScore(user.value?.id, q) : 0
})


const currentQuarter = computed(() => {
  const m = new Date().getMonth() + 1
  if (m >= 5 && m <= 7) return 'Q1'
  if (m >= 8 && m <= 10) return 'Q2'
  if (m >= 11 || m <= 1) return 'Q3'
  return 'Q4'
})

const currentWindow = computed(() => checkinStore.getCurrentWindow())


const teamMembers = computed(() => auth.getTeamMembers(user.value?.id))
const teamSheets = computed(() => goalStore.getTeamSheets(teamMembers.value.map(m => m.id)))
const pendingReviews = computed(() => teamSheets.value.filter(s => s.status === SHEET_STATUS.SUBMITTED).length)
const approvedSheets = computed(() => teamSheets.value.filter(s => s.status === SHEET_STATUS.LOCKED).length)


const allEmployees = computed(() => auth.getEmployees())
const allSheets = computed(() => goalStore.getAllSheets())
const totalLocked = computed(() => allSheets.value.filter(s => s.status === SHEET_STATUS.LOCKED).length)
const totalSubmitted = computed(() => allSheets.value.filter(s => s.status === SHEET_STATUS.SUBMITTED).length)
const completionRate = computed(() => {
  const total = allEmployees.value.length
  if (!total) return 0
  return Math.round((totalLocked.value / total) * 100)
})

const escalationStats = computed(() => escalationStore.stats)


const checkinStats = computed(() => {
  const empIds = auth.isManager 
    ? teamMembers.value.map(m => m.id)
    : allEmployees.value.map(e => e.id)
  return checkinStore.getCompletionStats(empIds)
})

function getStatusLabel(status) {
  const map = {
    draft: 'Draft',
    submitted: 'Submitted',
    approved: 'Approved',
    returned: 'Returned',
    locked: 'Locked',
    none: 'Not Started',
  }
  return map[status] || status
}

function getStatusClass(status) {
  const map = {
    draft: 'badge-neutral',
    submitted: 'badge-info',
    approved: 'badge-success',
    returned: 'badge-warning',
    locked: 'badge-primary',
    none: 'badge-neutral',
  }
  return map[status] || 'badge-neutral'
}
</script>

<template>
  <div class="dashboard animate-fade-in">
    <div class="page-header flex justify-between items-center">
      <div>
        <h1>Welcome back, <span>{{ user?.name?.split(' ')[0] }}</span></h1>
        <p>{{ new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) }}</p>
      </div>
      <div v-if="currentWindow" class="badge badge-success" style="font-size: 0.8rem; padding: 8px 16px;">
        {{ currentWindow }} Window Open
      </div>
    </div>

    <!-- Employee Dashboard -->
    <template v-if="auth.isEmployee">
      <div class="grid-4 mb-lg">
        <div class="stat-card animate-slide-up" style="animation-delay: 0ms">
          <span class="stat-label">My Goals</span>
          <span class="stat-value">{{ myGoalCount }}</span>
          <span class="text-sm text-muted">of 8 max</span>
        </div>
        <div class="stat-card animate-slide-up" style="animation-delay: 80ms">
          <span class="stat-label">Sheet Status</span>
          <span class="badge" :class="getStatusClass(mySheetStatus)" style="font-size: 0.9rem; padding: 6px 14px; margin-top: 4px;">
            {{ getStatusLabel(mySheetStatus) }}
          </span>
        </div>
        <div class="stat-card animate-slide-up" style="animation-delay: 160ms">
          <span class="stat-label">Current Quarter</span>
          <span class="stat-value">{{ currentQuarter }}</span>
          <span class="text-sm text-muted">FY 2025-26</span>
        </div>
        <div class="stat-card animate-slide-up" style="animation-delay: 240ms">
          <span class="stat-label">Weighted Score</span>
          <span class="stat-value">{{ myWeightedScore }}%</span>
          <span class="text-sm text-muted">{{ currentQuarter }} progress</span>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="card mb-lg">
        <h3 class="mb-md">Quick Actions</h3>
        <div class="flex gap-md flex-wrap">
          <router-link to="/goals/create" class="btn btn-primary" v-if="!mySheet || mySheet.status === 'draft' || mySheet.status === 'returned'">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
            {{ mySheet ? 'Edit Goal Sheet' : 'Create Goal Sheet' }}
          </router-link>
          <router-link to="/goals/my" class="btn btn-secondary">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            View My Goals
          </router-link>
          <router-link to="/checkin" class="btn btn-secondary">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>
            Log Check-in
          </router-link>
        </div>
      </div>

      <!-- Return Comment Alert -->
      <div v-if="mySheet?.status === 'returned'" class="card-accent mb-lg" style="border-color: var(--color-warning-border);">
        <div class="flex gap-md items-start">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="var(--color-warning)" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          <div>
            <h4 style="color: var(--color-warning);">Goal Sheet Returned</h4>
            <p class="text-sm text-secondary mt-sm">{{ mySheet.returnComment }}</p>
          </div>
        </div>
      </div>

      <!-- Goals Summary -->
      <div class="card" v-if="mySheet && mySheet.goals.length">
        <h3 class="mb-md">Goal Summary</h3>
        <table class="data-table">
          <thead>
            <tr>
              <th>Goal</th>
              <th>Thrust Area</th>
              <th>UoM</th>
              <th>Target</th>
              <th>Weightage</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="goal in mySheet.goals" :key="goal.id">
              <td style="color: var(--text-primary); font-weight: 500;">{{ goal.title }}</td>
              <td><span class="tag">{{ goal.thrustArea }}</span></td>
              <td>{{ goal.uom }}</td>
              <td>{{ goal.target }}</td>
              <td><strong>{{ goal.weightage }}%</strong></td>
              <td>
                <span class="badge" :class="{
                  'badge-neutral': goal.goalStatus === 'not_started',
                  'badge-info': goal.goalStatus === 'on_track',
                  'badge-success': goal.goalStatus === 'completed',
                }">{{ goal.goalStatus?.replace('_', ' ') }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>

    <!-- Manager Dashboard -->
    <template v-if="auth.isManager">
      <div class="grid-4 mb-lg">
        <div class="stat-card animate-slide-up" style="animation-delay: 0ms">
          <span class="stat-label">Team Members</span>
          <span class="stat-value">{{ teamMembers.length }}</span>
        </div>
        <div class="stat-card animate-slide-up" style="animation-delay: 80ms">
          <span class="stat-label">Pending Reviews</span>
          <span class="stat-value">{{ pendingReviews }}</span>
          <span class="text-sm text-muted">goal sheets</span>
        </div>
        <div class="stat-card animate-slide-up" style="animation-delay: 160ms">
          <span class="stat-label">Approved</span>
          <span class="stat-value">{{ approvedSheets }}</span>
          <span class="text-sm text-muted">locked sheets</span>
        </div>
        <div class="stat-card animate-slide-up" style="animation-delay: 240ms">
          <span class="stat-label">Current Quarter</span>
          <span class="stat-value">{{ currentQuarter }}</span>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="card mb-lg">
        <h3 class="mb-md">Quick Actions</h3>
        <div class="flex gap-md flex-wrap">
          <router-link to="/goals/team" class="btn btn-primary">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
            Review Team Goals
          </router-link>
          <router-link to="/checkin/team" class="btn btn-secondary">
            Team Check-ins
          </router-link>
          <router-link to="/admin/push-kpi" class="btn btn-secondary">
            Push KPI
          </router-link>
          <router-link to="/reports" class="btn btn-secondary">
            View Reports
          </router-link>
        </div>
      </div>

      <!-- Team Members List -->
      <div class="card">
        <h3 class="mb-md">Team Overview</h3>
        <table class="data-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Goals</th>
              <th>Sheet Status</th>
              <th>{{ currentQuarter }} Score</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="member in teamMembers" :key="member.id">
              <td class="flex items-center gap-sm">
                <div class="user-avatar-initials">{{ member.avatar }}</div>
                <span style="color: var(--text-primary); font-weight: 500;">{{ member.name }}</span>
              </td>
              <td>{{ goalStore.getSheet(member.id)?.goals?.length || 0 }}</td>
              <td>
                <span class="badge" :class="getStatusClass(goalStore.getSheet(member.id)?.status || 'none')">
                  {{ getStatusLabel(goalStore.getSheet(member.id)?.status || 'none') }}
                </span>
              </td>
              <td>
                <strong>{{ goalStore.computeWeightedScore(member.id, currentQuarter) }}%</strong>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>

    <!-- Admin Dashboard -->
    <template v-if="auth.isAdmin">
      <div class="grid-4 mb-lg">
        <div class="stat-card animate-slide-up" style="animation-delay: 0ms">
          <span class="stat-label">Total Employees</span>
          <span class="stat-value">{{ allEmployees.length }}</span>
        </div>
        <div class="stat-card animate-slide-up" style="animation-delay: 80ms">
          <span class="stat-label">Goals Locked</span>
          <span class="stat-value">{{ totalLocked }}</span>
        </div>
        <div class="stat-card animate-slide-up" style="animation-delay: 160ms">
          <span class="stat-label">Pending Approval</span>
          <span class="stat-value">{{ totalSubmitted }}</span>
        </div>
        <div class="stat-card animate-slide-up" style="animation-delay: 240ms">
          <span class="stat-label">Completion Rate</span>
          <span class="stat-value">{{ completionRate }}%</span>
          <div class="progress-bar-wrap mt-sm">
            <div class="progress-bar-fill success" :style="{ width: completionRate + '%' }"></div>
          </div>
        </div>
      </div>

      <!-- Check-in Completion Grid -->
      <div class="card mb-lg">
        <h3 class="mb-md">Check-in Completion by Quarter</h3>
        <div class="grid-4">
          <div v-for="q in QUARTERS" :key="q" class="card-glass" style="text-align: center;">
            <div class="text-sm font-semibold text-secondary mb-sm">{{ q }}</div>
            <div class="stat-value" style="font-size: 1.5rem;">
              {{ checkinStats[q]?.completed || 0 }}/{{ checkinStats[q]?.total || 0 }}
            </div>
            <div class="progress-bar-wrap mt-sm">
              <div class="progress-bar-fill" :class="{
                'success': (checkinStats[q]?.completed / checkinStats[q]?.total * 100) >= 80,
                'warning': (checkinStats[q]?.completed / checkinStats[q]?.total * 100) >= 40 && (checkinStats[q]?.completed / checkinStats[q]?.total * 100) < 80,
                'danger': (checkinStats[q]?.completed / checkinStats[q]?.total * 100) < 40,
              }" :style="{ width: (checkinStats[q]?.total ? (checkinStats[q].completed / checkinStats[q].total * 100) : 0) + '%' }"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Escalation Summary -->
      <div class="card mb-lg" v-if="escalationStats.totalOpen > 0">
        <div class="flex justify-between items-center mb-md">
          <h3>Active Escalations</h3>
          <router-link to="/admin/escalation-log" class="btn btn-sm btn-secondary">View All</router-link>
        </div>
        <div class="grid-3">
          <div class="card-glass" style="text-align:center"><div class="text-sm font-semibold text-secondary mb-sm">Open</div><div class="stat-value" style="font-size:1.5rem;color:var(--color-danger)!important">{{ escalationStats.totalOpen }}</div></div>
          <div class="card-glass" style="text-align:center"><div class="text-sm font-semibold text-secondary mb-sm">Resolved Today</div><div class="stat-value" style="font-size:1.5rem">{{ escalationStats.resolvedToday }}</div></div>
          <div class="card-glass" style="text-align:center"><div class="text-sm font-semibold text-secondary mb-sm">Active Rules</div><div class="stat-value" style="font-size:1.5rem">{{ escalationStats.activeRules }}</div></div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="card">
        <h3 class="mb-md">Administration</h3>
        <div class="flex gap-md flex-wrap">
          <router-link to="/admin/push-kpi" class="btn btn-primary">Push KPI</router-link>
          <router-link to="/admin/audit" class="btn btn-secondary">Audit Trail</router-link>
          <router-link to="/reports" class="btn btn-secondary">Reports & Export</router-link>
          <router-link to="/admin/escalation-rules" class="btn btn-secondary">Escalation Rules</router-link>
          <router-link to="/admin/escalation-log" class="btn btn-secondary">Escalation Log</router-link>
        </div>
      </div>
    </template>

    <!-- Check-in Schedule -->
    <div class="card mt-lg">
      <h3 class="mb-md">Check-in Schedule — FY 2025-26</h3>
      <table class="data-table">
        <thead>
          <tr>
            <th>Period</th>
            <th>Window</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(val, key) in CHECK_IN_WINDOWS" :key="key">
            <td style="font-weight: 600; color: var(--text-primary);">{{ key }}</td>
            <td>{{ val.label }}</td>
            <td>
              <span class="badge" :class="checkinStore.isWindowOpen(key) ? 'badge-success' : 'badge-neutral'">
                {{ checkinStore.isWindowOpen(key) ? 'Open' : 'Closed' }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.dashboard {
  max-width: 1200px;
}
</style>
