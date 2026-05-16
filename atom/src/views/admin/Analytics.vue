<script setup>
import { ref, computed } from 'vue'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { Line, Bar, Doughnut } from 'vue-chartjs'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

// Theming support
const isDark = computed(() => document.documentElement.getAttribute('data-theme') === 'dark')
const textColor = computed(() => isDark.value ? '#e5e7eb' : '#374151')
const gridColor = computed(() => isDark.value ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)')

const commonOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  color: textColor.value,
  plugins: {
    legend: {
      labels: { color: textColor.value }
    }
  },
  scales: {
    x: {
      ticks: { color: textColor.value },
      grid: { color: gridColor.value }
    },
    y: {
      ticks: { color: textColor.value },
      grid: { color: gridColor.value }
    }
  }
}))

const pieOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  color: textColor.value,
  plugins: {
    legend: {
      labels: { color: textColor.value },
      position: 'right'
    }
  }
}))

// Mock Data

// 1. QoQ Goal Achievement
const qoqData = {
  labels: ['Q1 2025', 'Q2 2025', 'Q3 2025', 'Q4 2025'],
  datasets: [
    {
      label: 'Department Average',
      backgroundColor: 'rgba(59, 130, 246, 0.2)',
      borderColor: '#3b82f6',
      data: [65, 72, 78, 85],
      fill: true,
      tension: 0.4
    },
    {
      label: 'Team Average',
      backgroundColor: 'rgba(16, 185, 129, 0.2)',
      borderColor: '#10b981',
      data: [60, 68, 82, 88],
      fill: true,
      tension: 0.4
    }
  ]
}

// 2. Organization Completion Rates
const completionData = {
  labels: ['Engineering', 'Sales', 'Marketing', 'HR', 'Finance'],
  datasets: [
    {
      label: 'Completion Rate (%)',
      backgroundColor: '#6366f1',
      data: [85, 92, 78, 95, 88],
      borderRadius: 4
    }
  ]
}

// 3. Goal Distribution
const distributionData = {
  labels: ['Revenue', 'Productivity', 'Quality', 'Innovation', 'Culture'],
  datasets: [
    {
      backgroundColor: ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'],
      data: [25, 30, 20, 15, 10]
    }
  ]
}

// 4. Manager Effectiveness
const managers = ref([
  { id: 1, name: 'Alice Smith', teamSize: 8, checkInRate: 95, goalCompletion: 88 },
  { id: 2, name: 'Bob Johnson', teamSize: 12, checkInRate: 82, goalCompletion: 76 },
  { id: 3, name: 'Charlie Davis', teamSize: 5, checkInRate: 100, goalCompletion: 94 },
  { id: 4, name: 'Diana Evans', teamSize: 15, checkInRate: 68, goalCompletion: 70 },
  { id: 5, name: 'Evan Frank', teamSize: 7, checkInRate: 88, goalCompletion: 85 }
])

</script>

<template>
  <div class="analytics-container">
    <header class="page-header">
      <div>
        <h1 class="page-title">Analytics Dashboard</h1>
        <p class="page-subtitle">Organizational insights and goal tracking metrics</p>
      </div>
    </header>

    <div class="dashboard-grid">
      <!-- QoQ Trends -->
      <div class="card chart-card wide">
        <h3 class="card-title">QoQ Goal Achievement Trends</h3>
        <div class="chart-wrapper">
          <Line :data="qoqData" :options="commonOptions" />
        </div>
      </div>

      <!-- Goal Distribution -->
      <div class="card chart-card">
        <h3 class="card-title">Goal Distribution by Thrust Area</h3>
        <div class="chart-wrapper pie-wrapper">
          <Doughnut :data="distributionData" :options="pieOptions" />
        </div>
      </div>

      <!-- Completion Rates Heatmap -->
      <div class="card chart-card">
        <h3 class="card-title">Department Completion Rates</h3>
        <div class="chart-wrapper">
          <Bar :data="completionData" :options="commonOptions" />
        </div>
      </div>

      <!-- Manager Effectiveness -->
      <div class="card table-card wide">
        <h3 class="card-title">Manager Effectiveness</h3>
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Manager</th>
                <th>Team Size</th>
                <th>Check-in Compliance</th>
                <th>Goal Completion Rate</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="manager in managers" :key="manager.id">
                <td>
                  <div class="user-info">
                    <div class="avatar">{{ manager.name.charAt(0) }}</div>
                    <span class="name">{{ manager.name }}</span>
                  </div>
                </td>
                <td>{{ manager.teamSize }}</td>
                <td>
                  <div class="progress-cell">
                    <div class="progress-bar">
                      <div class="progress-fill" :style="{ width: manager.checkInRate + '%', backgroundColor: manager.checkInRate >= 90 ? '#10b981' : manager.checkInRate >= 75 ? '#f59e0b' : '#ef4444' }"></div>
                    </div>
                    <span>{{ manager.checkInRate }}%</span>
                  </div>
                </td>
                <td>
                  <div class="progress-cell">
                    <div class="progress-bar">
                      <div class="progress-fill" :style="{ width: manager.goalCompletion + '%', backgroundColor: manager.goalCompletion >= 85 ? '#10b981' : manager.goalCompletion >= 70 ? '#f59e0b' : '#ef4444' }"></div>
                    </div>
                    <span>{{ manager.goalCompletion }}%</span>
                  </div>
                </td>
                <td>
                  <span class="badge" :class="manager.checkInRate >= 90 ? 'success' : manager.checkInRate >= 75 ? 'warning' : 'danger'">
                    {{ manager.checkInRate >= 90 ? 'Excellent' : manager.checkInRate >= 75 ? 'Needs Focus' : 'At Risk' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.analytics-container {
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: var(--space-xl);
}

.page-title {
  font-size: 1.875rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: var(--space-xs);
  letter-spacing: -0.02em;
}

.page-subtitle {
  color: var(--text-secondary);
  font-size: 1rem;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-lg);
}

.card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: var(--space-lg);
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
}

.wide {
  grid-column: 1 / -1;
}

.card-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--space-lg);
}

.chart-wrapper {
  position: relative;
  height: 300px;
  width: 100%;
  flex-grow: 1;
}

.pie-wrapper {
  display: flex;
  justify-content: center;
}

.table-responsive {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th {
  text-align: left;
  padding: var(--space-md);
  color: var(--text-secondary);
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid var(--border-subtle);
}

.data-table td {
  padding: var(--space-md);
  border-bottom: 1px solid var(--border-subtle);
  color: var(--text-primary);
  font-size: 0.875rem;
}

.data-table tr:last-child td {
  border-bottom: none;
}

.user-info {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.avatar {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-full);
  background: var(--brand-surface);
  color: var(--brand-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.875rem;
}

.name {
  font-weight: 500;
}

.progress-cell {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.progress-bar {
  flex: 1;
  height: 8px;
  background: var(--bg-tertiary);
  border-radius: var(--radius-full);
  overflow: hidden;
  min-width: 100px;
}

.progress-fill {
  height: 100%;
  border-radius: var(--radius-full);
  transition: width 0.3s ease;
}

.badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: var(--radius-full);
  font-size: 0.75rem;
  font-weight: 600;
}

.badge.success {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.badge.warning {
  background: rgba(245, 158, 11, 0.1);
  color: #f59e0b;
}

.badge.danger {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

@media (max-width: 1024px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
  .wide {
    grid-column: 1 / -1;
  }
}
</style>
