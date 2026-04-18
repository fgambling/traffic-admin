<template>
  <div>
    <div class="page-header">
      <el-button :icon="ArrowLeft" @click="$router.back()">返回</el-button>
      <h2>商家详情</h2>
    </div>

    <el-row :gutter="16" v-loading="loading">
      <!-- 基本信息 -->
      <el-col :span="12">
        <el-card shadow="never" header="基本信息">
          <el-descriptions :column="1" border>
            <el-descriptions-item label="商家ID">{{ detail.id }}</el-descriptions-item>
            <el-descriptions-item label="商家名称">{{ detail.name }}</el-descriptions-item>
            <el-descriptions-item label="营业执照">{{ detail.licenseNo }}</el-descriptions-item>
            <el-descriptions-item label="联系人">{{ detail.contactPerson }}</el-descriptions-item>
            <el-descriptions-item label="联系电话">{{ detail.contactPhone }}</el-descriptions-item>
            <el-descriptions-item label="地址">{{ detail.address || '--' }}</el-descriptions-item>
            <el-descriptions-item label="套餐">
              <el-tag :type="detail.packageType === 2 ? 'primary' : 'info'" size="small">
                {{ detail.packageType === 2 ? '高级版' : '基础版' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag :type="statusTag(detail.status).type" size="small">{{ statusTag(detail.status).label }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="注册时间">{{ detail.createdAt }}</el-descriptions-item>
          </el-descriptions>
          <div style="margin-top:16px;display:flex;gap:8px;">
            <el-button type="primary" @click="editVisible = true">编辑信息</el-button>
            <el-button :type="detail.status === 1 ? 'danger' : 'success'" @click="toggleStatus">
              {{ detail.status === 1 ? '禁用账号' : '启用账号' }}
            </el-button>
          </div>
        </el-card>
      </el-col>

      <!-- 今日数据快照 -->
      <el-col :span="12">
        <el-card shadow="never" header="今日数据快照">
          <el-row :gutter="12">
            <el-col :span="12" v-for="s in snapCards" :key="s.label">
              <div class="snap-item">
                <div class="snap-val">{{ s.val }}</div>
                <div class="snap-label">{{ s.label }}</div>
              </div>
            </el-col>
          </el-row>
        </el-card>
      </el-col>
    </el-row>

    <!-- 编辑弹窗 -->
    <el-dialog v-model="editVisible" title="编辑商家信息" width="500px">
      <el-form :model="editForm" label-width="100px">
        <el-form-item label="商家名称"><el-input v-model="editForm.name" /></el-form-item>
        <el-form-item label="联系人">  <el-input v-model="editForm.contactPerson" /></el-form-item>
        <el-form-item label="联系电话"><el-input v-model="editForm.contactPhone" /></el-form-item>
        <el-form-item label="地址">    <el-input v-model="editForm.address" /></el-form-item>
        <el-form-item label="套餐">
          <el-select v-model="editForm.packageType">
            <el-option label="基础版" :value="1" />
            <el-option label="高级版" :value="2" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editVisible = false">取消</el-button>
        <el-button type="primary" @click="saveEdit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'
import { getMerchantDetail, updateMerchant, toggleMerchant } from '../../api'

const route   = useRoute()
const id      = route.params.id
const loading = ref(false)
const detail  = ref({})
const editVisible = ref(false)
const editForm    = reactive({})

const statusTag = s => ({ 0: { type: 'warning', label: '待激活' }, 1: { type: 'success', label: '正常' }, 2: { type: 'danger', label: '禁用' } }[s] || { type: 'info', label: '未知' })

const snapCards = computed(() => {
  const d = detail.value.todaySnapshot || {}
  return [
    { label: '今日进店', val: d.totalEnter || 0 },
    { label: '当前在店', val: d.currentInStore || 0 },
    { label: '平均停留', val: formatStay(d.avgStaySeconds) },
    { label: '女性占比', val: `${d.femaleRatio || 0}%` }
  ]
})

async function load() {
  loading.value = true
  try {
    const data = await getMerchantDetail(id)
    Object.assign(detail, data)
    detail.value = data
    Object.assign(editForm, { name: data.name, contactPerson: data.contactPerson, contactPhone: data.contactPhone, address: data.address, packageType: data.packageType })
  } catch (_) {
  } finally {
    loading.value = false
  }
}

async function saveEdit() {
  await updateMerchant(id, editForm)
  ElMessage.success('保存成功')
  editVisible.value = false
  load()
}

async function toggleStatus() {
  const next = detail.value.status === 1 ? 2 : 1
  await ElMessageBox.confirm(`确定${next === 1 ? '启用' : '禁用'}该商家吗？`, '提示', { type: 'warning' })
  await toggleMerchant(id, next)
  ElMessage.success('操作成功')
  load()
}

function formatStay(secs) {
  if (!secs) return '--'
  const m = Math.floor(secs / 60), s = secs % 60
  return s > 0 ? `${m}分${s}秒` : `${m}分钟`
}

onMounted(load)
</script>

<style scoped>
.page-header { display:flex; align-items:center; gap:16px; margin-bottom:16px; h2 { margin:0;font-size:20px; } }
.snap-item { background:#f5f7fa; border-radius:8px; padding:16px; text-align:center; margin-bottom:12px; }
.snap-val  { font-size:28px; font-weight:700; color:#1a1a2e; }
.snap-label{ font-size:13px; color:#999; margin-top:4px; }
</style>
