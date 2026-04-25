<template>
  <div>
    <div class="page-header">
      <h2>管理员账号</h2>
      <el-button type="primary" :icon="Plus" @click="openAdd">新增管理员</el-button>
    </div>
    <el-card shadow="never">
      <el-table :data="list" stripe v-loading="loading">
        <el-table-column prop="id"        label="ID"   width="80" align="center" />
        <el-table-column prop="username"  label="账号" min-width="180" />
        <el-table-column prop="name"      label="姓名" width="140" />
        <el-table-column prop="createdAt" label="创建时间" width="180" />
        <el-table-column label="操作" width="120" align="center">
          <template #default="{ row }">
            <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
            <el-button link type="danger" @click="del(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑管理员' : '新增管理员'" width="420px">
      <el-form :model="form" label-width="80px">
        <el-form-item label="账号"><el-input v-model="form.username" :disabled="isEdit" /></el-form-item>
        <el-form-item label="姓名"><el-input v-model="form.name" /></el-form-item>
        <el-form-item label="密码" v-if="!isEdit"><el-input v-model="form.password" type="password" show-password /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="save">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { getAdminList } from '../../api'
import http from '../../utils/request'

const loading       = ref(false)
const list          = ref([])
const dialogVisible = ref(false)
const isEdit        = ref(false)
const form          = reactive({ id: null, username: '', name: '', password: '' })

async function load() {
  loading.value = true
  try { list.value = (await getAdminList()) || [] } catch (_) {}
  loading.value = false
}

function openAdd() {
  Object.assign(form, { id: null, username: '', name: '', password: '' })
  isEdit.value = false
  dialogVisible.value = true
}

function openEdit(row) {
  Object.assign(form, { id: row.id, username: row.username, name: row.name, password: '' })
  isEdit.value = true
  dialogVisible.value = true
}

async function save() {
  if (!form.username) return ElMessage.warning('账号不能为空')
  if (isEdit.value) {
    await http.put(`/api/admin/system/admins/${form.id}`, { name: form.name })
  } else {
    if (!form.password) return ElMessage.warning('密码不能为空')
    await http.post('/api/admin/system/admins', form)
  }
  ElMessage.success('保存成功')
  dialogVisible.value = false
  load()
}

async function del(row) {
  await ElMessageBox.confirm(`确定删除管理员「${row.username}」？`, '提示', { type: 'warning' })
  await http.delete(`/api/admin/system/admins/${row.id}`)
  ElMessage.success('已删除')
  load()
}

onMounted(load)
</script>

<style scoped>
.page-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:16px; h2 { margin:0;font-size:20px; } }
</style>
