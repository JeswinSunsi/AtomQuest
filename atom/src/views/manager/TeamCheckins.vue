<script setup>
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import { useGoalStore } from '@/stores/goalStore'
import { useCheckinStore, QUARTERS } from '@/stores/checkinStore'
import { useToastStore } from '@/stores/toastStore'

const auth = useAuthStore()
const goalStore = useGoalStore()
const checkinStore = useCheckinStore()
const toast = useToastStore()

const teamMembers = computed(() => auth.getTeamMembers(auth.currentUser?.id))
const selectedQuarter = ref('Q1')
const expandedMember = ref(null)
const commentText = ref('')

function toggleExpand(empId) {
  expandedMember.value = expandedMember.value === empId ? null : empId
}

function addComment(empId) {
  if (!commentText.value.trim()) return
  checkinStore.addManagerComment(empId, selectedQuarter.value, commentText.value, auth.currentUser.id)
  toast.success('Comment added!')
  commentText.value = ''
}
</script>

<template>
  <div class="team-checkins animate-fade-in">
    <div class="page-header">
      <h1>Team Check-ins</h1>
      <p>View planned vs. actual achievements and add check-in comments.</p>
    </div>

    <div class="flex gap-sm items-center mb-lg">
      <label class="form-label">Quarter:</label>
      <button v-for="q in QUARTERS" :key="q" class="btn"
        :class="selectedQuarter === q ? 'btn-primary' : 'btn-secondary'"
        @click="selectedQuarter = q">{{ q }}</button>
    </div>

    <div v-for="member in teamMembers" :key="member.id" class="card mb-md">
      <div class="flex justify-between items-center" style="cursor: pointer;" @click="toggleExpand(member.id)">
        <div class="flex items-center gap-md">
          <div class="user-avatar-initials">{{ member.avatar }}</div>
          <div>
            <h4>{{ member.name }}</h4>
            <span class="text-sm text-muted">Weighted Score: <strong>{{ goalStore.computeWeightedScore(member.id, selectedQuarter) }}%</strong></span>
          </div>
        </div>
        <div class="flex gap-sm items-center">
          <span v-if="checkinStore.getCheckin(member.id, selectedQuarter)" class="badge badge-success">✓ Checked In</span>
          <span v-else class="badge badge-neutral">Pending</span>
          <span style="font-size: 1.2rem; transition: transform 0.2s;" :style="{ transform: expandedMember === member.id ? 'rotate(180deg)' : '' }">▼</span>
        </div>
      </div>

      <div v-if="expandedMember === member.id" class="mt-md animate-slide-up">
        <table class="data-table" v-if="goalStore.getSheet(member.id)?.goals?.length">
          <thead>
            <tr><th>Goal</th><th>Target</th><th>Actual</th><th>Score</th><th>Status</th></tr>
          </thead>
          <tbody>
            <tr v-for="goal in goalStore.getSheet(member.id).goals" :key="goal.id">
              <td style="font-weight: 500; color: var(--text-primary);">{{ goal.title }}</td>
              <td>{{ goal.target }}</td>
              <td>{{ goal.achievements[selectedQuarter] ?? '—' }}</td>
              <td>
                <strong :style="{
                  color: (goalStore.computeScore(goal, selectedQuarter) ?? 0) >= 80 ? 'var(--color-success)' :
                    (goalStore.computeScore(goal, selectedQuarter) ?? 0) >= 50 ? 'var(--color-warning)' : 'var(--color-danger)'
                }">{{ goalStore.computeScore(goal, selectedQuarter)?.toFixed(1) ?? '—' }}%</strong>
              </td>
              <td><span class="badge" :class="{ 'badge-neutral': goal.goalStatus === 'not_started', 'badge-info': goal.goalStatus === 'on_track', 'badge-success': goal.goalStatus === 'completed' }">{{ goal.goalStatus?.replace('_',' ') }}</span></td>
            </tr>
          </tbody>
        </table>

        <!-- Manager Comments -->
        <div class="mt-md" style="padding-top: var(--space-md); border-top: 1px solid var(--border-subtle);">
          <h4 class="mb-sm text-sm">Check-in Comments</h4>
          <div v-for="c in (checkinStore.getCheckin(member.id, selectedQuarter)?.managerComments || [])" :key="c.id" class="card-glass mb-sm p-md">
            <p class="text-sm">{{ c.text }}</p>
            <span class="text-xs text-muted">{{ new Date(c.createdAt).toLocaleString() }}</span>
          </div>
          <div class="flex gap-sm mt-sm">
            <input v-model="commentText" class="form-input" placeholder="Add a check-in comment..." @keyup.enter="addComment(member.id)" />
            <button class="btn btn-primary" @click="addComment(member.id)">Add</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.team-checkins { max-width: 1100px; }
</style>
