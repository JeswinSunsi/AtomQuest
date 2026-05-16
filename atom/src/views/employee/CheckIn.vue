<script setup>
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import { useGoalStore, GOAL_STATUS, SHEET_STATUS } from '@/stores/goalStore'
import { useCheckinStore, QUARTERS } from '@/stores/checkinStore'
import { useToastStore } from '@/stores/toastStore'

const auth = useAuthStore()
const goalStore = useGoalStore()
const checkinStore = useCheckinStore()
const toast = useToastStore()

const employeeId = computed(() => auth.currentUser?.id)
const sheet = computed(() => goalStore.getSheet(employeeId.value))
const selectedQuarter = ref('Q1')

const isLocked = computed(() => sheet.value?.status === SHEET_STATUS.LOCKED)

function saveCheckin() {
  if (!sheet.value) return
  sheet.value.goals.forEach(g => {
    goalStore.logAchievement(employeeId.value, g.id, selectedQuarter.value, g.achievements[selectedQuarter.value])
    goalStore.updateGoalStatus(employeeId.value, g.id, g.goalStatus)
  })
  checkinStore.addCheckin(employeeId.value, selectedQuarter.value, { submitted: true })
  toast.success(`${selectedQuarter.value} check-in saved!`)
}
</script>

<template>
  <div class="checkin animate-fade-in">
    <div class="page-header">
      <h1>Quarterly Check-in</h1>
      <p>Log your actual achievements against planned targets.</p>
    </div>

    <div v-if="!sheet || !isLocked" class="empty-state card">
      <h3>Goals Not Locked</h3>
      <p class="text-sm text-muted">Your goal sheet must be approved and locked before you can log check-ins.</p>
    </div>

    <template v-else>
      <div class="flex gap-md items-center mb-lg">
        <label class="form-label">Select Quarter:</label>
        <div class="flex gap-sm">
          <button v-for="q in QUARTERS" :key="q"
            class="btn" :class="selectedQuarter === q ? 'btn-primary' : 'btn-secondary'"
            @click="selectedQuarter = q">{{ q }}</button>
        </div>
        <span v-if="checkinStore.getCheckin(employeeId, selectedQuarter)" class="badge badge-success">✓ Submitted</span>
      </div>

      <div class="card mb-lg">
        <table class="data-table">
          <thead>
            <tr>
              <th>Goal</th>
              <th>UoM</th>
              <th>Target</th>
              <th>Achievement</th>
              <th>Score</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="goal in sheet.goals" :key="goal.id">
              <td style="color: var(--text-primary); font-weight: 500; max-width: 200px;">{{ goal.title }}</td>
              <td>{{ goal.uom }}</td>
              <td>{{ goal.uom === 'zero' ? '0' : goal.target }}{{ goal.uom === 'percentage' ? '%' : '' }}</td>
              <td>
                <input v-model="goal.achievements[selectedQuarter]" class="form-input" type="number"
                  :placeholder="goal.uom === 'zero' ? '0 or 1' : 'Actual'" style="width: 100px;" />
              </td>
              <td>
                <span class="font-bold" :style="{
                  color: (goalStore.computeScore(goal, selectedQuarter) ?? 0) >= 80 ? 'var(--color-success)' :
                    (goalStore.computeScore(goal, selectedQuarter) ?? 0) >= 50 ? 'var(--color-warning)' : 'var(--color-danger)'
                }">
                  {{ goalStore.computeScore(goal, selectedQuarter) !== null ? goalStore.computeScore(goal, selectedQuarter).toFixed(1) + '%' : '—' }}
                </span>
              </td>
              <td>
                <select v-model="goal.goalStatus" class="form-select" style="width: 130px;">
                  <option value="not_started">Not Started</option>
                  <option value="on_track">On Track</option>
                  <option value="completed">Completed</option>
                </select>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="card mb-lg flex justify-between items-center">
        <div>
          <span class="form-label">Weighted Score ({{ selectedQuarter }})</span>
          <div class="stat-value" style="font-size: 1.8rem;">{{ goalStore.computeWeightedScore(employeeId, selectedQuarter) }}%</div>
        </div>
        <button class="btn btn-primary btn-lg" @click="saveCheckin">Save Check-in</button>
      </div>
    </template>
  </div>
</template>

<style scoped>
.checkin { max-width: 1100px; }
</style>
