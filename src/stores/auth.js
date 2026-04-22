import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { me } from '@/api/auth'

const ROLE_DASHBOARDS = {
  PATIENT: '/patient/dashboard',
  PRACTITIONER: '/practitioner/dashboard',
  ADMIN: '/admin/dashboard',
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const token = ref(null)

  const isAuthenticated = computed(() => !!token.value && !!user.value)
  const role = computed(() => user.value?.role ?? null)
  const dashboardPath = computed(() => ROLE_DASHBOARDS[role.value] ?? '/')

  async function rehydrate() {
    const stored = localStorage.getItem('token')
    if (!stored) return
    token.value = stored
    try {
      user.value = await me()
    } catch {
      logout()
    }
  }

  function setAuth(tokenValue, userData) {
    token.value = tokenValue
    user.value = userData
    localStorage.setItem('token', tokenValue)
  }

  function logout() {
    token.value = null
    user.value = null
    localStorage.removeItem('token')
  }

  return { user, token, isAuthenticated, role, dashboardPath, rehydrate, setAuth, logout }
})
