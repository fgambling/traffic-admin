<template>
  <div>
    <div class="page-header">
      <h2>建议审核</h2>
    </div>

    <!-- 搜索栏 -->
    <el-card shadow="never" style="margin-bottom:16px;">
      <el-form :model="query" inline>
        <el-form-item label="状态">
          <el-select v-model="query.reviewStatus" placeholder="全部" clearable style="width:130px;">
            <el-option label="未操作"  :value="0" />
            <el-option label="优质建议" :value="1" />
            <el-option label="已隐藏"  :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="建议类型">
          <el-select v-model="query.adviceType" placeholder="全部" clearable style="width:110px;">
            <el-option label="备货" value="备货" />
            <el-option label="排班" value="排班" />
            <el-option label="营销" value="营销" />
            <el-option label="服务" value="服务" />
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
      <el-table
        :data="list" stripe v-loading="loading" row-key="id"
        :row-class-name="({ row }) => row.reviewStatus === 2 ? 'row-hidden' : ''"
        style="cursor:pointer;"
        @row-click="openDetail"
      >
        <el-table-column prop="merchantId"   label="商家ID"   width="85"  align="center" />
        <el-table-column prop="merchantName" label="商家名称" width="140" />
        <el-table-column prop="adviceType"   label="类型"     width="85"  align="center">
          <template #default="{ row }">
            <el-tag size="small" v-if="row.adviceType">{{ row.adviceType }}</el-tag>
            <span v-else>--</span>
          </template>
        </el-table-column>
        <el-table-column prop="content" label="建议内容" min-width="260">
          <template #default="{ row }">
            <span class="content-preview">{{ row.content }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="feedback" label="反馈" width="70" align="center">
          <template #default="{ row }">{{ ['—','👍','👎'][row.feedback ?? 0] }}</template>
        </el-table-column>
        <el-table-column label="状态" width="105" align="center">
          <template #default="{ row }">
            <el-tag :type="statusTag(row.reviewStatus).type" size="small">
              {{ statusTag(row.reviewStatus).label }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="生成时间" width="170">
          <template #default="{ row }">{{ fmtDate(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="160" align="center" fixed="right">
          <template #default="{ row }">
            <el-button link type="warning" @click.stop="mark(row, row.reviewStatus === 1 ? 0 : 1)">
              {{ row.reviewStatus === 1 ? '取消优质' : '⭐ 优质' }}
            </el-button>
            <el-button link :type="row.reviewStatus === 2 ? 'primary' : 'info'"
              @click.stop="mark(row, row.reviewStatus === 2 ? 0 : 2)">
              {{ row.reviewStatus === 2 ? '取消隐藏' : '隐藏' }}
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

    <!-- 详情弹窗 -->
    <el-dialog v-model="detailVisible" title="建议详情" width="560px" :close-on-click-modal="true">
      <template v-if="current">
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="商家ID">{{ current.merchantId }}</el-descriptions-item>
          <el-descriptions-item label="商家名称">{{ current.merchantName }}</el-descriptions-item>
          <el-descriptions-item label="建议类型">
            <el-tag size="small" v-if="current.adviceType">{{ current.adviceType }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="置信度">{{ current.confidence || '--' }}</el-descriptions-item>
          <el-descriptions-item label="用户反馈">{{ ['未反馈','👍 有用','👎 无用'][current.feedback ?? 0] }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="statusTag(current.reviewStatus).type" size="small">
              {{ statusTag(current.reviewStatus).label }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="生成时间" :span="2">{{ fmtDate(current.createdAt) }}</el-descriptions-item>
          <el-descriptions-item label="建议内容" :span="2">
            <div style="white-space:pre-wrap;line-height:1.7;">{{ current.content }}</div>
          </el-descriptions-item>
        </el-descriptions>
      </template>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
        <el-button type="warning" @click="mark(current, current.reviewStatus === 1 ? 0 : 1); detailVisible = false">
          {{ current?.reviewStatus === 1 ? '取消优质' : '⭐ 标记优质' }}
        </el-button>
        <el-button :type="current?.reviewStatus === 2 ? 'primary' : 'danger'"
          @click="mark(current, current.reviewStatus === 2 ? 0 : 2); detailVisible = false">
          {{ current?.reviewStatus === 2 ? '取消隐藏' : '隐藏' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getAiAdviceList, reviewAiAdvice } from '../../api'
import { fmtDate } from '../../utils/format'

const loading       = ref(false)
const list          = ref([])
const total         = ref(0)
const query         = reactive({ reviewStatus: null, source: 2, adviceType: null, page: 1, size: 20 })
const detailVisible = ref(false)
const current       = ref(null)

function statusTag(s) {
  return [
    { label: '未操作',  type: 'info'    },
    { label: '优质建议', type: 'success' },
    { label: '已隐藏',  type: 'danger'  }
  ][s ?? 0] ?? { label: '未操作', type: 'info' }
}

function openDetail(row) {
  current.value = row
  detailVisible.value = true
}

async function load(page) {
  if (page) query.page = page
  loading.value = true
  try {
    const data  = await getAiAdviceList(query)
    list.value  = data.list  || []
    total.value = data.total || 0
  } catch (_) {
  } finally {
    loading.value = false
  }
}

function resetQuery() {
  Object.assign(query, { reviewStatus: null, source: 2, adviceType: null, page: 1 })
  load()
}

async function mark(row, status) {
  if (!row) return
  try {
    await reviewAiAdvice(row.id, { reviewStatus: status, adminNote: row.adminNote || '' })
    row.reviewStatus = status
    const msgs = { 0: '已重置', 1: '已标记为优质建议', 2: '已隐藏' }
    ElMessage.success(msgs[status])
  } catch (_) {
    ElMessage.error('操作失败')
  }
}

onMounted(load)
</script>

<style scoped>
.page-header {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  h2 { margin: 0; font-size: 20px; color: #1a1a2e; }
}
.content-preview {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.5;
  color: #333;
}
:deep(.row-hidden) {
  opacity: 0.45;
  td { color: #999 !important; }
}
:deep(.el-table__row) { cursor: pointer; }
</style>
