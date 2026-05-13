<script setup>
import { ref, watch, onMounted } from 'vue'
import dayjs from 'dayjs'
import AppLayout from '@/components/AppLayout.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import PaginationBar from '@/components/PaginationBar.vue'
import LoadingSkeleton from '@/components/LoadingSkeleton.vue'
import EmptyState from '@/components/EmptyState.vue'
import ConfirmModal from '@/components/ConfirmModal.vue'
import { getRelationships, terminateRelationship } from '@/api/relationships'

const TABS = ['ACTIVE', 'TERMINATED']
const activeTab = ref('ACTIVE')
const relationships = ref([])
const pagination = ref(null)
const loading = ref(true)
const error = ref(null)

const confirmId = ref(null)
const terminating = ref(false)

async function loadPage(page = 1) {
  loading.value = true
  error.value = null
  try {
    const result = await getRelationships({ status: activeTab.value, page, limit: 10 })
    relationships.value = result.data
    pagination.value = result.pagination
  } catch {
    error.value = 'Could not load relationships. Please try again.'
  } finally {
    loading.value = false
  }
}

watch(activeTab, () => loadPage(1))
onMounted(() => loadPage(1))

async function handleTerminate() {
  terminating.value = true
  try {
    await terminateRelationship(confirmId.value)
    confirmId.value = null
    await loadPage(1)
  } catch (err) {
    error.value = err.response?.data?.error?.message ?? 'Could not terminate relationship.'
    confirmId.value = null
  } finally {
    terminating.value = false
  }
}

function fmt(date) {
  return dayjs(date).format('MMM D, YYYY')
}
</script>

<template>
  <AppLayout>
    <div class="page">
      <h1 class="page-title">My Practitioners</h1>

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
        v-else-if="!relationships.length"
        :title="activeTab === 'ACTIVE' ? 'No active practitioners' : 'No past relationships'"
        :message="activeTab === 'ACTIVE' ? 'Once a practitioner accepts your connection request, they\'ll appear here.' : ''"
        :action-label="activeTab === 'ACTIVE' ? 'Browse Practitioners' : ''"
        action-to="/practitioners"
      />

      <div v-else class="rel-list">
        <div v-for="rel in relationships" :key="rel.id" class="rel-card card">
          <div class="rel-main">
            <div class="rel-avatar">
              {{ (rel.practitionerName ?? '?')[0].toUpperCase() }}
            </div>
            <div class="rel-info">
              <p class="rel-name">{{ rel.practitionerName }}</p>
              <p class="rel-spec">{{ rel.specialization }}</p>
              <p class="rel-date">
                Since {{ fmt(rel.startedAt) }}
                <template v-if="rel.terminatedAt"> · Ended {{ fmt(rel.terminatedAt) }}</template>
              </p>
            </div>
          </div>
          <div class="rel-side">
            <StatusBadge :status="rel.status" />
            <RouterLink
              v-if="rel.status === 'ACTIVE'"
              :to="`/patient/consultation-requests?practitionerId=${rel.practitionerId}`"
              class="btn btn-secondary req-consult-btn"
            >
              Request Consultation
            </RouterLink>
            <button
              v-if="rel.status === 'ACTIVE'"
              class="btn btn-danger term-btn"
              @click="confirmId = rel.id"
            >
              Terminate
            </button>
          </div>
        </div>
      </div>

      <PaginationBar v-if="pagination" :pagination="pagination" :loading="loading" @page-change="loadPage" />
    </div>

    <ConfirmModal
      v-if="confirmId"
      title="Terminate Relationship?"
      message="This will end your active relationship with this practitioner. You won't be able to access new medical records from them after this."
      confirm-label="Yes, terminate"
      confirm-class="btn-danger"
      :loading="terminating"
      @confirm="handleTerminate"
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

.rel-list { display: flex; flex-direction: column; gap: 12px; }

.rel-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 18px 20px;
}

.rel-main { display: flex; align-items: center; gap: 14px; flex: 1; min-width: 0; }

.rel-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--color-primary-light);
  color: var(--color-primary-dark);
  font-size: 18px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.rel-name { font-size: 15px; font-weight: 600; }
.rel-spec { font-size: 13px; color: var(--color-text-muted); margin-top: 2px; }
.rel-date { font-size: 12px; color: var(--color-text-muted); margin-top: 4px; }

.rel-side { display: flex; flex-direction: column; align-items: flex-end; gap: 10px; flex-shrink: 0; }

.term-btn { padding: 6px 14px; font-size: 13px; }
.req-consult-btn { padding: 6px 14px; font-size: 13px; }
</style>
