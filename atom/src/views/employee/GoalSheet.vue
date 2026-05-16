<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { useGoalStore, THRUST_AREAS, UOM_TYPES, SHEET_STATUS } from '@/stores/goalStore'
import { useToastStore } from '@/stores/toastStore'

const router = useRouter()
const auth = useAuthStore()
const goalStore = useGoalStore()
const toast = useToastStore()

const employeeId = computed(() => auth.currentUser?.id)
const sheet = computed(() => goalStore.getSheet(employeeId.value))

// Initialize sheet if needed
if (!sheet.value) {
  goalStore.createSheet(employeeId.value)
}

const canEdit = computed(() => {
  if (!sheet.value) return true
  return [SHEET_STATUS.DRAFT, SHEET_STATUS.RETURNED].includes(sheet.value.status)
})

// Goals as reactive local state for editing
const localGoals = ref([])

function syncLocalGoals() {
  if (sheet.value) {
    localGoals.value = sheet.value.goals.map(g => ({ ...g }))
  }
}

syncLocalGoals()
watch(sheet, syncLocalGoals, { deep: true })

// Validation
const totalWeightage = computed(() =>
  localGoals.value.reduce((sum, g) => sum + Number(g.weightage || 0), 0)
)

const validation = computed(() => {
  const errors = []
  if (localGoals.value.length === 0) errors.push('Add at least one goal')
  if (localGoals.value.length > 8) errors.push('Max 8 goals allowed')
  if (Math.abs(totalWeightage.value - 100) > 0.01) errors.push(`Total weightage must equal 100% (currently ${totalWeightage.value}%)`)

  localGoals.value.forEach((g, i) => {
    if (Number(g.weightage || 0) < 10) errors.push(`Goal ${i + 1}: min weightage is 10%`)
    if (!g.title?.trim()) errors.push(`Goal ${i + 1}: title required`)
    if (!g.thrustArea) errors.push(`Goal ${i + 1}: thrust area required`)
    if (!g.target && g.uom !== 'zero') errors.push(`Goal ${i + 1}: target required`)
  })

  return { valid: errors.length === 0, errors }
})

const weightagePercent = computed(() => Math.min(totalWeightage.value, 100))
const weightageColor = computed(() => {
  if (totalWeightage.value === 100) return 'success'
  if (totalWeightage.value > 100) return 'danger'
  return 'warning'
})

function addGoal() {
  if (localGoals.value.length >= 8) {
    toast.warning('Maximum 8 goals allowed')
    return
  }
  localGoals.value.push({
    id: 'temp_' + Date.now(),
    thrustArea: '',
    title: '',
    description: '',
    uom: 'numeric',
    target: '',
    weightage: '',
    isSharedKPI: false,
  })
}

function removeGoal(index) {
  const goal = localGoals.value[index]
  if (goal.isSharedKPI) {
    toast.warning('Cannot remove shared KPI goals')
    return
  }
  localGoals.value.splice(index, 1)
}

function saveGoals() {
  // Sync local goals back to store
  const s = goalStore.getSheet(employeeId.value) || goalStore.createSheet(employeeId.value)

  // Keep shared KPI goals and update the rest
  s.goals = localGoals.value.map(lg => {
    const existing = s.goals.find(g => g.id === lg.id)
    if (existing) {
      // Update existing
      if (lg.isSharedKPI) {
        existing.weightage = Number(lg.weightage)
      } else {
        Object.assign(existing, {
          thrustArea: lg.thrustArea,
          title: lg.title,
          description: lg.description,
          uom: lg.uom,
          target: lg.uom === 'zero' ? 0 : Number(lg.target),
          weightage: Number(lg.weightage),
        })
      }
      return existing
    } else {
      // New goal
      return {
        ...lg,
        id: 'goal_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        target: lg.uom === 'zero' ? 0 : Number(lg.target),
        weightage: Number(lg.weightage),
        goalStatus: 'not_started',
        achievements: { Q1: null, Q2: null, Q3: null, Q4: null },
        createdAt: new Date().toISOString(),
      }
    }
  })

  s.updatedAt = new Date().toISOString()
  goalStore.persist()
  toast.success('Goals saved successfully!')
}

