<script setup>
import { ref, onMounted } from 'vue'
import AppNav from '@/components/AppNav.vue'
import PractitionerCard from '@/components/PractitionerCard.vue'
import { getPractitioners } from '@/api/profile'

const practitioners = ref([])
const pagination = ref(null)
const loading = ref(true)
const error = ref(null)
const currentPage = ref(1)
const LIMIT = 12

async function loadPage(page) {
  loading.value = true
  error.value = null
  try {
    const result = await getPractitioners({ page, limit: LIMIT })
    practitioners.value = result.data
    pagination.value = result.pagination
    currentPage.value = page
  } catch {
    error.value = 'Could not load practitioners. Please try again.'
  } finally {
    loading.value = false
  }
}

onMounted(() => loadPage(1))
</script>

<template>
  <div>
    <AppNav />

    <div class="page">
      <div class="page-header">
        <h1 class="page-title">Find a Practitioner</h1>
        <p class="text-muted">Browse verified medical practitioners and request a consultation.</p>
      </div>

      <!-- Loading skeletons -->
      <div v-if="loading" class="grid">
        <div v-for="n in LIMIT" :key="n" class="skeleton-card" />
      </div>

      <!-- Error -->
      <div v-else-if="error" class="feedback-box error-box">
        <p>{{ error }}</p>
        <button class="btn btn-secondary" style="margin-top:12px" @click="loadPage(currentPage)">
          Try again
        </button>
      </div>

      <!-- Empty -->
      <div v-else-if="!practitioners.length" class="feedback-box">
        <p class="text-muted">No practitioners are available right now. Check back soon.</p>
      </div>

      <!-- Grid -->
      <div v-else class="grid">
        <PractitionerCard
          v-for="p in practitioners"
          :key="p.id"
          :practitioner="p"
        />
      </div>

      <!-- Pagination -->
      <div v-if="pagination && pagination.totalPages > 1" class="pagination">
        <button
          class="btn btn-secondary"
          :disabled="currentPage === 1 || loading"
          @click="loadPage(currentPage - 1)"
        >
          ← Previous
        </button>
        <span class="pagination-info">
          Page {{ currentPage }} of {{ pagination.totalPages }}
        </span>
        <button
          class="btn btn-secondary"
          :disabled="currentPage === pagination.totalPages || loading"
          @click="loadPage(currentPage + 1)"
        >
          Next →
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-header {
  margin-bottom: 32px;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.skeleton-card {
  height: 84px;
  border-radius: var(--radius-lg);
  background: linear-gradient(90deg, var(--color-border) 25%, #eef2f7 50%, var(--color-border) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.feedback-box {
  padding: 48px 24px;
  text-align: center;
}

.error-box {
  color: var(--color-error);
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-top: 40px;
}

.pagination-info {
  font-size: 14px;
  color: var(--color-text-muted);
  min-width: 120px;
  text-align: center;
}
</style>
