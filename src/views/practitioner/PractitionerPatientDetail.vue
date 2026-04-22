<script setup>
import { ref, watch, onMounted, computed } from "vue";
import { useRoute } from "vue-router";
import dayjs from "dayjs";
import AppLayout from "@/components/AppLayout.vue";
import StatusBadge from "@/components/StatusBadge.vue";
import PaginationBar from "@/components/PaginationBar.vue";
import LoadingSkeleton from "@/components/LoadingSkeleton.vue";
import EmptyState from "@/components/EmptyState.vue";
import MedicalRecordForm from "@/components/MedicalRecordForm.vue";
import { getRelationship } from "@/api/relationships";
import { getPatientRecords } from "@/api/records";

const route = useRoute();

const TYPES = ["ALL", "NOTE", "DIAGNOSIS", "PRESCRIPTION", "LAB_RESULT"];
const TYPE_LABELS = {
  ALL: "All",
  NOTE: "Note",
  DIAGNOSIS: "Diagnosis",
  PRESCRIPTION: "Prescription",
  LAB_RESULT: "Lab Result",
};

// Relationship + patient data
const relationship = ref(null);
const relLoading = ref(true);
const relError = ref(null);

// Records state
const records = ref([]);
const pagination = ref(null);
const recordsLoading = ref(false);
const recordsError = ref(null);
const selectedType = ref("ALL");

// Form state
const showCreateForm = ref(false);
const editingRecord = ref(null);
const expandedId = ref(null);

const patientId = computed(() => relationship.value?.patientId ?? null);
const patientName = computed(
  () => relationship.value?.patient.fullName ?? "Patient",
);

onMounted(async () => {
  try {
    relationship.value = await getRelationship(route.params.id);
  } catch {
    relError.value = "Could not load patient information.";
  } finally {
    relLoading.value = false;
  }
});

watch(patientId, (id) => {
  if (id) loadRecords(1);
});

watch(selectedType, () => loadRecords(1));

async function loadRecords(page = 1) {
  if (!patientId.value) return;
  recordsLoading.value = true;
  recordsError.value = null;
  try {
    const params = { page, limit: 10 };
    if (selectedType.value !== "ALL") params.recordType = selectedType.value;
    const result = await getPatientRecords(patientId.value, params);
    records.value = result.data;
    pagination.value = result.pagination;
  } catch {
    recordsError.value = "Could not load medical records.";
  } finally {
    recordsLoading.value = false;
  }
}

function handleSaved() {
  showCreateForm.value = false;
  editingRecord.value = null;
  loadRecords(1);
}

function startEdit(rec) {
  editingRecord.value = rec;
  showCreateForm.value = false;
  expandedId.value = null;
}

function cancelEdit() {
  editingRecord.value = null;
}

function toggleExpand(id) {
  if (editingRecord.value?.id === id) return;
  expandedId.value = expandedId.value === id ? null : id;
}

function fmt(date) {
  return dayjs(date).format("MMM D, YYYY");
}
</script>

