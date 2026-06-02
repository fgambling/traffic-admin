<template>
  <div>
    <div class="page-header">
      <h2>业务员管理</h2>
      <div style="display:flex;gap:8px;">
        <el-button type="primary" @click="openAdd">新增业务员</el-button>
        <el-button @click="showImport = true">批量导入</el-button>
      </div>
    </div>

    <!-- 搜索栏 -->
    <el-card shadow="never" style="margin-bottom:16px;">
      <el-form :model="query" inline>
        <el-form-item label="姓名">
          <el-input v-model="query.name" placeholder="搜索姓名" clearable style="width:180px;" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="query.status" placeholder="全部" clearable style="width:110px;">
            <el-option label="正常" :value="1" />
            <el-option label="禁用" :value="0" />
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
        <el-table-column prop="id"     label="ID"   width="80" align="center" />
        <el-table-column prop="name"   label="姓名" width="120" />
        <el-table-column prop="phone"  label="手机号" width="140" />
        <el-table-column label="所属地区" min-width="160">
          <template #default="{ row }">{{ [row.province, row.city, row.adminDistrict].filter(Boolean).join(' · ') || '—' }}</template>
        </el-table-column>
        <el-table-column prop="totalCommission" label="累计佣金" width="130" align="right">
          <template #default="{ row }">¥{{ Number(row.totalCommission || 0).toFixed(2) }}</template>
        </el-table-column>
        <el-table-column prop="balance" label="可提现余额" width="130" align="right">
          <template #default="{ row }">¥{{ Number(row.balance || 0).toFixed(2) }}</template>
        </el-table-column>
        <el-table-column prop="withdrawnAmount" label="已提现金额" width="130" align="right">
          <template #default="{ row }">¥{{ Number(row.withdrawnAmount || 0).toFixed(2) }}</template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
              {{ row.status === 1 ? '正常' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" min-width="160">
          <template #default="{ row }">{{ fmtDate(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="180" align="center" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
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

    <!-- 新增/编辑对话框 -->
    <el-dialog v-model="showForm" :title="form.id ? '编辑业务员' : '新增业务员'" width="520px">
      <el-form :model="form" label-width="90px">
        <el-form-item label="姓名">
          <el-input v-model="form.name" placeholder="请输入姓名" />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="form.phone" placeholder="请输入手机号" :disabled="!!form.id" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input v-model="form.password" type="password" :placeholder="form.id ? '留空不修改' : '请输入密码'" show-password />
        </el-form-item>
        <el-form-item label="所属地区" required>
          <el-cascader
            v-model="regionValue"
            :options="regionData"
            :props="cascaderProps"
            placeholder="请选择省 / 市 / 区"
            filterable
            style="width:100%;"
            @change="onRegionChange"
          />
        </el-form-item>
        <el-form-item label="所属片区">
          <el-input v-model="form.district" placeholder="如：天河片区（选填）" />
        </el-form-item>
        <el-form-item label="所属行业">
          <el-input v-model="form.industry" placeholder="如：餐饮（选填）" />
        </el-form-item>
        <el-form-item label="员工类别">
          <el-select v-model="form.employeeCategory" placeholder="请选择" clearable style="width:100%;">
            <el-option label="全职" :value="1" />
            <el-option label="兼职" :value="2" />
            <el-option label="总公司员工" :value="3" />
            <el-option label="分公司员工" :value="4" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showForm = false">取消</el-button>
        <el-button type="primary" @click="submitForm" :loading="submitting">确定</el-button>
      </template>
    </el-dialog>

    <!-- 批量导入对话框 -->
    <el-dialog v-model="showImport" title="批量导入业务员" width="520px">
      <p style="color:#666;font-size:13px;margin-bottom:12px;">
        请粘贴 JSON 数组，格式：<code>[{"name":"张三","phone":"13800000001"},...]</code><br>
        默认密码 123456，手机号已存在的行将跳过。
      </p>
      <el-input v-model="importJson" type="textarea" :rows="8" placeholder='[{"name":"张三","phone":"13800000001"}]' />
      <p v-if="importResult" :style="`color:${importResult.skip > 0 ? '#e6a23c' : '#67c23a'};font-size:13px;margin-top:8px;`">
        导入完成：成功 {{ importResult.success }} 条，跳过 {{ importResult.skip }} 条
      </p>
      <template #footer>
        <el-button @click="showImport = false">关闭</el-button>
        <el-button type="primary" @click="submitImport" :loading="importing">导入</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { regionData } from 'element-china-area-data'
import { getSalesmanList, addSalesman, updateSalesman, toggleSalesman, batchImportSalesmen } from '../../api'
import { fmtDate } from '../../utils/format'

const loading   = ref(false)
const list      = ref([])
const total     = ref(0)
const query     = reactive({ name: '', status: null, page: 1, size: 15 })
const showForm  = ref(false)
const submitting = ref(false)
const form      = reactive({ id: null, name: '', phone: '', password: '', province: '', city: '', adminDistrict: '', district: '', industry: '', employeeCategory: null })
const regionValue = ref([])
const showImport = ref(false)
const importJson = ref('')
const importing  = ref(false)
const importResult = ref(null)

const cascaderProps = { value: 'label', label: 'label', children: 'children' }

function onRegionChange(val) {
  form.province      = val?.[0] || ''
  form.city          = val?.[1] || ''
  form.adminDistrict = val?.[2] || ''
}

async function load(page) {
  if (page) query.page = page
  loading.value = true
  try {
    const data = await getSalesmanList(query)
    list.value  = data.list || []
    total.value = data.total || 0
  } catch (_) {
  } finally {
    loading.value = false
  }
}

function resetQuery() {
  Object.assign(query, { name: '', status: null, page: 1 })
  load()
}

function openAdd() {
  Object.assign(form, { id: null, name: '', phone: '', password: '', province: '', city: '', adminDistrict: '', district: '', industry: '', employeeCategory: null })
  regionValue.value = []
  showForm.value = true
}

function openEdit(row) {
  Object.assign(form, {
    id: row.id, name: row.name, phone: row.phone, password: '',
    province: row.province || '', city: row.city || '',
    adminDistrict: row.adminDistrict || '',
    district: row.district || '', industry: row.industry || '',
    employeeCategory: row.employeeCategory || null
  })
  regionValue.value = [row.province, row.city, row.adminDistrict].filter(Boolean)
  showForm.value = true
}

async function submitForm() {
  if (!form.name || !form.phone) return ElMessage.warning('姓名和手机号不能为空')
  if (!form.province || !form.city) return ElMessage.warning('请选择所属地区（至少到市）')
  submitting.value = true
  try {
    const payload = {
      name: form.name, phone: form.phone, password: form.password,
      province: form.province, city: form.city, adminDistrict: form.adminDistrict,
      district: form.district, industry: form.industry, employeeCategory: form.employeeCategory
    }
    if (form.id) {
      await updateSalesman(form.id, payload)
    } else {
      await addSalesman(payload)
    }
    ElMessage.success(form.id ? '已更新' : '已新增')
    showForm.value = false
    load()
  } catch (e) {
    ElMessage.error(e?.response?.data?.message || '操作失败')
  } finally {
    submitting.value = false
  }
}

async function toggleStatus(row) {
  const next = row.status === 1 ? 0 : 1
  await ElMessageBox.confirm(`确定要${next === 1 ? '启用' : '禁用'}业务员「${row.name}」吗？`, '提示', { type: 'warning' })
  await toggleSalesman(row.id, next)
  ElMessage.success('已更新')
  load()
}

async function submitImport() {
  let rows
  try { rows = JSON.parse(importJson.value) } catch (_) {
    return ElMessage.error('JSON格式有误')
  }
  if (!Array.isArray(rows)) return ElMessage.error('应为数组格式')
  importing.value = true
  try {
    importResult.value = await batchImportSalesmen(rows)
    load()
  } catch (_) {
    ElMessage.error('导入失败')
  } finally {
    importing.value = false
  }
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