function submitGoals() {
  saveGoals()
  const result = goalStore.submitSheet(employeeId.value)
  if (result.error) {
    toast.error(result.error)
  } else {
    toast.success('Goal sheet submitted for manager approval!')
    router.push('/goals/my')
  }
}
</script>

<template>
  <div class="goal-sheet animate-fade-in">
    <div class="page-header flex justify-between items-center">
      <div>
        <h1>Goal Sheet</h1>
        <p>Define your goals for FY 2025-26. Each goal needs a thrust area, target, and weightage.</p>
      </div>
      <div class="flex gap-sm items-center">
        <span v-if="sheet" class="badge" :class="{
          'badge-neutral': sheet.status === 'draft',
          'badge-info': sheet.status === 'submitted',
          'badge-success': sheet.status === 'locked',
          'badge-warning': sheet.status === 'returned',
        }" style="font-size: 0.85rem; padding: 6px 14px;">
          {{ sheet.status?.toUpperCase() }}
        </span>
      </div>
    </div>

    <!-- Return Warning -->
    <div v-if="sheet?.status === 'returned'" class="card-accent mb-lg" style="border-color: var(--color-warning-border);">
      <div class="flex gap-md items-start">
        <div>
          <h4 style="color: var(--color-warning);">Returned by Manager</h4>
          <p class="text-sm text-secondary mt-sm">{{ sheet.returnComment }}</p>
        </div>
      </div>
    </div>

    <!-- Locked Warning -->
    <div v-if="sheet?.status === 'locked' || sheet?.status === 'submitted'" class="card mb-lg" style="border-color: var(--color-info-border);">
      <div class="flex gap-md items-center">
        <p class="text-sm text-secondary">
          {{ sheet.status === 'locked' ? 'Your goal sheet is locked. Contact Admin to make changes.' : 'Your goal sheet is submitted and pending approval. No edits allowed.' }}
        </p>
      </div>
    </div>

    <!-- Weightage Progress Bar -->
    <div class="card mb-lg">
      <div class="flex justify-between items-center mb-sm">
        <span class="form-label">Total Weightage</span>
        <span class="font-bold" :style="{ color: totalWeightage === 100 ? 'var(--color-success)' : totalWeightage > 100 ? 'var(--color-danger)' : 'var(--color-warning)' }">
          {{ totalWeightage }}% / 100%
        </span>
      </div>
      <div class="progress-bar-wrap" style="height: 12px;">
        <div class="progress-bar-fill" :class="weightageColor" :style="{ width: weightagePercent + '%' }"></div>
      </div>
      <div class="flex justify-between mt-sm">
        <span class="text-xs text-muted">{{ localGoals.length }} / 8 goals</span>
        <span class="text-xs" :style="{ color: validation.valid ? 'var(--color-success)' : 'var(--color-warning)' }">
          {{ validation.valid ? '✓ Ready to submit' : validation.errors[0] }}
        </span>
      </div>
    </div>

    <!-- Goals List -->
    <div class="goals-list">
      <div
        v-for="(goal, index) in localGoals"
        :key="goal.id || index"
        class="card mb-md goal-card animate-slide-up"
        :style="{ animationDelay: (index * 50) + 'ms' }"
      >
        <div class="flex justify-between items-center mb-md">
          <h4 class="flex items-center gap-sm">
            <span class="goal-number">{{ index + 1 }}</span>
            {{ goal.title || 'New Goal' }}
            <span v-if="goal.isSharedKPI" class="badge badge-primary" style="margin-left: 8px;">Shared KPI</span>
          </h4>
          <button
            v-if="canEdit && !goal.isSharedKPI"
            class="btn btn-ghost btn-icon"
            @click="removeGoal(index)"
            title="Remove goal"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="var(--color-danger)" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div class="goal-form-grid">
          <!-- Thrust Area -->
          <div class="form-group">
            <label class="form-label">Thrust Area</label>
            <select
              v-model="goal.thrustArea"
              class="form-select"
              :disabled="!canEdit || goal.isSharedKPI"
            >
              <option value="">Select Thrust Area</option>
              <option v-for="ta in THRUST_AREAS" :key="ta" :value="ta">{{ ta }}</option>
            </select>
          </div>

          <!-- Title -->
          <div class="form-group">
            <label class="form-label">Goal Title</label>
            <input
              v-model="goal.title"
              class="form-input"
              placeholder="Enter goal title"
              :disabled="!canEdit || goal.isSharedKPI"
            />
          </div>

          <!-- UoM -->
          <div class="form-group">
            <label class="form-label">Unit of Measurement</label>
            <select
              v-model="goal.uom"
              class="form-select"
              :disabled="!canEdit || goal.isSharedKPI"
            >
              <option v-for="u in UOM_TYPES" :key="u.value" :value="u.value">{{ u.label }}</option>
            </select>
          </div>

          <!-- Target -->
          <div class="form-group" v-if="goal.uom !== 'zero'">
            <label class="form-label">Target</label>
            <input
              v-model="goal.target"
              class="form-input"
              :type="goal.uom === 'timeline' ? 'date' : 'number'"
              :placeholder="goal.uom === 'percentage' ? 'e.g., 95' : 'e.g., 500'"
              :disabled="!canEdit || goal.isSharedKPI"
            />
          </div>

          <!-- Weightage -->
          <div class="form-group">
            <label class="form-label">Weightage (%)</label>
            <input
              v-model="goal.weightage"
              class="form-input"
              type="number"
              min="10"
              max="100"
              placeholder="Min 10%"
              :disabled="!canEdit"
              :class="{ 'is-invalid': Number(goal.weightage || 0) < 10 && goal.weightage !== '' }"
            />
            <span v-if="Number(goal.weightage || 0) < 10 && goal.weightage !== ''" class="form-error">Minimum 10%</span>
          </div>
        </div>

        <!-- Description -->
        <div class="form-group mt-md">
          <label class="form-label">Description</label>
          <textarea
            v-model="goal.description"
            class="form-textarea"
            placeholder="Describe the goal in detail..."
            :disabled="!canEdit || goal.isSharedKPI"
            rows="2"
          ></textarea>
        </div>
      </div>
    </div>

    <!-- Add Goal Button -->
    <button
      v-if="canEdit && localGoals.length < 8"
      class="btn btn-secondary w-full mb-lg add-goal-btn"
      @click="addGoal"
    >
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      Add Goal ({{ localGoals.length }}/8)
    </button>

    <!-- Validation Errors -->
    <div v-if="!validation.valid && localGoals.length > 0" class="card mb-lg" style="border-color: var(--color-danger-border);">
      <h4 style="color: var(--color-danger); margin-bottom: 8px;">⚠ Validation Issues</h4>
      <ul style="list-style: none; display: flex; flex-direction: column; gap: 4px;">
        <li v-for="(err, i) in validation.errors" :key="i" class="text-sm text-secondary">
          • {{ err }}
        </li>
      </ul>
    </div>

    <!-- Actions -->
    <div v-if="canEdit" class="flex gap-md justify-end">
      <button class="btn btn-secondary" @click="saveGoals" :disabled="localGoals.length === 0">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
        Save Draft
      </button>
      <button class="btn btn-primary" @click="submitGoals" :disabled="!validation.valid">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
        Submit for Approval
      </button>
    </div>
  </div>
</template>

<style scoped>
.goal-sheet {
  max-width: 1000px;
}

.goal-number {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: var(--accent-gradient);
  color: white;
  border-radius: var(--radius-full);
  font-size: 0.8rem;
  font-weight: 700;
}

.goal-form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: var(--space-md);
}

@media (max-width: 768px) {
  .goal-form-grid {
    grid-template-columns: 1fr;
  }
}

.goal-card {
  transition: all var(--transition-base);
}

.goal-card:hover {
  border-color: var(--border-accent);
}

.add-goal-btn {
  border-style: dashed;
  padding: var(--space-lg);
}

.add-goal-btn:hover {
  border-color: var(--accent-primary);
  color: var(--accent-primary);
}
</style>
