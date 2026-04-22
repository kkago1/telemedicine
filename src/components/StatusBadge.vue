<script setup>
defineProps({
  status: { type: String, required: true },
})

const MAP = {
  // Consultation
  PENDING:     { label: 'Pending',     color: 'amber' },
  ACCEPTED:    { label: 'Accepted',    color: 'green' },
  REJECTED:    { label: 'Rejected',    color: 'red' },
  CANCELLED:   { label: 'Cancelled',   color: 'gray' },
  // Relationship
  ACTIVE:      { label: 'Active',      color: 'green' },
  TERMINATED:  { label: 'Terminated',  color: 'gray' },
  // Verification
  APPROVED:    { label: 'Approved',    color: 'green' },
  // Record types
  NOTE:         { label: 'Note',         color: 'blue' },
  DIAGNOSIS:    { label: 'Diagnosis',    color: 'amber' },
  PRESCRIPTION: { label: 'Prescription', color: 'teal' },
  LAB_RESULT:   { label: 'Lab Result',   color: 'purple' },
}
</script>

<template>
  <span class="badge" :class="MAP[status]?.color ?? 'gray'">
    {{ MAP[status]?.label ?? status }}
  </span>
</template>

<style scoped>
.badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
}

.badge.green  { background: var(--color-success-light); color: #15803D; }
.badge.amber  { background: var(--color-warning-light); color: #92400E; }
.badge.red    { background: var(--color-error-light);   color: var(--color-error); }
.badge.gray   { background: var(--color-bg-subtle);     color: var(--color-text-muted); border: 1px solid var(--color-border); }
.badge.blue   { background: #EFF6FF; color: #1E40AF; }
.badge.teal   { background: var(--color-primary-light); color: var(--color-primary-dark); }
.badge.purple { background: #F3E8FF; color: #7E22CE; }
</style>
