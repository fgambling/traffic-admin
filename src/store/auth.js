import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('admin_token') || '')
  const adminName = ref(localStorage.getItem('admin_name') || '')
  const role = ref(localStorage.getItem('admin_role') || 'admin')

  const isLoggedIn = computed(() => !!token.value)
  const isFinance = computed(() => role.value === 'finance')

  function setLogin(t, name, r = 'admin') {
    token.value = t
    adminName.value = name
    role.value = r
    localStorage.setItem('admin_token', t)
    localStorage.setItem('admin_name', name)
    localStorage.setItem('admin_role', r)
  }

  function logout() {
    token.value = ''
    adminName.value = ''
    role.value = 'admin'
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_name')
    localStorage.removeItem('admin_role')
  }

  return { token, adminName, role, isLoggedIn, isFinance, setLogin, logout }
})
