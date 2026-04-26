<template>
  <div>
    <div class="page-header">
      <h2>佣金规则配置</h2>
      <el-button type="primary" @click="openAdd">新增规则</el-button>
    </div>

    <el-card shadow="never">
      <el-table :data="rules" stripe v-loading="loading">
        <el-table-column prop="name" label="规则名称" min-width="160" />
        <el-table-column label="类型" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.rate > 0 ? 'warning' : 'success'" size="small">
              {{ row.rate > 0 ? '按比例' : '固定金额' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="佣金" width="140" align="right">
          <template #default="{ row }">
            <span v-if="row.rate > 0">{{ (row.rate * 100).toFixed(2).replace(/\.?0+$/, '') }}%</span>
            <span v-else>¥{{ Number(row.fixedAmount).toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="说明" min-width="200" />
        <el-table-column prop="updatedAt" label="更新时间" width="180">
          <template #default="{ row }">{{ fmtDate(row.updatedAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="130" align="center" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
            <el-button link type="danger"  @click="del(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新增/编辑 -->
    <el-dialog v-model="showForm" :title="form.id ? '编辑规则' : '新增规则'" width="460px" @closed="valueError = ''">
      <el-form :model="form" label-width="90px">
        <el-form-item label="规则名称">
          <el-input v-model="form.name" placeholder="例：高级版首单佣金" />
        </el-form-item>
        <el-form-item label="佣金类型">
          <el-radio-group v-model="form.ruleType" @change="() => { form.valueStr = ''; valueError = '' }">
            <el-radio value="rate">按比例</el-radio>
            <el-radio value="fixed">固定金额</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item :label="form.ruleType === 'rate' ? '佣金比例' : '固定金额'">
          <el-input
            v-model="form.valueStr"
            :placeholder="form.ruleType === 'rate' ? '0 到 100 之间的数字' : '请输入金额'"
            style="width:220px;"
            @input="valueError = ''"
          >
            <template #append>{{ form.ruleType === 'rate' ? '%' : '元' }}</template>
          </el-input>
          <div v-if="valueError" style="color:#f56c6c;font-size:12px;margin-top:4px;">{{ valueError }}</div>
        </el-form-item>
        <el-form-item label="说明">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="规则说明（选填）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showForm = false">取消</el-button>
        <el-button type="primary" @click="submit" :loading="submitting">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getCommissionRules, saveCommissionRule, deleteCommissionRule } from '../../api'
import { fmtDate } from '../../utils/format'

const loading    = ref(false)
const rules      = ref([])
const showForm   = ref(false)
const submitting = ref(false)
const valueError = ref('')
const form = reactive({ id: null, name: '', ruleType: 'fixed', valueStr: '', description: '' })

async function load() {
  loading.value = true
  try { rules.value = await getCommissionRules() || [] }
  catch (_) {}
  finally { loading.value = false }
}

function openAdd() {
  Object.assign(form, { id: null, name: '', ruleType: 'fixed', valueStr: '', description: '' })
  valueError.value = ''
  showForm.value = true
}

function openEdit(row) {
  const hasRate = row.rate != null && Number(row.rate) > 0
  Object.assign(form, {
    id: row.id,
    name: row.name,
    ruleType: hasRate ? 'rate' : 'fixed',
    valueStr: hasRate
      ? String(+(row.rate * 100).toFixed(4)).replace(/\.?0+$/, '')
      : String(row.fixedAmount != null ? +row.fixedAmount : ''),
    description: row.description || ''
  })
  valueError.value = ''
  showForm.value = true
}

function validateValue() {
  const v = form.valueStr.trim()
  if (v === '') return form.ruleType === 'rate' ? '请输入佣金比例' : '请输入固定金额'
  if (!/^\d+(\.\d+)?$/.test(v)) return '请输入有效数字'
  const n = Number(v)
  if (n <= 0) return '必须为正数'
  if (form.ruleType === 'rate' && n > 100) return '比例必须在 0 到 100 之间'
  return ''
}

async function submit() {
  if (!form.name.trim()) return ElMessage.warning('请填写规则名称')
  const err = validateValue()
  if (err) { valueError.value = err; return }
  valueError.value = ''
  const n = Number(form.valueStr.trim())

  submitting.value = true
  try {
    await saveCommissionRule({
      id: form.id || undefined,
      name: form.name.trim(),
      rate:        form.ruleType === 'rate'  ? n / 100 : null,
      fixedAmount: form.ruleType === 'fixed' ? n       : null,
      description: form.description
    })
    ElMessage.success('已保存')
    showForm.value = false
    load()
  } catch (_) {
    ElMessage.error('保存失败')
  } finally {
    submitting.value = false
  }
}

async function del(row) {
  await ElMessageBox.confirm(`确定删除规则「${row.name}」吗？`, '提示', { type: 'warning' })
  await deleteCommissionRule(row.id)
  ElMessage.success('已删除')
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
