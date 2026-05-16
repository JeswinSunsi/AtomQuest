<script setup>
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import { useKpiStore } from '@/stores/kpiStore'
import { useGoalStore, THRUST_AREAS, UOM_TYPES } from '@/stores/goalStore'
import { useToastStore } from '@/stores/toastStore'

const auth = useAuthStore()
const kpiStore = useKpiStore()
const goalStore = useGoalStore()
const toast = useToastStore()

const employees = computed(() => auth.getEmployees())

const kpiForm = ref({
  title: '',
  description: '',
  thrustArea: '',
  uom: 'numeric',
  target: '',
})
const selectedEmployees = ref([])
const primaryOwner = ref('')

function toggleEmployee(empId) {
  const idx = selectedEmployees.value.indexOf(empId)
  if (idx >= 0) {
    selectedEmployees.value.splice(idx, 1)
    if (primaryOwner.value === empId) primaryOwner.value = ''
  } else {
    selectedEmployees.value.push(empId)
  }
}

const isValid = computed(() => {
  return kpiForm.value.title.trim() && kpiForm.value.thrustArea && kpiForm.value.target && selectedEmployees.value.length > 0 && primaryOwner.value
})

function pushKpi() {
  if (!isValid.value) { toast.warning('Please fill all fields'); return }
  kpiStore.pushKPI(
    { ...kpiForm.value, target: Number(kpiForm.value.target) },
    selectedEmployees.value,
    primaryOwner.value,
  )
  toast.success(`KPI "${kpiForm.value.title}" pushed to ${selectedEmployees.value.length} employees!`)
  kpiForm.value = { title: '', description: '', thrustArea: '', uom: 'numeric', target: '' }
  selectedEmployees.value = []
  primaryOwner.value = ''
}
</script>

<template>
  <div class="push-kpi animate-fade-in">
    <div class="page-header">
      <h1>Push Departmental KPI</h1>
      <p>Create a shared KPI and push it to multiple employees. Recipients can only adjust weightage.</p>
    </div>

    <div class="grid-2">
      <!-- KPI Form -->
      <div class="card">
        <h3 class="mb-md">KPI Details</h3>
        <div class="flex flex-col gap-md">
          <div class="form-group">
            <label class="form-label">KPI Title</label>
            <input v-model="kpiForm.title" class="form-input" placeholder="e.g., Department Revenue Target" />
          </div>
          <div class="form-group">
            <label class="form-label">Description</label>
            <textarea v-model="kpiForm.description" class="form-textarea" rows="2" placeholder="Describe the KPI..."></textarea>
          </div>
          <div class="form-group">
            <label class="form-label">Thrust Area</label>
            <select v-model="kpiForm.thrustArea" class="form-select">
              <option value="">Select</option>
              <option v-for="ta in THRUST_AREAS" :key="ta" :value="ta">{{ ta }}</option>
            </select>
          </div>
          <div class="grid-2">
            <div class="form-group">
              <label class="form-label">UoM</label>
              <select v-model="kpiForm.uom" class="form-select">
                <option v-for="u in UOM_TYPES" :key="u.value" :value="u.value">{{ u.label }}</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Target</label>
              <input v-model="kpiForm.target" class="form-input" type="number" placeholder="Target value" />
            </div>
          </div>
        </div>
      </div>

      <!-- Employee Selection -->
      <div class="card">
        <h3 class="mb-md">Assign To Employees</h3>
        <div class="flex flex-col gap-sm">
          <label v-for="emp in employees" :key="emp.id" class="emp-check-row"
            :class="{ selected: selectedEmployees.includes(emp.id) }"
            @click="toggleEmployee(emp.id)">
            <span class="emp-check-box">
              <span v-if="selectedEmployees.includes(emp.id)">✓</span>
            </span>
            <div class="user-avatar-initials">{{ emp.avatar }}</div>
            <div>
              <div class="text-sm font-medium">{{ emp.name }}</div>
              <div class="text-xs text-muted">{{ emp.department }}</div>
            </div>
            <span v-if="primaryOwner === emp.id" class="badge badge-primary" style="margin-left: auto;">Primary Owner</span>
          </label>
        </div>

        <div v-if="selectedEmployees.length" class="form-group mt-md">
          <label class="form-label">Primary Owner</label>
          <select v-model="primaryOwner" class="form-select">
            <option value="">Select primary owner</option>
            <option v-for="id in selectedEmployees" :key="id" :value="id">{{ auth.getUserById(id)?.name }}</option>
          </select>
          <span class="form-hint">Achievement from primary owner syncs to all linked employees.</span>
        </div>
      </div>
    </div>

    <div class="flex justify-end mt-lg">
      <button class="btn btn-primary btn-lg" :disabled="!isValid" @click="pushKpi">
        Push KPI to {{ selectedEmployees.length }} Employee{{ selectedEmployees.length !== 1 ? 's' : '' }}
      </button>
    </div>

    <!-- Existing Shared KPIs -->
    <div v-if="kpiStore.sharedKpis.length" class="card mt-lg">
      <h3 class="mb-md">Existing Shared KPIs</h3>
      <table class="data-table">
        <thead><tr><th>Title</th><th>Thrust Area</th><th>Target</th><th>Employees</th><th>Primary Owner</th></tr></thead>
        <tbody>
          <tr v-for="kpi in kpiStore.sharedKpis" :key="kpi.id">
            <td style="font-weight: 500; color: var(--text-primary);">{{ kpi.title }}</td>
            <td><span class="tag">{{ kpi.thrustArea }}</span></td>
            <td>{{ kpi.target }}</td>
            <td>{{ kpi.employeeIds.length }}</td>
            <td>{{ auth.getUserById(kpi.primaryOwnerId)?.name }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.push-kpi { max-width: 1000px; }
.emp-check-row {
  display: flex; align-items: center; gap: var(--space-md); padding: 10px 14px;
  background: var(--bg-glass); border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md); cursor: pointer; transition: all var(--transition-fast);
}
.emp-check-row:hover { border-color: var(--border-light); }
.emp-check-row.selected { border-color: var(--accent-primary); background: var(--accent-primary-glow); }
.emp-check-box {
  width: 22px; height: 22px; border: 2px solid var(--border-light);
  border-radius: var(--radius-sm); display: flex; align-items: center;
  justify-content: center; font-size: 0.75rem; color: var(--accent-primary); font-weight: 700;
}
.emp-check-row.selected .emp-check-box { border-color: var(--accent-primary); background: var(--accent-primary-glow); }
</style>
