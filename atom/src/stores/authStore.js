import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const SEED_USERS = [
  { id: 'emp1', name: 'Arjun Mehta', role: 'employee', managerId: 'mgr1', department: 'Engineering', avatar: 'AM' },
  { id: 'emp2', name: 'Priya Sharma', role: 'employee', managerId: 'mgr1', department: 'Engineering', avatar: 'PS' },
  { id: 'emp3', name: 'Rahul Verma', role: 'employee', managerId: 'mgr1', department: 'Engineering', avatar: 'RV' },
  { id: 'mgr1', name: 'Deepa Nair', role: 'manager', managerId: null, department: 'Engineering', avatar: 'DN' },
  { id: 'admin1', name: 'Vikram Singh', role: 'admin', managerId: null, department: 'HR', avatar: 'VS' },
]

export const useAuthStore = defineStore('auth', () => {
  const currentUser = ref(null)
  const users = ref([])


  function init() {
    const stored = localStorage.getItem('aq_users')
    if (stored) {
      users.value = JSON.parse(stored)
    } else {
      users.value = SEED_USERS
      persist()
    }
    const savedUser = localStorage.getItem('aq_currentUser')
    if (savedUser) {
      currentUser.value = JSON.parse(savedUser)
    }
  }

  function persist() {
    localStorage.setItem('aq_users', JSON.stringify(users.value))
  }

  function login(userId) {
    const user = users.value.find(u => u.id === userId)
    if (user) {
      currentUser.value = { ...user }
      localStorage.setItem('aq_currentUser', JSON.stringify(user))
    }
  }

  function logout() {
    currentUser.value = null
    localStorage.removeItem('aq_currentUser')
  }

  const isEmployee = computed(() => currentUser.value?.role === 'employee')
  const isManager = computed(() => currentUser.value?.role === 'manager')
  const isAdmin = computed(() => currentUser.value?.role === 'admin')
  const isAuthenticated = computed(() => !!currentUser.value)

  function getUserById(id) {
    return users.value.find(u => u.id === id)
  }

  function getTeamMembers(managerId) {
    return users.value.filter(u => u.managerId === managerId)
  }

  function getEmployees() {
    return users.value.filter(u => u.role === 'employee')
  }

  function getAllUsers() {
    return users.value
  }

  return {
    currentUser,
    users,
    isEmployee,
    isManager,
    isAdmin,
    isAuthenticated,
    init,
    login,
    logout,
    getUserById,
    getTeamMembers,
    getEmployees,
    getAllUsers,
  }
})
