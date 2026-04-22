<script setup>
import { ref, onMounted } from 'vue'
import dayjs from 'dayjs'
import AppLayout from '@/components/AppLayout.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import { getIncomingRequests } from '@/api/consultations'
import { getRelationships } from '@/api/relationships'

const stats = ref({ pendingRequests: 0, activePatients: 0 })
const recentRequests = ref([])
const loading = ref(true)

onMounted(async () => {
  const [pendingResult, activeResult, recentResult] = await Promise.allSettled([
    getIncomingRequests({ status: 'PENDING', page: 1, limit: 1 }),
    getRelationships({ status: 'ACTIVE', page: 1, limit: 1 }),
    getIncomingRequests({ status: 'PENDING', page: 1, limit: 3 }),
  ])

  if (pendingResult.status === 'fulfilled')
    stats.value.pendingRequests = pendingResult.value.pagination?.total ?? 0
  if (activeResult.status === 'fulfilled')
    stats.value.activePatients = activeResult.value.pagination?.total ?? 0
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
        <div v-for="n in 2" :key="n" class="skeleton-stat" />
      </div>
      <div v-else class="stats-grid">
        <div class="stat-card stat-amber">
          <p class="stat-value">{{ stats.pendingRequests }}</p>
          <p class="stat-label">Pending Requests</p>
          <RouterLink to="/practitioner/requests" class="stat-link">Review →</RouterLink>
        </div>
        <div class="stat-card stat-teal">
          <p class="stat-value">{{ stats.activePatients }}</p>
          <p class="stat-label">Active Patients</p>
          <RouterLink to="/practitioner/patients" class="stat-link">View all →</RouterLink>
        </div>
      </div>

      <!-- Quick actions -->
      <div class="quick-actions">
        <RouterLink to="/practitioner/requests" class="btn btn-primary">Review Requests</RouterLink>
        <RouterLink to="/practitioner/patients" class="btn btn-secondary">My Patients</RouterLink>
      </div>

      <!-- Recent pending requests -->
      <section class="section">
        <h2 class="section-title">Pending Requests</h2>

        <div v-if="loading" class="skeleton-list">
          <div v-for="n in 3" :key="n" class="skeleton-row" />
        </div>

        <div v-else-if="!recentRequests.length" class="empty-hint">
          No pending requests at the moment.
        </div>

        <div v-else class="request-list">
          <div v-for="req in recentRequests" :key="req.id" class="request-row card">
            <div class="req-info">
              <p class="req-name">{{ req.patientName ?? 'Patient' }}</p>
              <p class="req-msg text-muted">{{ req.message }}</p>
            </div>
            <div class="req-meta">
              <StatusBadge :status="req.status" />
              <p class="req-date text-muted">{{ fmt(req.createdAt) }}</p>
            </div>
          </div>
        </div>

        <RouterLink
          v-if="recentRequests.length"
          to="/practitioner/requests"
          class="view-all-link"
        >
          View all requests →
        </RouterLink>
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

.request-list { display: flex; flex-direction: column; gap: 10px; margin-bottom: 16px; }
.request-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 20px;
}
.req-name { font-size: 15px; font-weight: 600; }
.req-msg   { font-size: 13px; margin-top: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 320px; }
.req-meta  { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; flex-shrink: 0; }
.req-date  { font-size: 12px; }

.view-all-link { font-size: 13px; font-weight: 500; color: var(--color-primary); }
.view-all-link:hover { text-decoration: underline; }
</style>
