<template>
  <div>
    <div class="page-header">
      <h2>AI 费用统计</h2>
    </div>

    <el-row :gutter="16" style="margin-bottom:24px;">
      <el-col :span="6" v-for="c in costCards" :key="c.label">
        <el-card shadow="never">
          <div class="cost-val">{{ c.val }}</div>
          <div class="cost-label">{{ c.label }}</div>
        </el-card>
      </el-col>
    </el-row>

    <el-card shadow="never">
      <template #header>
        <el-tabs v-model="activeTab" @tab-change="onTabChange">
          <el-tab-pane label="建议明细" name="detail" />
          <el-tab-pane label="按商家统计" name="merchant" />
        </el-tabs>
      </template>

      <!-- 明细列表 -->
      <template v-if="activeTab === 'detail'">
        <el-table :data="list" stripe v-loading="loading">
          <el-table-column prop="id"         label="ID"     width="90"  align="center" />
          <el-table-column prop="merchantId" label="商家ID" width="100" align="center" />
          <el-table-column prop="triggerRuleId" label="规则ID" width="120" />
          <el-table-column prop="adviceType" label="建议类型" width="100" align="center">
            <template #default="{ row }">
              <el-tag size="small">{{ row.adviceType || '--' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="source"     label="来源"   width="110" align="center">
            <template #default="{ row }">
              <el-tag :type="row.source === 2 ? 'warning' : 'info'" size="small">
                {{ row.source === 2 ? 'AI大模型' : '规则引擎' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="feedback"   label="反馈"   width="80"  align="center">
            <template #default="{ row }">
              <span>{{ ['—','👍','👎'][row.feedback ?? 0] }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="createdAt" label="生成时间" width="180">
            <template #default="{ row }">{{ fmtDate(row.createdAt) }}</template>
          </el-table-column>
        </el-table>
        <el-pagination
          v-model:current-page="page"
          :page-size="15"
          :total="total"
          layout="total, prev, pager, next"
          style="margin-top:16px;justify-content:flex-end;"
          @current-change="loadDetail"
        />
      </template>

      <!-- 按商家统计 -->
      <template v-else>
        <el-table :data="merchantStats" stripe v-loading="loadingMerchant">
          <el-table-column prop="merchantId"  label="商家ID"    width="100" align="center" />
          <el-table-column prop="totalCount"  label="总生成数"  width="120" align="right" />
          <el-table-column prop="aiCount"     label="AI生成数"  width="120" align="right" />
          <el-table-column label="规则生成数" width="120" align="right">
            <template #default="{ row }">{{ (row.totalCount || 0) - (row.aiCount || 0) }}</template>
          </el-table-column>
          <el-table-column prop="usefulCount" label="有用条数"  width="120" align="right" />
          <el-table-column prop="usefulRate"  label="有用率"    width="100" align="right">
            <template #default="{ row }">{{ row.usefulRate }}%</template>
          </el-table-column>
        </el-table>
      </template>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getAiCost, getAiCostByMerchant } from '../../api'
import { fmtDate } from '../../utils/format'

const loading        = ref(false)
const loadingMerchant = ref(false)
const list           = ref([])
const total          = ref(0)
const page           = ref(1)
const summary        = ref({ totalGenerated: 0, ruleCount: 0, aiCount: 0, usefulRate: 0 })
const merchantStats  = ref([])
const activeTab      = ref('detail')

const costCards = computed(() => [
  { label: '总生成条数', val: summary.value.totalGenerated },
  { label: '规则引擎',   val: summary.value.ruleCount },
  { label: 'AI大模型',   val: summary.value.aiCount },
  { label: '有用率',     val: `${summary.value.usefulRate}%` }
])

async function loadDetail() {
  loading.value = true
  try {
    const data = await getAiCost({ page: page.value, size: 15 })
    list.value    = data.list || []
    total.value   = data.total || 0
    summary.value = data.summary || summary.value
  } catch (_) {
  } finally {
    loading.value = false
  }
}

async function loadMerchant() {
  loadingMerchant.value = true
  try {
    merchantStats.value = await getAiCostByMerchant() || []
  } catch (_) {
  } finally {
    loadingMerchant.value = false
  }
}

function onTabChange(tab) {
  if (tab === 'merchant' && merchantStats.value.length === 0) loadMerchant()
}

onMounted(loadDetail)
</script>

<style scoped>
.page-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:16px; h2 { margin:0;font-size:20px; } }
.cost-val   { font-size:36px; font-weight:700; color:#1a1a2e; text-align:center; }
.cost-label { font-size:14px; color:#999; text-align:center; margin-top:8px; }
:deep(.el-tabs__header) { margin-bottom: 0; }
</style>
