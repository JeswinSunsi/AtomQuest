import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useGoalStore } from './goalStore'

export const useKpiStore = defineStore('kpi', () => {
  const sharedKpis = ref([])

  function init() {
    const stored = localStorage.getItem('aq_sharedKpis')
    if (stored) {
      sharedKpis.value = JSON.parse(stored)
    }
  }

  function persist() {
    localStorage.setItem('aq_sharedKpis', JSON.stringify(sharedKpis.value))
  }


  function pushKPI(kpiData, employeeIds, primaryOwnerId) {
    const goalStore = useGoalStore()
    const kpiId = 'kpi_' + Date.now()

    const kpi = {
      id: kpiId,
      title: kpiData.title,
      description: kpiData.description || '',
      thrustArea: kpiData.thrustArea,
      uom: kpiData.uom,
      target: kpiData.target,
      primaryOwnerId,
      employeeIds: [...employeeIds],
      createdAt: new Date().toISOString(),
    }
    sharedKpis.value.push(kpi)


    for (const empId of employeeIds) {
      goalStore.createSheet(empId)
      goalStore.addGoal(empId, {
        thrustArea: kpiData.thrustArea,
        title: kpiData.title,
        description: kpiData.description || '',
        uom: kpiData.uom,
        target: kpiData.target,
        weightage: 0,
        isSharedKPI: true,
        primaryOwnerId,
        sharedKpiId: kpiId,
      })
    }

    persist()
    return kpi
  }


  function syncAchievement(kpiId, quarter) {
    const goalStore = useGoalStore()
    const kpi = sharedKpis.value.find(k => k.id === kpiId)
    if (!kpi) return


    const primarySheet = goalStore.getSheet(kpi.primaryOwnerId)
    if (!primarySheet) return

    const primaryGoal = primarySheet.goals.find(g => g.sharedKpiId === kpiId)
    if (!primaryGoal) return

    const achievement = primaryGoal.achievements[quarter]


    for (const empId of kpi.employeeIds) {
      if (empId === kpi.primaryOwnerId) continue
      const sheet = goalStore.getSheet(empId)
      if (!sheet) continue
      const linkedGoal = sheet.goals.find(g => g.sharedKpiId === kpiId)
      if (linkedGoal) {
        linkedGoal.achievements[quarter] = achievement
      }
    }

    goalStore.persist()
  }

  function getKpiById(id) {
    return sharedKpis.value.find(k => k.id === id)
  }

  function getAllKpis() {
    return sharedKpis.value
  }

  return {
    sharedKpis,
    init,
    pushKPI,
    syncAchievement,
    getKpiById,
    getAllKpis,
  }
})
