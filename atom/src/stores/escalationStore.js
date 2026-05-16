import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAuthStore } from './authStore'
import { useGoalStore, SHEET_STATUS } from './goalStore'
import { useCheckinStore, CHECK_IN_WINDOWS } from './checkinStore'


export const TRIGGER_TYPES = {
  GOAL_NOT_SUBMITTED: 'goal_not_submitted',
  GOAL_NOT_APPROVED: 'goal_not_approved',
  CHECKIN_OVERDUE: 'checkin_overdue',
}

export const TRIGGER_LABELS = {
  [TRIGGER_TYPES.GOAL_NOT_SUBMITTED]: 'Goals Not Submitted',
  [TRIGGER_TYPES.GOAL_NOT_APPROVED]: 'Goals Not Approved',
  [TRIGGER_TYPES.CHECKIN_OVERDUE]: 'Check-in Overdue',
}


export const ESCALATION_LEVELS = {
  0: { label: 'Employee', badge: 'badge-info', role: 'employee' },
  1: { label: 'Manager', badge: 'badge-warning', role: 'manager' },
  2: { label: 'HR / Skip-Level', badge: 'badge-danger', role: 'hr' },
}


const DEFAULT_RULES = [
  {
    id: 'rule_goal_not_submitted',
    name: 'Goals Not Submitted',
    description: 'Employee has not submitted goals within the defined number of days after the goal-setting cycle opens.',
    triggerType: TRIGGER_TYPES.GOAL_NOT_SUBMITTED,
    thresholdDays: 14,
    escalationIntervalDays: 3,
    escalationChain: ['employee', 'manager', 'hr'],
    enabled: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'rule_goal_not_approved',
    name: 'Goals Not Approved',
    description: 'Manager has not approved goal sheet within the defined number of days after submission.',
    triggerType: TRIGGER_TYPES.GOAL_NOT_APPROVED,
    thresholdDays: 7,
    escalationIntervalDays: 3,
    escalationChain: ['manager', 'hr'],
    enabled: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'rule_checkin_overdue',
    name: 'Check-in Overdue',
    description: 'Quarterly check-in not completed within the defined number of days of the check-in window opening.',
    triggerType: TRIGGER_TYPES.CHECKIN_OVERDUE,
    thresholdDays: 10,
    escalationIntervalDays: 5,
    escalationChain: ['employee', 'manager', 'hr'],
    enabled: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

let _nextId = 1

export const useEscalationStore = defineStore('escalation', () => {
  const rules = ref([])
  const escalationLogs = ref([])


  function init() {
    const storedRules = localStorage.getItem('aq_escalationRules')
    if (storedRules) {
      rules.value = JSON.parse(storedRules)
    } else {
      rules.value = JSON.parse(JSON.stringify(DEFAULT_RULES))
      persistRules()
    }

    const storedLogs = localStorage.getItem('aq_escalationLogs')
    if (storedLogs) {
      escalationLogs.value = JSON.parse(storedLogs)
    }
  }

  function persistRules() {
    localStorage.setItem('aq_escalationRules', JSON.stringify(rules.value))
  }

  function persistLogs() {
    localStorage.setItem('aq_escalationLogs', JSON.stringify(escalationLogs.value))
  }


  function addRule(ruleData) {
    const rule = {
      id: 'rule_' + Date.now() + '_' + (_nextId++),
      name: ruleData.name || 'Untitled Rule',
      description: ruleData.description || '',
      triggerType: ruleData.triggerType,
      thresholdDays: Number(ruleData.thresholdDays) || 7,
      escalationIntervalDays: Number(ruleData.escalationIntervalDays) || 3,
      escalationChain: ruleData.escalationChain || ['employee', 'manager', 'hr'],
      enabled: ruleData.enabled !== false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    rules.value.push(rule)
    persistRules()
    return rule
  }

  function updateRule(ruleId, updates) {
    const rule = rules.value.find(r => r.id === ruleId)
    if (!rule) return
    Object.assign(rule, updates, { updatedAt: new Date().toISOString() })
    persistRules()
  }

  function deleteRule(ruleId) {
    rules.value = rules.value.filter(r => r.id !== ruleId)
    persistRules()
  }

  function toggleRule(ruleId) {
    const rule = rules.value.find(r => r.id === ruleId)
    if (!rule) return
    rule.enabled = !rule.enabled
    rule.updatedAt = new Date().toISOString()
    persistRules()
  }

  function getRuleById(ruleId) {
    return rules.value.find(r => r.id === ruleId)
  }


  function addLogEntry(entry) {
    escalationLogs.value.unshift({
      id: 'esc_' + Date.now() + '_' + (_nextId++),
      ruleId: entry.ruleId,
      ruleName: entry.ruleName || '',
      employeeId: entry.employeeId,
      employeeName: entry.employeeName || '',
      escalationLevel: entry.escalationLevel || 0,
      targetRole: entry.targetRole || 'employee',
      targetName: entry.targetName || '',
      status: 'open',
      triggerDate: new Date().toISOString(),
      resolvedAt: null,
      details: entry.details || '',
    })
    persistLogs()
  }

  function resolveEscalation(logId) {
    const entry = escalationLogs.value.find(e => e.id === logId)
    if (!entry) return
    entry.status = 'resolved'
    entry.resolvedAt = new Date().toISOString()
    persistLogs()
  }

  function autoResolveEscalation(logId) {
    const entry = escalationLogs.value.find(e => e.id === logId)
    if (!entry) return
    entry.status = 'auto_resolved'
    entry.resolvedAt = new Date().toISOString()
    persistLogs()
  }

  function getOpenEscalations() {
    return escalationLogs.value.filter(e => e.status === 'open')
  }

  function getEscalationsByEmployee(employeeId) {
    return escalationLogs.value.filter(e => e.employeeId === employeeId)
  }

  function getLogs(filters = {}) {
    let logs = [...escalationLogs.value]

    if (filters.status && filters.status !== 'all') {
      logs = logs.filter(l => l.status === filters.status)
    }
    if (filters.ruleId) {
      logs = logs.filter(l => l.ruleId === filters.ruleId)
    }
    if (filters.triggerType) {
      logs = logs.filter(l => {
        const rule = rules.value.find(r => r.id === l.ruleId)
        return rule && rule.triggerType === filters.triggerType
      })
    }
    if (filters.search) {
      const s = filters.search.toLowerCase()
      logs = logs.filter(l =>
        l.employeeName.toLowerCase().includes(s) ||
        l.ruleName.toLowerCase().includes(s) ||
        l.details.toLowerCase().includes(s) ||
        l.targetRole.toLowerCase().includes(s)
      )
    }

    return logs
  }


  function evaluateRules() {
    const authStore = useAuthStore()
    const goalStore = useGoalStore()
    const checkinStore = useCheckinStore()

    const employees = authStore.getEmployees()
    const now = new Date()
    let newEscalations = 0

    for (const rule of rules.value) {
      if (!rule.enabled) continue

      for (const emp of employees) {
        const violation = checkViolation(rule, emp, goalStore, checkinStore, now)
        if (!violation) {

          const openEntries = escalationLogs.value.filter(
            e => e.ruleId === rule.id && e.employeeId === emp.id && e.status === 'open'
          )
          openEntries.forEach(e => autoResolveEscalation(e.id))
          continue
        }


        const existing = escalationLogs.value.find(
          e => e.ruleId === rule.id && e.employeeId === emp.id && e.status === 'open'
        )

        if (existing) {

          const daysSinceTrigger = daysBetween(new Date(existing.triggerDate), now)
          const nextLevel = Math.min(
            Math.floor(daysSinceTrigger / rule.escalationIntervalDays),
            rule.escalationChain.length - 1
          )

          if (nextLevel > existing.escalationLevel) {
            const targetRole = rule.escalationChain[nextLevel] || 'hr'
            const targetName = resolveTargetName(targetRole, emp, authStore)

            existing.escalationLevel = nextLevel
            existing.targetRole = targetRole
            existing.targetName = targetName
            existing.details = `Escalated to ${ESCALATION_LEVELS[nextLevel]?.label || targetRole} — ${violation.reason}`
            persistLogs()
          }
        } else {

          const initialLevel = 0
          const targetRole = rule.escalationChain[initialLevel] || 'employee'
          const targetName = resolveTargetName(targetRole, emp, authStore)

          addLogEntry({
            ruleId: rule.id,
            ruleName: rule.name,
            employeeId: emp.id,
            employeeName: emp.name,
            escalationLevel: initialLevel,
            targetRole,
            targetName,
            details: violation.reason,
          })
          newEscalations++
        }
      }
    }

    return { evaluated: employees.length * rules.value.filter(r => r.enabled).length, newEscalations }
  }

  function checkViolation(rule, employee, goalStore, checkinStore, now) {
    switch (rule.triggerType) {
      case TRIGGER_TYPES.GOAL_NOT_SUBMITTED: {
        const sheet = goalStore.getSheet(employee.id)

        if (!sheet || sheet.status === SHEET_STATUS.DRAFT || sheet.status === SHEET_STATUS.RETURNED) {

          const cycleOpenDate = getCycleOpenDate(now)
          const daysSinceOpen = daysBetween(cycleOpenDate, now)
          if (daysSinceOpen >= rule.thresholdDays) {
            return {
              reason: `Goals not submitted — ${daysSinceOpen} days since cycle opened (threshold: ${rule.thresholdDays} days)`,
            }
          }
        }
        return null
      }

      case TRIGGER_TYPES.GOAL_NOT_APPROVED: {
        const sheet = goalStore.getSheet(employee.id)

        if (sheet && sheet.status === SHEET_STATUS.SUBMITTED) {
          const submittedDate = new Date(sheet.updatedAt)
          const daysSinceSubmit = daysBetween(submittedDate, now)
          if (daysSinceSubmit >= rule.thresholdDays) {
            return {
              reason: `Goals pending approval — ${daysSinceSubmit} days since submission (threshold: ${rule.thresholdDays} days)`,
            }
          }
        }
        return null
      }

      case TRIGGER_TYPES.CHECKIN_OVERDUE: {

        const currentWindow = checkinStore.getCurrentWindow()
        if (!currentWindow || currentWindow === 'Goal Setting') return null

        const checkin = checkinStore.getCheckin(employee.id, currentWindow)
        if (!checkin) {

          const windowConfig = CHECK_IN_WINDOWS[currentWindow]
          if (windowConfig) {
            const windowOpenDate = getWindowOpenDate(windowConfig, now)
            const daysSinceOpen = daysBetween(windowOpenDate, now)
            if (daysSinceOpen >= rule.thresholdDays) {
              return {
                reason: `${currentWindow} check-in not completed — ${daysSinceOpen} days since window opened (threshold: ${rule.thresholdDays} days)`,
              }
            }
          }
        }
        return null
      }

      default:
        return null
    }
  }


  function daysBetween(date1, date2) {
    const msPerDay = 1000 * 60 * 60 * 24
    return Math.floor((date2 - date1) / msPerDay)
  }

  function getCycleOpenDate(now) {

    const year = now.getMonth() >= 4 ? now.getFullYear() : now.getFullYear() - 1
    return new Date(year, 4, 1)
  }

  function getWindowOpenDate(windowConfig, now) {
    const year = now.getFullYear()
    return new Date(year, windowConfig.month - 1, 1)
  }

  function resolveTargetName(targetRole, employee, authStore) {
    switch (targetRole) {
      case 'employee':
        return employee.name
      case 'manager': {
        if (employee.managerId) {
          const mgr = authStore.getUserById(employee.managerId)
          return mgr ? mgr.name : 'Manager'
        }
        return 'Manager'
      }
      case 'hr':
        return 'HR / Admin'
      default:
        return targetRole
    }
  }


  const stats = computed(() => {
    const open = escalationLogs.value.filter(e => e.status === 'open')
    const resolved = escalationLogs.value.filter(e => e.status === 'resolved' || e.status === 'auto_resolved')

    const today = new Date().toDateString()
    const resolvedToday = resolved.filter(e => e.resolvedAt && new Date(e.resolvedAt).toDateString() === today)

    const byLevel = {}
    for (const e of open) {
      const lvl = e.escalationLevel
      byLevel[lvl] = (byLevel[lvl] || 0) + 1
    }

    return {
      totalOpen: open.length,
      totalResolved: resolved.length,
      resolvedToday: resolvedToday.length,
      byLevel,
      totalRules: rules.value.length,
      activeRules: rules.value.filter(r => r.enabled).length,
    }
  })

  return {
    rules,
    escalationLogs,
    init,
    addRule,
    updateRule,
    deleteRule,
    toggleRule,
    getRuleById,
    addLogEntry,
    resolveEscalation,
    autoResolveEscalation,
    getOpenEscalations,
    getEscalationsByEmployee,
    getLogs,
    evaluateRules,
    stats,
  }
})
