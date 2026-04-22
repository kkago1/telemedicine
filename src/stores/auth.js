import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login as loginApi, me } from '@/api/auth'

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

  // Derived from nested patient/practitioner profile
  const fullName = computed(() =>
    user.value?.patient?.fullName
    ?? user.value?.practitioner?.fullName
    ?? null
  )

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

  async function login(credentials) {
    const result = await loginApi(credentials)   // { user, token }
    localStorage.setItem('token', result.token)
    token.value = result.token
    // Fetch full profile (includes nested patient/practitioner data)
    user.value = await me()
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

  return { user, token, isAuthenticated, role, fullName, dashboardPath, rehydrate, login, setAuth, logout }
})
