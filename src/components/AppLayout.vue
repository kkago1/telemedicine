<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppNav from '@/components/AppNav.vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const route = useRoute()

const navLinks = computed(() => {
  if (auth.role === 'PATIENT') {
    return [
      { label: 'Dashboard',         to: '/patient/dashboard' },
      { label: 'My Requests',       to: '/patient/requests' },
      { label: 'My Practitioners',       to: '/patient/relationships' },
      { label: 'Medical Records',        to: '/patient/records' },
      { label: 'Consultation Requests',  to: '/patient/consultation-requests' },
      { label: 'My Consultations',       to: '/patient/consultations' },
    ]
  }
  if (auth.role === 'PRACTITIONER') {
    return [
      { label: 'Dashboard',         to: '/practitioner/dashboard' },
      { label: 'Incoming Requests',      to: '/practitioner/requests' },
      { label: 'My Patients',            to: '/practitioner/patients' },
      { label: 'Consultation Requests',  to: '/practitioner/consultation-requests' },
      { label: 'My Consultations',       to: '/practitioner/consultations' },
    ]
  }
  if (auth.role === 'ADMIN') {
    return [
      { label: 'Dashboard',         to: '/admin/dashboard' },
      { label: 'Practitioners',     to: '/admin/practitioners' },
      { label: 'Users',             to: '/admin/users' },
    ]
  }
  return []
})

function isActive(to) {
  return route.path === to || route.path.startsWith(to + '/')
}
</script>

<template>
  <div class="app-shell">
    <AppNav />

    <div class="app-body">
      <aside class="sidebar">
        <div class="sidebar-user">
          <div class="user-avatar">{{ (auth.fullName ?? auth.user?.phoneNumber ?? '?')[0].toUpperCase() }}</div>
          <div class="user-info">
            <p class="user-name">{{ auth.fullName ?? 'Account' }}</p>
            <p class="user-role">{{ auth.role }}</p>
          </div>
        </div>

        <nav class="sidebar-nav">
          <RouterLink
            v-for="link in navLinks"
            :key="link.to"
            :to="link.to"
            class="sidebar-link"
            :class="{ active: isActive(link.to) }"
          >
            {{ link.label }}
          </RouterLink>
        </nav>
      </aside>

      <main class="main-content">
        <slot />
      </main>
    </div>
  </div>
</template>

<style scoped>
.app-shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--color-bg-subtle);
}

.app-body {
  display: flex;
  flex: 1;
  max-width: 1400px;
  width: 100%;
  margin: 0 auto;
  padding: 24px 24px 48px;
  gap: 24px;
}

/* Sidebar */
.sidebar {
  width: 220px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: sticky;
  top: 88px; /* below AppNav (64px) + 24px gap */
  align-self: flex-start;
}

.sidebar-user {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}

.user-avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: var(--color-primary);
  color: #fff;
  font-size: 16px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.user-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-role {
  font-size: 11px;
  font-weight: 500;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-top: 2px;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 2px;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 8px;
  box-shadow: var(--shadow-sm);
}

.sidebar-link {
  display: block;
  padding: 9px 12px;
  border-radius: var(--radius-md);
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-muted);
  text-decoration: none;
  transition: background 0.12s, color 0.12s;
}

.sidebar-link:hover {
  background: var(--color-bg-subtle);
  color: var(--color-text);
}

.sidebar-link.active {
  background: var(--color-primary-light);
  color: var(--color-primary-dark);
  font-weight: 600;
}

/* Main content */
.main-content {
  flex: 1;
  min-width: 0;
}

/* Mobile: collapse sidebar to top */
@media (max-width: 768px) {
  .app-body {
    flex-direction: column;
    padding: 16px;
  }

  .sidebar {
    width: 100%;
    position: static;
  }

  .sidebar-nav {
    flex-direction: row;
    flex-wrap: wrap;
    gap: 4px;
  }

  .sidebar-link {
    flex: 1;
    min-width: max-content;
    text-align: center;
    font-size: 13px;
    padding: 8px 10px;
  }
}
</style>
