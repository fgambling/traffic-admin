<template>
  <div>
    <div class="page-header">
      <h2>AI 费用统计</h2>
      <span class="page-sub">仅统计高级版 AI 大模型生成的建议</span>
    </div>

    <!-- 汇总卡片 -->
    <div style="display:flex;gap:12px;margin-bottom:24px;">
      <el-card shadow="never" v-for="c in costCards" :key="c.label" style="flex:1;">
        <div class="cost-val">{{ c.val }}</div>
        <div class="cost-label">{{ c.label }}</div>
      </el-card>
    </div>

    <!-- 按商家统计 -->
    <el-card shadow="never">
      <el-table :data="sortedStats" stripe v-loading="loadingMerchant">
        <el-table-column prop="merchantId"   label="商家ID"     width="90"  align="center" />
        <el-table-column prop="merchantName" label="商家名称"   min-width="160" />
        <el-table-column width="150" align="right">
          <template #header>
            <span class="sort-hdr" @click="toggleSort('totalAiCount')">
              累计生成条数 {{ sortIcon('totalAiCount') }}
            </span>
          </template>
          <template #default="{ row }">{{ row.totalAiCount }}</template>
        </el-table-column>
        <el-table-column width="150" align="right">
          <template #header>
            <span class="sort-hdr" @click="toggleSort('todayAiCount')">
              今日生成条数 {{ sortIcon('todayAiCount') }}
            </span>
          </template>
          <template #default="{ row }">{{ row.todayAiCount }}</template>
        </el-table-column>
        <el-table-column width="190">
          <template #header>
            <span class="sort-hdr" @click="toggleSort('lastGenAt')">
              最近生成时间 {{ sortIcon('lastGenAt') }}
            </span>
          </template>
          <template #default="{ row }">{{ fmtDate(row.lastGenAt) }}</template>
        </el-table-column>
        <el-table-column width="145" align="right">
          <template #header>
            <span class="sort-hdr" @click="toggleSort('estTodayCostYuan')">
              预估今日费用 {{ sortIcon('estTodayCostYuan') }}
            </span>
          </template>
          <template #default="{ row }">
            <span :style="{ color: (row.estTodayCostYuan || 0) > 0 ? '#e6a23c' : '#999' }">
              ¥ {{ (row.estTodayCostYuan || 0).toFixed(2) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column width="145" align="right">
          <template #header>
            <span class="sort-hdr" @click="toggleSort('estCostYuan')">
              预估累计费用 {{ sortIcon('estCostYuan') }}
            </span>
          </template>
          <template #default="{ row }">
            <span :style="{ color: (row.estCostYuan || 0) > 0 ? '#e6a23c' : '#999' }">
              ¥ {{ (row.estCostYuan || 0).toFixed(2) }}
            </span>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getAiCostByMerchant } from '../../api'
import { fmtDate } from '../../utils/format'

const loadingMerchant = ref(false)
const merchantStats   = ref([])
const summary = computed(() => ({
  totalAiCount:  merchantStats.value.reduce((s, r) => s + (r.totalAiCount || 0), 0),
  todayAiCount:  merchantStats.value.reduce((s, r) => s + (r.todayAiCount || 0), 0),
  merchantCount: merchantStats.value.length,
  totalEstCost:  merchantStats.value.reduce((s, r) => s + (r.estCostYuan      || 0), 0).toFixed(2),
  todayEstCost:  merchantStats.value.reduce((s, r) => s + (r.estTodayCostYuan || 0), 0).toFixed(2)
}))

const costCards = computed(() => [
  { label: 'AI 累计生成条数', val: summary.value.totalAiCount },
  { label: '今日生成条数',    val: summary.value.todayAiCount },
  { label: '覆盖高级版商家',  val: summary.value.merchantCount },
  { label: '预估累计费用',    val: '¥ ' + summary.value.totalEstCost },
  { label: '预估今日费用',    val: '¥ ' + summary.value.todayEstCost }
])

// ── 排序 ─────────────────────────────────────────────────────
const sortProp = ref(null)   // null = 默认按 merchantId 升序
const sortAsc  = ref(true)

function toggleSort(prop) {
  if (sortProp.value === prop) {
    if (!sortAsc.value) { sortProp.value = null; sortAsc.value = true }  // 再次点击降序 → 重置
    else sortAsc.value = false
  } else {
    sortProp.value = prop
    sortAsc.value  = true
  }
}

function sortIcon(prop) {
  if (sortProp.value !== prop) return '↕'
  return sortAsc.value ? '↑' : '↓'
}

const sortedStats = computed(() => {
  const arr = [...merchantStats.value]
  if (!sortProp.value) return arr.sort((a, b) => (a.merchantId ?? 0) - (b.merchantId ?? 0))
  const prop = sortProp.value
  return arr.sort((a, b) => {
    const va = a[prop] ?? 0
    const vb = b[prop] ?? 0
    if (va < vb) return sortAsc.value ? -1 : 1
    if (va > vb) return sortAsc.value ? 1 : -1
    return 0
  })
})

async function load() {
  loadingMerchant.value = true
  try {
    const raw = await getAiCostByMerchant() || []
    merchantStats.value = raw
  } catch (_) {
  } finally {
    loadingMerchant.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.page-header {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 16px;
  h2 { margin: 0; font-size: 20px; }
  .page-sub { font-size: 13px; color: #999; }
}
.cost-val   { font-size: 36px; font-weight: 700; color: #1a1a2e; text-align: center; }
.cost-label { font-size: 14px; color: #999; text-align: center; margin-top: 8px; }
:deep(.el-tabs__header) { margin-bottom: 0; }
.sort-hdr {
  cursor: pointer;
  user-select: none;
  white-space: nowrap;
  &:hover { color: #409eff; }
}
</style>
