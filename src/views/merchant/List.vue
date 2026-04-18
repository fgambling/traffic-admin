<template>
  <div>
    <div class="page-header">
      <h2>商家管理</h2>
    </div>

    <!-- 搜索栏 -->
    <el-card shadow="never" style="margin-bottom:16px;">
      <el-form :model="query" inline>
        <el-form-item label="商家名称">
          <el-input v-model="query.name" placeholder="搜索商家名称" clearable style="width:200px;" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="query.status" placeholder="全部" clearable style="width:120px;">
            <el-option label="待激活" :value="0" />
            <el-option label="正常"   :value="1" />
            <el-option label="禁用"   :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="套餐">
          <el-select v-model="query.packageType" placeholder="全部" clearable style="width:120px;">
            <el-option label="基础版" :value="1" />
            <el-option label="高级版" :value="2" />
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
      <el-table :data="list" stripe v-loading="loading">
        <el-table-column prop="id"            label="ID"       width="80"  align="center" />
        <el-table-column prop="name"          label="商家名称" min-width="160" />
        <el-table-column prop="licenseNo"     label="营业执照" min-width="150" />
        <el-table-column prop="contactPerson" label="联系人"   width="100" />
        <el-table-column prop="contactPhone"  label="联系电话" width="140" />
        <el-table-column prop="packageType"   label="套餐"     width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.packageType === 2 ? 'primary' : 'info'" size="small">
              {{ row.packageType === 2 ? '高级版' : '基础版' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="statusTag(row.status).type" size="small">{{ statusTag(row.status).label }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" align="center" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="$router.push(`/merchant/${row.id}`)">详情</el-button>
            <el-button link :type="row.status === 1 ? 'danger' : 'success'" @click="toggleStatus(row)">
              {{ row.status === 1 ? '禁用' : '启用' }}
            </el-button>
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
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getMerchantList, toggleMerchant } from '../../api'

const loading = ref(false)
const list    = ref([])
const total   = ref(0)
const query   = reactive({ name: '', status: null, packageType: null, page: 1, size: 15 })

function statusTag(s) {
  return { 0: { type: 'warning', label: '待激活' }, 1: { type: 'success', label: '正常' }, 2: { type: 'danger', label: '禁用' } }[s] || { type: 'info', label: '未知' }
}

async function load(page) {
  if (page) query.page = page
  loading.value = true
  try {
    const data = await getMerchantList(query)
    list.value  = data.list || []
    total.value = data.total || 0
  } catch (_) {
  } finally {
    loading.value = false
  }
}

function resetQuery() {
  Object.assign(query, { name: '', status: null, packageType: null, page: 1 })
  load()
}

async function toggleStatus(row) {
  const next = row.status === 1 ? 2 : 1
  const label = next === 1 ? '启用' : '禁用'
  await ElMessageBox.confirm(`确定要${label}商家「${row.name}」吗？`, '提示', { type: 'warning' })
  await toggleMerchant(row.id, next)
  ElMessage.success(`已${label}`)
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
</style>
