<template>
  <div>
    <div class="page-header">
      <h2>建议管理</h2>
    </div>

    <el-tabs v-model="activeTab" type="border-card">

      <!-- ══════════ 中级版：规则引擎配置 ══════════ -->
      <el-tab-pane label="中级版 · 规则引擎" name="mid">
        <div class="tab-actions">
          <el-button type="primary" :icon="Plus" @click="openAdd">新增规则</el-button>
        </div>
        <el-table :data="rules" stripe v-loading="rulesLoading">
          <el-table-column prop="ruleId"     label="规则ID"   width="120" />
          <el-table-column prop="adviceType" label="建议类型" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="typeColor[row.adviceType]" size="small">{{ row.adviceType }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="condition"  label="触发条件" min-width="200" show-overflow-tooltip />
          <el-table-column prop="template"   label="建议模板" min-width="240" show-overflow-tooltip />
          <el-table-column prop="enabled"    label="启用"     width="80" align="center">
            <template #default="{ row }">
              <el-switch v-model="row.enabled" @change="toggleRule(row)" />
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120" align="center">
            <template #default="{ row }">
              <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
              <el-button link type="danger"  @click="delRule(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>

        <el-dialog v-model="ruleDialog" :title="isEdit ? '编辑规则' : '新增规则'" width="560px">
          <el-form :model="ruleForm" label-width="90px">
            <el-form-item label="规则ID">
              <el-input v-model="ruleForm.ruleId" :disabled="isEdit" placeholder="如 R001" />
            </el-form-item>
            <el-form-item label="建议类型">
              <el-select v-model="ruleForm.adviceType" style="width:100%;">
                <el-option label="营销" value="营销" />
                <el-option label="排班" value="排班" />
                <el-option label="备货" value="备货" />
              </el-select>
            </el-form-item>
            <el-form-item label="触发条件">
              <el-input v-model="ruleForm.condition" placeholder="如：今日进店 > 50 且 时间在 9-11 点" />
            </el-form-item>
            <el-form-item label="建议模板">
              <el-input v-model="ruleForm.template" type="textarea" :rows="4"
                placeholder="支持变量：{totalEnter} {peakHour} {avgStay}" />
            </el-form-item>
          </el-form>
          <template #footer>
            <el-button @click="ruleDialog = false">取消</el-button>
            <el-button type="primary" @click="saveRule">保存</el-button>
          </template>
        </el-dialog>
      </el-tab-pane>

      <!-- ══════════ 高级版：AI 大模型配置 ══════════ -->
      <el-tab-pane label="高级版 · AI 大模型" name="advanced">
        <el-card shadow="never" style="max-width:720px;margin-top:8px;">
          <el-form v-loading="cfgLoading" :model="cfg" label-width="120px" label-position="left">
            <el-form-item label="服务商">
              <el-select v-model="cfg['ai.provider']" style="width:100%;" @change="onProviderChange">
                <el-option label="OpenAI（GPT-4）"     value="openai" />
                <el-option label="文心一言（百度千帆）" value="ernie" />
                <el-option label="通义千问（阿里云）"   value="qwen" />
                <el-option label="DeepSeek（深度求索）" value="deepseek" />
              </el-select>
            </el-form-item>

            <el-form-item label="模型">
              <el-select v-model="cfg['ai.model']" style="width:100%;" allow-create filterable placeholder="选择或输入模型名">
                <el-option v-for="m in modelOptions" :key="m.value" :label="m.label" :value="m.value" />
              </el-select>
              <div style="color:#aaa;font-size:12px;margin-top:4px;">{{ providerHint }}</div>
            </el-form-item>

            <el-form-item label="API Key">
              <el-input v-model="cfg['ai.apiKey']" placeholder="重新输入将覆盖原有 Key（已脱敏显示）" show-password />
            </el-form-item>

            <el-form-item label="每日调用上限">
              <el-input-number v-model="cfg['ai.dailyLimit']" :min="0" :max="10000" :step="10" style="width:200px;" />
              <span style="margin-left:8px;color:#999;font-size:13px;">次/商家（0 = 不限制）</span>
            </el-form-item>

            <el-form-item label="Prompt 模板">
              <el-input
                v-model="cfg['ai.promptTemplate']"
                type="textarea"
                :rows="10"
              />
              <div style="display:flex;align-items:center;justify-content:space-between;margin-top:6px;">
                <span style="color:#999;font-size:12px;">
                  使用 <code>&#123;&#123;data&#125;&#125;</code> 作为动态数据占位符，系统将自动填入门店客流数据
                </span>
                <el-button link type="primary" size="small" @click="cfg['ai.promptTemplate'] = DEFAULT_PROMPT">
                  恢复默认
                </el-button>
              </div>
            </el-form-item>

            <el-form-item>
              <el-button type="primary" @click="saveCfg" :loading="cfgSaving"
              :disabled="!testPassed" :title="testPassed ? '' : '请先测试连接成功后再保存'">
              保存配置
            </el-button>
              <el-button :loading="testing" @click="testConn">测试连接</el-button>
              <el-button @click="loadCfg">重置</el-button>
              <span v-if="!testPassed" style="font-size:12px;color:#e6a23c;margin-left:8px;">
                ⚠ 需先测试连接成功
              </span>
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
      </el-tab-pane>

    </el-tabs>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { getAiRules, saveAiRule, deleteAiRule, getAiConfig, saveAiConfig, testAiConnection } from '../../api'

const activeTab = ref('mid')

// ── 中级版：规则引擎 ──────────────────────────────────────────
const rulesLoading = ref(false)
const rules        = ref([])
const ruleDialog   = ref(false)
const isEdit       = ref(false)
const typeColor    = { '营销': 'warning', '排班': 'success', '备货': 'primary', '服务': 'info' }
const ruleForm     = reactive({ ruleId: '', adviceType: '营销', condition: '', template: '', priority: 1 })

async function loadRules() {
  rulesLoading.value = true
  try { rules.value = (await getAiRules()) || [] } catch (_) {}
  rulesLoading.value = false
}

function openAdd() {
  Object.assign(ruleForm, { ruleId: '', adviceType: '营销', condition: '', template: '', priority: 1 })
  isEdit.value = false
  ruleDialog.value = true
}

function openEdit(row) {
  Object.assign(ruleForm, row)
  isEdit.value = true
  ruleDialog.value = true
}

async function saveRule() {
  await saveAiRule({ ...ruleForm })
  ElMessage.success('保存成功')
  ruleDialog.value = false
  loadRules()
}

async function delRule(row) {
  await ElMessageBox.confirm(`确定删除规则「${row.ruleId}」？`, '提示', { type: 'warning' })
  await deleteAiRule(row.ruleId)
  ElMessage.success('已删除')
  loadRules()
}

function toggleRule(row) {
  saveAiRule({ ...row }).catch(() => { row.enabled = !row.enabled })
}

// ── 高级版：AI 大模型配置 ─────────────────────────────────────
const DEFAULT_PROMPT = `你是一位零售门店经营顾问，擅长根据客流数据给出简洁、可落地的经营建议。

以下是门店的客流与商家信息：
{{data}}

请根据以上数据，输出 2~3 条经营建议。要求：
- 每条建议必须直接针对数据中的具体数字，避免泛泛而谈
- 若数据中包含店铺业态、菜单/商品、促销活动、目标客群、营业时段等自定义信息，需结合这些内容给出更有针对性的方案
- 内容 50~100 字，包含具体行动（谁、做什么、何时做）
- confidence：数据依据充分则填"高"，数据有限或推断成分多则填"低"

严格以如下 JSON 数组返回，不要任何额外文字：
[{"type":"备货","content":"具体建议内容","confidence":"高"},...]
type 只能是 备货、排班、营销、服务 之一。`

const cfgLoading = ref(false)
const cfgSaving  = ref(false)
const testing    = ref(false)
const testResult = ref(null)
const testPassed = ref(false)   // 必须测试通过才能保存
const cfg = reactive({
  'ai.provider':       'deepseek',
  'ai.model':          '',
  'ai.apiKey':         '',
  'ai.dailyLimit':     0,
  'ai.promptTemplate': ''
})

const MODELS = {
  openai: [
    { label: 'gpt-4o（推荐 · 最强多模态）',  value: 'gpt-4o' },
    { label: 'gpt-4-turbo（旗舰 · 高性能）', value: 'gpt-4-turbo' },
    { label: 'gpt-3.5-turbo（快速 · 低成本）', value: 'gpt-3.5-turbo' }
  ],
  ernie: [
    { label: 'ernie-4.0-8k（旗舰）',       value: 'ernie-4.0-8k' },
    { label: 'ernie-3.5-8k（均衡 · 推荐）', value: 'ernie-3.5-8k' },
    { label: 'ernie-speed-128k（轻量）',    value: 'ernie-speed-128k' }
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

const HINTS = {
  openai:   'API 地址：https://api.openai.com  ·  到 platform.openai.com 申请 Key',
  ernie:    'API 地址：qianfan.baidubce.com（兼容模式）  ·  到百度智能云千帆平台申请 Key',
  qwen:     'API 地址：dashscope.aliyuncs.com（兼容模式）  ·  到阿里云百炼控制台申请 Key',
  deepseek: 'API 地址：https://api.deepseek.com  ·  到 platform.deepseek.com 申请 Key'
}

const modelOptions = computed(() => MODELS[cfg['ai.provider']] || MODELS.deepseek)
const providerHint = computed(() => HINTS[cfg['ai.provider']] || '')

function onProviderChange(p) {
  cfg['ai.model'] = MODELS[p]?.[0]?.value || ''
  testResult.value = null
  testPassed.value = false
}

// 切换关键凭据时重置测试状态
watch(() => [cfg['ai.provider'], cfg['ai.model'], cfg['ai.apiKey']], () => {
  testPassed.value = false
  testResult.value = null
})

async function loadCfg() {
  cfgLoading.value = true
  try {
    const data = await getAiConfig()
    Object.assign(cfg, {
      'ai.provider':       data['ai.provider']       || 'deepseek',
      'ai.model':          data['ai.model']          || 'deepseek-chat',
      'ai.apiKey':         data['ai.apiKey']         || '',
      'ai.dailyLimit':     Number(data['ai.dailyLimit'] || 0),
      'ai.promptTemplate': data['ai.promptTemplate'] || DEFAULT_PROMPT
    })
  } catch (_) {}
  cfgLoading.value = false
}

async function saveCfg() {
  if (!testPassed.value) {
    ElMessage.warning('请先点击"测试连接"并确认连接成功后再保存')
    return
  }
  cfgSaving.value = true
  try {
    await saveAiConfig({
      'ai.provider':       cfg['ai.provider'],
      'ai.model':          cfg['ai.model'],
      'ai.apiKey':         cfg['ai.apiKey'],
      'ai.dailyLimit':     String(cfg['ai.dailyLimit']),
      'ai.promptTemplate': cfg['ai.promptTemplate']
    })
    ElMessage.success('配置已保存')
    loadCfg()
  } catch (_) {
    ElMessage.error('保存失败')
  } finally {
    cfgSaving.value = false
  }
}

async function testConn() {
  testing.value = true
  testResult.value = null
  try {
    const data = await testAiConnection({
      provider: cfg['ai.provider'],
      model:    cfg['ai.model'],
      apiKey:   cfg['ai.apiKey']
    })
    testResult.value = {
      ok:          true,
      title:       '连接成功，可以保存配置',
      description: data?.reply ? `模型回复：${data.reply}` : `延迟 ${data?.latencyMs ?? '--'} ms`
    }
    testPassed.value = true
  } catch (e) {
    testResult.value = {
      ok:          false,
      title:       '连接失败',
      description: e?.message || '请检查 API Key、模型名和网络'
    }
    testPassed.value = false
  } finally {
    testing.value = false
  }
}

// 切到高级版 tab 时再加载配置（懒加载）
watch(activeTab, val => { if (val === 'advanced' && !cfg['ai.model']) loadCfg() })

onMounted(loadRules)
</script>

<style scoped>
.page-header {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  h2 { margin: 0; font-size: 20px; color: #1a1a2e; }
}
.tab-actions {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 16px;
}
</style>
