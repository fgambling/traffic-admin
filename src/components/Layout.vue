<template>
  <el-container style="height:100vh;">
    <!-- 侧边栏 -->
    <el-aside :width="collapsed ? '64px' : '220px'" style="transition:.25s;background:#001529;overflow-y:auto;overflow-x:hidden;">
      <div class="sidebar-logo" :class="{ collapsed }">
        <span class="logo-icon">📊</span>
        <span v-if="!collapsed" class="logo-text">智慧客流管理</span>
      </div>
      <el-menu
        :default-active="route.path"
        background-color="#001529"
        text-color="rgba(255,255,255,.7)"
        active-text-color="#fff"
        :collapse="collapsed"
        :collapse-transition="false"
        router
      >
        <el-menu-item index="/monitor">
          <el-icon><Monitor /></el-icon><template #title>数据监控</template>
        </el-menu-item>
        <el-menu-item index="/merchant">
          <el-icon><Shop /></el-icon><template #title>商家管理</template>
        </el-menu-item>
        <!-- 业务员 -->
        <el-sub-menu index="/salesman">
          <template #title>
            <el-icon><UserFilled /></el-icon><span>业务员管理</span>
          </template>
          <el-menu-item index="/salesman">业务员列表</el-menu-item>
          <el-menu-item index="/salesman/commission">佣金规则</el-menu-item>
        </el-sub-menu>

        <el-menu-item index="/withdraw">
          <el-icon><Money /></el-icon><template #title>提现审核</template>
        </el-menu-item>

        <!-- AI 管理 -->
        <el-sub-menu index="/ai">
          <template #title>
            <el-icon><MagicStick /></el-icon><span>AI 管理</span>
          </template>
          <el-menu-item index="/ai/config">模型配置</el-menu-item>
          <el-menu-item index="/ai/rules">规则配置</el-menu-item>
          <el-menu-item index="/ai/advice">建议审核</el-menu-item>
          <el-menu-item index="/ai/cost">费用统计</el-menu-item>
        </el-sub-menu>

        <!-- 系统设置 -->
        <el-sub-menu index="/system">
          <template #title>
            <el-icon><Setting /></el-icon><span>系统设置</span>
          </template>
          <el-menu-item index="/system/admins">管理员账号</el-menu-item>
          <el-menu-item index="/system/logs">操作日志</el-menu-item>
          <el-menu-item index="/system/bugs">BUG日志</el-menu-item>
        </el-sub-menu>
      </el-menu>
    </el-aside>

    <el-container>
      <!-- 顶栏 -->
      <el-header style="background:#fff;border-bottom:1px solid #f0f0f0;display:flex;align-items:center;justify-content:space-between;padding:0 24px;">
        <el-icon class="collapse-btn" @click="collapsed = !collapsed" style="cursor:pointer;font-size:20px;">
          <Fold v-if="!collapsed" /><Expand v-else />
        </el-icon>
        <div style="display:flex;align-items:center;gap:16px;">
          <span style="color:#666;font-size:14px;">{{ auth.adminName }}</span>
          <el-button link type="danger" @click="handleLogout">退出</el-button>
        </div>
      </el-header>

      <!-- 主内容 -->
      <el-main style="background:#f5f7fa;overflow:auto;">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../store/auth'

const route    = useRoute()
const router   = useRouter()
const auth     = useAuthStore()
const collapsed = ref(false)

function handleLogout() {
  auth.logout()
  router.push('/login')
}
</script>

<style scoped>
.sidebar-logo {
  height: 64px;
  display: flex;
  align-items: center;
  padding: 0 20px;
  gap: 10px;
  border-bottom: 1px solid rgba(255,255,255,.1);
  overflow: hidden;
  white-space: nowrap;
  &.collapsed { justify-content: center; padding: 0; }
  .logo-icon { font-size: 24px; flex-shrink: 0; }
  .logo-text { color: #fff; font-size: 16px; font-weight: 700; }
}
</style>
