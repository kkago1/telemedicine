<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppNav from '@/components/AppNav.vue'
import { getPractitioner } from '@/api/profile'
import { createRequest } from '@/api/connections'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const practitioner = ref(null)
const loading = ref(true)
const error = ref(null)

onMounted(async () => {
  try {
    practitioner.value = await getPractitioner(route.params.id)
  } catch (err) {
    error.value = err.response?.status === 404
      ? 'This practitioner could not be found.'
      : 'Could not load practitioner profile. Please try again.'
  } finally {
    loading.value = false
  }
})

function initials(name) {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

// Consultation request form
const formState = ref('idle') // idle | form | submitting | success
const requestMessage = ref('')
const requestError = ref('')
const messageError = ref('')

function openForm() {
  if (!auth.isAuthenticated) {
    router.push({ path: '/login', query: { redirect: route.fullPath } })
    return
  }
  formState.value = 'form'
  requestMessage.value = ''
  requestError.value = ''
  messageError.value = ''
}

async function submitRequest() {
  messageError.value = ''
  if (requestMessage.value.trim().length < 10) {
    messageError.value = 'Please describe your reason for connecting (at least 10 characters).'
    return
  }
  formState.value = 'submitting'
  requestError.value = ''
  try {
    await createRequest({
      practitionerId: practitioner.value.id,
      message: requestMessage.value.trim(),
    })
    formState.value = 'success'
  } catch (err) {
    requestError.value =
      err.response?.data?.error?.message
      ?? 'Could not send request. Please try again.'
    formState.value = 'form'
  }
}
</script>

<template>
  <div>
    <AppNav />

    <div class="page">
      <RouterLink to="/practitioners" class="back-link">← All Practitioners</RouterLink>

      <!-- Loading -->
      <div v-if="loading" class="skeleton-wrapper">
        <div class="skeleton skeleton-header" />
        <div class="skeleton skeleton-body" />
      </div>

      <!-- Error -->
      <div v-else-if="error" class="feedback-box">
        <p class="error-text">{{ error }}</p>
        <RouterLink to="/practitioners" class="btn btn-secondary" style="margin-top:12px;">
          Back to directory
        </RouterLink>
      </div>

      <!-- Profile -->
      <template v-else-if="practitioner">
        <div class="profile-header card">
          <div class="profile-avatar">{{ initials(practitioner.fullName) }}</div>
          <div class="profile-meta">
            <h1 class="profile-name">{{ practitioner.fullName }}</h1>
            <p class="profile-spec">{{ practitioner.specialization }}</p>
            <span class="verified-badge">✓ KMPDC Verified</span>
          </div>
        </div>

        <div class="detail-grid">
          <div class="card detail-card">
            <h2 class="detail-title">About</h2>
            <div class="detail-row">
              <span class="detail-label">Specialization</span>
              <span class="detail-value">{{ practitioner.specialization }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">License</span>
              <span class="detail-value">{{ practitioner.licenseNumber }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Status</span>
              <span class="detail-value status-active">Active &amp; Available</span>
            </div>
          </div>

          <!-- CTA card -->
          <div class="card cta-card">
            <!-- Unauthenticated -->
            <template v-if="!auth.isAuthenticated">
              <h2 class="detail-title">Request a Connection</h2>
              <p class="cta-desc">Sign in to send a connection request to {{ practitioner.fullName }}.</p>
              <button class="btn btn-primary cta-btn" @click="openForm">Sign in to request</button>
            </template>

            <!-- Wrong role -->
            <template v-else-if="auth.role !== 'PATIENT'">
              <h2 class="detail-title">Connection Requests</h2>
              <p class="text-muted" style="font-size:13px; margin-top:8px;">
                Connection requests are available to patients only.
              </p>
            </template>

            <!-- Patient — idle -->
            <template v-else-if="formState === 'idle'">
              <h2 class="detail-title">Request a Connection</h2>
              <p class="cta-desc">
                Send a connection request to {{ practitioner.fullName }}.
                They'll review it and get back to you.
              </p>
              <button class="btn btn-primary cta-btn" @click="openForm">Request Connection</button>
            </template>

            <!-- Patient — form -->
            <template v-else-if="formState === 'form' || formState === 'submitting'">
              <h2 class="detail-title">Request a Connection</h2>
              <div class="form-group" style="margin-top:16px;">
                <label class="form-label" for="req-message">Describe your reason</label>
                <textarea
                  id="req-message"
                  v-model="requestMessage"
                  class="form-input req-textarea"
                  :class="{ 'is-error': messageError }"
                  placeholder="Briefly explain what you'd like to consult about…"
                  rows="4"
                  :disabled="formState === 'submitting'"
                />
                <span v-if="messageError" class="form-error">{{ messageError }}</span>
              </div>
              <div v-if="requestError" class="alert alert-error" style="margin-top:12px;">{{ requestError }}</div>
              <div class="form-actions">
                <button
                  class="btn btn-secondary"
                  :disabled="formState === 'submitting'"
                  @click="formState = 'idle'"
                >
                  Cancel
                </button>
                <button
                  class="btn btn-primary"
                  :disabled="formState === 'submitting'"
                  @click="submitRequest"
                >
                  {{ formState === 'submitting' ? 'Sending…' : 'Send Request' }}
                </button>
              </div>
            </template>

            <!-- Patient — success -->
            <template v-else-if="formState === 'success'">
              <div class="success-state">
                <div class="success-icon">✓</div>
                <h2 class="detail-title" style="margin-top:12px;">Request sent!</h2>
                <p class="cta-desc">
                  Your connection request has been sent to {{ practitioner.fullName }}.
                  You can track its status in your dashboard.
                </p>
                <RouterLink to="/patient/requests" class="btn btn-ghost" style="margin-top:8px; width:100%; justify-content:center;">
                  View my requests →
                </RouterLink>
              </div>
            </template>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.back-link {
  display: inline-block;
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-muted);
  margin-bottom: 24px;
  transition: color 0.15s;
}
.back-link:hover { color: var(--color-primary); }

.profile-header {
  display: flex;
  align-items: center;
  gap: 24px;
  margin-bottom: 24px;
}
.profile-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: var(--color-primary-light);
  color: var(--color-primary-dark);
  font-size: 28px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.profile-name  { font-size: 24px; font-weight: 700; }
.profile-spec  { font-size: 15px; color: var(--color-text-muted); margin-top: 4px; }
.verified-badge {
  display: inline-block;
  margin-top: 10px;
  font-size: 12px;
  font-weight: 600;
  color: var(--color-primary-dark);
  background: var(--color-primary-light);
  padding: 3px 10px;
  border-radius: 999px;
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 20px;
  align-items: start;
}
@media (max-width: 768px) { .detail-grid { grid-template-columns: 1fr; } }

.detail-title { font-size: 16px; font-weight: 600; margin-bottom: 16px; }
.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 16px;
  padding: 10px 0;
  border-bottom: 1px solid var(--color-border);
}
.detail-row:last-child { border-bottom: none; }
.detail-label { font-size: 13px; color: var(--color-text-muted); flex-shrink: 0; }
.detail-value { font-size: 14px; font-weight: 500; text-align: right; }
.status-active { color: var(--color-success); }

.cta-desc { font-size: 14px; color: var(--color-text-muted); line-height: 1.6; margin-bottom: 20px; }
.cta-btn { width: 100%; padding: 12px; font-size: 15px; }

.req-textarea { resize: vertical; min-height: 100px; }
.form-actions { display: flex; gap: 10px; margin-top: 16px; justify-content: flex-end; }

.alert { padding: 10px 14px; border-radius: var(--radius-md); font-size: 14px; }
.alert-error { background: var(--color-error-light); color: var(--color-error); border: 1px solid #FECACA; }

.success-state { text-align: center; }
.success-icon {
  width: 48px; height: 48px; border-radius: 50%;
  background: var(--color-success-light); color: #15803D;
  font-size: 22px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto;
}

.skeleton-wrapper { display: flex; flex-direction: column; gap: 20px; }
.skeleton {
  border-radius: var(--radius-lg);
  background: linear-gradient(90deg, var(--color-border) 25%, #eef2f7 50%, var(--color-border) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
}
.skeleton-header { height: 140px; }
.skeleton-body   { height: 280px; }
@keyframes shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.feedback-box { padding: 48px 24px; text-align: center; }
.error-text { color: var(--color-error); font-size: 15px; }
</style>
