<template>
  <div>
    <div class="page-header">
      <h2>提现审核</h2>
    </div>

    <!-- 搜索栏 -->
    <el-card shadow="never" style="margin-bottom:16px;">
      <el-form :model="query" inline>
        <el-form-item label="业务员">
          <el-input v-model="query.salesmanName" placeholder="姓名搜索" clearable style="width:140px;" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="query.status" placeholder="全部" clearable style="width:120px;">
            <el-option label="待审核" :value="0" />
            <el-option label="已打款" :value="1" />
            <el-option label="已驳回" :value="2" />
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
        <el-table-column prop="id"           label="申请ID"   width="90" align="center" />
        <el-table-column prop="salesmanName" label="业务员"   width="120" />
        <el-table-column prop="salesmanPhone" label="手机号"  width="140" />
        <el-table-column prop="amount"       label="申请金额" width="120" align="right">
          <template #default="{ row }">¥{{ Number(row.amount || 0).toFixed(2) }}</template>
        </el-table-column>
        <el-table-column prop="way"          label="提现方式" width="100" align="center">
          <template #default="{ row }">
            <el-tag size="small">{{ { alipay:'支付宝', wechat:'微信', bank:'银行卡' }[row.way] || row.way }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="account"      label="收款账号" min-width="160" />
        <el-table-column prop="status"       label="状态"    width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="['warning','success','danger'][row.status]" size="small">
              {{ ['待审核','已打款','已驳回'][row.status] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="remark"       label="备注"    min-width="120" />
        <el-table-column prop="createdAt" label="申请时间" width="180">
          <template #default="{ row }">{{ fmtDate(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="160" align="center" fixed="right">
          <template #default="{ row }">
            <template v-if="row.status === 0">
              <el-button link type="success" @click="approve(row)">通过</el-button>
              <el-button link type="danger"  @click="reject(row)">驳回</el-button>
            </template>
            <span v-else style="color:#bbb;font-size:13px;">已处理</span>
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

    <!-- 驳回备注弹窗 -->
    <el-dialog v-model="showReject" title="驳回原因" width="400px">
      <el-input v-model="rejectRemark" type="textarea" :rows="4" placeholder="请填写驳回原因（将退还业务员余额）" />
      <template #footer>
        <el-button @click="showReject = false">取消</el-button>
        <el-button type="danger" @click="confirmReject" :loading="submitting">确认驳回</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getWithdrawList, approveWithdraw, rejectWithdraw } from '../../api'
import { fmtDate } from '../../utils/format'

const loading    = ref(false)
const list       = ref([])
const total      = ref(0)
const query      = reactive({ salesmanName: '', status: null, page: 1, size: 15 })
const showReject = ref(false)
const rejectRemark = ref('')
const submitting = ref(false)
const currentId  = ref(null)

async function load(page) {
  if (page) query.page = page
  loading.value = true
  try {
    const data = await getWithdrawList({
      salesmanName: query.salesmanName || undefined,
      status:       query.status ?? undefined,
      page:         query.page,
      size:         query.size
    })
    list.value  = data.list || []
    total.value = data.total || 0
  } catch (_) {
  } finally {
    loading.value = false
  }
}

function resetQuery() {
  Object.assign(query, { salesmanName: '', status: null, page: 1 })
  load()
}

async function approve(row) {
  await ElMessageBox.confirm(`确定通过 ¥${Number(row.amount).toFixed(2)} 的提现申请吗？`, '确认打款', { type: 'warning' })
  await approveWithdraw(row.id, { remark: '' })
  ElMessage.success('已通过')
  load()
}

function reject(row) {
  currentId.value  = row.id
  rejectRemark.value = ''
  showReject.value = true
}

async function confirmReject() {
  submitting.value = true
  try {
    await rejectWithdraw(currentId.value, { remark: rejectRemark.value })
    ElMessage.success('已驳回，余额已退还')
    showReject.value = false
    load()
  } catch (_) {
    ElMessage.error('操作失败')
  } finally {
    submitting.value = false
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
