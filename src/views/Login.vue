<template>
  <div class="login-page">
    <div class="login-box">
      <div class="login-logo">
        <span class="logo-icon">📊</span>
        <h1>智慧客流 · 管理后台</h1>
      </div>
      <el-form :model="form" :rules="rules" ref="formRef" size="large" @submit.prevent="submit">
        <el-form-item prop="username">
          <el-input v-model="form.username" placeholder="管理员账号" prefix-icon="User" />
        </el-form-item>
        <el-form-item prop="password">
          <el-input v-model="form.password" type="password" placeholder="密码" prefix-icon="Lock" show-password />
        </el-form-item>
        <el-button type="primary" native-type="submit" :loading="loading" style="width:100%;height:44px;font-size:16px;">
          登录
        </el-button>
      </el-form>
      <p class="login-hint">开发测试账号：admin / admin123</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../store/auth'
import { login } from '../api'

const router = useRouter()
const auth = useAuthStore()
const formRef = ref()
const loading = ref(false)

const form = ref({ username: 'admin', password: 'admin123' })
const rules = {
  username: [{ required: true, message: '请输入账号' }],
  password: [{ required: true, message: '请输入密码' }]
}

async function submit() {
  await formRef.value.validate()
  loading.value = true
  try {
    const data = await login(form.value)
    auth.setLogin(data.token, data.name || form.value.username)
    router.push('/')
  } catch (_) {
    // error handled by interceptor
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #0d1f3c 0%, #1f4788 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}
.login-box {
  width: 400px;
  background: #fff;
  border-radius: 16px;
  padding: 48px 40px 40px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
}
.login-logo {
  text-align: center;
  margin-bottom: 36px;
  .logo-icon { font-size: 48px; display: block; margin-bottom: 12px; }
  h1 { font-size: 22px; color: #1a1a2e; font-weight: 700; margin: 0; }
}
.login-hint {
  text-align: center;
  color: #aaa;
  font-size: 12px;
  margin-top: 16px;
}
</style>
