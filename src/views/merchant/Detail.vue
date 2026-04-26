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
            <el-descriptions-item label="注册时间">{{ fmtDate(detail.createdAt) }}</el-descriptions-item>
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

    <!-- 业务员跟进信息（可折叠） -->
    <el-card shadow="never" style="margin-top:16px;padding:0;" :body-style="{ padding: 0 }">
      <el-collapse v-model="followCollapse" @change="onFollowCollapseChange">
        <el-collapse-item name="follows">
          <template #title>
            <span style="font-weight:600;padding-left:4px;">业务员跟进信息</span>
            <el-tag v-if="follows.length" size="small" style="margin-left:10px;">{{ follows.length }} 位业务员</el-tag>
          </template>

          <div v-if="followsLoading" style="text-align:center;padding:24px;">
            <el-icon class="is-loading" :size="24"><Loading /></el-icon>
          </div>

          <div v-else-if="follows.length === 0" style="color:#999;padding:16px 20px;">暂无业务员跟进记录</div>

          <div v-else class="follow-list">
            <div v-for="f in follows" :key="f.followId" class="follow-block">
              <!-- 业务员信息头 -->
              <div class="follow-header">
                <div class="follow-salesman">
                  <span class="sm-name">{{ f.salesmanName }}</span>
                  <span class="sm-phone">{{ f.salesmanPhone }}</span>
                </div>
                <div class="follow-meta">
                  <el-tag :type="followStatusTag(f.status).type" size="small">
                    {{ followStatusTag(f.status).label }}
                  </el-tag>
                  <span v-if="f.commission" class="sm-commission">
                    合作金额：¥{{ Number(f.commission).toFixed(2) }}
                  </span>
                  <span v-if="f.cooperationTime" class="sm-time">
                    合作时间：{{ fmtDate(f.cooperationTime) }}
                  </span>
                </div>
              </div>

              <!-- 跟进历史记录 -->
              <div class="follow-records">
                <div v-if="!recordsMap[f.followId]" style="color:#ccc;font-size:13px;">加载中...</div>
                <div v-else-if="recordsMap[f.followId].length === 0" style="color:#ccc;font-size:13px;">暂无历史记录</div>
                <div v-else class="rec-timeline">
                  <div v-for="rec in recordsMap[f.followId]" :key="rec.id" class="rec-item">
                    <div class="rec-dot" :class="rec.type === 'status' ? 'dot-status' : 'dot-note'" />
                    <div class="rec-body">
                      <el-tag :type="rec.type === 'status' ? 'warning' : 'info'" size="small" style="margin-right:6px;">
                        {{ rec.type === 'status' ? '状态' : '记录' }}
                      </el-tag>
                      <span class="rec-content">{{ rec.content }}</span>
                      <el-image
                        v-if="rec.imageUrl"
                        :src="rec.imageUrl"
                        :preview-src-list="[rec.imageUrl]"
                        class="rec-image"
                        fit="cover"
                        preview-teleported
                      />
                      <div class="rec-time">{{ fmtDate(rec.createdAt) }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </el-collapse-item>
      </el-collapse>
    </el-card>

    <!-- 编辑弹窗 -->
    <el-dialog v-model="editVisible" title="编辑商家信息" width="500px">
      <el-form :model="editForm" label-width="100px">
        <el-form-item label="商家名称"><el-input v-model="editForm.name" /></el-form-item>
        <el-form-item label="联系人">  <el-input v-model="editForm.contactPerson" /></el-form-item>
        <el-form-item label="联系电话">
          <el-input v-model="editForm.contactPhone" />
          <div style="font-size:12px;color:#909399;margin-top:4px;">该电话号码同时作为商家登录账号，修改后商家需使用新号码登录</div>
        </el-form-item>
        <el-form-item label="地址">    <el-input v-model="editForm.address" /></el-form-item>
        <el-form-item label="营业执照"><el-input v-model="editForm.licenseNo" /></el-form-item>
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
import { ArrowLeft, Loading } from '@element-plus/icons-vue'
import { getMerchantDetail, updateMerchant, toggleMerchant, getMerchantFollows, getFollowRecords } from '../../api'

const route   = useRoute()
const id      = route.params.id
const loading = ref(false)
const detail  = ref({})
const editVisible = ref(false)
const editForm    = reactive({})

// ── 跟进折叠区 ─────────────────────────────────────────────
const followCollapse = ref([])        // 控制折叠展开
const followsLoading = ref(false)
const follows        = ref([])        // MerchantFollow 列表（含业务员信息）
const recordsMap     = reactive({})   // followId → FollowRecord[]
let   followsLoaded  = false

async function onFollowCollapseChange(active) {
  if (!active.includes('follows') || followsLoaded) return
  followsLoaded    = true
  followsLoading.value = true
  try {
    follows.value = await getMerchantFollows(id)
    // 并行加载所有业务员的历史记录
    await Promise.all(follows.value.map(async f => {
      try {
        recordsMap[f.followId] = await getFollowRecords(f.followId)
      } catch (_) {
        recordsMap[f.followId] = []
      }
    }))
  } catch (_) {
    follows.value = []
  } finally {
    followsLoading.value = false
  }
}

const followStatusTag = s => ({
  1: { type: 'primary', label: '接洽中'  },
  2: { type: 'success', label: '已合作'  },
  3: { type: 'info',    label: '已失效'  },
  4: { type: 'warning', label: '待审批'  },
  5: { type: 'danger',  label: '审批失败' }
}[s] || { type: 'info', label: '未知' })

function fmtDate(dt) {
  if (!dt) return '--'
  const d = new Date(dt)
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}/${pad(d.getMonth()+1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// ── 基础信息 ────────────────────────────────────────────────
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
    detail.value = data
    Object.assign(editForm, { name: data.name, contactPerson: data.contactPerson, contactPhone: data.contactPhone, address: data.address, licenseNo: data.licenseNo })
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

/* ── 跟进列表 ── */
.follow-list {
  padding: 0 4px 8px;
}

.follow-block {
  border: 1px solid #ebeef5;
  border-radius: 8px;
  margin-bottom: 12px;
  overflow: hidden;

  &:last-child { margin-bottom: 0; }
}

.follow-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
  padding: 12px 16px;
  background: #f8f9fa;
  border-bottom: 1px solid #ebeef5;
}

.follow-salesman {
  display: flex;
  align-items: center;
  gap: 10px;
}

.sm-name  { font-weight: 600; font-size: 14px; color: #303133; }
.sm-phone { font-size: 13px; color: #909399; }

.follow-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.sm-commission { font-size: 13px; color: #17794a; font-weight: 500; }
.sm-time       { font-size: 13px; color: #909399; }

/* ── 历史记录时间线 ── */
.follow-records {
  padding: 12px 16px;
}

.rec-timeline {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.rec-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.rec-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-top: 6px;
  flex-shrink: 0;

  &.dot-status { background: #e6a23c; }
  &.dot-note   { background: #909399; }
}

.rec-body { flex: 1; min-width: 0; }

.rec-content {
  font-size: 13px;
  color: #303133;
  line-height: 1.6;
  white-space: pre-line;
  vertical-align: middle;
}

.rec-image {
  display: block;
  width: 120px;
  height: 90px;
  border-radius: 6px;
  margin-top: 8px;
  cursor: pointer;
  border: 1px solid #ebeef5;
}

.rec-time {
  font-size: 12px;
  color: #c0c4cc;
  margin-top: 2px;
}
</style>
