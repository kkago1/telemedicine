<script setup>
defineProps({
  height:  { type: String, default: '80px' },
  radius:  { type: String, default: 'var(--radius-lg)' },
  count:   { type: Number, default: 1 },
})
</script>

<template>
  <div class="skeleton-group">
    <div
      v-for="n in count"
      :key="n"
      class="skeleton"
      :style="{ height, borderRadius: radius }"
    />
  </div>
</template>

<style scoped>
.skeleton-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.skeleton {
  width: 100%;
  background: linear-gradient(
    90deg,
    var(--color-border) 25%,
    #eef2f7 50%,
    var(--color-border) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
}

@keyframes shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
</style>
