<template>
  <div>
    <div class="page-header">
      <h2>跟进管理</h2>
    </div>

    <!-- 搜索栏 -->
    <el-card shadow="never" style="margin-bottom:16px;">
      <el-form :model="query" inline>
        <el-form-item label="商家名称">
          <el-input v-model="query.merchantName" placeholder="商家名称" clearable style="width:160px;" />
        </el-form-item>
        <el-form-item label="业务员">
          <el-input v-model="query.salesmanName" placeholder="业务员姓名" clearable style="width:140px;" />
        </el-form-item>
        <el-form-item label="跟进状态">
          <el-select v-model="query.status" placeholder="全部" clearable style="width:120px;">
            <el-option label="接洽中"  :value="1" />
            <el-option label="已合作"  :value="2" />
            <el-option label="已失效"  :value="3" />
            <el-option label="待审批"  :value="4" />
            <el-option label="审批失败" :value="5" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="load(1)">查询</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never">
      <el-table :data="list" stripe v-loading="loading">
        <el-table-column prop="salesmanName"  label="业务员"   width="110" />
        <el-table-column prop="salesmanPhone" label="业务员电话" width="135" />
        <el-table-column prop="merchantName"  label="商家名称" min-width="140" />
        <el-table-column prop="contactPerson" label="联系人"   width="100" />
        <el-table-column prop="contactPhone"  label="联系电话" width="135" />
        <el-table-column prop="address"       label="地址"     min-width="160" show-overflow-tooltip />
        <el-table-column prop="status"        label="状态"     width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="statusTag(row.status).type" size="small">
              {{ statusTag(row.status).label }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="updatedAt" label="更新时间" width="155">
          <template #default="{ row }">{{ fmtDate(row.updatedAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="100" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="openDetail(row)">
              {{ row.status === 4 ? '审批' : '查看' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="query.page"
        :page-size="query.size"
        :total="total"
        layout="total, prev, pager, next"
        style="margin-top:16px;justify-content:flex-end;"
        @current-change="p => load(p)"
      />
    </el-card>

    <!-- ── 审批详情弹窗 ── -->
    <el-dialog
      v-model="dialogVisible"
      :title="currentRow?.status === 4 ? '合作申请审批' : '跟进详情'"
      width="560px"
      :close-on-click-modal="false"
      @closed="resetDialog"
    >
      <template v-if="currentRow">
        <!-- 基本信息 -->
        <el-descriptions :column="2" border size="small" style="margin-bottom:16px;">
          <el-descriptions-item label="商家名称" :span="2">{{ currentRow.merchantName }}</el-descriptions-item>
          <el-descriptions-item label="联系人">{{ currentRow.contactPerson || '--' }}</el-descriptions-item>
          <el-descriptions-item label="联系电话">{{ currentRow.contactPhone || '--' }}</el-descriptions-item>
          <el-descriptions-item label="地址" :span="2">{{ currentRow.address || '--' }}</el-descriptions-item>
          <el-descriptions-item label="业务员">{{ currentRow.salesmanName }}</el-descriptions-item>
          <el-descriptions-item label="业务员电话">{{ currentRow.salesmanPhone }}</el-descriptions-item>
          <el-descriptions-item label="跟进状态">
            <el-tag :type="statusTag(currentRow.status).type" size="small">
              {{ statusTag(currentRow.status).label }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="更新时间">{{ fmtDate(currentRow.updatedAt) }}</el-descriptions-item>
        </el-descriptions>

        <!-- 合作信息（金额 + 凭证） -->
        <div v-if="currentRow.commission || currentRow.voucherUrl" class="cooperation-section">
          <div class="section-title">合作信息</div>
          <div class="info-row" v-if="currentRow.commission">
            <span class="info-label">合作金额</span>
            <span class="info-val amount">¥{{ Number(currentRow.commission).toFixed(2) }}</span>
          </div>
          <div class="info-row" v-if="currentRow.voucherUrl">
            <span class="info-label">合作凭证</span>
            <el-image
              :src="currentRow.voucherUrl"
              :preview-src-list="[currentRow.voucherUrl]"
              preview-teleported
              fit="cover"
              class="voucher-thumb"
            />
          </div>
        </div>

        <!-- 历史记录（备注） -->
        <div class="records-section">
          <div class="section-title">跟进记录</div>
          <div v-if="recordsLoading" style="text-align:center;padding:16px;">
            <el-icon class="is-loading"><Loading /></el-icon>
          </div>
          <div v-else-if="records.length === 0" class="records-empty">暂无记录</div>
          <div v-else class="records-list">
            <div v-for="rec in records" :key="rec.id" class="record-item">
              <el-tag
                :type="rec.type === 'status' ? 'warning' : 'info'"
                size="small"
                style="margin-right:8px;flex-shrink:0;"
              >{{ rec.type === 'status' ? '状态' : '记录' }}</el-tag>
              <div class="record-body">
                <div class="record-content">{{ rec.content }}</div>
                <div class="record-time">{{ fmtDate(rec.createdAt) }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 审批操作区（仅 status=4 显示） -->
        <template v-if="currentRow.status === 4">
          <el-divider />

          <!-- 拒绝原因输入（点击"驳回"后展开） -->
          <div v-if="showRejectInput" class="reject-reason">
            <div class="section-title">驳回原因</div>
            <el-input
              v-model="rejectReason"
              type="textarea"
              :rows="3"
              placeholder="请填写驳回原因（可选）"
              maxlength="200"
              show-word-limit
            />
            <div class="reject-actions">
              <el-button @click="showRejectInput = false">取消</el-button>
              <el-button type="danger" :loading="rejecting" @click="confirmReject">确认驳回</el-button>
            </div>
          </div>

          <!-- 主操作按钮 -->
          <div v-else class="dialog-actions">
            <el-button type="danger" plain @click="showRejectInput = true">驳回申请</el-button>
            <el-button type="success" :loading="approving" @click="confirmApprove">通过审批</el-button>
          </div>
        </template>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Loading } from '@element-plus/icons-vue'
import { getFollowList, getFollowRecords, approveFollow, rejectFollow } from '../../api'

const loading = ref(false)
const list    = ref([])
const total   = ref(0)
const query   = reactive({ merchantName: '', salesmanName: '', status: null, page: 1, size: 15 })

// ── 弹窗状态 ──────────────────────────────────────────────────
const dialogVisible   = ref(false)
const currentRow      = ref(null)
const records         = ref([])
const recordsLoading  = ref(false)
const approving       = ref(false)
const rejecting       = ref(false)
const showRejectInput = ref(false)
const rejectReason    = ref('')

function statusTag(s) {
  return {
    1: { type: 'primary', label: '接洽中'  },
    2: { type: 'success', label: '已合作'  },
    3: { type: 'info',    label: '已失效'  },
    4: { type: 'warning', label: '待审批'  },
    5: { type: 'danger',  label: '审批失败' }
  }[s] || { type: 'info', label: '未知' }
}

function fmtDate(dt) {
  if (!dt) return '--'
  return new Date(dt).toLocaleString('zh-CN', { hour12: false }).slice(0, 16)
}

async function load(page) {
  if (page) query.page = page
  loading.value = true
  try {
    const data = await getFollowList({
      status:       query.status       || undefined,
      merchantName: query.merchantName || undefined,
      salesmanName: query.salesmanName || undefined,
      page:         query.page,
      size:         query.size
    })
    list.value  = data.list  || []
    total.value = data.total || 0
  } finally {
    loading.value = false
  }
}

function resetQuery() {
  Object.assign(query, { merchantName: '', salesmanName: '', status: null, page: 1 })
  load()
}

async function openDetail(row) {
  currentRow.value    = row
  records.value       = []
  showRejectInput.value = false
  rejectReason.value  = ''
  dialogVisible.value = true

  recordsLoading.value = true
  try {
    records.value = await getFollowRecords(row.id)
  } catch (_) {
    records.value = []
  } finally {
    recordsLoading.value = false
  }
}

function resetDialog() {
  currentRow.value    = null
  records.value       = []
  showRejectInput.value = false
  rejectReason.value  = ''
}

async function confirmApprove() {
  await ElMessageBox.confirm(
    `确认通过「${currentRow.value.merchantName}」的合作申请？合作金额：¥${Number(currentRow.value.commission || 0).toFixed(2)}`,
    '审批通过', { type: 'success', confirmButtonText: '确认通过', cancelButtonText: '取消' }
  )
  approving.value = true
  try {
    await approveFollow(currentRow.value.id)
    ElMessage.success('审批已通过')
    dialogVisible.value = false
    load()
  } finally {
    approving.value = false
  }
}

async function confirmReject() {
  rejecting.value = true
  try {
    await rejectFollow(currentRow.value.id, rejectReason.value.trim() || undefined)
    ElMessage.success('已驳回')
    dialogVisible.value = false
    load()
  } finally {
    rejecting.value = false
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

.section-title {
  font-size: 13px;
  font-weight: 600;
  color: #606266;
  margin-bottom: 10px;
}

.cooperation-section {
  background: #f8f9fa;
  border-radius: 6px;
  padding: 14px 16px;
  margin-bottom: 16px;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
  &:last-child { margin-bottom: 0; }
}

.info-label {
  font-size: 13px;
  color: #909399;
  width: 64px;
  flex-shrink: 0;
}

.info-val { font-size: 14px; color: #303133; }
.info-val.amount { font-size: 18px; font-weight: 700; color: #17794a; }

.voucher-thumb {
  width: 180px;
  height: 120px;
  border-radius: 6px;
  border: 1px solid #eee;
  cursor: pointer;
}

.records-section {
  margin-bottom: 8px;
}

.records-empty {
  font-size: 13px;
  color: #c0c4cc;
  text-align: center;
  padding: 12px 0;
}

.records-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 220px;
  overflow-y: auto;
}

.record-item {
  display: flex;
  align-items: flex-start;
  gap: 0;
  background: #f8f9fa;
  border-radius: 6px;
  padding: 10px 12px;
}

.record-body {
  flex: 1;
  min-width: 0;
}

.record-content {
  font-size: 13px;
  color: #303133;
  line-height: 1.6;
  white-space: pre-line;
}

.record-time {
  font-size: 12px;
  color: #c0c4cc;
  margin-top: 4px;
}

.reject-reason {
  .reject-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 12px;
  }
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
