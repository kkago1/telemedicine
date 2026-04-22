<script setup>
defineProps({
  title:       { type: String, required: true },
  message:     { type: String, default: '' },
  actionLabel: { type: String, default: '' },
  actionTo:    { type: String, default: '' },
})
</script>

<template>
  <div class="empty">
    <div class="empty-icon">○</div>
    <h3 class="empty-title">{{ title }}</h3>
    <p v-if="message" class="empty-message">{{ message }}</p>
    <RouterLink v-if="actionLabel && actionTo" :to="actionTo" class="btn btn-primary empty-btn">
      {{ actionLabel }}
    </RouterLink>
  </div>
</template>

<style scoped>
.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px 24px;
  text-align: center;
}

.empty-icon {
  font-size: 40px;
  color: var(--color-border);
  margin-bottom: 16px;
  line-height: 1;
}

.empty-title {
  font-size: 17px;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 8px;
}

.empty-message {
  font-size: 14px;
  color: var(--color-text-muted);
  max-width: 340px;
  line-height: 1.6;
}

.empty-btn {
  margin-top: 20px;
}
</style>
