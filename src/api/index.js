import http from '../utils/request'

// ── 认证 ─────────────────────────────────────────────────────
export const login = data => http.post('/api/admin/login', data)

// ── 商家管理 ──────────────────────────────────────────────────
export const getMerchantList  = params => http.get('/api/admin/merchants', { params })
export const getMerchantDetail = id    => http.get(`/api/admin/merchants/${id}`)
export const updateMerchant   = (id, data) => http.put(`/api/admin/merchants/${id}`, data)
export const toggleMerchant   = (id, status) => http.put(`/api/admin/merchants/${id}/status`, { status })

// ── 设备管理 ──────────────────────────────────────────────────
export const getDeviceList   = params => http.get('/api/admin/devices', { params })
export const updateDevice    = (id, data) => http.put(`/api/admin/devices/${id}`, data)
export const bindDevice      = data  => http.post('/api/admin/devices/bind', data)

// ── 数据监控 ──────────────────────────────────────────────────
export const getMonitorOverview = () => http.get('/api/admin/monitor/overview')
export const getTrafficRealtime = () => http.get('/api/admin/monitor/realtime')

// ── AI 配置 ───────────────────────────────────────────────────
export const getAiRules    = ()       => http.get('/api/admin/ai/rules')
export const saveAiRule    = data     => http.post('/api/admin/ai/rules', data)
export const deleteAiRule  = id       => http.delete(`/api/admin/ai/rules/${id}`)
export const getAiCost     = params   => http.get('/api/admin/ai/cost', { params })

// ── 系统设置 ──────────────────────────────────────────────────
export const getAdminList  = ()       => http.get('/api/admin/system/admins')
export const getOpLogs     = params   => http.get('/api/admin/system/logs', { params })
