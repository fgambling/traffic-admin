import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getWithdrawPendingCount, getFollowPendingCount, getAppPendingCount } from '../api'

export const useBadgeStore = defineStore('badges', () => {
  const withdrawCount = ref(0)
  const followCount   = ref(0)
  const packageCount  = ref(0)

  async function refresh() {
    try {
      const [w, f, p] = await Promise.all([
        getWithdrawPendingCount(),
        getFollowPendingCount(),
        getAppPendingCount()
      ])
      withdrawCount.value = w || 0
      followCount.value   = f || 0
      packageCount.value  = p || 0
    } catch (_) {}
  }

  return { withdrawCount, followCount, packageCount, refresh }
})
