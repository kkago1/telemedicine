<script setup>
import { ref, watch, onMounted } from 'vue'
import dayjs from 'dayjs'
import AppLayout from '@/components/AppLayout.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import PaginationBar from '@/components/PaginationBar.vue'
import LoadingSkeleton from '@/components/LoadingSkeleton.vue'
import EmptyState from '@/components/EmptyState.vue'
import ConfirmModal from '@/components/ConfirmModal.vue'
import { getMySessions, scheduleConsultation, updateConsultationStatus } from '@/api/consultations'
import { getRelationships } from '@/api/relationships'

const TABS = ['SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW']
const activeTab = ref('SCHEDULED')
const consultations = ref([])
const pagination = ref(null)
const loading = ref(true)
const error = ref(null)

// Status update confirm
const confirmAction = ref(null) // { id, status }
const actionInProgress = ref(false)

// New standalone consultation form
const showNewForm = ref(false)
const relationships = ref([])
const newRelId = ref('')
const newSchedAt = ref('')
const newType = ref('VIRTUAL')
const newDuration = ref('')
const newNotes = ref('')
const newFormError = ref('')
const newSubmitting = ref(false)

async function loadPage(page = 1) {
  loading.value = true
  error.value = null
  try {
    const result = await getMySessions({ status: activeTab.value, page, pageSize: 10 })
    consultations.value = result.data
    pagination.value = result.pagination
  } catch {
    error.value = 'Could not load consultations. Please try again.'
  } finally {
    loading.value = false
  }
}

async function loadRelationships() {
  try {
    const result = await getRelationships({ status: 'ACTIVE', pageSize: 100 })
    relationships.value = result.data
  } catch {
    // non-fatal
  }
}

watch(activeTab, () => loadPage(1))
onMounted(() => {
  loadPage(1)
  loadRelationships()
})

async function handleStatusUpdate() {
  actionInProgress.value = true
  try {
    await updateConsultationStatus(confirmAction.value.id, confirmAction.value.status)
    confirmAction.value = null
    await loadPage(1)
  } catch (err) {
    error.value = err.response?.data?.error?.message ?? 'Could not update consultation.'
    confirmAction.value = null
  } finally {
    actionInProgress.value = false
  }
}

function resetNewForm() {
  newRelId.value = ''
  newSchedAt.value = ''
  newType.value = 'VIRTUAL'
  newDuration.value = ''
  newNotes.value = ''
  newFormError.value = ''
}

function cancelNewForm() {
  showNewForm.value = false
  resetNewForm()
}

async function submitNewForm() {
  newFormError.value = ''
  if (!newRelId.value) { newFormError.value = 'Please select a patient.'; return }
  if (!newSchedAt.value) { newFormError.value = 'Please choose a date and time.'; return }
  newSubmitting.value = true
  try {
    const body = {
      relationshipId: newRelId.value,
      scheduledAt: newSchedAt.value,
      type: newType.value,
    }
    if (newDuration.value) body.durationMinutes = String(newDuration.value)
    if (newNotes.value.trim()) body.notes = newNotes.value.trim()
    await scheduleConsultation(body)
    cancelNewForm()
    activeTab.value = 'SCHEDULED'
    await loadPage(1)
  } catch (err) {
    newFormError.value = err.response?.data?.error?.message ?? 'Could not schedule consultation. Please try again.'
  } finally {
    newSubmitting.value = false
  }
}

function confirmStatus(id, status) {
  confirmAction.value = { id, status }
}

const STATUS_LABELS = {
  COMPLETED: 'Complete',
  CANCELLED: 'Cancel',
  NO_SHOW: 'No-show',
}

const CONFIRM_MESSAGES = {
  COMPLETED: 'Mark this consultation as completed?',
  CANCELLED: 'Cancel this consultation? The patient will be notified.',
  NO_SHOW: 'Mark this patient as no-show?',
}

