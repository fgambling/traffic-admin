<template>
  <div>
    <div class="page-header">
      <h2>AI 规则配置</h2>
      <el-button type="primary" :icon="Plus" @click="openAdd">新增规则</el-button>
    </div>
    <el-card shadow="never">
      <el-table :data="rules" stripe v-loading="loading">
        <el-table-column prop="ruleId"     label="规则ID"   width="120" />
        <el-table-column prop="adviceType" label="建议类型" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="typeColor[row.adviceType]" size="small">{{ row.adviceType }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="condition"  label="触发条件" min-width="200" />
        <el-table-column prop="template"   label="建议模板" min-width="240" show-overflow-tooltip />
        <el-table-column prop="enabled"    label="启用"     width="80" align="center">
          <template #default="{ row }">
            <el-switch v-model="row.enabled" @change="toggleRule(row)" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" align="center">
          <template #default="{ row }">
            <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
            <el-button link type="danger" @click="del(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑规则' : '新增规则'" width="560px">
      <el-form :model="form" label-width="90px">
        <el-form-item label="规则ID">
          <el-input v-model="form.ruleId" :disabled="isEdit" placeholder="如 R001" />
        </el-form-item>
        <el-form-item label="建议类型">
          <el-select v-model="form.adviceType" style="width:100%;">
            <el-option label="营销" value="营销" />
            <el-option label="排班" value="排班" />
            <el-option label="备货" value="备货" />
          </el-select>
        </el-form-item>
        <el-form-item label="触发条件">
          <el-input v-model="form.condition" placeholder="如：今日进店 > 50 且 时间在 9-11 点" />
        </el-form-item>
        <el-form-item label="建议模板">
          <el-input v-model="form.template" type="textarea" :rows="4"
            placeholder="支持变量：{totalEnter} {peakHour} {avgStay}" />
        </el-form-item>
        <el-form-item label="优先级">
          <el-input-number v-model="form.priority" :min="1" :max="99" />
        </el-form-item>
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
import { getAiRules, saveAiRule, deleteAiRule } from '../../api'

const loading       = ref(false)
const rules         = ref([])
const dialogVisible = ref(false)
const isEdit        = ref(false)
const typeColor     = { '营销': 'warning', '排班': 'success', '备货': 'primary' }
const form          = reactive({ ruleId: '', adviceType: '营销', condition: '', template: '', priority: 1 })

async function load() {
  loading.value = true
  try { rules.value = (await getAiRules()) || [] } catch (_) {}
  loading.value = false
}

function openAdd() {
  Object.assign(form, { ruleId: '', adviceType: '营销', condition: '', template: '', priority: 1 })
  isEdit.value = false
  dialogVisible.value = true
}

function openEdit(row) {
  Object.assign(form, row)
  isEdit.value = true
  dialogVisible.value = true
}

async function save() {
  await saveAiRule({ ...form })
  ElMessage.success('保存成功')
  dialogVisible.value = false
  load()
}

async function del(row) {
  await ElMessageBox.confirm(`确定删除规则「${row.ruleId}」？`, '提示', { type: 'warning' })
  await deleteAiRule(row.ruleId)
  ElMessage.success('已删除')
  load()
}

function toggleRule(row) {
  saveAiRule({ ...row }).catch(() => { row.enabled = !row.enabled })
}

onMounted(load)
</script>

<style scoped>
.page-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:16px; h2 { margin:0;font-size:20px; } }
</style>
