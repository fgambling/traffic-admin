<template>
  <div>
    <div class="page-header">
      <h2>建议审核</h2>
    </div>

    <!-- 搜索栏 -->
    <el-card shadow="never" style="margin-bottom:16px;">
      <el-form :model="query" inline>
        <el-form-item label="审核状态">
          <el-select v-model="query.reviewStatus" placeholder="全部" clearable style="width:120px;">
            <el-option label="未审核" :value="0" />
            <el-option label="已采纳" :value="1" />
            <el-option label="待优化" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="来源">
          <el-select v-model="query.source" placeholder="全部" clearable style="width:120px;">
            <el-option label="规则引擎" :value="1" />
            <el-option label="AI大模型" :value="2" />
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
        <el-table-column prop="id"          label="ID"     width="80" align="center" />
        <el-table-column prop="merchantId"  label="商家ID" width="90" align="center" />
        <el-table-column prop="adviceType"  label="类型"   width="90" align="center">
          <template #default="{ row }">
            <el-tag size="small">{{ row.adviceType || '--' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="source"      label="来源"   width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.source === 2 ? 'warning' : 'info'" size="small">
              {{ row.source === 2 ? 'AI大模型' : '规则引擎' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="content"     label="建议内容" min-width="260" show-overflow-tooltip />
        <el-table-column prop="feedback"    label="用户反馈" width="90" align="center">
          <template #default="{ row }">
            <span>{{ ['—','👍','👎'][row.feedback ?? 0] }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="reviewStatus" label="审核状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="['info','success','warning'][row.reviewStatus ?? 0]" size="small">
              {{ ['未审核','已采纳','待优化'][row.reviewStatus ?? 0] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="adminNote"   label="管理员备注" min-width="140" show-overflow-tooltip />
        <el-table-column prop="createdAt" label="生成时间" width="180">
          <template #default="{ row }">{{ fmtDate(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="160" align="center" fixed="right">
          <template #default="{ row }">
            <el-button link type="success" @click="openReview(row, 1)">采纳</el-button>
            <el-button link type="warning" @click="openReview(row, 2)">待优化</el-button>
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

    <!-- 审核备注弹窗 -->
    <el-dialog v-model="showNote" :title="noteStatus === 1 ? '采纳建议' : '标记待优化'" width="420px">
      <el-input v-model="noteText" type="textarea" :rows="4" placeholder="管理员备注（选填）" />
      <template #footer>
        <el-button @click="showNote = false">取消</el-button>
        <el-button :type="noteStatus === 1 ? 'success' : 'warning'" @click="submitReview" :loading="submitting">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getAiAdviceList, reviewAiAdvice } from '../../api'
import { fmtDate } from '../../utils/format'

const loading    = ref(false)
const list       = ref([])
const total      = ref(0)
const query      = reactive({ reviewStatus: null, source: null, page: 1, size: 20 })
const showNote   = ref(false)
const noteText   = ref('')
const noteStatus = ref(1)
const currentId  = ref(null)
const submitting = ref(false)

async function load(page) {
  if (page) query.page = page
  loading.value = true
  try {
    const data = await getAiAdviceList(query)
    list.value  = data.list || []
    total.value = data.total || 0
  } catch (_) {
  } finally {
    loading.value = false
  }
}

function resetQuery() {
  Object.assign(query, { reviewStatus: null, source: null, page: 1 })
  load()
}

function openReview(row, status) {
  currentId.value  = row.id
  noteStatus.value = status
  noteText.value   = row.adminNote || ''
  showNote.value   = true
}

async function submitReview() {
  submitting.value = true
  try {
    await reviewAiAdvice(currentId.value, { reviewStatus: noteStatus.value, adminNote: noteText.value })
    ElMessage.success(noteStatus.value === 1 ? '已标记采纳' : '已标记待优化')
    showNote.value = false
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
