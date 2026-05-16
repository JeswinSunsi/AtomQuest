<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { useGoalStore, SHEET_STATUS } from '@/stores/goalStore'
import { useAuditStore } from '@/stores/auditStore'
import { useToastStore } from '@/stores/toastStore'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const goalStore = useGoalStore()
const auditStore = useAuditStore()
const toast = useToastStore()

const employeeId = route.params.employeeId
const employee = computed(() => auth.getUserById(employeeId))
const sheet = computed(() => goalStore.getSheet(employeeId))

const showReturnModal = ref(false)
const returnComment = ref('')

const canReview = computed(() => sheet.value?.status === SHEET_STATUS.SUBMITTED)

function handleApprove() {
  goalStore.approveSheet(employeeId)
  auditStore.addLog({
    userId: auth.currentUser.id,
    userName: auth.currentUser.name,
    action: 'Goal Sheet Approved & Locked',
    employeeId,
    details: `Approved goal sheet for ${employee.value?.name}`,
  })
  toast.success(`Goal sheet for ${employee.value?.name} approved and locked!`)
  router.push('/goals/team')
}

function handleReturn() {
  if (!returnComment.value.trim()) {
    toast.warning('Please provide a comment for the employee.')
    return
  }
  goalStore.returnSheet(employeeId, returnComment.value)
  auditStore.addLog({
    userId: auth.currentUser.id,
    userName: auth.currentUser.name,
    action: 'Goal Sheet Returned',
    employeeId,
    details: returnComment.value,
  })
  toast.warning(`Goal sheet returned to ${employee.value?.name}`)
  showReturnModal.value = false
  router.push('/goals/team')
}

function updateGoalInline(goalId, field, value) {
  const before = sheet.value.goals.find(g => g.id === goalId)?.[field]
  goalStore.updateGoal(employeeId, goalId, { [field]: value })
  if (sheet.value?.status === SHEET_STATUS.LOCKED) {
    auditStore.addLog({
      userId: auth.currentUser.id,
      userName: auth.currentUser.name,
      action: `Post-lock edit: ${field}`,
      goalId,
      goalTitle: sheet.value.goals.find(g => g.id === goalId)?.title,
      employeeId,
      before: String(before),
      after: String(value),
    })
  }
}
</script>

<template>
  <div class="review-goal animate-fade-in">
    <div class="page-header flex justify-between items-center">
      <div>
        <button class="btn btn-ghost mb-sm" @click="router.push('/goals/team')">
          ← Back to Team
        </button>
        <h1>Review: {{ employee?.name }}</h1>
        <p>{{ employee?.department }} — Goal Sheet Review</p>
      </div>
      <span v-if="sheet" class="badge" :class="{
        'badge-info': sheet.status === 'submitted',
        'badge-success': sheet.status === 'locked',
        'badge-warning': sheet.status === 'returned',
        'badge-neutral': sheet.status === 'draft',
      }" style="font-size: 0.9rem; padding: 8px 16px;">{{ sheet.status.toUpperCase() }}</span>
    </div>

    <div v-if="!sheet" class="empty-state card">
      <h3>No Goal Sheet</h3>
      <p class="text-sm text-muted">This employee hasn't created a goal sheet yet.</p>
    </div>

    <template v-else>
      <div class="card mb-lg">
        <table class="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Goal</th>
              <th>Thrust Area</th>
              <th>UoM</th>
              <th>Target</th>
              <th>Weightage</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(goal, i) in sheet.goals" :key="goal.id">
              <td><span class="goal-number">{{ i + 1 }}</span></td>
              <td>
                <div style="color: var(--text-primary); font-weight: 500;">{{ goal.title }}</div>
                <div v-if="goal.description" class="text-xs text-muted mt-sm">{{ goal.description }}</div>
                <span v-if="goal.isSharedKPI" class="badge badge-primary mt-sm">Shared KPI</span>
              </td>
              <td><span class="tag">{{ goal.thrustArea }}</span></td>
              <td>{{ goal.uom }}</td>
              <td>
                <input v-if="canReview && !goal.isSharedKPI"
                  :value="goal.target" @change="e => updateGoalInline(goal.id, 'target', Number(e.target.value))"
                  class="form-input" type="number" style="width: 90px;" />
                <span v-else>{{ goal.target }}</span>
              </td>
              <td>
                <input v-if="canReview"
                  :value="goal.weightage" @change="e => updateGoalInline(goal.id, 'weightage', Number(e.target.value))"
                  class="form-input" type="number" style="width: 80px;" />
                <strong v-else>{{ goal.weightage }}%</strong>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Weightage Summary -->
      <div class="card mb-lg flex justify-between items-center">
        <div>
          <span class="form-label">Total Weightage</span>
          <span class="text-lg font-bold" :style="{
            color: sheet.goals.reduce((s,g) => s + Number(g.weightage), 0) === 100 ? 'var(--color-success)' : 'var(--color-danger)'
          }">
            {{ sheet.goals.reduce((s,g) => s + Number(g.weightage), 0) }}%
          </span>
        </div>

        <div v-if="canReview" class="flex gap-md">
          <button class="btn btn-warning" @click="showReturnModal = true">
            Return for Rework
          </button>
          <button class="btn btn-success" @click="handleApprove"
            :disabled="sheet.goals.reduce((s,g) => s + Number(g.weightage), 0) !== 100">
            Approve & Lock
          </button>
        </div>
      </div>
    </template>

    <!-- Return Modal -->
    <div v-if="showReturnModal" class="modal-overlay" @click.self="showReturnModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Return Goal Sheet</h3>
          <button class="btn btn-ghost btn-icon" @click="showReturnModal = false">&times;</button>
        </div>
        <div class="form-group">
          <label class="form-label">Comment for Employee</label>
          <textarea v-model="returnComment" class="form-textarea" rows="4"
            placeholder="Explain what needs to be revised..."></textarea>
        </div>
        <div class="modal-actions">
          <button class="btn btn-secondary" @click="showReturnModal = false">Cancel</button>
          <button class="btn btn-warning" @click="handleReturn">Return Sheet</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.review-goal { max-width: 1100px; }
.goal-number {
  display: inline-flex; align-items: center; justify-content: center;
  width: 26px; height: 26px; background: var(--accent-gradient);
  color: white; border-radius: var(--radius-full); font-size: 0.75rem; font-weight: 700;
}
</style>
