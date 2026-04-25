<template>
  <div>
    <div class="page-header">
      <h2>BUG 日志</h2>
    </div>

    <!-- 统计卡片 -->
    <el-row :gutter="12" style="margin-bottom:16px;">
      <el-col :span="6" v-for="s in stats" :key="s.level">
        <el-card shadow="never" :style="`border-left:4px solid ${s.color};`">
          <div style="display:flex;align-items:center;gap:12px;">
            <span :style="`font-size:28px;font-weight:700;color:${s.color}`">{{ s.count }}</span>
            <span style="font-size:13px;color:#666;">{{ s.label }}</span>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 搜索栏 -->
    <el-card shadow="never" style="margin-bottom:16px;">
      <el-form :model="query" inline>
        <el-form-item label="级别">
          <el-select v-model="query.level" placeholder="全部" clearable style="width:110px;">
            <el-option label="ERROR" value="error" />
            <el-option label="WARN"  value="warn" />
            <el-option label="INFO"  value="info" />
          </el-select>
        </el-form-item>
        <el-form-item label="模块">
          <el-input v-model="query.module" placeholder="模块名" clearable style="width:140px;" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="query.resolved" placeholder="全部" clearable style="width:110px;">
            <el-option label="未解决" :value="0" />
            <el-option label="已解决" :value="1" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="load(1)">查询</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 数据表 -->
    <el-card shadow="never">
      <el-table :data="list" stripe v-loading="loading" :row-class-name="rowClass">
        <el-table-column prop="id"       label="ID"   width="80" align="center" />
        <el-table-column prop="level"    label="级别" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="{ error:'danger', warn:'warning', info:'info' }[row.level]" size="small">
              {{ row.level?.toUpperCase() }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="module"   label="模块"   width="120" />
        <el-table-column prop="message"  label="错误信息" min-width="280" show-overflow-tooltip />
        <el-table-column prop="userId"   label="用户ID"  width="90" align="center" />
        <el-table-column prop="userRole" label="角色"    width="90" align="center" />
        <el-table-column prop="resolved" label="状态"    width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="row.resolved ? 'success' : 'danger'" size="small">
              {{ row.resolved ? '已解决' : '未解决' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="时间" width="180" />
        <el-table-column label="操作" width="140" align="center" fixed="right">
          <template #default="{ row }">
            <el-button v-if="!row.resolved" link type="success" @click="resolve(row)">标记解决</el-button>
            <el-button link type="danger" @click="del(row)">删除</el-button>
          </template>
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
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getBugLogs, resolveBug, deleteBug } from '../../api'

const loading  = ref(false)
const list     = ref([])
const total    = ref(0)
const rawStats = ref([])
const query    = reactive({ level: null, module: '', resolved: null, page: 1, size: 20 })

const LEVEL_META = {
  error: { label: 'ERROR', color: '#f56c6c' },
  warn:  { label: 'WARN',  color: '#e6a23c' },
  info:  { label: 'INFO',  color: '#409eff' }
}

const stats = computed(() => {
  return Object.entries(LEVEL_META).map(([level, meta]) => {
    const found = rawStats.value.find(s => s.level === level)
    return { level, ...meta, count: found ? found.count : 0 }
  })
})

function rowClass({ row }) {
  return row.level === 'error' && !row.resolved ? 'row-error' : ''
}

async function load(page) {
  if (page) query.page = page
  loading.value = true
  try {
    const params = { ...query }
    if (!params.module) delete params.module
    const data = await getBugLogs(params)
    list.value     = data.list || []
    total.value    = data.total || 0
    rawStats.value = data.stats || []
  } catch (_) {
  } finally {
    loading.value = false
  }
}

function resetQuery() {
  Object.assign(query, { level: null, module: '', resolved: null, page: 1 })
  load()
}

async function resolve(row) {
  await resolveBug(row.id)
  ElMessage.success('已标记为已解决')
  load()
}

async function del(row) {
  await ElMessageBox.confirm('确定删除该条BUG日志吗？', '提示', { type: 'warning' })
  await deleteBug(row.id)
  ElMessage.success('已删除')
  load()
}

onMounted(load)
</script>

<style scoped>
.page-header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 16px;
  h2 { margin: 0; font-size: 20px; color: #1a1a2e; }
}
:deep(.row-error td) { background: #fff5f5 !important; }
</style>
