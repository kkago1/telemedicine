<script setup>
import { ref, watch, onMounted } from 'vue'
import dayjs from 'dayjs'
import AppLayout from '@/components/AppLayout.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import PaginationBar from '@/components/PaginationBar.vue'
import LoadingSkeleton from '@/components/LoadingSkeleton.vue'
import EmptyState from '@/components/EmptyState.vue'
import ConfirmModal from '@/components/ConfirmModal.vue'
import { getIncomingConsultationRequests, rejectConsultationRequest } from '@/api/consultationRequests'
import { scheduleConsultation } from '@/api/consultations'

const TABS = ['PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED']
const activeTab = ref('PENDING')
const requests = ref([])
const pagination = ref(null)
const loading = ref(true)
const error = ref(null)

const rejectConfirmId = ref(null)
const rejecting = ref(false)

// Inline schedule form per request
const schedulingId = ref(null)
const schedAt = ref('')
const schedType = ref('VIRTUAL')
const schedDuration = ref('')
const schedNotes = ref('')
const schedError = ref('')
const scheduling = ref(false)

async function loadPage(page = 1) {
  loading.value = true
  error.value = null
  try {
    const result = await getIncomingConsultationRequests({ status: activeTab.value, page, pageSize: 10 })
    requests.value = result.data
    pagination.value = result.pagination
  } catch {
    error.value = 'Could not load consultation requests. Please try again.'
  } finally {
    loading.value = false
  }
}

watch(activeTab, () => loadPage(1))
onMounted(() => loadPage(1))

async function handleReject() {
  rejecting.value = true
  try {
    await rejectConsultationRequest(rejectConfirmId.value)
    rejectConfirmId.value = null
    await loadPage(1)
  } catch (err) {
    error.value = err.response?.data?.error?.message ?? 'Could not reject request.'
    rejectConfirmId.value = null
  } finally {
    rejecting.value = false
  }
}

function openScheduleForm(id) {
  schedulingId.value = id
  schedAt.value = ''
  schedType.value = 'VIRTUAL'
  schedDuration.value = ''
  schedNotes.value = ''
  schedError.value = ''
}

function closeScheduleForm() {
  schedulingId.value = null
}

async function submitSchedule() {
  schedError.value = ''
  if (!schedAt.value) {
    schedError.value = 'Please select a date and time.'
    return
  }
  scheduling.value = true
  try {
    const body = {
      consultationRequestId: schedulingId.value,
      scheduledAt: schedAt.value,
      type: schedType.value,
    }
    if (schedDuration.value) body.durationMinutes = String(schedDuration.value)
    if (schedNotes.value.trim()) body.notes = schedNotes.value.trim()
    await scheduleConsultation(body)
    closeScheduleForm()
    activeTab.value = 'ACCEPTED'
    await loadPage(1)
  } catch (err) {
    schedError.value = err.response?.data?.error?.message ?? 'Could not schedule consultation. Please try again.'
  } finally {
    scheduling.value = false
  }
}

function fmt(date) {
  return dayjs(date).format('MMM D, YYYY')
}

function fmtDateTime(date) {
  if (!date) return '—'
  return dayjs(date).format('MMM D, YYYY [at] h:mm A')
}
</script>

