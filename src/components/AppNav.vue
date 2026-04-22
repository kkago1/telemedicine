<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()
const menuOpen = ref(false)

function logout() {
  menuOpen.value = false
  auth.logout()
  router.push('/')
}

function closeMenu() {
  menuOpen.value = false
}
</script>

<template>
  <header class="nav">
    <div class="nav-inner">
      <RouterLink to="/" class="nav-logo" @click="closeMenu">TeleMed</RouterLink>

      <!-- Desktop nav -->
      <nav class="nav-links desktop-only">
        <RouterLink to="/practitioners" class="nav-link">Browse Practitioners</RouterLink>
      </nav>

      <div class="nav-actions desktop-only">
        <template v-if="!auth.isAuthenticated">
          <RouterLink to="/login" class="btn btn-ghost nav-btn">Log in</RouterLink>
          <RouterLink to="/register" class="btn btn-primary nav-btn">Sign up</RouterLink>
        </template>
        <template v-else>
          <RouterLink :to="auth.dashboardPath" class="btn btn-ghost nav-btn">My Dashboard</RouterLink>
          <button class="btn btn-secondary nav-btn" @click="logout">Log out</button>
        </template>
      </div>

      <!-- Hamburger button (mobile only) -->
      <button
        class="hamburger mobile-only"
        :aria-expanded="menuOpen"
        aria-label="Toggle menu"
        @click="menuOpen = !menuOpen"
      >
        <span class="bar" :class="{ open: menuOpen }" />
        <span class="bar" :class="{ open: menuOpen }" />
        <span class="bar" :class="{ open: menuOpen }" />
      </button>
    </div>

    <!-- Mobile dropdown -->
    <div v-if="menuOpen" class="mobile-menu mobile-only">
      <RouterLink to="/practitioners" class="mobile-link" @click="closeMenu">
        Browse Practitioners
      </RouterLink>
      <div class="mobile-divider" />
      <template v-if="!auth.isAuthenticated">
        <RouterLink to="/login" class="mobile-link" @click="closeMenu">Log in</RouterLink>
        <RouterLink to="/register" class="mobile-link mobile-link-primary" @click="closeMenu">
          Sign up
        </RouterLink>
      </template>
      <template v-else>
        <RouterLink :to="auth.dashboardPath" class="mobile-link" @click="closeMenu">
          My Dashboard
        </RouterLink>
        <button class="mobile-link mobile-link-danger" @click="logout">Log out</button>
      </template>
    </div>
  </header>
</template>

<style scoped>
.nav {
  position: sticky;
  top: 0;
  z-index: 100;
  background: var(--color-bg);
  border-bottom: 1px solid var(--color-border);
  box-shadow: var(--shadow-sm);
}

.nav-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
  height: 64px;
  display: flex;
  align-items: center;
  gap: 32px;
}

.nav-logo {
  font-size: 20px;
  font-weight: 700;
  color: var(--color-primary);
  text-decoration: none;
  letter-spacing: -0.5px;
  flex-shrink: 0;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 24px;
  flex: 1;
}

.nav-link {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-muted);
  text-decoration: none;
  transition: color 0.15s;
}
.nav-link:hover,
.nav-link.router-link-active {
  color: var(--color-primary);
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}

.nav-btn {
  padding: 8px 16px;
  font-size: 14px;
}

/* Hamburger */
.hamburger {
  margin-left: auto;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 5px;
  width: 36px;
  height: 36px;
  padding: 4px;
  border-radius: var(--radius-sm);
  background: none;
  border: none;
  cursor: pointer;
}
.hamburger:hover { background: var(--color-bg-subtle); }

.bar {
  display: block;
  height: 2px;
  background: var(--color-text);
  border-radius: 2px;
  transition: transform 0.2s, opacity 0.2s;
  transform-origin: center;
}
.bar:nth-child(1).open { transform: translateY(7px) rotate(45deg); }
.bar:nth-child(2).open { opacity: 0; }
.bar:nth-child(3).open { transform: translateY(-7px) rotate(-45deg); }

/* Mobile menu */
.mobile-menu {
  border-top: 1px solid var(--color-border);
  padding: 8px 0 16px;
  background: var(--color-bg);
}

.mobile-link {
  display: block;
  width: 100%;
  padding: 12px 24px;
  font-size: 15px;
  font-weight: 500;
  color: var(--color-text);
  text-decoration: none;
  background: none;
  border: none;
  text-align: left;
  cursor: pointer;
  transition: background 0.15s;
}
.mobile-link:hover { background: var(--color-bg-subtle); }
.mobile-link.router-link-active { color: var(--color-primary); }
.mobile-link-primary { color: var(--color-primary); }
.mobile-link-danger  { color: var(--color-error); }

.mobile-divider {
  height: 1px;
  background: var(--color-border);
  margin: 8px 0;
}

/* Responsive visibility */
@media (min-width: 640px) {
  .mobile-only  { display: none !important; }
}
@media (max-width: 639px) {
  .desktop-only { display: none !important; }
}
</style>
