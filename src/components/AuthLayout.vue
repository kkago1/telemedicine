<template>
  <div class="auth-shell">
    <RouterLink to="/" class="brand-logo">TeleMed</RouterLink>
    <p class="brand-tagline">Quality healthcare, wherever you are.</p>
    <div class="card auth-card">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.auth-shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: var(--color-bg-subtle);
  padding: 24px;
  gap: 8px;
}

.brand-logo {
  font-size: 26px;
  font-weight: 700;
  color: var(--color-primary);
  letter-spacing: -0.5px;
  text-decoration: none;
}

.brand-tagline {
  color: var(--color-text-muted);
  font-size: 14px;
  margin-bottom: 12px;
}

.auth-card {
  width: 100%;
  max-width: 440px;
}
</style>
