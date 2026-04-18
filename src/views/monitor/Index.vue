<template>
  <div>
    <div class="page-header">
      <h2>数据监控</h2>
      <el-button :icon="Refresh" @click="load" :loading="loading">刷新</el-button>
    </div>

    <!-- 汇总卡片 -->
    <el-row :gutter="16" style="margin-bottom:24px;">
      <el-col :span="6" v-for="card in statCards" :key="card.label">
        <el-card shadow="never" class="stat-card" :style="`border-top:4px solid ${card.color}`">
          <div class="stat-val">{{ card.val }}</div>
          <div class="stat-label">{{ card.label }}</div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 商家实时客流表 -->
    <el-card shadow="never">
      <template #header>
        <span>各商家今日实时客流</span>
        <el-tag style="margin-left:12px;" type="success" size="small">实时</el-tag>
      </template>
      <el-table :data="merchants" stripe v-loading="loading">
        <el-table-column prop="merchantName" label="商家名称" min-width="160" />
        <el-table-column prop="totalEnter" label="今日进店" align="center" width="120" />
        <el-table-column prop="currentInStore" label="当前在店" align="center" width="120">
          <template #default="{ row }">
            <el-tag type="success" size="small">{{ row.currentInStore }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="avgStaySeconds" label="平均停留" align="center" width="120">
          <template #default="{ row }">{{ formatStay(row.avgStaySeconds) }}</template>
        </el-table-column>
        <el-table-column prop="femaleRatio" label="女性占比" align="center" width="120">
          <template #default="{ row }">{{ row.femaleRatio }}%</template>
        </el-table-column>
        <el-table-column prop="dataSource" label="数据来源" align="center" width="100">
          <template #default="{ row }">
            <el-tag :type="row.dataSource === 'cache' ? 'warning' : 'info'" size="small">
              {{ row.dataSource === 'cache' ? '缓存' : '数据库' }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Refresh } from '@element-plus/icons-vue'
import { getMonitorOverview } from '../../api'

const loading   = ref(false)
const overview  = ref({ totalMerchants: 0, totalDevices: 0, todayEnterTotal: 0, activeMerchants: 0 })
const merchants = ref([])

const statCards = computed(() => [
  { label: '商家总数',     val: overview.value.totalMerchants,   color: '#1f4788' },
  { label: '设备总数',     val: overview.value.totalDevices,     color: '#17794a' },
  { label: '今日总进店',   val: overview.value.todayEnterTotal,  color: '#e8842a' },
  { label: '今日活跃商家', val: overview.value.activeMerchants,  color: '#6b3399' }
])

async function load() {
  loading.value = true
  try {
    const data = await getMonitorOverview()
    overview.value = data.overview || overview.value
    merchants.value = data.merchants || []
  } catch (_) {
  } finally {
    loading.value = false
  }
}

function formatStay(secs) {
  if (!secs) return '--'
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return s > 0 ? `${m}分${s}秒` : `${m}分钟`
}

onMounted(load)
</script>

<style scoped>
.page-header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 24px;
  h2 { margin: 0; font-size: 20px; color: #1a1a2e; }
}
.stat-card { text-align: center; }
.stat-val  { font-size: 36px; font-weight: 700; color: #1a1a2e; }
.stat-label{ font-size: 14px; color: #999; margin-top: 8px; }
</style>
