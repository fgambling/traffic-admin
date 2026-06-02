<template>
  <div>
    <div class="page-header">
      <h2>AI 模型配置</h2>
    </div>

    <el-card shadow="never" style="max-width:720px;">
      <el-form :model="form" label-width="120px" label-position="left">
        <!-- 表单字段区：加载时显示遮罩，不影响下方按钮 -->
        <div v-loading="loading">
          <el-form-item label="服务商">
            <el-select v-model="form['ai.provider']" style="width:100%;" @change="onProviderChange">
              <el-option label="OpenAI（GPT-4）"     value="openai" />
              <el-option label="文心一言（百度千帆）" value="ernie" />
              <el-option label="通义千问（阿里云）"   value="qwen" />
              <el-option label="DeepSeek（深度求索）" value="deepseek" />
            </el-select>
          </el-form-item>

          <el-form-item label="模型">
            <el-select v-model="form['ai.model']" style="width:100%;" allow-create filterable placeholder="选择或输入模型名">
              <el-option v-for="m in modelOptions" :key="m.value" :label="m.label" :value="m.value" />
            </el-select>
            <div style="color:#aaa;font-size:12px;margin-top:4px;">{{ providerHint }}</div>
          </el-form-item>

          <el-form-item label="API Key">
            <el-input
              v-model="form['ai.apiKey']"
              placeholder="重新输入将覆盖原有 Key（已脱敏显示）"
              show-password
            />
          </el-form-item>

          <el-form-item label="每日调用上限">
            <el-input-number
              v-model="form['ai.dailyLimit']"
              :min="0" :max="10000" :step="10"
              style="width:200px;"
            />
            <span style="margin-left:8px;color:#999;font-size:13px;">次/商家（0 = 不限制）</span>
          </el-form-item>

          <el-form-item label="Prompt 模板">
            <el-input
              v-model="form['ai.promptTemplate']"
              type="textarea"
              :rows="10"
            />
            <div style="display:flex;align-items:center;justify-content:space-between;margin-top:6px;">
              <span style="color:#999;font-size:12px;">
                使用 <code>&#123;&#123;data&#125;&#125;</code> 作为动态数据占位符，系统将自动填入门店客流数据
              </span>
              <el-button link type="primary" size="small" @click="form['ai.promptTemplate'] = DEFAULT_PROMPT">
                恢复默认
              </el-button>
            </div>
          </el-form-item>
        </div>

        <!-- 操作按钮区：始终可点击 -->
        <el-form-item style="margin-top:8px;">
          <el-button type="primary" @click="save" :loading="saving">保存配置</el-button>
          <el-button :loading="testing" @click="test">测试连接</el-button>
          <el-button @click="load">重置</el-button>
        </el-form-item>

        <el-alert
          v-if="testResult"
          :type="testResult.ok ? 'success' : 'error'"
          :title="testResult.title"
          :description="testResult.description"
          show-icon
          style="margin-top:12px;"
          @close="testResult = null"
        />
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getAiConfig, saveAiConfig, testAiConnection } from '../../api'

const DEFAULT_PROMPT = `你是一位资深零售门店经营顾问，擅长根据客流数据给出深度、可落地的经营建议。

以下是门店的客流与商家信息：
{{data}}

请根据以上数据，输出 4~6 条经营建议。要求：
- 每条建议必须直接针对数据中的具体数字，结合门店业态与客群特征深入分析
- 若数据中包含店铺业态、菜单/商品、促销活动、目标客群、营业时段等信息，须充分结合这些内容，给出高度个性化的方案
- 每条建议的 content 使用 Markdown 格式，包含：**核心结论**（加粗）、具体操作步骤（列表）、预期效果；内容充实，200~400 字
- confidence：数据依据充分则填"高"，推断成分较多则填"低"

严格以如下 JSON 数组返回，不要任何额外文字：
[{"type":"备货","content":"Markdown格式的详细建议内容","confidence":"高"},...]
type 只能是 备货、排班、营销、服务 之一。`

