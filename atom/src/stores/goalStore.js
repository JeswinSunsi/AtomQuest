import { defineStore } from 'pinia'
import { ref } from 'vue'

let _nextId = 1

function generateId() {
  return 'goal_' + Date.now() + '_' + (_nextId++)
}

function generateSheetId() {
  return 'sheet_' + Date.now() + '_' + (_nextId++)
}


export const THRUST_AREAS = [
  'Revenue Growth',
  'Customer Satisfaction',
  'Operational Excellence',
  'Innovation & Technology',
  'People Development',
  'Quality & Compliance',
  'Cost Optimization',
  'Market Expansion',
]

export const UOM_TYPES = [
  { value: 'numeric', label: 'Numeric (higher is better)' },
  { value: 'percentage', label: 'Percentage (%)' },
  { value: 'timeline', label: 'Timeline (date-based)' },
  { value: 'zero', label: 'Zero-based (0 = success)' },
]


export const SHEET_STATUS = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  APPROVED: 'approved',
  RETURNED: 'returned',
  LOCKED: 'locked',
}


export const GOAL_STATUS = {
  NOT_STARTED: 'not_started',
  ON_TRACK: 'on_track',
  COMPLETED: 'completed',
}

export const useGoalStore = defineStore('goals', () => {
  const goalSheets = ref([])

  function init() {
    const stored = localStorage.getItem('aq_goalSheets')
    if (stored) {
      goalSheets.value = JSON.parse(stored)
    }
  }

  function persist() {
    localStorage.setItem('aq_goalSheets', JSON.stringify(goalSheets.value))
  }


  function getSheet(employeeId) {
    return goalSheets.value.find(s => s.employeeId === employeeId)
  }

  function createSheet(employeeId) {
    let sheet = getSheet(employeeId)
    if (!sheet) {
      sheet = {
        id: generateSheetId(),
        employeeId,
        status: SHEET_STATUS.DRAFT,
        goals: [],
        returnComment: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      goalSheets.value.push(sheet)
      persist()
    }
    return sheet
  }


  function addGoal(employeeId, goalData) {
    const sheet = getSheet(employeeId) || createSheet(employeeId)
    if (sheet.goals.length >= 8) return { error: 'Maximum 8 goals allowed' }
    if (sheet.status === SHEET_STATUS.LOCKED) return { error: 'Sheet is locked' }

    const goal = {
      id: generateId(),
      thrustArea: goalData.thrustArea || '',
      title: goalData.title || '',
      description: goalData.description || '',
      uom: goalData.uom || 'numeric',
      target: goalData.target || 0,
      weightage: goalData.weightage || 0,
      goalStatus: GOAL_STATUS.NOT_STARTED,
      isSharedKPI: goalData.isSharedKPI || false,
      primaryOwnerId: goalData.primaryOwnerId || null,
      sharedKpiId: goalData.sharedKpiId || null,
      achievements: { Q1: null, Q2: null, Q3: null, Q4: null },
      createdAt: new Date().toISOString(),
    }
    sheet.goals.push(goal)
    sheet.updatedAt = new Date().toISOString()
    persist()
    return { success: true, goal }
  }


  function updateGoal(employeeId, goalId, updates) {
    const sheet = getSheet(employeeId)
    if (!sheet) return
    const goal = sheet.goals.find(g => g.id === goalId)
    if (!goal) return
    Object.assign(goal, updates)
    sheet.updatedAt = new Date().toISOString()
    persist()
  }


  function removeGoal(employeeId, goalId) {
    const sheet = getSheet(employeeId)
    if (!sheet) return
    sheet.goals = sheet.goals.filter(g => g.id !== goalId)
    sheet.updatedAt = new Date().toISOString()
    persist()
  }


  function validateSheet(employeeId) {
    const sheet = getSheet(employeeId)
    if (!sheet) return { valid: false, errors: ['No sheet found'] }
    const errors = []

    if (sheet.goals.length === 0) errors.push('At least one goal is required')
    if (sheet.goals.length > 8) errors.push('Maximum 8 goals allowed')

    const totalWeightage = sheet.goals.reduce((sum, g) => sum + Number(g.weightage), 0)
    if (Math.abs(totalWeightage - 100) > 0.01) errors.push(`Total weightage must be 100% (currently ${totalWeightage}%)`)

    sheet.goals.forEach((g, i) => {
      if (Number(g.weightage) < 10) errors.push(`Goal ${i + 1}: minimum weightage is 10%`)
      if (!g.title.trim()) errors.push(`Goal ${i + 1}: title is required`)
      if (!g.thrustArea) errors.push(`Goal ${i + 1}: thrust area is required`)
      if (!g.target && g.uom !== 'zero') errors.push(`Goal ${i + 1}: target is required`)
    })

    return { valid: errors.length === 0, errors }
  }


  function submitSheet(employeeId) {
    const sheet = getSheet(employeeId)
    if (!sheet) return { error: 'No sheet found' }
    const validation = validateSheet(employeeId)
    if (!validation.valid) return { error: validation.errors.join('; ') }
    sheet.status = SHEET_STATUS.SUBMITTED
    sheet.returnComment = ''
    sheet.updatedAt = new Date().toISOString()
    persist()
    return { success: true }
  }


  function approveSheet(employeeId) {
    const sheet = getSheet(employeeId)
    if (!sheet) return
    sheet.status = SHEET_STATUS.LOCKED
    sheet.updatedAt = new Date().toISOString()
    persist()
  }


  function returnSheet(employeeId, comment) {
    const sheet = getSheet(employeeId)
    if (!sheet) return
    sheet.status = SHEET_STATUS.RETURNED
    sheet.returnComment = comment || 'Please revise and resubmit.'
    sheet.updatedAt = new Date().toISOString()
    persist()
  }


  function logAchievement(employeeId, goalId, quarter, value) {
    const sheet = getSheet(employeeId)
    if (!sheet) return
    const goal = sheet.goals.find(g => g.id === goalId)
    if (!goal) return
    goal.achievements[quarter] = value
    sheet.updatedAt = new Date().toISOString()
    persist()
  }


  function updateGoalStatus(employeeId, goalId, status) {
    const sheet = getSheet(employeeId)
    if (!sheet) return
    const goal = sheet.goals.find(g => g.id === goalId)
    if (!goal) return
    goal.goalStatus = status
    sheet.updatedAt = new Date().toISOString()
    persist()
  }


  function computeScore(goal, quarter) {
    const achievement = Number(goal.achievements[quarter])
    const target = Number(goal.target)

    if (achievement === null || achievement === undefined || isNaN(achievement)) return null

    switch (goal.uom) {
      case 'numeric':
      case 'percentage':

        if (target === 0) return 0
        return Math.min((achievement / target) * 100, 150)
      case 'timeline':


        if (target === 0) return 100
        return achievement <= target ? 100 : Math.max(0, 100 - ((achievement - target) / target * 100))
      case 'zero':

        return achievement === 0 ? 100 : 0
      default:
        return 0
    }
  }


  function computeWeightedScore(employeeId, quarter) {
    const sheet = getSheet(employeeId)
    if (!sheet) return 0
    let totalScore = 0
    sheet.goals.forEach(g => {
      const score = computeScore(g, quarter)
      if (score !== null) {
        totalScore += (score * Number(g.weightage)) / 100
      }
    })
    return Math.round(totalScore * 100) / 100
  }


  function getAllSheets() {
    return goalSheets.value
  }


  function getSheetsByStatus(status) {
    return goalSheets.value.filter(s => s.status === status)
  }


  function getTeamSheets(teamMemberIds) {
    return goalSheets.value.filter(s => teamMemberIds.includes(s.employeeId))
  }

  return {
    goalSheets,
    init,
    getSheet,
    createSheet,
    addGoal,
    updateGoal,
    removeGoal,
    validateSheet,
    submitSheet,
    approveSheet,
    returnSheet,
    logAchievement,
    updateGoalStatus,
    computeScore,
    computeWeightedScore,
    getAllSheets,
    getSheetsByStatus,
    getTeamSheets,
    persist,
  }
})
