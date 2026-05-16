<script setup>
import { computed } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import { useGoalStore, SHEET_STATUS } from '@/stores/goalStore'

const auth = useAuthStore()
const goalStore = useGoalStore()

const teamMembers = computed(() => auth.getTeamMembers(auth.currentUser?.id))

function getSheet(empId) { return goalStore.getSheet(empId) }

function getStatusClass(status) {
  return { draft: 'badge-neutral', submitted: 'badge-info', approved: 'badge-success', returned: 'badge-warning', locked: 'badge-primary' }[status] || 'badge-neutral'
}

function getStatusLabel(status) {
  return { draft: 'Draft', submitted: 'Pending Review', approved: 'Approved', returned: 'Returned', locked: 'Locked' }[status] || 'Not Started'
}

const statusFilter = computed(() => {
  return [
    { label: 'All', value: 'all' },
    { label: 'Pending', value: SHEET_STATUS.SUBMITTED },
    { label: 'Locked', value: SHEET_STATUS.LOCKED },
    { label: 'Returned', value: SHEET_STATUS.RETURNED },
  ]
})
</script>

<template>
  <div class="team-goals animate-fade-in">
    <div class="page-header">
      <h1>Team Goals</h1>
      <p>Review and approve goal sheets submitted by your team members.</p>
    </div>

    <div v-if="!teamMembers.length" class="empty-state card">
      <h3>No Team Members</h3>
      <p class="text-sm text-muted">No employees are assigned to you.</p>
    </div>

    <div v-else class="team-grid">
      <router-link
        v-for="member in teamMembers"
        :key="member.id"
        :to="'/goals/review/' + member.id"
        class="card team-member-card animate-slide-up"
        :style="{ textDecoration: 'none' }"
      >
        <div class="flex items-center gap-md mb-md">
          <div class="user-avatar-initials">{{ member.avatar }}</div>
          <div>
            <h3 style="font-size: 1rem;">{{ member.name }}</h3>
            <span class="text-sm text-muted">{{ member.department }}</span>
          </div>
        </div>

        <div class="flex justify-between items-center">
          <div>
            <span class="form-label">Goals</span>
            <span class="text-lg font-bold">{{ getSheet(member.id)?.goals?.length || 0 }}</span>
          </div>
          <span class="badge" :class="getStatusClass(getSheet(member.id)?.status)">
            {{ getStatusLabel(getSheet(member.id)?.status) }}
          </span>
        </div>

        <div v-if="getSheet(member.id)?.status === 'submitted'" class="mt-md" style="padding-top: var(--space-sm); border-top: 1px solid var(--border-subtle);">
          <span class="text-xs" style="color: var(--color-warning);">Awaiting your review</span>
        </div>
      </router-link>
    </div>
  </div>
</template>

<style scoped>
.team-goals { max-width: 1000px; }
.team-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: var(--space-md); }
.team-member-card { cursor: pointer; transition: all var(--transition-base); }
.team-member-card:hover { border-color: var(--border-accent); transform: translateY(-3px); box-shadow: var(--shadow-glow); }
</style>
