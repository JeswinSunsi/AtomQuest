<script setup>
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import { useGoalStore } from '@/stores/goalStore'
import { useCheckinStore, QUARTERS } from '@/stores/checkinStore'
import { useToastStore } from '@/stores/toastStore'
import * as XLSX from 'xlsx'

const auth = useAuthStore()
const goalStore = useGoalStore()
const checkinStore = useCheckinStore()
const toast = useToastStore()

const selectedQuarter = ref('Q1')
const employees = computed(() => auth.getEmployees())

const reportData = computed(() => {
  return employees.value.map(emp => {
    const sheet = goalStore.getSheet(emp.id)
    if (!sheet) return { employee: emp, goals: [], weightedScore: 0 }
    return {
      employee: emp,
      goals: sheet.goals.map(g => ({
        title: g.title,
        thrustArea: g.thrustArea,
        uom: g.uom,
        target: g.target,
        weightage: g.weightage,
        achievement: g.achievements[selectedQuarter.value],
        score: goalStore.computeScore(g, selectedQuarter.value),
        status: g.goalStatus,
      })),
      weightedScore: goalStore.computeWeightedScore(emp.id, selectedQuarter.value),
      checkedIn: !!checkinStore.getCheckin(emp.id, selectedQuarter.value),
    }
  })
})

function exportCSV() {
  const rows = []
  rows.push(['Employee', 'Goal', 'Thrust Area', 'UoM', 'Target', 'Achievement', 'Score (%)', 'Weightage (%)', 'Status', 'Weighted Score (%)'])
  for (const r of reportData.value) {
    for (const g of r.goals) {
      rows.push([r.employee.name, g.title, g.thrustArea, g.uom, g.target, g.achievement ?? '', g.score?.toFixed(1) ?? '', g.weightage, g.status, r.weightedScore])
    }
    if (!r.goals.length) rows.push([r.employee.name, '—', '', '', '', '', '', '', '', 0])
  }
  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = `achievement_report_${selectedQuarter.value}.csv`; a.click()
  URL.revokeObjectURL(url)
  toast.success('CSV exported!')
}

function exportExcel() {
  const rows = []
  for (const r of reportData.value) {
    for (const g of r.goals) {
      rows.push({
        Employee: r.employee.name, Goal: g.title, 'Thrust Area': g.thrustArea, UoM: g.uom,
        Target: g.target, Achievement: g.achievement ?? '', 'Score (%)': g.score?.toFixed(1) ?? '',
        'Weightage (%)': g.weightage, Status: g.status, 'Weighted Score (%)': r.weightedScore,
      })
    }
  }
  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, selectedQuarter.value)
  XLSX.writeFile(wb, `achievement_report_${selectedQuarter.value}.xlsx`)
  toast.success('Excel exported!')
}
</script>

<template>
  <div class="reports animate-fade-in">
    <div class="page-header flex justify-between items-center">
      <div>
        <h1>Achievement Reports</h1>
        <p>Planned vs. Actual for all employees. Export to CSV or Excel.</p>
      </div>
      <div class="flex gap-sm">
        <button class="btn btn-secondary" @click="exportCSV">Export CSV</button>
        <button class="btn btn-primary" @click="exportExcel">Export Excel</button>
      </div>
    </div>

    <div class="flex gap-sm items-center mb-lg">
      <label class="form-label">Quarter:</label>
      <button v-for="q in QUARTERS" :key="q" class="btn"
        :class="selectedQuarter === q ? 'btn-primary' : 'btn-secondary'"
        @click="selectedQuarter = q">{{ q }}</button>
    </div>

    <!-- Completion Dashboard -->
    <div class="grid-3 mb-lg">
      <div class="stat-card">
        <span class="stat-label">Total Employees</span>
        <span class="stat-value">{{ employees.length }}</span>
      </div>
      <div class="stat-card">
        <span class="stat-label">Checked In ({{ selectedQuarter }})</span>
        <span class="stat-value" style="background: linear-gradient(135deg, #10b981, #34d399); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
          {{ reportData.filter(r => r.checkedIn).length }}
        </span>
      </div>
      <div class="stat-card">
        <span class="stat-label">Avg Weighted Score</span>
        <span class="stat-value">
          {{ reportData.length ? (reportData.reduce((s,r) => s + r.weightedScore, 0) / reportData.length).toFixed(1) : 0 }}%
        </span>
      </div>
    </div>

    <!-- Report Table -->
    <div class="card">
      <div v-for="r in reportData" :key="r.employee.id" class="mb-lg">
        <div class="flex items-center gap-md mb-sm">
          <div class="user-avatar-initials">{{ r.employee.avatar }}</div>
          <h4>{{ r.employee.name }}</h4>
          <span class="badge" :class="r.checkedIn ? 'badge-success' : 'badge-neutral'">
            {{ r.checkedIn ? '✓ Checked In' : 'Pending' }}
          </span>
          <span class="text-sm font-bold" style="margin-left: auto;">Score: {{ r.weightedScore }}%</span>
        </div>
        <table class="data-table" v-if="r.goals.length">
          <thead>
            <tr><th>Goal</th><th>Thrust Area</th><th>Target</th><th>Actual</th><th>Score</th><th>Weightage</th></tr>
          </thead>
          <tbody>
            <tr v-for="g in r.goals" :key="g.title">
              <td style="font-weight: 500; color: var(--text-primary);">{{ g.title }}</td>
              <td><span class="tag">{{ g.thrustArea }}</span></td>
              <td>{{ g.target }}</td>
              <td>{{ g.achievement ?? '—' }}</td>
              <td><strong :style="{ color: (g.score ?? 0) >= 80 ? 'var(--color-success)' : (g.score ?? 0) >= 50 ? 'var(--color-warning)' : 'var(--color-danger)' }">{{ g.score?.toFixed(1) ?? '—' }}%</strong></td>
              <td>{{ g.weightage }}%</td>
            </tr>
          </tbody>
        </table>
        <p v-else class="text-sm text-muted">No goals created.</p>
        <div class="divider"></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.reports { max-width: 1200px; }
</style>
