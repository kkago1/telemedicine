<script setup>
defineProps({
  practitioner: { type: Object, required: true },
})

function initials(name) {
  if (!name) return '?'
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}
</script>

<template>
  <RouterLink :to="`/practitioners/${practitioner.id}`" class="pcard">
    <div class="pcard-avatar">{{ initials(practitioner.fullName) }}</div>
    <div class="pcard-body">
      <h3 class="pcard-name">{{ practitioner.fullName }}</h3>
      <p class="pcard-spec">{{ practitioner.specialization }}</p>
    </div>
    <span class="pcard-cta">View profile →</span>
  </RouterLink>
</template>

<style scoped>
.pcard {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 18px 20px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-bg);
  box-shadow: var(--shadow-sm);
  text-decoration: none;
  color: var(--color-text);
  transition: box-shadow 0.15s, transform 0.15s, border-color 0.15s;
}

.pcard:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
  border-color: var(--color-primary-light);
}

.pcard-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--color-primary-light);
  color: var(--color-primary-dark);
  font-size: 16px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.pcard-body {
  flex: 1;
  min-width: 0;
}

.pcard-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.pcard-spec {
  font-size: 13px;
  color: var(--color-text-muted);
  margin-top: 2px;
}

.pcard-cta {
  font-size: 13px;
  color: var(--color-primary);
  font-weight: 500;
  flex-shrink: 0;
}
</style>
