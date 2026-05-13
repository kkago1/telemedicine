<script setup>
import { ref, watch, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import dayjs from 'dayjs'
import AppLayout from '@/components/AppLayout.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import PaginationBar from '@/components/PaginationBar.vue'
import LoadingSkeleton from '@/components/LoadingSkeleton.vue'
import EmptyState from '@/components/EmptyState.vue'
import ConfirmModal from '@/components/ConfirmModal.vue'
import { getMyConsultationRequests, createConsultationRequest, cancelConsultationRequest } from '@/api/consultationRequests'
import { getRelationships } from '@/api/relationships'

const route = useRoute()

const TABS = ['PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED']
const activeTab = ref('PENDING')
const requests = ref([])
const pagination = ref(null)
const loading = ref(true)
const error = ref(null)

const confirmId = ref(null)
const cancelling = ref(false)

// New request form
const showForm = ref(false)
const relationships = ref([])
const formPractitionerId = ref(route.query.practitionerId ?? '')
const formMessage = ref('')
const formPreferredType = ref('ANY')
const formPreferredDate = ref('')
const formPreferredTime = ref('')
const formError = ref('')
const submitting = ref(false)

async function loadPage(page = 1) {
  loading.value = true
  error.value = null
  try {
    const result = await getMyConsultationRequests({ status: activeTab.value, page, pageSize: 10 })
    requests.value = result.data
    pagination.value = result.pagination
  } catch {
    error.value = 'Could not load consultation requests. Please try again.'
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
  if (route.query.practitionerId) showForm.value = true
})

async function handleCancel() {
  cancelling.value = true
  try {
    await cancelConsultationRequest(confirmId.value)
    confirmId.value = null
    await loadPage(1)
  } catch (err) {
    error.value = err.response?.data?.error?.message ?? 'Could not cancel request.'
    confirmId.value = null
  } finally {
    cancelling.value = false
  }
}

async function submitForm() {
  formError.value = ''
  if (!formPractitionerId.value) {
    formError.value = 'Please select a practitioner.'
    return
  }
  submitting.value = true
  try {
    const body = { practitionerId: formPractitionerId.value }
    if (formMessage.value.trim()) body.message = formMessage.value.trim()
    if (formPreferredType.value && formPreferredType.value !== 'ANY') body.preferredType = formPreferredType.value
    else if (formPreferredType.value === 'ANY') body.preferredType = 'ANY'
    if (formPreferredDate.value) body.preferredDate = formPreferredDate.value
    if (formPreferredTime.value) body.preferredTime = formPreferredTime.value
    await createConsultationRequest(body)
    showForm.value = false
    resetForm()
    activeTab.value = 'PENDING'
    await loadPage(1)
  } catch (err) {
    formError.value = err.response?.data?.error?.message ?? 'Could not send request. Please try again.'
  } finally {
    submitting.value = false
  }
}

function resetForm() {
  formPractitionerId.value = ''
  formMessage.value = ''
  formPreferredType.value = 'ANY'
  formPreferredDate.value = ''
  formPreferredTime.value = ''
  formError.value = ''
}

function cancelForm() {
  showForm.value = false
  resetForm()
}

const selectedPractitioner = computed(() =>
  relationships.value.find(r => r.practitionerId === formPractitionerId.value)
)

function fmt(date) {
  return dayjs(date).format('MMM D, YYYY')
}

function fmtDateTime(date) {
  if (!date) return '—'
  return dayjs(date).format('MMM D, YYYY h:mm A')
}
</script>

<template>
  <AppLayout>
    <div class="page">
      <div class="page-header">
        <h1 class="page-title">Consultation Requests</h1>
        <button class="btn btn-primary" @click="showForm = !showForm">
          {{ showForm ? 'Close' : '+ New Request' }}
        </button>
      </div>

      <!-- New request form -->
      <div v-if="showForm" class="card form-card">
        <h2 class="form-title">Request a Consultation</h2>

        <div class="form-group">
          <label class="form-label">Practitioner</label>
          <select v-model="formPractitionerId" class="form-input" :disabled="submitting">
            <option value="">Select a practitioner…</option>
            <option
              v-for="rel in relationships"
              :key="rel.practitionerId"
              :value="rel.practitionerId"
            >
              {{ rel.practitionerName }} — {{ rel.specialization }}
            </option>
          </select>
          <p v-if="relationships.length === 0" class="form-hint">
            You need an active practitioner relationship to request a consultation.
            <RouterLink to="/patient/relationships">View your practitioners →</RouterLink>
          </p>
        </div>

        <div class="form-group">
          <label class="form-label">Message <span class="optional">(optional)</span></label>
          <textarea
            v-model="formMessage"
            class="form-input"
            rows="3"
            placeholder="Describe what you'd like to consult about…"
            :disabled="submitting"
          />
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Preferred Type</label>
            <select v-model="formPreferredType" class="form-input" :disabled="submitting">
              <option value="ANY">Any</option>
              <option value="VIRTUAL">Virtual</option>
              <option value="PHYSICAL">Physical</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Preferred Date <span class="optional">(optional)</span></label>
            <input v-model="formPreferredDate" type="date" class="form-input" :disabled="submitting" />
          </div>
          <div class="form-group">
            <label class="form-label">Preferred Time <span class="optional">(optional)</span></label>
            <input v-model="formPreferredTime" type="time" class="form-input" :disabled="submitting" />
          </div>
        </div>

        <div v-if="formError" class="alert alert-error">{{ formError }}</div>

        <div class="form-actions">
          <button class="btn btn-secondary" :disabled="submitting" @click="cancelForm">Cancel</button>
          <button class="btn btn-primary" :disabled="submitting" @click="submitForm">
            {{ submitting ? 'Sending…' : 'Send Request' }}
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
        :message="activeTab === 'PENDING' ? 'Click &quot;New Request&quot; above to request a consultation with one of your practitioners.' : ''"
      />

      <div v-else class="request-list">
        <div v-for="req in requests" :key="req.id" class="request-card card">
          <div class="req-main">
            <div class="req-avatar">{{ (req.practitionerName ?? '?')[0].toUpperCase() }}</div>
            <div class="req-info">
              <p class="req-name">{{ req.practitionerName }}</p>
              <p class="req-spec">{{ req.specialization }}</p>
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
            <button
              v-if="req.status === 'PENDING'"
              class="btn btn-danger cancel-btn"
              @click="confirmId = req.id"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>

      <PaginationBar v-if="pagination" :pagination="pagination" :loading="loading" @page-change="loadPage" />
    </div>

    <ConfirmModal
      v-if="confirmId"
      title="Cancel Request?"
      message="Are you sure you want to cancel this consultation request? This cannot be undone."
      confirm-label="Yes, cancel it"
      confirm-class="btn-danger"
      :loading="cancelling"
      @confirm="handleCancel"
      @close="confirmId = null"
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

.request-list { display: flex; flex-direction: column; gap: 12px; }
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
.req-spec    { font-size: 13px; color: var(--color-text-muted); margin-top: 2px; }
.req-message { font-size: 13px; color: var(--color-text-muted); margin-top: 6px; line-height: 1.5; }
.req-meta    { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 8px; }
.meta-chip {
  font-size: 11px; font-weight: 500;
  background: var(--color-border); color: var(--color-text-muted);
  padding: 2px 8px; border-radius: 999px;
}
.req-side { display: flex; flex-direction: column; align-items: flex-end; gap: 8px; flex-shrink: 0; }
.req-date  { font-size: 12px; color: var(--color-text-muted); }
.cancel-btn { padding: 6px 14px; font-size: 13px; }

.alert { padding: 10px 14px; border-radius: var(--radius-md); font-size: 14px; margin-top: 12px; }
.alert-error { background: var(--color-error-light); color: var(--color-error); border: 1px solid #FECACA; }
</style>
