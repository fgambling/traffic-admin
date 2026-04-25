import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  { path: '/login', component: () => import('../views/Login.vue'), meta: { public: true } },
  {
    path: '/',
    component: () => import('../components/Layout.vue'),
    redirect: '/monitor',
    children: [
      { path: 'monitor',                  name: 'Monitor',          component: () => import('../views/monitor/Index.vue'),              meta: { title: '数据监控',   icon: 'Monitor' } },
      { path: 'merchant',                 name: 'MerchantList',     component: () => import('../views/merchant/List.vue'),              meta: { title: '商家管理',   icon: 'Shop' } },
      { path: 'merchant/:id',             name: 'MerchantDetail',   component: () => import('../views/merchant/Detail.vue'),            meta: { title: '商家详情',   hidden: true } },
      { path: 'salesman',                 name: 'SalesmanList',     component: () => import('../views/salesman/List.vue'),              meta: { title: '业务员管理', icon: 'User' } },
      { path: 'salesman/commission',      name: 'CommissionRules',  component: () => import('../views/salesman/CommissionRules.vue'),   meta: { title: '佣金规则',   icon: 'Coin' } },
      { path: 'salesman/follow-approval', name: 'FollowApproval',   component: () => import('../views/salesman/FollowApproval.vue'),    meta: { title: '合作审批',   icon: 'Stamp' } },
      { path: 'withdraw',                 name: 'WithdrawReview',   component: () => import('../views/withdraw/Review.vue'),            meta: { title: '提现审核',   icon: 'Money' } },
      { path: 'ai/rules',                 name: 'AiRules',          component: () => import('../views/ai/Rules.vue'),                   meta: { title: 'AI规则配置', icon: 'MagicStick' } },
      { path: 'ai/config',                name: 'AiConfig',         component: () => import('../views/ai/Config.vue'),                  meta: { title: 'AI模型配置', icon: 'Setting' } },
      { path: 'ai/advice',                name: 'AiAdviceReview',   component: () => import('../views/ai/AdviceReview.vue'),            meta: { title: '建议审核',   icon: 'ChatDotRound' } },
      { path: 'ai/cost',                  name: 'AiCost',           component: () => import('../views/ai/Cost.vue'),                    meta: { title: 'AI费用统计', icon: 'Coin' } },
      { path: 'system/admins',            name: 'Admins',           component: () => import('../views/system/Admins.vue'),              meta: { title: '管理员账号', icon: 'User' } },
      { path: 'system/logs',              name: 'OpLogs',           component: () => import('../views/system/Logs.vue'),                meta: { title: '操作日志',   icon: 'Document' } },
      { path: 'system/bugs',              name: 'BugLogs',          component: () => import('../views/system/BugLogs.vue'),             meta: { title: 'BUG日志',    icon: 'Warning' } },
    ]
  },
  { path: '/:pathMatch(.*)*', redirect: '/' }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach(to => {
  const token = localStorage.getItem('admin_token')
  if (!to.meta.public && !token) return '/login'
})

export default router
