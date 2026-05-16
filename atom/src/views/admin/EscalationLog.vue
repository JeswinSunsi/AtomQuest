<script setup>
import { ref, computed } from 'vue'
import { useEscalationStore, TRIGGER_LABELS, ESCALATION_LEVELS } from '@/stores/escalationStore'
import { useToastStore } from '@/stores/toastStore'

const escalationStore = useEscalationStore()
const toast = useToastStore()

const searchQuery = ref('')
const statusFilter = ref('all')
const triggerFilter = ref('all')

const stats = computed(() => escalationStore.stats)

const logs = computed(() => {
  const filters = { search: searchQuery.value }
  if (statusFilter.value !== 'all') filters.status = statusFilter.value
  if (triggerFilter.value !== 'all') filters.triggerType = triggerFilter.value
  return escalationStore.getLogs(filters)
})

function handleResolve(logId) {
  escalationStore.resolveEscalation(logId)
  toast.success('Escalation resolved.')
}

function getLevelMeta(level) {
  return ESCALATION_LEVELS[level] || { label: 'Unknown', badge: 'badge-neutral', role: 'unknown' }
}

function exportCSV() {
  const headers = ['Date', 'Employee', 'Rule', 'Level', 'Target', 'Status', 'Details']
  const rows = logs.value.map(l => [
    new Date(l.triggerDate).toLocaleString(), l.employeeName, l.ruleName,
    getLevelMeta(l.escalationLevel).label, l.targetName, l.status, l.details
  ])
  const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = 'escalation_log.csv'; a.click()
  URL.revokeObjectURL(url)
}

function runEvaluation() {
  const result = escalationStore.evaluateRules()
  if (result.newEscalations > 0) toast.warning(`${result.newEscalations} new escalation(s) detected.`)
  else toast.success('Evaluation complete. No new escalations.')
}

function getStatusBadge(status) {
  const map = { open: 'badge-danger', resolved: 'badge-success', auto_resolved: 'badge-info' }
  return map[status] || 'badge-neutral'
}

function getStatusLabel(status) {
  const map = { open: 'Open', resolved: 'Resolved', auto_resolved: 'Auto-Resolved' }
  return map[status] || status
}
</script>

<template>
  <div class="esc-log animate-fade-in">
    <div class="page-header flex justify-between items-center">
      <div>
        <h1>Escalation Log</h1>
        <p>Track and resolve escalation events across the organization.</p>
      </div>
      <div class="flex gap-sm">
        <button class="btn btn-secondary" @click="runEvaluation">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>
          Re-evaluate
        </button>
        <button class="btn btn-secondary" @click="exportCSV">Export CSV</button>
      </div>
    </div>

    <!-- Stats -->
    <div class="grid-4 mb-lg">
      <div class="stat-card animate-slide-up">
        <span class="stat-label">Open</span>
        <span class="stat-value" :style="stats.totalOpen > 0 ? 'color:var(--color-danger)!important' : ''">{{ stats.totalOpen }}</span>
        <span class="text-sm text-muted">active escalations</span>
      </div>
      <div class="stat-card animate-slide-up" style="animation-delay:80ms">
        <span class="stat-label">Resolved</span>
        <span class="stat-value">{{ stats.totalResolved }}</span>
      </div>
      <div class="stat-card animate-slide-up" style="animation-delay:160ms">
        <span class="stat-label">Resolved Today</span>
        <span class="stat-value">{{ stats.resolvedToday }}</span>
      </div>
      <div class="stat-card animate-slide-up" style="animation-delay:240ms">
        <span class="stat-label">By Level</span>
        <div class="flex gap-xs mt-sm flex-wrap">
          <span v-for="(count, lvl) in stats.byLevel" :key="lvl" class="badge" :class="getLevelMeta(Number(lvl)).badge">
            {{ getLevelMeta(Number(lvl)).label }}: {{ count }}
          </span>
          <span v-if="Object.keys(stats.byLevel).length === 0" class="text-sm text-muted">None</span>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="card mb-lg">
      <div class="flex gap-md items-end flex-wrap">
        <div class="form-group" style="flex:1;min-width:200px">
          <label class="form-label">Search</label>
          <input v-model="searchQuery" class="form-input" placeholder="Search by employee, rule..." />
        </div>
        <div class="form-group" style="min-width:160px">
          <label class="form-label">Status</label>
          <select v-model="statusFilter" class="form-select">
            <option value="all">All</option>
            <option value="open">Open</option>
            <option value="resolved">Resolved</option>
            <option value="auto_resolved">Auto-Resolved</option>
          </select>
        </div>
        <div class="form-group" style="min-width:180px">
          <label class="form-label">Trigger Type</label>
          <select v-model="triggerFilter" class="form-select">
            <option value="all">All Types</option>
            <option v-for="(label, val) in TRIGGER_LABELS" :key="val" :value="val">{{ label }}</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Log Table -->
    <div v-if="!logs.length" class="empty-state card">
      <h3>No Escalation Entries</h3>
      <p class="text-sm text-muted">Run an evaluation or wait for scheduled checks to generate entries.</p>
    </div>

    <div v-else class="card">
      <table class="data-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Employee</th>
            <th>Rule</th>
            <th>Level</th>
            <th>Target</th>
            <th>Status</th>
            <th>Details</th>
            <th style="text-align:right">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="log in logs" :key="log.id" :class="{ 'row-open': log.status === 'open' }">
            <td class="text-xs">{{ new Date(log.triggerDate).toLocaleString() }}</td>
            <td style="font-weight:500;color:var(--text-primary)">{{ log.employeeName }}</td>
            <td><span class="badge badge-info">{{ log.ruleName }}</span></td>
            <td><span class="badge" :class="getLevelMeta(log.escalationLevel).badge">{{ getLevelMeta(log.escalationLevel).label }}</span></td>
            <td>{{ log.targetName }}</td>
            <td><span class="badge" :class="getStatusBadge(log.status)">{{ getStatusLabel(log.status) }}</span></td>
            <td class="text-sm text-secondary" style="max-width:260px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" :title="log.details">{{ log.details || '—' }}</td>
            <td style="text-align:right">
              <button v-if="log.status === 'open'" class="btn btn-success btn-sm" @click="handleResolve(log.id)">Resolve</button>
              <span v-else class="text-xs text-muted">{{ log.resolvedAt ? new Date(log.resolvedAt).toLocaleDateString() : '—' }}</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.esc-log { max-width: 1200px; }
.row-open { background: var(--color-danger-bg); }
.row-open:hover { background: var(--color-danger-bg) !important; }
</style>
