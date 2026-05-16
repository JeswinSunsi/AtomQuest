<script setup>
import { ref, computed } from 'vue'
import { useEscalationStore, TRIGGER_TYPES, TRIGGER_LABELS } from '@/stores/escalationStore'
import { useToastStore } from '@/stores/toastStore'

const escalationStore = useEscalationStore()
const toast = useToastStore()

const editingRule = ref(null)
const showForm = ref(false)

const formData = ref({
  name: '', description: '',
  triggerType: TRIGGER_TYPES.GOAL_NOT_SUBMITTED,
  thresholdDays: 7, escalationIntervalDays: 3,
  escalationChain: ['employee', 'manager', 'hr'],
  enabled: true,
})

const stats = computed(() => escalationStore.stats)
const triggerOptions = Object.entries(TRIGGER_LABELS).map(([value, label]) => ({ value, label }))
const chainOptions = [
  { value: 'employee', label: 'Employee' },
  { value: 'manager', label: 'Manager' },
  { value: 'hr', label: 'HR / Skip-Level' },
]

function openCreateForm() {
  editingRule.value = null
  formData.value = { name: '', description: '', triggerType: TRIGGER_TYPES.GOAL_NOT_SUBMITTED, thresholdDays: 7, escalationIntervalDays: 3, escalationChain: ['employee', 'manager', 'hr'], enabled: true }
  showForm.value = true
}

function openEditForm(rule) {
  editingRule.value = rule.id
  formData.value = { name: rule.name, description: rule.description, triggerType: rule.triggerType, thresholdDays: rule.thresholdDays, escalationIntervalDays: rule.escalationIntervalDays, escalationChain: [...rule.escalationChain], enabled: rule.enabled }
  showForm.value = true
}

function saveRule() {
  if (!formData.value.name.trim()) { toast.warning('Rule name is required.'); return }
  if (formData.value.escalationChain.length === 0) { toast.warning('At least one escalation target is required.'); return }
  if (editingRule.value) {
    escalationStore.updateRule(editingRule.value, { ...formData.value })
    toast.success('Rule updated successfully.')
  } else {
    escalationStore.addRule({ ...formData.value })
    toast.success('Rule created successfully.')
  }
  showForm.value = false
}

function cancelForm() { showForm.value = false; editingRule.value = null }

function handleToggle(ruleId) {
  escalationStore.toggleRule(ruleId)
  const rule = escalationStore.getRuleById(ruleId)
  toast.info(`Rule "${rule.name}" ${rule.enabled ? 'enabled' : 'disabled'}.`)
}

function handleDelete(rule) {
  if (confirm(`Delete rule "${rule.name}"?`)) { escalationStore.deleteRule(rule.id); toast.success('Rule deleted.') }
}

function runEvaluation() {
  const result = escalationStore.evaluateRules()
  if (result.newEscalations > 0) toast.warning(`${result.newEscalations} new escalation(s) created.`)
  else toast.success(`Evaluation complete. No new escalations.`)
}

function toggleChainItem(item) {
  const idx = formData.value.escalationChain.indexOf(item)
  if (idx >= 0) formData.value.escalationChain.splice(idx, 1)
  else {
    const order = ['employee', 'manager', 'hr']
    formData.value.escalationChain.push(item)
    formData.value.escalationChain.sort((a, b) => order.indexOf(a) - order.indexOf(b))
  }
}

function formatChain(chain) {
  const m = { employee: 'Employee', manager: 'Manager', hr: 'HR' }
  return chain.map(c => m[c] || c).join(' → ')
}
</script>