<template>
  <AppLayout>
    <div class="page">
      <h1 class="page-title">Consultation Requests</h1>

      <!-- Tabs -->
      <div class="tabs">
        <button
          v-for="tab in TABS"
          :key="tab"
          class="tab-btn"
          :class="{ active: activeTab === tab }"
          @click="activeTab = tab"
        >
          {{ tab.charAt(0) + tab.slice(1).toLowerCase() }}
        </button>
      </div>

      <LoadingSkeleton v-if="loading" height="96px" :count="5" />

      <div v-else-if="error" class="error-box">
        <p>{{ error }}</p>
        <button class="btn btn-secondary" style="margin-top:12px;" @click="loadPage(1)">Try again</button>
      </div>

      <EmptyState
        v-else-if="!requests.length"
        :title="`No ${activeTab.toLowerCase()} consultation requests`"
        :message="activeTab === 'PENDING' ? 'Consultation requests from your patients will appear here.' : ''"
      />

      <div v-else class="request-list">
        <div v-for="req in requests" :key="req.id" class="request-wrap">
          <div class="request-card card">
            <div class="req-main">
              <div class="req-avatar">{{ (req.patientName ?? 'P')[0].toUpperCase() }}</div>
              <div class="req-info">
                <p class="req-name">{{ req.patientName ?? 'Patient' }}</p>
                <p v-if="req.message" class="req-message">{{ req.message }}</p>
                <div class="req-meta">
                  <span v-if="req.preferredType" class="meta-chip">{{ req.preferredType }}</span>
                  <span v-if="req.preferredDate" class="meta-chip">{{ fmtDateTime(req.preferredDate) }}</span>
                </div>
              </div>
            </div>
            <div class="req-side">
              <StatusBadge :status="req.status" />
              <p class="req-date">{{ fmt(req.createdAt) }}</p>
              <div v-if="req.status === 'PENDING'" class="req-actions">
                <button
                  class="btn btn-primary action-btn"
                  :disabled="schedulingId === req.id"
                  @click="schedulingId === req.id ? closeScheduleForm() : openScheduleForm(req.id)"
                >
                  {{ schedulingId === req.id ? 'Close' : 'Schedule' }}
                </button>
                <button
                  class="btn btn-danger action-btn"
                  :disabled="schedulingId === req.id"
                  @click="rejectConfirmId = req.id"
                >
                  Reject
                </button>
              </div>
            </div>
          </div>

          <!-- Inline schedule form -->
          <div v-if="schedulingId === req.id" class="schedule-form card">
            <h3 class="sched-title">Schedule Consultation with {{ req.patientName }}</h3>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Date & Time</label>
                <input
                  v-model="schedAt"
                  type="datetime-local"
                  class="form-input"
                  :disabled="scheduling"
                />
              </div>
              <div class="form-group">
                <label class="form-label">Type</label>
                <select v-model="schedType" class="form-input" :disabled="scheduling">
                  <option value="VIRTUAL">Virtual</option>
                  <option value="PHYSICAL">Physical</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Duration (min) <span class="optional">(optional)</span></label>
                <input
                  v-model="schedDuration"
                  type="number"
                  min="5"
                  class="form-input"
                  placeholder="e.g. 30"
                  :disabled="scheduling"
                />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Notes <span class="optional">(optional)</span></label>
              <textarea
                v-model="schedNotes"
                class="form-input"
                rows="2"
                placeholder="Internal notes for this session…"
                :disabled="scheduling"
              />
            </div>

            <div v-if="schedError" class="alert alert-error">{{ schedError }}</div>

            <div class="form-actions">
              <button class="btn btn-secondary" :disabled="scheduling" @click="closeScheduleForm">Cancel</button>
              <button class="btn btn-primary" :disabled="scheduling" @click="submitSchedule">
                {{ scheduling ? 'Scheduling…' : 'Confirm Schedule' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <PaginationBar v-if="pagination" :pagination="pagination" :loading="loading" @page-change="loadPage" />
    </div>

    <ConfirmModal
      v-if="rejectConfirmId"
      title="Reject Request?"
      message="The patient will be notified that their consultation request was rejected."
      confirm-label="Yes, reject"
      confirm-class="btn-danger"
      :loading="rejecting"
      @confirm="handleReject"
      @close="rejectConfirmId = null"
    />
  </AppLayout>
</template>

<style scoped>
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

.request-list { display: flex; flex-direction: column; gap: 16px; }
.request-wrap { display: flex; flex-direction: column; gap: 8px; }

.request-card {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  padding: 18px 20px;
}
.req-main { display: flex; align-items: flex-start; gap: 14px; flex: 1; min-width: 0; }
.req-avatar {
  width: 42px; height: 42px; border-radius: 50%;
  background: var(--color-primary-light); color: var(--color-primary-dark);
  font-size: 16px; font-weight: 700;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.req-name    { font-size: 15px; font-weight: 600; }
.req-message { font-size: 13px; color: var(--color-text-muted); margin-top: 6px; line-height: 1.5; }
.req-meta    { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 8px; }
.meta-chip {
  font-size: 11px; font-weight: 500;
  background: var(--color-border); color: var(--color-text-muted);
  padding: 2px 8px; border-radius: 999px;
}
.req-side { display: flex; flex-direction: column; align-items: flex-end; gap: 8px; flex-shrink: 0; }
.req-date { font-size: 12px; color: var(--color-text-muted); }
.req-actions { display: flex; gap: 8px; }
.action-btn  { padding: 6px 14px; font-size: 13px; }

.schedule-form { padding: 20px 24px; border-left: 3px solid var(--color-primary); }
.sched-title { font-size: 15px; font-weight: 600; margin-bottom: 16px; }
.optional { color: var(--color-text-muted); font-size: 12px; font-weight: 400; }
.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 16px;
  margin-bottom: 16px;
}
@media (max-width: 640px) { .form-row { grid-template-columns: 1fr; } }
.form-actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 16px; }

.alert { padding: 10px 14px; border-radius: var(--radius-md); font-size: 14px; margin-top: 12px; }
.alert-error { background: var(--color-error-light); color: var(--color-error); border: 1px solid #FECACA; }
</style>
