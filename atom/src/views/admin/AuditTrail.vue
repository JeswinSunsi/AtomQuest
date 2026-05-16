<script setup>
import { ref, computed } from 'vue'
import { useAuditStore } from '@/stores/auditStore'

const auditStore = useAuditStore()
const searchQuery = ref('')

const logs = computed(() => auditStore.getLogs({ search: searchQuery.value }))

function exportCSV() {
  const headers = ['Timestamp', 'User', 'Action', 'Goal', 'Employee', 'Before', 'After', 'Details']
  const rows = logs.value.map(l => [
    l.timestamp, l.userName, l.action, l.goalTitle, l.employeeId, l.before || '', l.after || '', l.details
  ])
  const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = 'audit_trail.csv'; a.click()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <div class="audit-trail animate-fade-in">
    <div class="page-header flex justify-between items-center">
      <div>
        <h1>Audit Trail</h1>
        <p>Log of all post-lock goal changes — who, what, when.</p>
      </div>
      <div class="flex gap-sm">
        <button class="btn btn-secondary" @click="exportCSV">Export CSV</button>
      </div>
    </div>

    <div class="card mb-lg">
      <input v-model="searchQuery" class="form-input" placeholder="Search audit logs..." style="max-width: 400px;" />
    </div>

    <div v-if="!logs.length" class="empty-state card">
      <h3>No Audit Entries</h3>
      <p class="text-sm text-muted">Audit logs will appear here when post-lock changes are made.</p>
    </div>

    <div v-else class="card">
      <table class="data-table">
        <thead>
          <tr><th>Timestamp</th><th>User</th><th>Action</th><th>Goal</th><th>Before</th><th>After</th><th>Details</th></tr>
        </thead>
        <tbody>
          <tr v-for="log in logs" :key="log.id">
            <td class="text-xs">{{ new Date(log.timestamp).toLocaleString() }}</td>
            <td style="font-weight: 500; color: var(--text-primary);">{{ log.userName }}</td>
            <td><span class="badge badge-info">{{ log.action }}</span></td>
            <td>{{ log.goalTitle || '—' }}</td>
            <td><span v-if="log.before" class="text-sm" style="color: var(--color-danger);">{{ log.before }}</span><span v-else>—</span></td>
            <td><span v-if="log.after" class="text-sm" style="color: var(--color-success);">{{ log.after }}</span><span v-else>—</span></td>
            <td class="text-sm text-secondary">{{ log.details || '—' }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.audit-trail { max-width: 1200px; }
</style>