function fmt(date) {
  return dayjs(date).format('MMM D, YYYY')
}

function fmtDateTime(date) {
  if (!date) return '—'
  return dayjs(date).format('MMM D, YYYY [at] h:mm A')
}

function tabLabel(tab) {
  return tab === 'NO_SHOW' ? 'No-show' : tab.charAt(0) + tab.slice(1).toLowerCase()
}
</script>

<template>
  <AppLayout>
    <div class="page">
      <div class="page-header">
        <h1 class="page-title">My Consultations</h1>
        <button class="btn btn-primary" @click="showNewForm = !showNewForm">
          {{ showNewForm ? 'Close' : '+ New Consultation' }}
        </button>
      </div>

      <!-- Standalone schedule form -->
      <div v-if="showNewForm" class="card form-card">
        <h2 class="form-title">Schedule a Consultation</h2>

        <div class="form-group">
          <label class="form-label">Patient</label>
          <select v-model="newRelId" class="form-input" :disabled="newSubmitting">
            <option value="">Select a patient…</option>
            <option
              v-for="rel in relationships"
              :key="rel.id"
              :value="rel.id"
            >
              {{ rel.patientName ?? 'Patient' }}
            </option>
          </select>
          <p v-if="relationships.length === 0" class="form-hint">
            You need active patient relationships to schedule consultations.
          </p>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Date & Time</label>
            <input v-model="newSchedAt" type="datetime-local" class="form-input" :disabled="newSubmitting" />
          </div>
          <div class="form-group">
            <label class="form-label">Type</label>
            <select v-model="newType" class="form-input" :disabled="newSubmitting">
              <option value="VIRTUAL">Virtual</option>
              <option value="PHYSICAL">Physical</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Duration (min) <span class="optional">(optional)</span></label>
            <input v-model="newDuration" type="number" min="5" class="form-input" placeholder="e.g. 30" :disabled="newSubmitting" />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Notes <span class="optional">(optional)</span></label>
          <textarea v-model="newNotes" class="form-input" rows="2" placeholder="Internal notes…" :disabled="newSubmitting" />
        </div>

        <div v-if="newFormError" class="alert alert-error">{{ newFormError }}</div>

        <div class="form-actions">
          <button class="btn btn-secondary" :disabled="newSubmitting" @click="cancelNewForm">Cancel</button>
          <button class="btn btn-primary" :disabled="newSubmitting" @click="submitNewForm">
            {{ newSubmitting ? 'Scheduling…' : 'Schedule' }}
          </button>
        </div>
      </div>

      <!-- Tabs -->
      <div class="tabs">
        <button
          v-for="tab in TABS"
          :key="tab"
          class="tab-btn"
          :class="{ active: activeTab === tab }"
          @click="activeTab = tab"
        >
          {{ tabLabel(tab) }}
        </button>
      </div>

      <LoadingSkeleton v-if="loading" height="96px" :count="5" />

      <div v-else-if="error" class="error-box">
        <p>{{ error }}</p>
        <button class="btn btn-secondary" style="margin-top:12px;" @click="loadPage(1)">Try again</button>
      </div>

      <EmptyState
        v-else-if="!consultations.length"
        :title="`No ${tabLabel(activeTab).toLowerCase()} consultations`"
        :message="activeTab === 'SCHEDULED'
          ? 'Schedule a consultation above or accept a consultation request from a patient.'
          : ''"
        :action-label="activeTab === 'SCHEDULED' ? 'Review Requests' : ''"
        action-to="/practitioner/consultation-requests"
      />

      <div v-else class="consult-list">
        <div v-for="c in consultations" :key="c.id" class="consult-card card">
          <div class="c-main">
            <div class="c-avatar">{{ (c.patientName ?? 'P')[0].toUpperCase() }}</div>
            <div class="c-info">
              <p class="c-name">{{ c.patientName ?? 'Patient' }}</p>
              <p class="c-when">{{ fmtDateTime(c.scheduledAt) }}</p>
              <div class="c-meta">
                <span class="meta-chip" :class="`type-${c.type?.toLowerCase()}`">{{ c.type }}</span>
                <span v-if="c.durationMinutes" class="meta-chip">{{ c.durationMinutes }} min</span>
              </div>
            </div>
          </div>
          <div class="c-side">
            <StatusBadge :status="c.status" />
            <p class="c-date">{{ fmt(c.scheduledAt) }}</p>
            <div v-if="c.status === 'SCHEDULED'" class="c-actions">
              <button
                v-for="(label, status) in STATUS_LABELS"
                :key="status"
                class="btn action-btn"
                :class="status === 'COMPLETED' ? 'btn-primary' : 'btn-danger'"
                @click="confirmStatus(c.id, status)"
              >
                {{ label }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <PaginationBar v-if="pagination" :pagination="pagination" :loading="loading" @page-change="loadPage" />
    </div>

    <ConfirmModal
      v-if="confirmAction"
      :title="`${STATUS_LABELS[confirmAction.status]} Consultation?`"
      :message="CONFIRM_MESSAGES[confirmAction.status]"
      :confirm-label="STATUS_LABELS[confirmAction.status]"
      :confirm-class="confirmAction.status === 'COMPLETED' ? 'btn-primary' : 'btn-danger'"
      :loading="actionInProgress"
      @confirm="handleStatusUpdate"
      @close="confirmAction = null"
    />
  </AppLayout>
</template>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}
.page-header .page-title { margin-bottom: 0; }

