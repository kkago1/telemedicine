<script setup>
import { ref, watch, onMounted } from 'vue'
import dayjs from 'dayjs'
import AppLayout from '@/components/AppLayout.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import PaginationBar from '@/components/PaginationBar.vue'
import LoadingSkeleton from '@/components/LoadingSkeleton.vue'
import EmptyState from '@/components/EmptyState.vue'
import ConfirmModal from '@/components/ConfirmModal.vue'
import { getMyConsultations, updateConsultationStatus } from '@/api/consultations'

const TABS = ['SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW']
const activeTab = ref('SCHEDULED')
const consultations = ref([])
const pagination = ref(null)
const loading = ref(true)
const error = ref(null)

const confirmId = ref(null)
const cancelling = ref(false)

async function loadPage(page = 1) {
  loading.value = true
  error.value = null
  try {
    const result = await getMyConsultations({ status: activeTab.value, page, pageSize: 10 })
    consultations.value = result.data
    pagination.value = result.pagination
  } catch {
    error.value = 'Could not load consultations. Please try again.'
  } finally {
    loading.value = false
  }
}

watch(activeTab, () => loadPage(1))
onMounted(() => loadPage(1))

async function handleCancel() {
  cancelling.value = true
  try {
    await updateConsultationStatus(confirmId.value, 'CANCELLED')
    confirmId.value = null
    await loadPage(1)
  } catch (err) {
    error.value = err.response?.data?.error?.message ?? 'Could not cancel consultation.'
    confirmId.value = null
  } finally {
    cancelling.value = false
  }
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
      <h1 class="page-title">My Consultations</h1>

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
          ? 'Your upcoming consultations will appear here once a practitioner schedules one.'
          : ''"
      />

      <div v-else class="consult-list">
        <div v-for="c in consultations" :key="c.id" class="consult-card card">
          <div class="c-main">
            <div class="c-avatar">{{ (c.practitionerName ?? '?')[0].toUpperCase() }}</div>
            <div class="c-info">
              <p class="c-name">{{ c.practitionerName }}</p>
              <p class="c-spec">{{ c.specialization }}</p>
              <p class="c-when">{{ fmtDateTime(c.scheduledAt) }}</p>
              <div class="c-meta">
                <span class="meta-chip" :class="`type-${c.type?.toLowerCase()}`">{{ c.type }}</span>
                <span v-if="c.durationMinutes" class="meta-chip">{{ c.durationMinutes }} min</span>
              </div>
            </div>
          </div>
          <div class="c-side">
            <StatusBadge :status="c.status" />
            <p class="c-date">Booked {{ fmt(c.scheduledAt) }}</p>
            <button
              v-if="c.status === 'SCHEDULED'"
              class="btn btn-danger cancel-btn"
              @click="confirmId = c.id"
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
      title="Cancel Consultation?"
      message="Are you sure you want to cancel this consultation? The practitioner will be notified."
      confirm-label="Yes, cancel it"
      confirm-class="btn-danger"
      :loading="cancelling"
      @confirm="handleCancel"
      @close="confirmId = null"
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
.c-spec { font-size: 13px; color: var(--color-text-muted); margin-top: 2px; }
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
.cancel-btn { padding: 6px 14px; font-size: 13px; }
</style>
