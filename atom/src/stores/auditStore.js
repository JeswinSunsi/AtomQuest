import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAuditStore = defineStore('audit', () => {
  const auditLogs = ref([])

  function init() {
    const stored = localStorage.getItem('aq_auditLogs')
    if (stored) {
      auditLogs.value = JSON.parse(stored)
    }
  }

  function persist() {
    localStorage.setItem('aq_auditLogs', JSON.stringify(auditLogs.value))
  }

  function addLog(entry) {
    auditLogs.value.unshift({
      id: 'audit_' + Date.now(),
      timestamp: new Date().toISOString(),
      userId: entry.userId,
      userName: entry.userName || '',
      action: entry.action,
      goalId: entry.goalId || null,
      goalTitle: entry.goalTitle || '',
      employeeId: entry.employeeId || null,
      before: entry.before || null,
      after: entry.after || null,
      details: entry.details || '',
    })
    persist()
  }

  function getLogs(filters = {}) {
    let logs = [...auditLogs.value]

    if (filters.userId) {
      logs = logs.filter(l => l.userId === filters.userId)
    }
    if (filters.employeeId) {
      logs = logs.filter(l => l.employeeId === filters.employeeId)
    }
    if (filters.action) {
      logs = logs.filter(l => l.action.toLowerCase().includes(filters.action.toLowerCase()))
    }
    if (filters.search) {
      const s = filters.search.toLowerCase()
      logs = logs.filter(l =>
        l.action.toLowerCase().includes(s) ||
        l.goalTitle.toLowerCase().includes(s) ||
        l.userName.toLowerCase().includes(s) ||
        l.details.toLowerCase().includes(s)
      )
    }

    return logs
  }

  function clearLogs() {
    auditLogs.value = []
    persist()
  }

  return {
    auditLogs,
    init,
    addLog,
    getLogs,
    clearLogs,
  }
})
