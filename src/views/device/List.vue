<template>
  <div>
    <div class="page-header">
      <h2>设备管理</h2>
      <el-button type="primary" :icon="Plus" @click="bindVisible = true">绑定设备</el-button>
    </div>

    <!-- 搜索 -->
    <el-card shadow="never" style="margin-bottom:16px;">
      <el-form :model="query" inline>
        <el-form-item label="设备ID">
          <el-input v-model="query.deviceId" placeholder="设备编号" clearable style="width:180px;" />
        </el-form-item>
        <el-form-item label="商家名称">
          <el-input v-model="query.merchantName" placeholder="所属商家" clearable style="width:180px;" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="query.status" placeholder="全部" clearable style="width:120px;">
            <el-option label="在线" :value="1" />
            <el-option label="离线" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="load(1)">查询</el-button>
          <el-button @click="reset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never">
      <el-table :data="list" stripe v-loading="loading">
        <el-table-column prop="deviceId"     label="设备编号"  min-width="160" />
        <el-table-column prop="merchantName" label="所属商家"  min-width="150" />
        <el-table-column prop="brand"        label="品牌型号"  width="140" />
        <el-table-column prop="location"     label="安装位置"  width="140" />
        <el-table-column prop="lastHeartbeat" label="最后心跳" width="180" />
        <el-table-column prop="online"       label="状态"     width="100" align="center">
          <template #default="{ row }">
            <el-badge :is-dot="true" :type="row.online ? 'success' : 'danger'">
              <el-tag :type="row.online ? 'success' : 'danger'" size="small">
                {{ row.online ? '在线' : '离线' }}
              </el-tag>
            </el-badge>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" align="center">
          <template #default="{ row }">
            <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
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

    <!-- 编辑弹窗 -->
    <el-dialog v-model="editVisible" title="编辑设备" width="420px">
      <el-form :model="editForm" label-width="90px">
        <el-form-item label="安装位置"><el-input v-model="editForm.location" /></el-form-item>
        <el-form-item label="备注">    <el-input v-model="editForm.remark" type="textarea" :rows="3" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editVisible = false">取消</el-button>
        <el-button type="primary" @click="saveEdit">保存</el-button>
      </template>
    </el-dialog>

    <!-- 绑定设备弹窗 -->
    <el-dialog v-model="bindVisible" title="绑定设备到商家" width="420px">
      <el-form :model="bindForm" label-width="90px">
        <el-form-item label="设备编号"><el-input v-model="bindForm.deviceId" placeholder="扫码或手动输入" /></el-form-item>
        <el-form-item label="商家ID">  <el-input v-model="bindForm.merchantId" placeholder="商家ID" /></el-form-item>
        <el-form-item label="安装位置"><el-input v-model="bindForm.location" placeholder="如：入口处" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="bindVisible = false">取消</el-button>
        <el-button type="primary" @click="saveBind">绑定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { getDeviceList, updateDevice, bindDevice } from '../../api'

const loading     = ref(false)
const list        = ref([])
const total       = ref(0)
const editVisible = ref(false)
const bindVisible = ref(false)
const query       = reactive({ deviceId: '', merchantName: '', status: null, page: 1, size: 15 })
const editForm    = reactive({ id: null, location: '', remark: '' })
const bindForm    = reactive({ deviceId: '', merchantId: '', location: '' })

async function load(page) {
  if (page) query.page = page
  loading.value = true
  try {
    const data = await getDeviceList(query)
    list.value  = data.list || []
    total.value = data.total || 0
  } catch (_) {
  } finally {
    loading.value = false
  }
}

function reset() {
  Object.assign(query, { deviceId: '', merchantName: '', status: null, page: 1 })
  load()
}

function openEdit(row) {
  Object.assign(editForm, { id: row.id, location: row.location, remark: row.remark })
  editVisible.value = true
}

async function saveEdit() {
  await updateDevice(editForm.id, { location: editForm.location, remark: editForm.remark })
  ElMessage.success('保存成功')
  editVisible.value = false
  load()
}

async function saveBind() {
  await bindDevice(bindForm)
  ElMessage.success('绑定成功')
  bindVisible.value = false
  Object.assign(bindForm, { deviceId: '', merchantId: '', location: '' })
  load()
}

onMounted(load)
</script>

<style scoped>
.page-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:16px; h2 { margin:0;font-size:20px; } }
</style>
