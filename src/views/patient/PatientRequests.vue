<script setup>
import { ref, watch, onMounted } from 'vue'
import dayjs from 'dayjs'
import AppLayout from '@/components/AppLayout.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import PaginationBar from '@/components/PaginationBar.vue'
import LoadingSkeleton from '@/components/LoadingSkeleton.vue'
import EmptyState from '@/components/EmptyState.vue'
import ConfirmModal from '@/components/ConfirmModal.vue'
import { getMyRequests, cancelRequest } from '@/api/consultations'

const TABS = ['PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED']
const activeTab = ref('PENDING')
const requests = ref([])
const pagination = ref(null)
const loading = ref(true)
const error = ref(null)

const confirmId = ref(null)
const cancelling = ref(false)

async function loadPage(page = 1) {
  loading.value = true
  error.value = null
  try {
    const result = await getMyRequests({ status: activeTab.value, page, limit: 10 })
    requests.value = result.data
    pagination.value = result.pagination
  } catch {
    error.value = 'Could not load requests. Please try again.'
  } finally {
    loading.value = false
  }
}

watch(activeTab, () => loadPage(1))
onMounted(() => loadPage(1))

async function handleCancel() {
  cancelling.value = true
  try {
    await cancelRequest(confirmId.value)
    confirmId.value = null
    await loadPage(1)
  } catch (err) {
    error.value = err.response?.data?.error?.message ?? err.response?.data?.message ?? 'Could not cancel request.'
    confirmId.value = null
  } finally {
    cancelling.value = false
  }
}

function fmt(date) {
  return dayjs(date).format('MMM D, YYYY')
}
</script>

<template>
  <AppLayout>
    <div class="page">
      <h1 class="page-title">My Consultation Requests</h1>

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

      <!-- Loading -->
      <LoadingSkeleton v-if="loading" height="88px" :count="5" />

      <!-- Error -->
      <div v-else-if="error" class="error-box">
        <p>{{ error }}</p>
        <button class="btn btn-secondary" style="margin-top:12px;" @click="loadPage(1)">Try again</button>
      </div>

      <!-- Empty -->
      <EmptyState
        v-else-if="!requests.length"
        :title="`No ${activeTab.toLowerCase()} requests`"
        :message="activeTab === 'PENDING' ? 'Browse practitioners to send your first consultation request.' : ''"
        :action-label="activeTab === 'PENDING' ? 'Find a Practitioner' : ''"
        action-to="/practitioners"
      />

      <!-- List -->
      <div v-else class="request-list">
        <div v-for="req in requests" :key="req.id" class="request-card card">
          <div class="req-main">
            <div class="req-avatar">
              {{ (req.practitionerName ?? '?')[0].toUpperCase() }}
            </div>
            <div class="req-info">
              <p class="req-name">{{ req.practitionerName }}</p>
              <p class="req-spec">{{ req.specialization }}</p>
              <p class="req-message">{{ req.message }}</p>
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

    <!-- Confirm cancel modal -->
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
.tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 24px;
  border-bottom: 2px solid var(--color-border);
  padding-bottom: 0;
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
.tab-btn.active {
  color: var(--color-primary);
  border-bottom-color: var(--color-primary);
}

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
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: var(--color-primary-light);
  color: var(--color-primary-dark);
  font-size: 16px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.req-name    { font-size: 15px; font-weight: 600; }
.req-spec    { font-size: 13px; color: var(--color-text-muted); margin-top: 2px; }
.req-message { font-size: 13px; color: var(--color-text-muted); margin-top: 6px; line-height: 1.5; }

.req-side {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
  flex-shrink: 0;
}
.req-date { font-size: 12px; color: var(--color-text-muted); }

.cancel-btn { padding: 6px 14px; font-size: 13px; }
</style>