<template>
  <div class="esc-rules animate-fade-in">
    <div class="page-header flex justify-between items-center">
      <div>
        <h1>Escalation Rules</h1>
        <p>Configure rule-based escalation triggers and notification chains.</p>
      </div>
      <div class="flex gap-sm">
        <button class="btn btn-secondary" @click="runEvaluation">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>
          Run Evaluation
        </button>
        <button class="btn btn-primary" @click="openCreateForm">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add Rule
        </button>
      </div>
    </div>

    <div class="grid-3 mb-lg">
      <div class="stat-card animate-slide-up"><span class="stat-label">Total Rules</span><span class="stat-value">{{ stats.totalRules }}</span></div>
      <div class="stat-card animate-slide-up" style="animation-delay:80ms"><span class="stat-label">Active Rules</span><span class="stat-value">{{ stats.activeRules }}</span><span class="text-sm text-muted">currently enabled</span></div>
      <div class="stat-card animate-slide-up" style="animation-delay:160ms"><span class="stat-label">Open Escalations</span><span class="stat-value" :style="stats.totalOpen > 0 ? 'color:var(--color-danger)!important' : ''">{{ stats.totalOpen }}</span></div>
    </div>

    <!-- Modal -->
    <div v-if="showForm" class="modal-overlay" @click.self="cancelForm">
      <div class="modal-content card">
        <div class="flex justify-between items-center mb-lg">
          <h3>{{ editingRule ? 'Edit Rule' : 'Create Rule' }}</h3>
          <button class="btn btn-ghost btn-sm" @click="cancelForm">&times;</button>
        </div>
        <div class="flex flex-col gap-md">
          <div class="form-group"><label class="form-label">Rule Name</label><input v-model="formData.name" class="form-input" placeholder="e.g. Goals Not Submitted" /></div>
          <div class="form-group"><label class="form-label">Trigger Type</label><select v-model="formData.triggerType" class="form-select"><option v-for="o in triggerOptions" :key="o.value" :value="o.value">{{ o.label }}</option></select></div>
          <div class="form-group"><label class="form-label">Description</label><textarea v-model="formData.description" class="form-textarea" rows="2" placeholder="Describe trigger..."></textarea></div>
          <div class="grid-2">
            <div class="form-group"><label class="form-label">Threshold (Days)</label><input v-model.number="formData.thresholdDays" type="number" min="1" max="90" class="form-input" /><span class="form-hint">Days before first escalation</span></div>
            <div class="form-group"><label class="form-label">Interval (Days)</label><input v-model.number="formData.escalationIntervalDays" type="number" min="1" max="30" class="form-input" /><span class="form-hint">Days between levels</span></div>
          </div>
          <div class="form-group">
            <label class="form-label">Escalation Chain</label>
            <div class="flex gap-sm">
              <label v-for="o in chainOptions" :key="o.value" class="chain-opt" :class="{ sel: formData.escalationChain.includes(o.value) }">
                <input type="checkbox" :checked="formData.escalationChain.includes(o.value)" @change="toggleChainItem(o.value)" style="display:none" />
                <span>{{ o.label }}</span>
              </label>
            </div>
            <span class="form-hint">Chain: {{ formatChain(formData.escalationChain) || 'None' }}</span>
          </div>
        </div>
        <div class="flex justify-end gap-sm mt-lg" style="border-top:1px solid var(--border-subtle); padding-top:var(--space-md);">
          <button class="btn btn-secondary" @click="cancelForm">Cancel</button>
          <button class="btn btn-primary" @click="saveRule">{{ editingRule ? 'Save Changes' : 'Create Rule' }}</button>
        </div>
      </div>
    </div>

    <!-- Table -->
    <div v-if="!escalationStore.rules.length" class="empty-state card"><h3>No Escalation Rules</h3><p class="text-sm text-muted">Create your first rule to start monitoring compliance.</p></div>
    <div v-else class="card">
      <table class="data-table">
        <thead><tr><th>Rule</th><th>Trigger</th><th>Threshold</th><th>Interval</th><th>Chain</th><th>Status</th><th style="text-align:right">Actions</th></tr></thead>
        <tbody>
          <tr v-for="rule in escalationStore.rules" :key="rule.id">
            <td><div><span style="font-weight:600;color:var(--text-primary)">{{ rule.name }}</span><div class="text-xs text-muted" style="margin-top:2px;max-width:240px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{ rule.description }}</div></div></td>
            <td><span class="badge badge-info">{{ TRIGGER_LABELS[rule.triggerType] || rule.triggerType }}</span></td>
            <td><span class="font-semibold">{{ rule.thresholdDays }}</span> <span class="text-muted text-xs">days</span></td>
            <td><span class="font-semibold">{{ rule.escalationIntervalDays }}</span> <span class="text-muted text-xs">days</span></td>
            <td><div class="flex items-center gap-xs"><template v-for="(c, i) in rule.escalationChain" :key="c"><span class="chain-badge" :class="'cb-' + c">{{ c === 'hr' ? 'HR' : c.charAt(0).toUpperCase() + c.slice(1) }}</span><span v-if="i < rule.escalationChain.length - 1" class="text-muted text-xs">→</span></template></div></td>
            <td><button class="toggle-btn" :class="{ on: rule.enabled }" @click="handleToggle(rule.id)"><span class="track"><span class="thumb"></span></span></button></td>
            <td style="text-align:right"><div class="flex gap-xs justify-end">
              <button class="btn btn-ghost btn-sm" @click="openEditForm(rule)" title="Edit"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
              <button class="btn btn-ghost btn-sm" @click="handleDelete(rule)" title="Delete" style="color:var(--color-danger)"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg></button>
            </div></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.esc-rules { max-width: 1200px; }
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(4px); animation: fadeIn 150ms ease; }
.modal-content { width: 100%; max-width: 560px; max-height: 90vh; overflow-y: auto; animation: slideUp 200ms ease; }
.chain-opt { display: flex; align-items: center; gap: 6px; padding: 6px 12px; border: 1px solid var(--border-light); border-radius: var(--radius-sm); cursor: pointer; font-size: 0.85rem; transition: all var(--transition-fast); user-select: none; }
.chain-opt.sel { background: var(--brand-surface); border-color: var(--brand-primary); color: var(--brand-primary); font-weight: 500; }
.chain-badge { font-size: 0.7rem; font-weight: 600; padding: 2px 6px; border-radius: var(--radius-sm); }
.cb-employee { background: var(--color-info-bg); color: var(--color-info); }
.cb-manager { background: var(--color-warning-bg); color: #8a6d00; }
.cb-hr { background: var(--color-danger-bg); color: var(--color-danger); }
.toggle-btn { background: none; border: none; cursor: pointer; padding: 4px; }
.track { display: block; width: 36px; height: 20px; border-radius: 10px; background: var(--border-light); position: relative; transition: background var(--transition-fast); }
.toggle-btn.on .track { background: var(--color-success); }
.thumb { display: block; width: 16px; height: 16px; border-radius: 50%; background: white; position: absolute; top: 2px; left: 2px; transition: transform var(--transition-fast); box-shadow: 0 1px 3px rgba(0,0,0,0.2); }
.toggle-btn.on .thumb { transform: translateX(16px); }
@keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
@keyframes slideUp { from { opacity: 0; transform: translateY(16px) } to { opacity: 1; transform: translateY(0) } }
</style>
