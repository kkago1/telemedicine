<script setup>
import { ref, onMounted } from 'vue'
import AppNav from '@/components/AppNav.vue'
import PractitionerCard from '@/components/PractitionerCard.vue'
import { getPractitioners } from '@/api/profile'

const practitioners = ref([])
const loading = ref(true)
const error = ref(null)

onMounted(async () => {
  try {
    const result = await getPractitioners({ page: 1, limit: 6 })
    practitioners.value = result.data
  } catch {
    error.value = 'Could not load practitioners right now.'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div>
    <AppNav />

    <!-- Hero -->
    <section class="hero">
      <div class="hero-inner">
        <h1 class="hero-title">Quality healthcare,<br>wherever you are.</h1>
        <p class="hero-sub">
          Connect with verified medical practitioners for consultations,
          diagnoses, and ongoing care — all from your phone.
        </p>
        <div class="hero-actions">
          <RouterLink to="/practitioners" class="btn btn-white">
            Find a Practitioner
          </RouterLink>
          <RouterLink to="/register" class="btn btn-outline">
            Create an account
          </RouterLink>
        </div>
      </div>
    </section>

    <!-- Featured practitioners -->
    <section class="featured">
      <div class="featured-inner">
        <div class="featured-header">
          <div>
            <h2 class="section-title">Featured Practitioners</h2>
            <p class="section-sub">Verified and ready to help.</p>
          </div>
          <RouterLink to="/practitioners" class="btn btn-ghost view-all">
            View all →
          </RouterLink>
        </div>

        <div v-if="loading" class="skeleton-grid">
          <div v-for="n in 6" :key="n" class="skeleton-card" />
        </div>

        <p v-else-if="error" class="error-msg">{{ error }}</p>

        <div v-else-if="practitioners.length" class="practitioners-grid">
          <PractitionerCard
            v-for="p in practitioners"
            :key="p.id"
            :practitioner="p"
          />
        </div>

        <p v-else class="empty-msg">No practitioners available right now.</p>
      </div>
    </section>

    <!-- Value props -->
    <section class="values">
      <div class="values-inner">
        <div class="value-card">
          <div class="value-icon">✓</div>
          <h3>Verified Practitioners</h3>
          <p>Every practitioner is reviewed and KMPDC-licensed before joining.</p>
        </div>
        <div class="value-card">
          <div class="value-icon">🔒</div>
          <h3>Private & Secure</h3>
          <p>Your medical records and conversations are private and encrypted.</p>
        </div>
        <div class="value-card">
          <div class="value-icon">📋</div>
          <h3>Medical Records</h3>
          <p>Access your diagnoses, prescriptions, and notes in one place.</p>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="footer">
      <p>© 2026 TeleMed · Quality care, wherever you are.</p>
    </footer>
  </div>
</template>

<style scoped>
/* Hero */
.hero {
  background: linear-gradient(135deg, #0D9488 0%, #0F766E 100%);
  color: #fff;
  padding: 96px 24px;
}

.hero-inner {
  max-width: 720px;
  margin: 0 auto;
  text-align: center;
}

.hero-title {
  font-size: clamp(36px, 5vw, 56px);
  font-weight: 700;
  line-height: 1.15;
  letter-spacing: -0.5px;
}

.hero-sub {
  font-size: 18px;
  opacity: 0.88;
  margin-top: 16px;
  line-height: 1.6;
  max-width: 540px;
  margin-left: auto;
  margin-right: auto;
}

.hero-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 36px;
  flex-wrap: wrap;
}

.btn-white {
  background: #fff;
  color: var(--color-primary-dark);
  font-weight: 600;
  padding: 13px 28px;
  border-radius: var(--radius-md);
  font-size: 15px;
}

.btn-white:hover {
  background: #F0FDFB;
}

.btn-outline {
  background: transparent;
  color: #fff;
  border: 2px solid rgba(255, 255, 255, 0.55);
  font-weight: 600;
  padding: 11px 28px;
  border-radius: var(--radius-md);
  font-size: 15px;
}

.btn-outline:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.85);
}

/* Featured */
.featured {
  padding: 72px 24px;
  background: var(--color-bg-subtle);
}

.featured-inner {
  max-width: 1200px;
  margin: 0 auto;
}

.featured-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: 32px;
}

.section-title {
  font-size: 26px;
  font-weight: 700;
  color: var(--color-text);
}

.section-sub {
  font-size: 15px;
  color: var(--color-text-muted);
  margin-top: 4px;
}

.view-all {
  flex-shrink: 0;
}

.practitioners-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

/* Skeletons */
.skeleton-grid {
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

.error-msg {
  color: var(--color-error);
  font-size: 14px;
}

.empty-msg {
  color: var(--color-text-muted);
  font-size: 14px;
}

/* Value props */
.values {
  padding: 72px 24px;
  background: var(--color-bg);
}

.values-inner {
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 24px;
}

.value-card {
  padding: 28px 24px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  text-align: center;
}

.value-icon {
  font-size: 28px;
  margin-bottom: 12px;
}

.value-card h3 {
  font-size: 17px;
  font-weight: 600;
  margin-bottom: 8px;
  color: var(--color-text);
}

.value-card p {
  font-size: 14px;
  color: var(--color-text-muted);
  line-height: 1.6;
}

/* Footer */
.footer {
  background: var(--color-bg-subtle);
  border-top: 1px solid var(--color-border);
  text-align: center;
  padding: 24px;
  font-size: 13px;
  color: var(--color-text-muted);
}
</style>
