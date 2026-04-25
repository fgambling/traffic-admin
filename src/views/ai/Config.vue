<template>
  <div>
    <div class="page-header">
      <h2>AI 模型配置</h2>
    </div>

    <el-card shadow="never" style="max-width:680px;">
      <el-form v-loading="loading" :model="form" label-width="120px" label-position="left">
        <el-form-item label="模型名称">
          <el-select v-model="form['ai.model']" style="width:100%;" allow-create filterable placeholder="选择或输入模型名">
            <el-option label="gpt-4o"         value="gpt-4o" />
            <el-option label="gpt-4-turbo"    value="gpt-4-turbo" />
            <el-option label="gpt-3.5-turbo"  value="gpt-3.5-turbo" />
            <el-option label="claude-3-5-sonnet" value="claude-3-5-sonnet-20241022" />
            <el-option label="deepseek-chat"  value="deepseek-chat" />
          </el-select>
        </el-form-item>

        <el-form-item label="API Key">
          <el-input
            v-model="form['ai.apiKey']"
            placeholder="sk-... （已脱敏，重新输入则覆盖）"
            show-password
          />
        </el-form-item>

        <el-form-item label="每日生成上限">
          <el-input-number
            v-model="form['ai.dailyLimit']"
            :min="0" :max="10000" :step="10"
            style="width:200px;"
          />
          <span style="margin-left:8px;color:#999;font-size:13px;">条（0 = 不限制）</span>
        </el-form-item>

        <el-form-item label="Prompt模板">
          <el-input
            v-model="form['ai.promptTemplate']"
            type="textarea"
            :rows="8"
            placeholder="系统提示词模板，支持 {totalEnter} {avgStay} {peakHour} 等变量"
          />
          <div style="color:#999;font-size:12px;margin-top:4px;">
            可用变量：{totalEnter} 今日进店人数 · {avgStay} 平均停留秒数 · {peakHour} 高峰时段 · {femaleRatio} 女性占比
          </div>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="save" :loading="saving">保存配置</el-button>
          <el-button @click="load">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getAiConfig, saveAiConfig } from '../../api'

const loading = ref(false)
const saving  = ref(false)
const form    = reactive({
  'ai.model':          '',
  'ai.apiKey':         '',
  'ai.dailyLimit':     0,
  'ai.promptTemplate': ''
})

async function load() {
  loading.value = true
  try {
    const data = await getAiConfig()
    Object.assign(form, {
      'ai.model':          data['ai.model']          || '',
      'ai.apiKey':         data['ai.apiKey']         || '',
      'ai.dailyLimit':     Number(data['ai.dailyLimit'] || 0),
      'ai.promptTemplate': data['ai.promptTemplate'] || ''
    })
  } catch (_) {
  } finally {
    loading.value = false
  }
}

async function save() {
  saving.value = true
  try {
    await saveAiConfig({
      'ai.model':          form['ai.model'],
      'ai.apiKey':         form['ai.apiKey'],
      'ai.dailyLimit':     String(form['ai.dailyLimit']),
      'ai.promptTemplate': form['ai.promptTemplate']
    })
    ElMessage.success('配置已保存')
    load() // 重新加载以显示最新脱敏值
  } catch (_) {
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.page-header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 24px;
  h2 { margin: 0; font-size: 20px; color: #1a1a2e; }
}
</style>