.form-card { padding: 24px; margin-bottom: 24px; }
.form-title { font-size: 16px; font-weight: 600; margin-bottom: 20px; }
.form-hint  { font-size: 12px; color: var(--color-text-muted); margin-top: 6px; }
.optional   { color: var(--color-text-muted); font-size: 12px; font-weight: 400; }
.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 16px;
}
@media (max-width: 640px) { .form-row { grid-template-columns: 1fr; } }
.form-actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 16px; }

.tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 24px;
  border-bottom: 2px solid var(--color-border);
}
.tab-btn {
  padding: 8px 18px;
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-muted);
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s;
}
.tab-btn:hover { color: var(--color-text); }
.tab-btn.active { color: var(--color-primary); border-bottom-color: var(--color-primary); }

.error-box { color: var(--color-error); font-size: 14px; }

.consult-list { display: flex; flex-direction: column; gap: 12px; }
.consult-card {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  padding: 18px 20px;
}
.c-main { display: flex; align-items: flex-start; gap: 14px; flex: 1; min-width: 0; }
.c-avatar {
  width: 42px; height: 42px; border-radius: 50%;
  background: var(--color-primary-light); color: var(--color-primary-dark);
  font-size: 16px; font-weight: 700;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.c-name { font-size: 15px; font-weight: 600; }
.c-when { font-size: 13px; color: var(--color-text); font-weight: 500; margin-top: 6px; }
.c-meta { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 8px; }
.meta-chip {
  font-size: 11px; font-weight: 500;
  background: var(--color-border); color: var(--color-text-muted);
  padding: 2px 8px; border-radius: 999px;
}
.type-virtual  { background: #EFF6FF; color: #1D4ED8; }
.type-physical { background: #F0FDF4; color: #15803D; }

.c-side { display: flex; flex-direction: column; align-items: flex-end; gap: 8px; flex-shrink: 0; }
.c-date { font-size: 12px; color: var(--color-text-muted); }
.c-actions { display: flex; gap: 6px; flex-wrap: wrap; justify-content: flex-end; }
.action-btn { padding: 6px 12px; font-size: 12px; }

.alert { padding: 10px 14px; border-radius: var(--radius-md); font-size: 14px; margin-top: 12px; }
.alert-error { background: var(--color-error-light); color: var(--color-error); border: 1px solid #FECACA; }
</style>
