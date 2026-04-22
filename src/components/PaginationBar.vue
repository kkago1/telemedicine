<script setup>
defineProps({
  pagination: { type: Object, required: true }, // { page, pageSize, total, totalPages }
  loading:    { type: Boolean, default: false },
})

const emit = defineEmits(['page-change'])
</script>

<template>
  <div v-if="pagination.totalPages > 1" class="pagination">
    <button
      class="btn btn-secondary pg-btn"
      :disabled="pagination.page === 1 || loading"
      @click="emit('page-change', pagination.page - 1)"
    >
      ← Prev
    </button>

    <span class="pg-info">
      Page {{ pagination.page }} of {{ pagination.totalPages }}
      <span class="pg-total">({{ pagination.total }} total)</span>
    </span>

    <button
      class="btn btn-secondary pg-btn"
      :disabled="pagination.page === pagination.totalPages || loading"
      @click="emit('page-change', pagination.page + 1)"
    >
      Next →
    </button>
  </div>
</template>

<style scoped>
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-top: 32px;
}

.pg-btn {
  padding: 8px 16px;
  font-size: 14px;
}

.pg-info {
  font-size: 14px;
  color: var(--color-text-muted);
  min-width: 160px;
  text-align: center;
}

.pg-total {
  font-size: 12px;
  color: var(--color-text-muted);
  margin-left: 4px;
}
</style>
