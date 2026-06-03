<template>
  <div>
    <div class="page-header">
      <h2>登录页外观</h2>
    </div>

    <el-row :gutter="24">
      <!-- 编辑表单 -->
      <el-col :span="12">
        <el-card shadow="never" header="自定义配置">
          <el-form :model="form" label-width="90px" v-loading="loading">

            <!-- Logo 配置 -->
            <el-form-item label="Logo 类型">
              <el-radio-group v-model="logoMode" @change="onLogoModeChange">
                <el-radio value="emoji">Emoji 图标</el-radio>
                <el-radio value="image">图片上传</el-radio>
              </el-radio-group>
            </el-form-item>

            <el-form-item v-if="logoMode === 'emoji'" label="Emoji">
              <el-input v-model="emojiVal" placeholder="如 📊" maxlength="4" style="width:120px;" />
              <span class="emoji-preview">{{ emojiVal }}</span>
            </el-form-item>

            <el-form-item v-else label="Logo 图片">
              <div class="upload-area">
                <img v-if="imageVal" :src="fullUrl(imageVal)" class="logo-preview-img" />
                <el-upload
                  :show-file-list="false"
                  accept="image/*"
                  :before-upload="beforeUpload"
                  :http-request="doUpload"
                >
                  <el-button :loading="uploading" size="small">
                    {{ imageVal ? '重新上传' : '选择图片' }}
                  </el-button>
                </el-upload>
                <el-button v-if="imageVal" link type="danger" size="small" @click="imageVal = ''">清除</el-button>
              </div>
              <div class="form-tip">建议正方形图片，PNG/JPG，大小不超过 2MB</div>
            </el-form-item>

            <el-form-item label="品牌名称">
              <el-input v-model="form.brandTitle" placeholder="如：智慧客流分析" maxlength="20" />
            </el-form-item>
            <el-form-item label="Slogan">
              <el-input v-model="form.slogan" placeholder="如：AI 驱动 · 精准洞察 · 智慧运营" maxlength="40" />
            </el-form-item>

            <el-form-item>
              <el-button type="primary" @click="save" :loading="saving">保存</el-button>
              <el-button @click="reset">重置默认</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>

      <!-- 实时预览 -->
      <el-col :span="12">
        <el-card shadow="never" header="登录页预览">
          <div class="preview-wrap">
            <div class="preview-bg">
              <div class="preview-brand">
                <div class="preview-icon">
                  <img v-if="logoMode === 'image' && imageVal" :src="fullUrl(imageVal)" class="preview-logo-img" />
                  <span v-else>{{ emojiVal || '📊' }}</span>
                </div>
                <div class="preview-title">{{ form.brandTitle || '智慧客流分析' }}</div>
                <div class="preview-sub">{{ form.slogan || 'AI 驱动 · 精准洞察 · 智慧运营' }}</div>
              </div>
              <div class="preview-card">
                <div class="preview-hint">— 选择您的身份登录 —</div>
                <div class="preview-btn green">商家端登录</div>
                <div class="preview-btn blue">业务员工号登录</div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getAppearance, saveAppearance } from '../../api'
import http, { BASE_URL } from '../../utils/request'

const loading  = ref(false)
const saving   = ref(false)
const uploading = ref(false)

const logoMode  = ref('emoji')   // 'emoji' | 'image'
const emojiVal  = ref('📊')
const imageVal  = ref('')        // 存 /uploads/xxx.png 路径

const DEFAULTS = { brandTitle: '智慧客流分析', slogan: 'AI 驱动 · 精准洞察 · 智慧运营' }
const form = reactive({ ...DEFAULTS })

function fullUrl(path) {
  if (!path) return ''
  if (path.startsWith('http')) return path
  return BASE_URL + path
}

function onLogoModeChange() {
  // 切换模式时清掉另一侧
  if (logoMode.value === 'emoji') imageVal.value = ''
  else emojiVal.value = ''
}

function beforeUpload(file) {
  if (file.size > 2 * 1024 * 1024) {
    ElMessage.error('图片不能超过 2MB')
    return false
  }
  return true
}

async function doUpload({ file }) {
  uploading.value = true
  try {
    const fd = new FormData()
    fd.append('file', file)
    const res = await http.post('/api/admin/system/upload-image', fd, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    imageVal.value = res.url
  } catch (_) {
    ElMessage.error('上传失败')
  } finally {
    uploading.value = false
  }
}

async function load() {
  loading.value = true
  try {
    const data = await getAppearance()
    form.brandTitle = data.brandTitle || DEFAULTS.brandTitle
    form.slogan     = data.slogan     || DEFAULTS.slogan
    const logo = data.logo || '📊'
    if (logo.startsWith('/uploads/') || logo.startsWith('http')) {
      logoMode.value = 'image'
      imageVal.value = logo
    } else {
      logoMode.value = 'emoji'
      emojiVal.value = logo
    }
  } catch (_) {}
  finally { loading.value = false }
}

async function save() {
  const logo = logoMode.value === 'image' ? (imageVal.value || '📊') : (emojiVal.value || '📊')
  saving.value = true
  try {
    await saveAppearance({ logo, brandTitle: form.brandTitle, slogan: form.slogan })
    ElMessage.success('保存成功，小程序登录页将实时生效')
  } catch (_) {
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

function reset() {
  logoMode.value  = 'emoji'
  emojiVal.value  = '📊'
  imageVal.value  = ''
  Object.assign(form, DEFAULTS)
}

onMounted(load)
</script>

<style scoped>
.page-header {
  display: flex; align-items: center; margin-bottom: 24px;
  h2 { margin: 0; font-size: 20px; color: #1a1a2e; }
}
.form-tip { font-size: 12px; color: #909399; margin-top: 4px; }

.emoji-preview {
  font-size: 28px;
  margin-left: 12px;
  vertical-align: middle;
}

.upload-area {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-preview-img {
  width: 56px; height: 56px;
  border-radius: 10px;
  object-fit: cover;
  border: 1px solid #e4e7ed;
}

/* 预览区 */
.preview-wrap { padding: 4px 0; }

.preview-bg {
  background: linear-gradient(160deg, #0d1f3c 0%, #162d50 50%, #1a3a6e 100%);
  border-radius: 16px;
  padding: 32px 24px 0;
  min-height: 380px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.preview-brand {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  margin-bottom: 28px;
}

.preview-icon {
  width: 64px; height: 64px;
  background: rgba(255,255,255,0.12);
  border: 1px solid rgba(255,255,255,0.18);
  border-radius: 18px;
  display: flex; align-items: center; justify-content: center;
  font-size: 30px;
  overflow: hidden;
}

.preview-logo-img {
  width: 100%; height: 100%;
  object-fit: cover;
}

.preview-title {
  font-size: 18px; font-weight: 700;
  color: #fff; letter-spacing: 2px;
}

.preview-sub {
  font-size: 11px;
  color: rgba(255,255,255,0.5);
  letter-spacing: 1px;
}

.preview-card {
  background: #fff;
  border-radius: 18px 18px 0 0;
  padding: 20px 24px 24px;
  width: 100%;
  box-sizing: border-box;
}

.preview-hint {
  text-align: center;
  font-size: 11px;
  color: #bbb;
  margin-bottom: 14px;
}

.preview-btn {
  height: 40px;
  border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  font-size: 13px; font-weight: 600;
  margin-bottom: 10px;
  color: #fff;

  &.green { background: linear-gradient(135deg, #07c160, #06ad56); }
  &.blue  { background: #f4f6fa; color: #1f4788; border: 1px solid #dce5f5; }
}
</style>
