import http from '../utils/request'

// ── 认证 ─────────────────────────────────────────────────────
export const login = data => http.post('/api/admin/login', data)

// ── 商家管理 ──────────────────────────────────────────────────
export const getMerchantList    = params        => http.get('/api/admin/merchants', { params })
export const getMerchantDetail  = id            => http.get(`/api/admin/merchants/${id}`)
export const updateMerchant     = (id, data)    => http.put(`/api/admin/merchants/${id}`, data)
export const toggleMerchant     = (id, status)  => http.put(`/api/admin/merchants/${id}/status`, { status })
export const approveMerchant    = id            => http.put(`/api/admin/merchants/${id}/approve`)
export const getMerchantFollows = merchantId    => http.get(`/api/admin/merchants/${merchantId}/follows`)
export const creditCommission   = (merchantId, followId, amount) =>
  http.post(`/api/admin/merchants/${merchantId}/follows/${followId}/commission`, { amount })

// ── 设备管理 ──────────────────────────────────────────────────
export const getDeviceList  = params       => http.get('/api/admin/devices', { params })
export const updateDevice   = (id, data)   => http.put(`/api/admin/devices/${id}`, data)
export const bindDevice     = data         => http.post('/api/admin/devices/bind', data)

// ── 数据监控 ──────────────────────────────────────────────────
export const getMonitorOverview = ()       => http.get('/api/admin/monitor/overview')
export const getMonitorTrend    = params   => http.get('/api/admin/monitor/trend', { params })

// ── 业务员管理 ────────────────────────────────────────────────
export const getSalesmanList    = params        => http.get('/api/admin/salesmen', { params })
export const addSalesman        = data          => http.post('/api/admin/salesmen', data)
export const updateSalesman     = (id, data)    => http.put(`/api/admin/salesmen/${id}`, data)
export const toggleSalesman     = (id, status)  => http.put(`/api/admin/salesmen/${id}/status`, { status })
export const batchImportSalesmen = rows         => http.post('/api/admin/salesmen/batch-import', rows)

// ── 跟进管理 ──────────────────────────────────────────────────
export const getFollowList        = params       => http.get('/api/admin/follow/list', { params })
export const getFollowRecords     = id           => http.get(`/api/admin/follow/${id}/records`)
export const approveFollow        = (id, data)   => http.post(`/api/admin/follow/${id}/approve`, data ?? {})
export const rejectFollow         = (id, reason) => http.post(`/api/admin/follow/${id}/reject`, { reason })
export const getMerchantFollowers = merchantId   => http.get(`/api/admin/merchant/${merchantId}/followers`)

// ── 佣金规则 ──────────────────────────────────────────────────
export const getCommissionRules = ()      => http.get('/api/admin/commission-rules')
export const saveCommissionRule = data    => http.post('/api/admin/commission-rules', data)
export const deleteCommissionRule = id   => http.delete(`/api/admin/commission-rules/${id}`)

// ── 提现审核 ──────────────────────────────────────────────────
export const getWithdrawList    = params       => http.get('/api/admin/withdraw', { params })
export const approveWithdraw    = (id, data)   => http.put(`/api/admin/withdraw/${id}/approve`, data)
export const rejectWithdraw     = (id, data)   => http.put(`/api/admin/withdraw/${id}/reject`, data)

// ── AI 配置 ───────────────────────────────────────────────────
export const getAiRules         = ()      => http.get('/api/admin/ai/rules')
export const saveAiRule         = data    => http.post('/api/admin/ai/rules', data)
export const deleteAiRule       = id      => http.delete(`/api/admin/ai/rules/${id}`)
export const getAiCost          = params  => http.get('/api/admin/ai/cost', { params })
export const getAiCostByMerchant = ()     => http.get('/api/admin/ai/cost/by-merchant')
export const getAiConfig        = ()      => http.get('/api/admin/ai/config')
export const saveAiConfig       = data    => http.post('/api/admin/ai/config', data)
export const getAiAdviceList    = params  => http.get('/api/admin/ai/advice', { params })
export const reviewAiAdvice     = (id, data) => http.put(`/api/admin/ai/advice/${id}/review`, data)

// ── 系统设置 ──────────────────────────────────────────────────
export const getAdminList       = ()      => http.get('/api/admin/system/admins')
export const addAdmin           = data    => http.post('/api/admin/system/admins', data)
export const updateAdmin        = (id, data) => http.put(`/api/admin/system/admins/${id}`, data)
export const deleteAdmin        = id      => http.delete(`/api/admin/system/admins/${id}`)
export const getOpLogs          = params  => http.get('/api/admin/system/logs', { params })
export const getBugLogs         = params  => http.get('/api/admin/system/bugs', { params })
export const resolveBug         = id      => http.put(`/api/admin/system/bugs/${id}/resolve`)
export const deleteBug          = id      => http.delete(`/api/admin/system/bugs/${id}`)
