<template>
  <div>
    <div class="page-header">
      <h2>AI 费用统计</h2>
      <el-date-picker
        v-model="dateRange"
        type="daterange"
        range-separator="至"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        value-format="YYYY-MM-DD"
        style="width:280px;"
        @change="load"
      />
    </div>

    <el-row :gutter="16" style="margin-bottom:24px;">
      <el-col :span="6" v-for="c in costCards" :key="c.label">
        <el-card shadow="never">
          <div class="cost-val">{{ c.val }}</div>
          <div class="cost-label">{{ c.label }}</div>
        </el-card>
      </el-col>
    </el-row>

    <el-card shadow="never" header="建议生成明细">
      <el-table :data="list" stripe v-loading="loading">
        <el-table-column prop="date"        label="日期"     width="120" />
        <el-table-column prop="merchantName" label="商家"    min-width="160" />
        <el-table-column prop="ruleId"      label="规则ID"   width="120" />
        <el-table-column prop="adviceType"  label="建议类型" width="100" align="center">
          <template #default="{ row }">
            <el-tag size="small">{{ row.adviceType }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="source"      label="来源"     width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.source === 2 ? 'warning' : 'info'" size="small">
              {{ row.source === 2 ? 'AI大模型' : '规则引擎' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="feedback"    label="反馈"     width="80" align="center">
          <template #default="{ row }">
            <span>{{ ['—','👍','👎'][row.feedback] }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt"   label="生成时间" width="180" />
      </el-table>
      <el-pagination
        v-model:current-page="page"
        :page-size="15"
        :total="total"
        layout="total, prev, pager, next"
        style="margin-top:16px;justify-content:flex-end;"
        @current-change="load"
      />
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getAiCost } from '../../api'

const loading   = ref(false)
const list      = ref([])
const total     = ref(0)
const page      = ref(1)
const dateRange = ref([])
const summary   = ref({ totalGenerated: 0, ruleCount: 0, aiCount: 0, usefulRate: 0 })

const costCards = computed(() => [
  { label: '总生成条数', val: summary.value.totalGenerated },
  { label: '规则引擎',   val: summary.value.ruleCount },
  { label: 'AI大模型',   val: summary.value.aiCount },
  { label: '有用率',     val: `${summary.value.usefulRate}%` }
])

async function load() {
  loading.value = true
  try {
    const params = { page: page.value, size: 15 }
    if (dateRange.value?.length === 2) {
      params.start = dateRange.value[0]
      params.end   = dateRange.value[1]
    }
    const data = await getAiCost(params)
    list.value    = data.list || []
    total.value   = data.total || 0
    summary.value = data.summary || summary.value
  } catch (_) {
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.page-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:16px; h2 { margin:0;font-size:20px; } }
.cost-val   { font-size:36px; font-weight:700; color:#1a1a2e; text-align:center; }
.cost-label { font-size:14px; color:#999; text-align:center; margin-top:8px; }
</style>
