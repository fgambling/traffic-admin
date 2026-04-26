<template>
  <div>
    <div class="page-header">
      <h2>操作日志</h2>
    </div>
    <el-card shadow="never" style="margin-bottom:16px;">
      <el-form :model="query" inline>
        <el-form-item label="操作人">
          <el-input v-model="query.operator" placeholder="管理员账号" clearable style="width:160px;" />
        </el-form-item>
        <el-form-item label="操作模块">
          <el-select v-model="query.module" placeholder="全部" clearable style="width:140px;">
            <el-option label="商家管理" value="merchant" />
            <el-option label="设备管理" value="device" />
            <el-option label="AI配置"   value="ai" />
            <el-option label="系统设置" value="system" />
          </el-select>
        </el-form-item>
        <el-form-item label="时间">
          <el-date-picker v-model="query.dateRange" type="daterange" range-separator="至"
            start-placeholder="开始" end-placeholder="结束" value-format="YYYY-MM-DD" style="width:240px;" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="load(1)">查询</el-button>
          <el-button @click="reset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never">
      <el-table :data="list" stripe v-loading="loading">
        <el-table-column prop="id"          label="ID"     width="80" align="center" />
        <el-table-column prop="operator"    label="操作人" width="120" />
        <el-table-column prop="module"      label="模块"   width="120" align="center">
          <template #default="{ row }">
            <el-tag size="small" type="info">{{ row.module }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="action"      label="操作内容" min-width="200" show-overflow-tooltip />
        <el-table-column prop="ip"          label="IP"      width="140" />
        <el-table-column prop="createdAt" label="时间" width="180">
          <template #default="{ row }">{{ fmtDate(row.createdAt) }}</template>
        </el-table-column>
      </el-table>
      <el-pagination
        v-model:current-page="query.page"
        v-model:page-size="query.size"
        :total="total"
        layout="total, prev, pager, next"
        style="margin-top:16px;justify-content:flex-end;"
        @change="load"
      />
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { getOpLogs } from '../../api'
import { fmtDate } from '../../utils/format'

const loading = ref(false)
const list    = ref([])
const total   = ref(0)
const query   = reactive({ operator: '', module: '', dateRange: [], page: 1, size: 20 })

async function load(page) {
  if (page) query.page = page
  loading.value = true
  try {
    const params = { ...query }
    if (query.dateRange?.length === 2) {
      params.start = query.dateRange[0]
      params.end   = query.dateRange[1]
    }
    delete params.dateRange
    const data = await getOpLogs(params)
    list.value  = data.list || []
    total.value = data.total || 0
  } catch (_) {
  } finally {
    loading.value = false
  }
}

function reset() {
  Object.assign(query, { operator: '', module: '', dateRange: [], page: 1 })
  load()
}

onMounted(load)
</script>

<style scoped>
.page-header { display:flex; align-items:center; margin-bottom:16px; h2 { margin:0;font-size:20px; } }
</style>
