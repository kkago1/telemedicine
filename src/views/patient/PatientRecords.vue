<script setup>
import { ref, watch, onMounted, computed } from 'vue'
import dayjs from 'dayjs'
import AppLayout from '@/components/AppLayout.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import PaginationBar from '@/components/PaginationBar.vue'
import LoadingSkeleton from '@/components/LoadingSkeleton.vue'
import EmptyState from '@/components/EmptyState.vue'
import { getMyRecords } from '@/api/records'

const TYPES = ['ALL', 'NOTE', 'DIAGNOSIS', 'PRESCRIPTION', 'LAB_RESULT']
const TYPE_LABELS = {
  ALL: 'All',
  NOTE: 'Note',
  DIAGNOSIS: 'Diagnosis',
  PRESCRIPTION: 'Prescription',
  LAB_RESULT: 'Lab Result',
}

const selectedType = ref('ALL')
const records = ref([])
const pagination = ref(null)
const loading = ref(true)
const error = ref(null)
const expandedId = ref(null)

const apiParams = computed(() => {
  const p = { page: 1, limit: 10 }
  if (selectedType.value !== 'ALL') p.recordType = selectedType.value
  return p
})

async function loadPage(page = 1) {
  loading.value = true
  error.value = null
  try {
    const params = { ...apiParams.value, page }
    const result = await getMyRecords(params)
    records.value = result.data
    pagination.value = result.pagination
  } catch {
    error.value = 'Could not load records. Please try again.'
  } finally {
    loading.value = false
  }
}

watch(selectedType, () => loadPage(1))
onMounted(() => loadPage(1))

function fmt(date) {
  return dayjs(date).format('MMM D, YYYY')
}

function toggleExpand(id) {
  expandedId.value = expandedId.value === id ? null : id
}
</script>

<template>
  <AppLayout>
    <div class="page">
      <h1 class="page-title">My Medical Records</h1>

      <!-- Filter chips -->
      <div class="filter-row">
        <button
          v-for="type in TYPES"
          :key="type"
          class="chip"
          :class="{ active: selectedType === type }"
          @click="selectedType = type"
        >
          {{ TYPE_LABELS[type] }}
        </button>
      </div>

      <LoadingSkeleton v-if="loading" height="88px" :count="5" />

      <div v-else-if="error" class="error-box">
        <p>{{ error }}</p>
        <button class="btn btn-secondary" style="margin-top:12px;" @click="loadPage(1)">Try again</button>
      </div>

      <EmptyState
        v-else-if="!records.length"
        :title="selectedType === 'ALL' ? 'No medical records yet' : `No ${TYPE_LABELS[selectedType].toLowerCase()} records`"
        :message="selectedType === 'ALL' ? 'Medical records created by your practitioners will appear here.' : ''"
      />

      <div v-else class="record-list">
        <div
          v-for="rec in records"
          :key="rec.id"
          class="record-card card"
          :class="{ expanded: expandedId === rec.id }"
        >
          <div class="rec-header" @click="toggleExpand(rec.id)">
            <div class="rec-main">
              <div class="rec-type-icon" :class="`type-${rec.recordType?.toLowerCase()}`">
                {{ rec.recordType?.[0] ?? '?' }}
              </div>
              <div class="rec-info">
                <p class="rec-title">{{ rec.title }}</p>
                <p class="rec-meta">
                  By {{ rec.practitionerName ?? 'Practitioner' }} · {{ fmt(rec.createdAt) }}
                </p>
              </div>
            </div>
            <div class="rec-side">
              <StatusBadge :status="rec.recordType" />
              <span class="expand-icon">{{ expandedId === rec.id ? '▲' : '▼' }}</span>
            </div>
          </div>

          <div v-if="expandedId === rec.id" class="rec-body">
            <p class="rec-description">{{ rec.description }}</p>
            <a
              v-if="rec.attachmentUrl"
              :href="rec.attachmentUrl"
              target="_blank"
              rel="noopener"
              class="attachment-link"
            >
              View Attachment →
            </a>
          </div>
        </div>
      </div>

      <PaginationBar v-if="pagination" :pagination="pagination" :loading="loading" @page-change="loadPage" />
    </div>
  </AppLayout>
</template>

<style scoped>
.filter-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 24px;
}

.chip {
  padding: 6px 16px;
  border-radius: 999px;
  border: 1px solid var(--color-border);
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-muted);
  background: var(--color-surface);
  cursor: pointer;
  transition: all 0.15s;
}
.chip:hover { border-color: var(--color-primary); color: var(--color-primary); }
.chip.active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: #fff;
}

.error-box { color: var(--color-error); font-size: 14px; }

.record-list { display: flex; flex-direction: column; gap: 10px; }

.record-card {
  padding: 0;
  overflow: hidden;
  transition: box-shadow 0.15s;
}

.rec-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 20px;
  cursor: pointer;
  user-select: none;
}
.rec-header:hover { background: var(--color-surface); }

.rec-main { display: flex; align-items: center; gap: 14px; flex: 1; min-width: 0; }

.rec-type-icon {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  font-size: 15px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  text-transform: uppercase;
}

.type-note         { background: #EFF6FF; color: #1E40AF; }
.type-diagnosis    { background: #FEF3C7; color: #92400E; }
.type-prescription { background: var(--color-primary-light); color: var(--color-primary-dark); }
.type-lab_result   { background: #F3E8FF; color: #7E22CE; }

.rec-info { flex: 1; min-width: 0; }
.rec-title { font-size: 15px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.rec-meta  { font-size: 12px; color: var(--color-text-muted); margin-top: 3px; }

.rec-side { display: flex; align-items: center; gap: 12px; flex-shrink: 0; }
.expand-icon { font-size: 10px; color: var(--color-text-muted); }

.rec-body {
  padding: 0 20px 18px 74px;
  border-top: 1px solid var(--color-border);
  padding-top: 14px;
}
.rec-description {
  font-size: 14px;
  line-height: 1.65;
  color: var(--color-text);
  white-space: pre-wrap;
}
.attachment-link {
  display: inline-block;
  margin-top: 10px;
  font-size: 13px;
  font-weight: 500;
  color: var(--color-primary);
}
.attachment-link:hover { text-decoration: underline; }
</style>