<template>
  <AppLayout>
    <div class="page">
      <!-- Back link -->
      <RouterLink to="/practitioner/patients" class="back-link"
        >← My Patients</RouterLink
      >

      <!-- Patient info card -->
      <div v-if="relLoading" class="skeleton-patient" />

      <div v-else-if="relError" class="error-box">{{ relError }}</div>

      <div v-else class="patient-card card">
        <div class="patient-main">
          <div class="patient-avatar">
            {{ patientName[0].toUpperCase() }}
          </div>
          <div class="patient-info">
            <h1 class="patient-name">{{ patientName }}</h1>
            <p class="patient-since text-muted">
              Since {{ fmt(relationship.startedAt) }}
            </p>
          </div>
        </div>
        <StatusBadge :status="relationship.status" />
      </div>

      <!-- Records section -->
      <section class="section">
        <div class="section-header">
          <h2 class="section-title">Medical Records</h2>
          <button
            v-if="relationship && !showCreateForm"
            class="btn btn-primary"
            @click="
              showCreateForm = true;
              editingRecord = null;
            "
          >
            + Add Record
          </button>
        </div>

        <!-- Create form -->
        <MedicalRecordForm
          v-if="showCreateForm && patientId"
          :patient-id="patientId"
          :relationship-id="route.params.id"
          @saved="handleSaved"
          @cancel="showCreateForm = false"
        />

        <!-- Type filter chips -->
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

        <LoadingSkeleton v-if="recordsLoading" height="88px" :count="5" />

        <div v-else-if="recordsError" class="error-box">
          <p>{{ recordsError }}</p>
          <button
            class="btn btn-secondary"
            style="margin-top: 12px"
            @click="loadRecords(1)"
          >
            Try again
          </button>
        </div>

        <EmptyState
          v-else-if="!records.length"
          :title="
            selectedType === 'ALL'
              ? 'No records yet'
              : `No ${TYPE_LABELS[selectedType].toLowerCase()} records`
          "
          :message="
            selectedType === 'ALL'
              ? 'Use the button above to create the first medical record for this patient.'
              : ''
          "
        />

        <div v-else class="record-list">
          <!-- Edit form inline -->
          <template v-for="rec in records" :key="rec.id">
            <MedicalRecordForm
              v-if="editingRecord?.id === rec.id && patientId"
              :patient-id="patientId"
              :relationship-id="route.params.id"
              :initial="rec"
              @saved="handleSaved"
              @cancel="cancelEdit"
            />

            <div v-else class="record-card card">
              <div class="rec-header" @click="toggleExpand(rec.id)">
                <div class="rec-main">
                  <div
                    class="rec-type-icon"
                    :class="`type-${rec.recordType?.toLowerCase()}`"
                  >
                    {{ rec.recordType?.[0] ?? "?" }}
                  </div>
                  <div class="rec-info">
                    <p class="rec-title">{{ rec.title }}</p>
                    <p class="rec-meta">{{ fmt(rec.createdAt) }}</p>
                  </div>
                </div>
                <div class="rec-side">
                  <StatusBadge :status="rec.recordType" />
                  <button
                    class="btn btn-ghost edit-btn"
                    @click.stop="startEdit(rec)"
                  >
                    Edit
                  </button>
                  <span class="expand-icon">{{
                    expandedId === rec.id ? "▲" : "▼"
                  }}</span>
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
          </template>
        </div>

        <PaginationBar
          v-if="pagination"
          :pagination="pagination"
          :loading="recordsLoading"
          @page-change="loadRecords"
        />
      </section>
    </div>
  </AppLayout>
</template>

<style scoped>
.back-link {
  display: inline-block;
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-muted);
  margin-bottom: 20px;
}
.back-link:hover {
  color: var(--color-primary);
}

.skeleton-patient {
  height: 88px;
  border-radius: var(--radius-lg);
  background: linear-gradient(
    90deg,
    var(--color-border) 25%,
    #eef2f7 50%,
    var(--color-border) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
  margin-bottom: 32px;
}
@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

.error-box {
  color: var(--color-error);
  font-size: 14px;
  margin-bottom: 24px;
}

.patient-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 20px 24px;
  margin-bottom: 32px;
}

.patient-main {
  display: flex;
  align-items: center;
  gap: 16px;
}

.patient-avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--color-primary-light);
  color: var(--color-primary-dark);
  font-size: 22px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.patient-name {
  font-size: 20px;
  font-weight: 700;
}
.patient-since {
  font-size: 13px;
  margin-top: 3px;
}

.section {
  margin-top: 0;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}
.section-title {
  font-size: 18px;
  font-weight: 600;
}

.filter-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 20px;
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
.chip:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}
.chip.active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: #fff;
}

.record-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.record-card {
  padding: 0;
  overflow: hidden;
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
.rec-header:hover {
  background: var(--color-surface);
}

.rec-main {
  display: flex;
  align-items: center;
  gap: 14px;
  flex: 1;
  min-width: 0;
}

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
.type-note {
  background: #eff6ff;
  color: #1e40af;
}
.type-diagnosis {
  background: #fef3c7;
  color: #92400e;
}
.type-prescription {
  background: var(--color-primary-light);
  color: var(--color-primary-dark);
}
.type-lab_result {
  background: #f3e8ff;
  color: #7e22ce;
}

.rec-info {
  flex: 1;
  min-width: 0;
}
.rec-title {
  font-size: 15px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.rec-meta {
  font-size: 12px;
  color: var(--color-text-muted);
  margin-top: 3px;
}

.rec-side {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}
.edit-btn {
  padding: 4px 12px;
  font-size: 13px;
}
.expand-icon {
  font-size: 10px;
  color: var(--color-text-muted);
}

.rec-body {
  padding: 14px 20px 18px 74px;
  border-top: 1px solid var(--color-border);
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
.attachment-link:hover {
  text-decoration: underline;
}
</style>
