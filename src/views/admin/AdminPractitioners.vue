<script setup>
import { ref, watch, onMounted } from 'vue'
import dayjs from 'dayjs'
import AppLayout from '@/components/AppLayout.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import PaginationBar from '@/components/PaginationBar.vue'
import LoadingSkeleton from '@/components/LoadingSkeleton.vue'
import EmptyState from '@/components/EmptyState.vue'
import ConfirmModal from '@/components/ConfirmModal.vue'
import { getPractitioners, approvePractitioner, rejectPractitioner } from '@/api/admin'

const TABS = ['PENDING', 'APPROVED', 'REJECTED']
const activeTab = ref('PENDING')
const practitioners = ref([])
const pagination = ref(null)
const loading = ref(true)
const error = ref(null)

const confirmAction = ref(null) // { id, type: 'approve' | 'reject', name }
const actionInProgress = ref(false)

async function loadPage(page = 1) {
  loading.value = true
  error.value = null
  try {
    const result = await getPractitioners({ verificationStatus: activeTab.value, page, limit: 10 })
    practitioners.value = result.data
    pagination.value = result.pagination
  } catch {
    error.value = 'Could not load practitioners. Please try again.'
  } finally {
    loading.value = false
  }
}

watch(activeTab, () => loadPage(1))
onMounted(() => loadPage(1))

async function handleConfirm() {
  actionInProgress.value = true
  try {
    if (confirmAction.value.type === 'approve') {
      await approvePractitioner(confirmAction.value.id)
    } else {
      await rejectPractitioner(confirmAction.value.id)
    }
    confirmAction.value = null
    await loadPage(1)
  } catch (err) {
    error.value = err.response?.data?.error?.message ?? 'Action failed. Please try again.'
    confirmAction.value = null
  } finally {
    actionInProgress.value = false
  }
}

function fmt(date) {
  return dayjs(date).format('MMM D, YYYY')
}
</script>

<template>
  <AppLayout>
    <div class="page">
      <h1 class="page-title">Manage Practitioners</h1>

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
        v-else-if="!practitioners.length"
        :title="`No ${activeTab.toLowerCase()} practitioners`"
        :message="activeTab === 'PENDING' ? 'New practitioner registrations will appear here for review.' : ''"
      />

      <div v-else class="prac-list">
        <div v-for="p in practitioners" :key="p.id" class="prac-card card">
          <div class="prac-main">
            <div class="prac-avatar">
              {{ (p.fullName ?? 'P')[0].toUpperCase() }}
            </div>
            <div class="prac-info">
              <p class="prac-name">{{ p.fullName ?? '—' }}</p>
              <p class="prac-detail">{{ p.specialization ?? '—' }}</p>
              <p class="prac-detail">License: {{ p.licenseNumber ?? '—' }}</p>
              <p class="prac-date">Registered {{ fmt(p.createdAt) }}</p>
            </div>
          </div>
          <div class="prac-side">
            <StatusBadge :status="p.verificationStatus" />
            <div v-if="p.verificationStatus === 'PENDING'" class="prac-actions">
              <button
                class="btn btn-primary action-btn"
                @click="confirmAction = { id: p.id, type: 'approve', name: p.fullName }"
              >
                Approve
              </button>
              <button
                class="btn btn-danger action-btn"
                @click="confirmAction = { id: p.id, type: 'reject', name: p.fullName }"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      </div>

      <PaginationBar v-if="pagination" :pagination="pagination" :loading="loading" @page-change="loadPage" />
    </div>

    <ConfirmModal
      v-if="confirmAction"
      :title="confirmAction.type === 'approve' ? 'Approve Practitioner?' : 'Reject Practitioner?'"
      :message="confirmAction.type === 'approve'
        ? `${confirmAction.name} will be approved and appear in the public practitioner directory.`
        : `${confirmAction.name}'s application will be rejected. They will not be able to accept patients.`"
      :confirm-label="confirmAction.type === 'approve' ? 'Yes, approve' : 'Yes, reject'"
      :confirm-class="confirmAction.type === 'approve' ? 'btn-primary' : 'btn-danger'"
      :loading="actionInProgress"
      @confirm="handleConfirm"
      @close="confirmAction = null"
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
.tab-btn.active { color: var(--color-primary); border-bottom-color: var(--color-primary); }

.error-box { color: var(--color-error); font-size: 14px; }

.prac-list { display: flex; flex-direction: column; gap: 12px; }

.prac-card {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  padding: 18px 20px;
}

.prac-main { display: flex; align-items: flex-start; gap: 14px; flex: 1; min-width: 0; }

.prac-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: var(--color-primary-light);
  color: var(--color-primary-dark);
  font-size: 17px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.prac-name   { font-size: 15px; font-weight: 600; }
.prac-detail { font-size: 13px; color: var(--color-text-muted); margin-top: 2px; }
.prac-date   { font-size: 12px; color: var(--color-text-muted); margin-top: 4px; }

.prac-side {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 12px;
  flex-shrink: 0;
}

.prac-actions { display: flex; gap: 8px; }
.action-btn   { padding: 6px 14px; font-size: 13px; }
</style>
