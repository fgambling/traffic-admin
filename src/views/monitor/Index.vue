<template>
  <div>
    <div class="page-header">
      <h2>数据监控</h2>
      <el-button :icon="Refresh" @click="load" :loading="loading">刷新</el-button>
    </div>

    <!-- 汇总卡片：第一行 4 格 -->
    <el-row :gutter="16" style="margin-bottom:16px;">
      <el-col :span="6" v-for="card in statRow1" :key="card.label">
        <el-card shadow="never" class="stat-card" :style="`border-top:4px solid ${card.color}`">
          <div class="stat-val">{{ card.val }}</div>
          <div class="stat-label">{{ card.label }}</div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 汇总卡片：第二行 4 格 -->
    <el-row :gutter="16" style="margin-bottom:24px;">
      <el-col :span="6" v-for="card in statRow2" :key="card.label">
        <el-card
          shadow="never"
          class="stat-card"
          :class="{ 'stat-card--link': card.link }"
          :style="`border-top:4px solid ${card.color}`"
          @click="card.link && router.push(card.link)"
        >
          <div class="stat-val">{{ card.val }}</div>
          <div class="stat-label">
            {{ card.label }}
            <el-icon v-if="card.link" size="12" style="margin-left:4px;vertical-align:middle;"><ArrowRight /></el-icon>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 合作商家详情：双柱状图 -->
    <el-card shadow="never" style="margin-bottom:24px;">
      <template #header>
        <div style="display:flex;align-items:center;justify-content:space-between;">
          <div style="display:flex;align-items:center;gap:16px;">
            <span>合作商家详情</span>
            <div class="legend">
              <span class="legend-dot" style="background:#4e7ef7;"/>营收（元）
              <span class="legend-dot" style="background:#52c41a;margin-left:10px;"/>门店数量（家）
            </div>
          </div>
          <el-radio-group v-model="cooperationType" size="small" @change="loadCooperation">
            <el-radio-button value="day">日</el-radio-button>
            <el-radio-button value="week">周</el-radio-button>
            <el-radio-button value="month">月</el-radio-button>
          </el-radio-group>
        </div>
      </template>
      <BarChart :data="cooperationData" height="240px" />

      <!-- 业务员排行榜 -->
      <div class="rank-header">
        <span class="rank-title">业务员合作排行（TOP 5）</span>
        <el-radio-group v-model="rankType" size="small" @change="loadRank">
          <el-radio-button value="all">总计</el-radio-button>
          <el-radio-button value="week">近7天</el-radio-button>
          <el-radio-button value="month">近30天</el-radio-button>
        </el-radio-group>
      </div>
      <el-table :data="rankData" stripe size="small" v-loading="rankLoading" style="margin-top:12px;">
        <el-table-column type="index" label="排名" width="55" align="center">
          <template #default="{ $index }">
            <span :class="['rank-badge', `rank-${$index + 1}`]">{{ $index + 1 }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="姓名" min-width="90" />
        <el-table-column label="员工类别" width="100" align="center">
          <template #default="{ row }">{{ catLabel(row.employeeCategory) }}</template>
        </el-table-column>
        <el-table-column label="已合作数量" width="100" align="center">
          <template #default="{ row }">{{ row.cooperationCount }} 家</template>
        </el-table-column>
        <el-table-column label="总核收（元）" min-width="110" align="right">
          <template #default="{ row }">¥{{ fmtN(row.totalRevenue) }}</template>
        </el-table-column>
        <el-table-column label="已提现（元）" min-width="110" align="right">
          <template #default="{ row }">¥{{ fmtN(row.withdrawn) }}</template>
        </el-table-column>
        <el-table-column label="未提现（元）" min-width="110" align="right">
          <template #default="{ row }">¥{{ fmtN(row.pendingWithdraw) }}</template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 套餐即将到期门店 -->
    <el-card shadow="never" style="margin-bottom:24px;">
      <template #header>
        <span>套餐即将到期门店</span>
      </template>
      <el-table :data="expiringData" stripe size="small" v-loading="expiringLoading">
        <el-table-column prop="merchantName"  label="门店名称"   min-width="140" />
        <el-table-column prop="contactPerson" label="负责人"     width="100" />
        <el-table-column prop="contactPhone"  label="负责人电话" width="140" />
        <el-table-column label="所属业务员" min-width="130">
          <template #default="{ row }">
            <span v-if="row.salesmanNames">{{ row.salesmanNames }}</span>
            <span v-else style="color:#ccc;">--</span>
          </template>
        </el-table-column>
        <el-table-column label="到期时间" width="120" align="center">
          <template #default="{ row }">
            <span :class="expireClass(row.packageExpireAt)">{{ row.packageExpireAt }}</span>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 历史趋势图 -->
    <el-card shadow="never" style="margin-bottom:24px;">
      <template #header>
        <div style="display:flex;align-items:center;justify-content:space-between;">
          <span>历史客流趋势</span>
          <div style="display:flex;gap:8px;">
            <el-select v-model="trendParams.merchantId" placeholder="全平台" clearable style="width:160px;" @change="loadTrend">
              <el-option v-for="m in merchants" :key="m.merchantId" :label="m.merchantName" :value="m.merchantId" />
            </el-select>
            <el-radio-group v-model="trendParams.type" @change="loadTrend">
              <el-radio-button value="day">日</el-radio-button>
              <el-radio-button value="week">周</el-radio-button>
              <el-radio-button value="month">月</el-radio-button>
            </el-radio-group>
            <el-select v-model="trendParams.days" style="width:100px;" @change="loadTrend">
              <el-option label="近7天"  :value="7" />
              <el-option label="近30天" :value="30" />
              <el-option label="近90天" :value="90" />
            </el-select>
          </div>
        </div>
      </template>
      <LineChart :data="trendData" height="260px" />
    </el-card>

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
import { ref, computed, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Refresh, ArrowRight } from '@element-plus/icons-vue'
import { getMonitorOverview, getMonitorTrend, getCooperationDetail, getSalesmanRank, getExpiringPackages } from '../../api'
import LineChart from '../../components/LineChart.vue'
import BarChart  from '../../components/BarChart.vue'

const router    = useRouter()
const loading   = ref(false)
const overview  = ref({
  totalMerchants: 0, todayEnterTotal: 0, activeMerchants: 0,
  todayNewMerchants: 0, todayRevenue: 0, totalRevenue: 0,
  totalPendingWithdraw: 0, totalWithdrawn: 0,
  pendingWithdrawCount: 0, pendingMerchantCount: 0
})
const merchants       = ref([])
const trendData       = ref([])
const cooperationData = ref([])
const cooperationType = ref('month')
const trendParams     = reactive({ merchantId: null, type: 'day', days: 30 })
const rankData        = ref([])
const rankType        = ref('all')
const rankLoading     = ref(false)
const expiringData    = ref([])
const expiringLoading = ref(false)

function fmtAmount(v) { return (Number(v) || 0).toFixed(2) }
function fmtN(v)      { return (Number(v) || 0).toFixed(2) }

const CAT_MAP = { 1: '全职', 2: '兼职', 3: '总公司', 4: '分公司' }
function catLabel(c) { return CAT_MAP[c] || '--' }

const statRow1 = computed(() => [
  { label: '商家总数',       val: overview.value.totalMerchants,    color: '#1f4788' },
  { label: '今日新增商家',   val: overview.value.todayNewMerchants, color: '#0d8a6b' },
  { label: '今日核收（元）', val: fmtAmount(overview.value.todayRevenue),  color: '#c0392b' },
  { label: '总核收（元）',   val: fmtAmount(overview.value.totalRevenue),  color: '#d35400' }
])

const statRow2 = computed(() => [
  { label: '待提现金额（元）', val: fmtAmount(overview.value.totalPendingWithdraw), color: '#2980b9' },
  { label: '已提现金额（元）', val: fmtAmount(overview.value.totalWithdrawn),       color: '#27ae60' },
  {
    label: `待处理提现（${overview.value.pendingWithdrawCount}笔）`,
    val: overview.value.pendingWithdrawCount,
    color: '#8e44ad', link: '/withdraw'
  },
  {
    label: `待审核商家（${overview.value.pendingMerchantCount}家）`,
    val: overview.value.pendingMerchantCount,
    color: '#e67e22', link: '/salesman/follow-approval'
  }
])

async function load() {
  loading.value = true
  try {
    const data = await getMonitorOverview()
    overview.value = { ...overview.value, ...(data.overview || {}) }
    merchants.value = data.merchants || []
  } catch (_) {
  } finally {
    loading.value = false
  }
}

async function loadTrend() {
  try {
    const pts = await getMonitorTrend(trendParams)
    trendData.value = (pts || []).map(p => ({ label: p.label, value: p.enterCount }))
  } catch (_) {}
}

async function loadCooperation() {
  try {
    const rows = await getCooperationDetail({ type: cooperationType.value })
    cooperationData.value = rows || []
  } catch (_) {}
}

async function loadRank() {
  rankLoading.value = true
  try {
    rankData.value = (await getSalesmanRank({ type: rankType.value })) || []
  } catch (_) {}
  rankLoading.value = false
}

async function loadExpiring() {
  expiringLoading.value = true
  try {
    expiringData.value = (await getExpiringPackages()) || []
  } catch (_) {}
  expiringLoading.value = false
}

function expireClass(dateStr) {
  if (!dateStr) return ''
  const days = Math.ceil((new Date(dateStr) - Date.now()) / 86400000)
  if (days <= 7)  return 'expire-urgent'
  if (days <= 30) return 'expire-warn'
  return ''
}

function formatStay(secs) {
  if (!secs) return '--'
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return s > 0 ? `${m}分${s}秒` : `${m}分钟`
}

onMounted(() => { load(); loadTrend(); loadCooperation(); loadRank(); loadExpiring() })
</script>

<style scoped>
.page-header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 24px;
  h2 { margin: 0; font-size: 20px; color: #1a1a2e; }
}
.stat-card { text-align: center; }
.stat-card--link { cursor: pointer; transition: box-shadow .2s; }
.stat-card--link:hover { box-shadow: 0 4px 16px rgba(0,0,0,.15) !important; }
.stat-val  { font-size: 34px; font-weight: 700; color: #1a1a2e; }
.stat-label{ font-size: 13px; color: #999; margin-top: 8px; }
.legend { display:flex; align-items:center; font-size:12px; color:#666; }
.legend-dot { display:inline-block; width:10px; height:10px; border-radius:2px; margin-right:4px; }
.rank-header { display:flex; align-items:center; justify-content:space-between; margin-top:20px; }
.rank-title  { font-size:14px; font-weight:600; color:#1a1a2e; }
.rank-badge  { display:inline-flex; align-items:center; justify-content:center;
               width:22px; height:22px; border-radius:50%; font-size:12px; font-weight:700; color:#fff; }
.rank-1 { background:#f5a623; }
.rank-2 { background:#9b9b9b; }
.rank-3 { background:#c77c40; }
.rank-4, .rank-5 { background:#d0d0d0; color:#666; }
.expire-urgent { color:#e74c3c; font-weight:700; }
.expire-warn   { color:#e67e22; font-weight:600; }
</style>
