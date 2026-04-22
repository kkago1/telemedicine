<script setup>
import { ref, onMounted } from 'vue'
import AppLayout from '@/components/AppLayout.vue'
import { getStats, getPractitioners } from '@/api/admin'

const stats = ref(null)
const loading = ref(true)

onMounted(async () => {
  const [statsResult, pendingResult] = await Promise.allSettled([
    getStats(),
    getPractitioners({ verificationStatus: 'PENDING', page: 1, limit: 1 }),
  ])

  if (statsResult.status === 'fulfilled') {
    stats.value = statsResult.value
  }
  if (pendingResult.status === 'fulfilled') {
    if (!stats.value) stats.value = {}
    stats.value.pendingPractitioners = pendingResult.value.pagination?.total ?? 0
  }

  loading.value = false
})
</script>

<template>
  <AppLayout>
    <div class="page">
      <h1 class="page-title">Admin Dashboard</h1>

      <div v-if="loading" class="stats-grid">
        <div v-for="n in 4" :key="n" class="skeleton-stat" />
      </div>

      <div v-else-if="stats" class="stats-grid">
        <div class="stat-card stat-blue">
          <p class="stat-value">{{ stats.totalUsers ?? '—' }}</p>
          <p class="stat-label">Total Users</p>
          <RouterLink to="/admin/users" class="stat-link">Manage →</RouterLink>
        </div>
        <div class="stat-card stat-teal">
          <p class="stat-value">{{ stats.totalPractitioners ?? '—' }}</p>
          <p class="stat-label">Practitioners</p>
          <RouterLink to="/admin/practitioners" class="stat-link">Manage →</RouterLink>
        </div>
        <div class="stat-card stat-amber">
          <p class="stat-value">{{ stats.pendingPractitioners ?? '—' }}</p>
          <p class="stat-label">Pending Verification</p>
          <RouterLink to="/admin/practitioners" class="stat-link">Review →</RouterLink>
        </div>
        <div class="stat-card stat-purple">
          <p class="stat-value">{{ stats.totalPatients ?? '—' }}</p>
          <p class="stat-label">Patients</p>
          <RouterLink to="/admin/users" class="stat-link">View →</RouterLink>
        </div>
      </div>

      <div v-else class="error-hint">Could not load statistics.</div>

      <div class="quick-actions">
        <RouterLink to="/admin/practitioners" class="btn btn-primary">Review Practitioners</RouterLink>
        <RouterLink to="/admin/users" class="btn btn-secondary">Manage Users</RouterLink>
      </div>
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
.stat-value { font-size: 36px; font-weight: 700; line-height: 1; }
.stat-label { font-size: 13px; color: var(--color-text-muted); margin-top: 6px; }
.stat-link  { font-size: 13px; font-weight: 500; color: inherit; opacity: 0.7; margin-top: 12px; display: block; }
.stat-link:hover { opacity: 1; }

.stat-blue   { background: #EFF6FF; border-color: #BFDBFE; color: #1E40AF; }
.stat-teal   { background: var(--color-primary-light); border-color: #99F6E4; color: var(--color-primary-dark); }
.stat-amber  { background: var(--color-warning-light); border-color: #FDE68A; color: #92400E; }
.stat-purple { background: #F3E8FF; border-color: #DDD6FE; color: #7E22CE; }

.skeleton-stat {
  height: 110px;
  border-radius: var(--radius-lg);
  background: linear-gradient(90deg, var(--color-border) 25%, #eef2f7 50%, var(--color-border) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
}
@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

.error-hint { font-size: 14px; color: var(--color-text-muted); margin-bottom: 24px; }

.quick-actions { display: flex; gap: 10px; flex-wrap: wrap; }
</style>
