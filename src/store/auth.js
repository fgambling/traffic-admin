import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('admin_token') || '')
  const adminName = ref(localStorage.getItem('admin_name') || '')

  const isLoggedIn = computed(() => !!token.value)

  function setLogin(t, name) {
    token.value = t
    adminName.value = name
    localStorage.setItem('admin_token', t)
    localStorage.setItem('admin_name', name)
  }

  function logout() {
    token.value = ''
    adminName.value = ''
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_name')
  }

  return { token, adminName, isLoggedIn, setLogin, logout }
})