const loading = ref(false)
const saving  = ref(false)
const testing = ref(false)
const testResult = ref(null)
const form    = reactive({
  'ai.provider':       'deepseek',
  'ai.model':          '',
  'ai.apiKey':         '',
  'ai.dailyLimit':     0,
  'ai.promptTemplate': ''
})

const MODELS = {
  openai: [
    { label: 'gpt-4o（推荐 · 最强多模态）',    value: 'gpt-4o' },
    { label: 'gpt-4-turbo（旗舰 · 高性能）',   value: 'gpt-4-turbo' },
    { label: 'gpt-3.5-turbo（快速 · 低成本）',  value: 'gpt-3.5-turbo' }
  ],
  ernie: [
    { label: 'ernie-4.0-8k（旗舰）',        value: 'ernie-4.0-8k' },
    { label: 'ernie-3.5-8k（均衡 · 推荐）',  value: 'ernie-3.5-8k' },
    { label: 'ernie-speed-128k（轻量）',     value: 'ernie-speed-128k' }
  ],
  qwen: [
    { label: 'qwen-max（旗舰 · 复杂任务）', value: 'qwen-max' },
    { label: 'qwen-plus（均衡 · 推荐）',    value: 'qwen-plus' },
    { label: 'qwen-turbo（快速 · 低成本）', value: 'qwen-turbo' }
  ],
  deepseek: [
    { label: 'deepseek-chat（推荐 · 性价比高）', value: 'deepseek-chat' },
    { label: 'deepseek-reasoner（深度推理）',     value: 'deepseek-reasoner' }
  ],
}

const PROVIDER_HINTS = {
  openai:   'API 地址：https://api.openai.com  ·  到 platform.openai.com 申请 Key',
  ernie:    'API 地址：qianfan.baidubce.com（兼容模式）  ·  到百度智能云千帆平台申请 Key',
  qwen:     'API 地址：dashscope.aliyuncs.com（兼容模式）  ·  到阿里云百炼控制台申请 Key',
  deepseek: 'API 地址：https://api.deepseek.com  ·  到 platform.deepseek.com 申请 Key'
}

const modelOptions = computed(() => MODELS[form['ai.provider']] || MODELS.deepseek)
const providerHint = computed(() => PROVIDER_HINTS[form['ai.provider']] || '')

function onProviderChange(p) {
  // 切换厂商时自动选该厂商的推荐默认模型
  form['ai.model'] = MODELS[p]?.[0]?.value || ''
  testResult.value = null
}

async function load() {
  loading.value = true
  try {
    const data = await getAiConfig()
    Object.assign(form, {
      'ai.provider':       data['ai.provider']       || 'deepseek',
      'ai.model':          data['ai.model']          || 'deepseek-chat',
      'ai.apiKey':         data['ai.apiKey']         || '',
      'ai.dailyLimit':     Number(data['ai.dailyLimit'] || 0),
      'ai.promptTemplate': data['ai.promptTemplate'] || DEFAULT_PROMPT
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
      'ai.provider':       form['ai.provider'],
      'ai.model':          form['ai.model'],
      'ai.apiKey':         form['ai.apiKey'],
      'ai.dailyLimit':     String(form['ai.dailyLimit']),
      'ai.promptTemplate': form['ai.promptTemplate']
    })
    ElMessage.success('配置已保存')
    load()
  } catch (_) {
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

async function test() {
  testing.value = true
  testResult.value = null
  try {
    const data = await testAiConnection({
      provider: form['ai.provider'],
      model:    form['ai.model'],
      apiKey:   form['ai.apiKey']  // 留空则使用已保存的 Key
    })
    if (data?.ok) {
      testResult.value = {
        ok:          true,
        title:       '连接成功',
        description: data.reply ? `模型回复：${data.reply}` : `延迟 ${data.latencyMs ?? '--'} ms`
      }
    } else {
      testResult.value = {
        ok:          false,
        title:       '连接失败',
        description: data?.error || '请检查 API Key、服务商与模型名是否匹配'
      }
    }
  } catch (e) {
    testResult.value = {
      ok:          false,
      title:       '连接失败',
      description: e?.message || '请检查 API Key、模型名和网络'
    }
  } finally {
    testing.value = false
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
