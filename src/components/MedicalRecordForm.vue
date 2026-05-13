<script setup>
import { ref, computed } from 'vue'
import { createRecord, updateRecord } from '@/api/records'

const props = defineProps({
  patientId: { type: String, required: true },
  relationshipId: { type: String, required: true },
  initial: { type: Object, default: null },
})

const emit = defineEmits(['saved', 'cancel'])

const RECORD_TYPES = ['NOTE', 'DIAGNOSIS', 'PRESCRIPTION', 'LAB_RESULT']
const TYPE_LABELS = {
  NOTE: 'Note',
  DIAGNOSIS: 'Diagnosis',
  PRESCRIPTION: 'Prescription',
  LAB_RESULT: 'Lab Result',
}

const isEdit = computed(() => !!props.initial)

const recordType = ref(props.initial?.recordType ?? 'NOTE')
const title = ref(props.initial?.title ?? '')
const description = ref(props.initial?.description ?? '')
const attachmentUrl = ref(props.initial?.attachmentUrl ?? '')

const saving = ref(false)
const error = ref(null)

async function handleSubmit() {
  if (!title.value.trim() || !description.value.trim()) {
    error.value = 'Title and description are required.'
    return
  }
  saving.value = true
  error.value = null
  try {
    let record
    if (isEdit.value) {
      record = await updateRecord(props.initial.id, {
        title: title.value.trim(),
        description: description.value.trim(),
        attachmentUrl: attachmentUrl.value.trim() || undefined,
      })
    } else {
      record = await createRecord({
        patientId: props.patientId,
        relationshipId: props.relationshipId,
        recordType: recordType.value,
        title: title.value.trim(),
        description: description.value.trim(),
        attachmentUrl: attachmentUrl.value.trim() || undefined,
      })
    }
    emit('saved', record)
  } catch (err) {
    error.value = err.response?.data?.error?.message ?? 'Could not save record.'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="record-form card">
    <h3 class="form-heading">{{ isEdit ? 'Edit Record' : 'New Medical Record' }}</h3>

    <div v-if="error" class="form-error-banner">{{ error }}</div>

    <div class="form-group">
      <label class="form-label">Record Type</label>
      <select v-model="recordType" class="form-input" :disabled="isEdit">
        <option v-for="t in RECORD_TYPES" :key="t" :value="t">{{ TYPE_LABELS[t] }}</option>
      </select>
    </div>

    <div class="form-group">
      <label class="form-label">Title</label>
      <input v-model="title" class="form-input" type="text" placeholder="e.g. Hypertension diagnosis" />
    </div>

    <div class="form-group">
      <label class="form-label">Description</label>
      <textarea v-model="description" class="form-input form-textarea" rows="4" placeholder="Detailed notes..." />
    </div>

    <div class="form-group">
      <label class="form-label">Attachment URL <span class="optional">(optional)</span></label>
      <input v-model="attachmentUrl" class="form-input" type="url" placeholder="https://..." />
    </div>

    <div class="form-actions">
      <button class="btn btn-secondary" :disabled="saving" @click="emit('cancel')">Cancel</button>
      <button class="btn btn-primary" :disabled="saving" @click="handleSubmit">
        {{ saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Record' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.record-form {
  padding: 24px;
  margin-bottom: 20px;
}

.form-heading {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 20px;
}

.form-error-banner {
  background: #FEF2F2;
  border: 1px solid #FECACA;
  color: var(--color-error);
  font-size: 13px;
  padding: 10px 14px;
  border-radius: var(--radius-sm);
  margin-bottom: 16px;
}

.form-textarea { resize: vertical; min-height: 96px; }

.optional { font-weight: 400; color: var(--color-text-muted); }

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 8px;
}
</style>
