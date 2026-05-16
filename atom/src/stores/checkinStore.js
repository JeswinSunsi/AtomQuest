import { defineStore } from 'pinia'
import { ref } from 'vue'

export const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4']

export const CHECK_IN_WINDOWS = {
  'Goal Setting': { month: 5, label: '1st May' },
  Q1: { month: 7, label: 'July' },
  Q2: { month: 10, label: 'October' },
  Q3: { month: 1, label: 'January' },
  Q4: { month: 3, label: 'March / April', endMonth: 4 },
}

export const useCheckinStore = defineStore('checkins', () => {
  const checkins = ref([])

  function init() {
    const stored = localStorage.getItem('aq_checkins')
    if (stored) {
      checkins.value = JSON.parse(stored)
    }
  }

  function persist() {
    localStorage.setItem('aq_checkins', JSON.stringify(checkins.value))
  }

  function addCheckin(employeeId, quarter, data) {
    const existing = checkins.value.find(c => c.employeeId === employeeId && c.quarter === quarter)
    if (existing) {
      Object.assign(existing, data, { updatedAt: new Date().toISOString() })
    } else {
      checkins.value.push({
        id: 'checkin_' + Date.now(),
        employeeId,
        quarter,
        ...data,
        managerComments: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
    }
    persist()
  }

  function getCheckin(employeeId, quarter) {
    return checkins.value.find(c => c.employeeId === employeeId && c.quarter === quarter)
  }

  function getEmployeeCheckins(employeeId) {
    return checkins.value.filter(c => c.employeeId === employeeId)
  }

  function addManagerComment(employeeId, quarter, comment, managerId) {
    const checkin = getCheckin(employeeId, quarter)
    if (checkin) {
      checkin.managerComments.push({
        id: 'comment_' + Date.now(),
        managerId,
        text: comment,
        createdAt: new Date().toISOString(),
      })
      checkin.updatedAt = new Date().toISOString()
      persist()
    }
  }

  function isWindowOpen(quarter) {
    const now = new Date()
    const month = now.getMonth() + 1 // 1-indexed
    const window = CHECK_IN_WINDOWS[quarter]
    if (!window) return false
    if (window.endMonth) {
      return month >= window.month && month <= window.endMonth
    }
    return month === window.month
  }

  function getCurrentWindow() {
    for (const [key, val] of Object.entries(CHECK_IN_WINDOWS)) {
      if (isWindowOpen(key)) return key
    }
    return null
  }

  function getCompletionStats(employeeIds) {
    const stats = {}
    for (const q of QUARTERS) {
      stats[q] = {
        total: employeeIds.length,
        completed: employeeIds.filter(eid => getCheckin(eid, q)).length,
      }
    }
    return stats
  }

  return {
    checkins,
    init,
    addCheckin,
    getCheckin,
    getEmployeeCheckins,
    addManagerComment,
    isWindowOpen,
    getCurrentWindow,
    getCompletionStats,
  }
})
