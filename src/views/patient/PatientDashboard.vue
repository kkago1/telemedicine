<script setup>
import { ref, onMounted } from 'vue'
import dayjs from 'dayjs'
import AppLayout from '@/components/AppLayout.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import { getMyRequests } from '@/api/consultations'
import { getRelationships } from '@/api/relationships'
import { getMyRecords } from '@/api/records'

const stats = ref({ pendingRequests: 0, activeRelationships: 0, totalRecords: 0 })
const recentRequests = ref([])
const loading = ref(true)

onMounted(async () => {
  const [reqResult, relResult, recResult, recentResult] = await Promise.allSettled([
    getMyRequests({ status: 'PENDING', page: 1, limit: 1 }),
    getRelationships({ status: 'ACTIVE', page: 1, limit: 1 }),
    getMyRecords({ page: 1, limit: 1 }),
    getMyRequests({ page: 1, limit: 5 }),
  ])

  if (reqResult.status === 'fulfilled')
    stats.value.pendingRequests = reqResult.value.pagination?.total ?? 0
  if (relResult.status === 'fulfilled')
    stats.value.activeRelationships = relResult.value.pagination?.total ?? 0
  if (recResult.status === 'fulfilled')
    stats.value.totalRecords = recResult.value.pagination?.total ?? 0
  if (recentResult.status === 'fulfilled')
    recentRequests.value = recentResult.value.data

  loading.value = false
})

function fmt(date) {
  return dayjs(date).format('MMM D, YYYY')
}
</script>

<template>
  <AppLayout>
    <div class="page">
      <h1 class="page-title">Dashboard</h1>

      <!-- Stats -->
      <div v-if="loading" class="stats-grid">
        <div v-for="n in 3" :key="n" class="skeleton-stat" />
      </div>
      <div v-else class="stats-grid">
        <div class="stat-card stat-amber">
          <p class="stat-value">{{ stats.pendingRequests }}</p>
          <p class="stat-label">Pending Requests</p>
          <RouterLink to="/patient/requests" class="stat-link">View all →</RouterLink>
        </div>
        <div class="stat-card stat-teal">
          <p class="stat-value">{{ stats.activeRelationships }}</p>
          <p class="stat-label">Active Practitioners</p>
          <RouterLink to="/patient/relationships" class="stat-link">View all →</RouterLink>
        </div>
        <div class="stat-card stat-blue">
          <p class="stat-value">{{ stats.totalRecords }}</p>
          <p class="stat-label">Medical Records</p>
          <RouterLink to="/patient/records" class="stat-link">View all →</RouterLink>
        </div>
      </div>

      <!-- Quick actions -->
      <div class="quick-actions">
        <RouterLink to="/practitioners" class="btn btn-primary">Find a Practitioner</RouterLink>
        <RouterLink to="/patient/requests" class="btn btn-secondary">My Requests</RouterLink>
        <RouterLink to="/patient/records" class="btn btn-secondary">My Records</RouterLink>
      </div>

      <!-- Recent requests -->
      <section class="section">
        <h2 class="section-title">Recent Requests</h2>

        <div v-if="loading" class="skeleton-list">
          <div v-for="n in 3" :key="n" class="skeleton-row" />
        </div>

        <div v-else-if="!recentRequests.length" class="empty-hint">
          No requests yet.
          <RouterLink to="/practitioners">Find a practitioner</RouterLink> to get started.
        </div>

        <div v-else class="request-list">
          <div v-for="req in recentRequests" :key="req.id" class="request-row card">
            <div class="req-info">
              <p class="req-name">{{ req.practitionerName }}</p>
              <p class="req-spec text-muted">{{ req.specialization }}</p>
              <p class="req-msg text-muted">{{ req.message }}</p>
            </div>
            <div class="req-meta">
              <StatusBadge :status="req.status" />
              <p class="req-date text-muted">{{ fmt(req.createdAt) }}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  </AppLayout>
</template>

<style scoped>
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  padding: 20px 24px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
}
.stat-value  { font-size: 36px; font-weight: 700; line-height: 1; }
.stat-label  { font-size: 13px; color: var(--color-text-muted); margin-top: 6px; }
.stat-link   { font-size: 13px; font-weight: 500; color: inherit; opacity: 0.7; margin-top: 12px; display: block; }
.stat-link:hover { opacity: 1; }

.stat-amber { background: var(--color-warning-light); border-color: #FDE68A; color: #92400E; }
.stat-teal  { background: var(--color-primary-light); border-color: #99F6E4; color: var(--color-primary-dark); }
.stat-blue  { background: #EFF6FF; border-color: #BFDBFE; color: #1E40AF; }

.skeleton-stat {
  height: 110px;
  border-radius: var(--radius-lg);
  background: linear-gradient(90deg, var(--color-border) 25%, #eef2f7 50%, var(--color-border) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
}
@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

.quick-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 32px;
}

.section { margin-top: 8px; }
.section-title { font-size: 18px; font-weight: 600; margin-bottom: 16px; }

.skeleton-list { display: flex; flex-direction: column; gap: 10px; }
.skeleton-row {
  height: 72px;
  border-radius: var(--radius-lg);
  background: linear-gradient(90deg, var(--color-border) 25%, #eef2f7 50%, var(--color-border) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
}

.empty-hint { font-size: 14px; color: var(--color-text-muted); padding: 24px 0; }

.request-list { display: flex; flex-direction: column; gap: 10px; }
.request-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 20px;
}
.req-name { font-size: 15px; font-weight: 600; }
.req-spec  { font-size: 13px; margin-top: 2px; }
.req-msg   { font-size: 13px; margin-top: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 320px; }
.req-meta  { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; flex-shrink: 0; }
.req-date  { font-size: 12px; }
</style>
