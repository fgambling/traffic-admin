<template>
  <div>
    <div class="page-header">
      <h2>商家管理</h2>
      <el-button type="primary" @click="openCreate">新增商家</el-button>
    </div>

    <el-tabs v-model="activeTab" @tab-change="onTabChange">
      <!-- ── Tab 0：商家列表 ── -->
      <el-tab-pane label="商家列表" name="list">
        <!-- 搜索栏 -->
        <el-card shadow="never" style="margin-bottom:16px;">
          <el-form :model="query" inline>
            <el-form-item label="商家名称">
              <el-input v-model="query.name" placeholder="搜索商家名称" clearable style="width:200px;" />
            </el-form-item>
            <el-form-item label="状态">
              <el-select v-model="query.status" placeholder="全部" clearable style="width:120px;">
                <el-option label="待激活" :value="0" />
                <el-option label="正常"   :value="1" />
                <el-option label="禁用"   :value="2" />
              </el-select>
            </el-form-item>
            <el-form-item label="套餐">
              <el-select v-model="query.packageType" placeholder="全部" clearable style="width:120px;">
                <el-option label="普通版" :value="1" />
                <el-option label="中级版" :value="2" />
                <el-option label="高级版" :value="3" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="load(1)">查询</el-button>
              <el-button @click="resetQuery">重置</el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <el-card shadow="never">
          <el-table :data="list" stripe v-loading="loading">
            <el-table-column prop="id"            label="ID"       width="80"  align="center" />
            <el-table-column prop="name"          label="商家名称" min-width="160" />
            <el-table-column prop="licenseNo"     label="营业执照" min-width="150" />
            <el-table-column prop="contactPerson" label="联系人"   width="100" />
            <el-table-column prop="contactPhone"  label="联系电话" width="140" />
            <el-table-column prop="packageType"   label="套餐"     width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="pkgTag(row.packageType).type" size="small">{{ pkgTag(row.packageType).label }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="statusTag(row.status).type" size="small">{{ statusTag(row.status).label }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="260" align="center" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" @click="$router.push(`/merchant/${row.id}`)">详情</el-button>
                <el-button link type="warning" @click="openAssignPkg(row)">分配套餐</el-button>
                <el-button link :type="row.status === 1 ? 'danger' : 'success'" @click="toggleStatus(row)">
                  {{ row.status === 1 ? '禁用' : '启用' }}
                </el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-pagination
            v-model:current-page="query.page"
            v-model:page-size="query.size"
            :total="total"
            layout="total, prev, pager, next"
            style="margin-top:16px;justify-content:flex-end;"
            @change="load"
          />
        </el-card>
      </el-tab-pane>

      <!-- ── Tab 1：待合作审批 ── -->
      <el-tab-pane name="pending">
        <template #label>
          待合作审批
          <el-badge v-if="pendingTotal > 0" :value="pendingTotal" :max="99" style="margin-left:6px;vertical-align:middle;" />
        </template>

        <el-card shadow="never">
          <el-table :data="pendingList" stripe v-loading="pendingLoading">
            <el-table-column prop="salesman_name"  label="业务员"   width="110" />
            <el-table-column prop="salesman_phone" label="业务员电话" width="135" />
            <el-table-column prop="merchant_name"  label="商家名称" min-width="140" />
            <el-table-column prop="contact_person" label="联系人"   width="100" />
            <el-table-column prop="contact_phone"  label="联系电话" width="135" />
            <el-table-column prop="address"        label="地址"     min-width="160" show-overflow-tooltip />
            <el-table-column label="合作金额" width="150" align="right">
              <template #default="{ row }">
                ¥{{ Number(row.commission || 0).toFixed(2) }}
                <el-tag v-if="row.co_follow_count > 0" size="small" class="tag-joint" style="margin-left:4px;">联合</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="updated_at" label="申请时间" width="155">
              <template #default="{ row }">{{ fmtDate(row.updated_at) }}</template>
            </el-table-column>
            <el-table-column label="操作" width="80" align="center" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" size="small" @click="openApproval(row)">审批</el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-pagination
            v-model:current-page="pendingQuery.page"
            :page-size="pendingQuery.size"
            :total="pendingTotal"
            layout="total, prev, pager, next"
            style="margin-top:16px;justify-content:flex-end;"
            @current-change="p => loadPending(p)"
          />
        </el-card>
      </el-tab-pane>
      <!-- ── Tab 2：跟进商家列表 ── -->
      <el-tab-pane label="跟进商家列表" name="follows">
        <!-- 搜索栏 -->
        <el-card shadow="never" style="margin-bottom:16px;">
          <el-form :model="followQuery" inline>
            <el-form-item label="商家名称">
              <el-input v-model="followQuery.merchantName" placeholder="搜索商家名称" clearable style="width:180px;" />
            </el-form-item>
            <el-form-item label="业务员">
              <el-input v-model="followQuery.salesmanName" placeholder="搜索业务员姓名" clearable style="width:160px;" />
            </el-form-item>
            <el-form-item label="跟进状态">
              <el-select v-model="followQuery.status" placeholder="全部" clearable style="width:120px;">
                <el-option label="接洽中"   :value="1" />
                <el-option label="已失效"   :value="3" />
                <el-option label="待审批"   :value="4" />
                <el-option label="审批失败" :value="5" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="loadFollows(1)">查询</el-button>
              <el-button @click="resetFollowQuery">重置</el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <el-card shadow="never">
          <el-table :data="followList" stripe v-loading="followLoading" style="width:100%;">
            <el-table-column prop="id"             label="ID"       width="70"  align="center" />
            <el-table-column prop="merchant_name"  label="商家名称" min-width="140" show-overflow-tooltip />
            <el-table-column prop="license_no"     label="营业执照" min-width="150" show-overflow-tooltip />
            <el-table-column prop="contact_person" label="联系人"   width="90" />
            <el-table-column prop="contact_phone"  label="联系电话" width="130" />
            <el-table-column prop="address"        label="地址"     min-width="160" show-overflow-tooltip />
            <el-table-column prop="salesman_name"  label="业务员"   width="90" />
            <el-table-column prop="salesman_phone" label="业务员电话" width="130" />
            <el-table-column label="跟进状态" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="followStatusTag(row.status).type" size="small">{{ followStatusTag(row.status).label }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="门店照片" width="90" align="center">
              <template #default="{ row }">
                <el-image
                  v-if="row.store_photo_url"
                  :src="toFullUrl(row.store_photo_url)"
                  :preview-src-list="[toFullUrl(row.store_photo_url)]"
                  preview-teleported
                  fit="cover"
                  style="width:48px;height:36px;border-radius:4px;cursor:pointer;"
                />
                <span v-else style="color:#ccc;">--</span>
              </template>
            </el-table-column>
            <el-table-column label="最后更新" width="155" align="center">
              <template #default="{ row }">{{ fmtDate(row.updated_at) }}</template>
            </el-table-column>
          </el-table>
          <el-pagination
            v-model:current-page="followQuery.page"
            :page-size="followQuery.size"
            :total="followTotal"
            layout="total, prev, pager, next"
            style="margin-top:16px;justify-content:flex-end;"
            @current-change="p => loadFollows(p)"
          />
        </el-card>
      </el-tab-pane>

      <!-- ── Tab 3：套餐申请 ── -->
      <el-tab-pane name="applications">
        <template #label>
          套餐申请
          <el-badge v-if="appPendingCount > 0" :value="appPendingCount" :max="99" style="margin-left:6px;vertical-align:middle;" />
        </template>

        <!-- 筛选 -->
        <el-card shadow="never" style="margin-bottom:16px;">
          <el-form inline>
            <el-form-item label="状态">
              <el-select v-model="appQuery.status" placeholder="全部" clearable style="width:120px;" @change="loadApplications(1)">
                <el-option label="待处理" :value="0" />
                <el-option label="已通过" :value="1" />
                <el-option label="已拒绝" :value="2" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="loadApplications(1)">查询</el-button>
              <el-button @click="() => { appQuery.status = null; loadApplications(1) }">重置</el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <el-card shadow="never">
          <el-table :data="appList" stripe v-loading="appLoading" style="cursor:pointer;" @row-click="openAppDetail">
            <el-table-column prop="merchantId"   label="商家ID"   width="80"  align="center" />
            <el-table-column prop="merchantName" label="商家名称" min-width="140" />
            <el-table-column prop="contactPhone" label="联系电话" width="140" />
            <el-table-column label="申请套餐" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="pkgTag(row.targetPkg).type" size="small">{{ pkgTag(row.targetPkg).label }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="状态" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="appStatusTag(row.status).type" size="small">{{ appStatusTag(row.status).label }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="申请时间" width="160">
              <template #default="{ row }">{{ fmtDate(row.createdAt) }}</template>
            </el-table-column>
            <el-table-column label="操作" width="130" align="center" fixed="right">
              <template #default="{ row }">
                <template v-if="row.status === 0">
                  <el-button link type="success" @click.stop="openAppReview(row, 1)">通过</el-button>
                  <el-button link type="danger"  @click.stop="openAppReview(row, 2)">拒绝</el-button>
                </template>
                <span v-else style="color:#999;font-size:12px;">已处理</span>
              </template>
            </el-table-column>
          </el-table>
          <el-pagination
            v-model:current-page="appQuery.page"
            :page-size="appQuery.size"
            :total="appTotal"
            layout="total, prev, pager, next"
            style="margin-top:16px;justify-content:flex-end;"
            @current-change="p => loadApplications(p)"
          />
        </el-card>
      </el-tab-pane>
    </el-tabs>

    <!-- ── 套餐申请详情弹窗 ── -->
    <el-dialog v-model="appDetailVisible" title="申请详情" width="500px" :close-on-click-modal="true">
      <template v-if="appDetailRow">
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="商家ID">{{ appDetailRow.merchantId }}</el-descriptions-item>
          <el-descriptions-item label="商家名称">{{ appDetailRow.merchantName }}</el-descriptions-item>
          <el-descriptions-item label="联系电话">{{ appDetailRow.contactPhone }}</el-descriptions-item>
          <el-descriptions-item label="申请套餐">
            <el-tag :type="pkgTag(appDetailRow.targetPkg).type" size="small">{{ pkgTag(appDetailRow.targetPkg).label }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="appStatusTag(appDetailRow.status).type" size="small">{{ appStatusTag(appDetailRow.status).label }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="申请时间">{{ fmtDate(appDetailRow.createdAt) }}</el-descriptions-item>
          <el-descriptions-item label="备注" :span="2">{{ appDetailRow.remark || '--' }}</el-descriptions-item>
          <el-descriptions-item v-if="appDetailRow.adminNote" label="管理员备注" :span="2">{{ appDetailRow.adminNote }}</el-descriptions-item>
          <el-descriptions-item v-if="appDetailRow.imageUrl" label="凭证图片" :span="2">
            <el-image :src="BASE_URL + appDetailRow.imageUrl"
              :preview-src-list="[BASE_URL + appDetailRow.imageUrl]" preview-teleported
              fit="cover" style="width:160px;height:110px;border-radius:6px;cursor:pointer;" />
          </el-descriptions-item>
        </el-descriptions>
      </template>
      <template #footer>
        <el-button @click="appDetailVisible = false">关闭</el-button>
        <template v-if="appDetailRow?.status === 0">
          <el-button type="danger"   @click="appDetailVisible = false; openAppReview(appDetailRow, 2)">拒绝</el-button>
          <el-button type="success"  @click="appDetailVisible = false; openAppReview(appDetailRow, 1)">通过</el-button>
        </template>
      </template>
    </el-dialog>

    <!-- ── 套餐申请通过弹窗（分配套餐样式） ── -->
    <el-dialog v-model="appReviewVisible" :title="appReviewAction === 1 ? '通过套餐申请' : '拒绝套餐申请'"
      width="400px" :close-on-click-modal="false">
      <template v-if="appReviewRow">
        <el-form label-width="90px">
          <el-form-item label="商家">
            <span>{{ appReviewRow.merchantName }}</span>
          </el-form-item>
          <el-form-item label="申请套餐">
            <el-tag :type="pkgTag(appReviewRow.targetPkg).type" size="small">{{ pkgTag(appReviewRow.targetPkg).label }}</el-tag>
          </el-form-item>
          <el-form-item v-if="appReviewAction === 1" label="有效期至" required>
            <el-date-picker v-model="appExpireAt" type="date" value-format="YYYY-MM-DD"
              placeholder="选择到期日期" style="width:200px;"
              :disabled-date="d => d < new Date(new Date().setHours(0,0,0,0))" />
          </el-form-item>
        </el-form>
      </template>
      <template #footer>
        <el-button @click="appReviewVisible = false">取消</el-button>
        <el-button :type="appReviewAction === 1 ? 'primary' : 'danger'"
          :loading="appReviewSaving" @click="confirmAppReview">
          {{ appReviewAction === 1 ? '确认分配' : '确认拒绝' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- ── 新增商家弹窗 ── -->
    <el-dialog v-model="showCreate" title="新增商家" width="480px">
      <el-form :model="createForm" label-width="90px">
        <el-form-item label="商家名称" required><el-input v-model="createForm.name" /></el-form-item>
        <el-form-item label="联系人" required><el-input v-model="createForm.contactPerson" /></el-form-item>
        <el-form-item label="联系电话" required>
          <el-input v-model="createForm.contactPhone" />
          <div style="font-size:12px;color:#909399;margin-top:4px;">该号码同时作为商家登录账号</div>
        </el-form-item>
        <el-form-item label="营业执照"><el-input v-model="createForm.licenseNo" placeholder="选填" /></el-form-item>
        <el-form-item label="地址"><el-input v-model="createForm.address" /></el-form-item>
        <el-form-item label="套餐类型">
          <el-select v-model="createForm.packageType" style="width:160px;">
            <el-option label="普通版" :value="1" />
            <el-option label="中级版" :value="2" />
            <el-option label="高级版" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="createForm.packageType >= 2" label="有效期至">
          <el-date-picker
            v-model="createForm.packageExpireAt"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="选择到期日期"
            style="width:200px;"
            :disabled-date="d => d < new Date(new Date().setHours(0,0,0,0))"
          />
        </el-form-item>
        <el-form-item label="登录密码"><el-input v-model="createForm.password" type="password" show-password placeholder="留空默认 123456" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreate = false">取消</el-button>
        <el-button type="primary" @click="confirmCreate" :loading="createSaving">确认添加</el-button>
      </template>
    </el-dialog>

    <!-- ── 设置密码弹窗 ── -->
    <el-dialog v-model="showPwd" title="设置登录密码" width="380px">
      <el-form label-width="80px">
        <el-form-item label="商家">
          <span>{{ pwdRow?.name }}</span>
        </el-form-item>
        <el-form-item label="新密码">
          <el-input v-model="newPassword" type="password" show-password placeholder="请输入新密码" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showPwd = false">取消</el-button>
        <el-button type="primary" @click="confirmSetPwd" :loading="pwdSaving">确认设置</el-button>
      </template>
    </el-dialog>

    <!-- ── 分配套餐弹窗 ── -->
    <el-dialog v-model="showPkg" title="分配套餐" width="400px">
      <el-form label-width="90px">
        <el-form-item label="商家">
          <span>{{ pkgRow?.name }}</span>
        </el-form-item>
        <el-form-item label="当前套餐">
          <el-tag :type="pkgTag(pkgRow?.packageType).type" size="small">{{ pkgTag(pkgRow?.packageType).label }}</el-tag>
        </el-form-item>
        <el-form-item label="分配为">
          <el-select v-model="pkgTarget" style="width:160px;">
            <el-option label="普通版" :value="1" />
            <el-option label="中级版" :value="2" />
            <el-option label="高级版" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="pkgTarget >= 2" label="有效期至">
          <el-date-picker
            v-model="pkgExpireAt"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="选择到期日期"
            style="width:200px;"
            :disabled-date="d => d < new Date(new Date().setHours(0,0,0,0))"
            @change="onExpireChange"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showPkg = false">取消</el-button>
        <el-button type="primary" @click="confirmAssignPkg" :loading="pkgSaving">确认分配</el-button>
      </template>
    </el-dialog>

    <!-- ── 合作审批弹窗 ── -->
    <el-dialog
      v-model="approvalVisible"
      title="合作申请审批"
      width="560px"
      :close-on-click-modal="false"
      @closed="resetApproval"
    >
      <template v-if="approvalRow">
        <el-descriptions :column="2" border size="small" style="margin-bottom:16px;">
          <el-descriptions-item label="商家名称" :span="2">
            {{ approvalRow.merchant_name }}
            <el-tag v-if="approvalRow.co_follow_count > 0" size="small" class="tag-joint" style="margin-left:6px;">联合跟进</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="联系人">{{ approvalRow.contact_person || '--' }}</el-descriptions-item>
          <el-descriptions-item label="联系电话">{{ approvalRow.contact_phone || '--' }}</el-descriptions-item>
          <el-descriptions-item label="地址" :span="2">{{ approvalRow.address || '--' }}</el-descriptions-item>
          <el-descriptions-item label="业务员">
            <div v-for="(s, i) in coFollowers" :key="i">{{ s.name }}</div>
          </el-descriptions-item>
          <el-descriptions-item label="业务员电话">
            <div v-for="(s, i) in coFollowers" :key="i">{{ s.phone }}</div>
          </el-descriptions-item>
          <el-descriptions-item label="申请时间" :span="2">{{ fmtDate(approvalRow.updated_at) }}</el-descriptions-item>
        </el-descriptions>

        <!-- 门店实拍图 -->
        <div v-if="approvalRow.store_photo_url" class="store-photo-section" style="margin-bottom:16px;">
          <div class="section-title">门店实拍图</div>
          <el-image
            :src="toFullUrl(approvalRow.store_photo_url)"
            :preview-src-list="[toFullUrl(approvalRow.store_photo_url)]"
            preview-teleported
            fit="cover"
            class="store-photo-thumb"
          />
        </div>

        <!-- 合作信息 -->
        <div class="cooperation-section">
          <div class="section-title">合作信息</div>
          <div class="info-row">
            <span class="info-label">合作金额</span>
            <span class="info-val">¥{{ Number(approvalRow.commission || 0).toFixed(2) }}</span>
          </div>
          <div class="info-row" v-if="approvalRow.follow_record">
            <span class="info-label">备注</span>
            <span class="info-val" style="white-space:pre-line;">{{ approvalRow.follow_record }}</span>
          </div>
          <div class="info-row" v-if="approvalRow.voucher_url">
            <span class="info-label">合作凭证</span>
            <el-image
              :src="toFullUrl(approvalRow.voucher_url)"
              :preview-src-list="[toFullUrl(approvalRow.voucher_url)]"
              preview-teleported
              fit="cover"
              class="voucher-thumb"
            />
          </div>
        </div>

        <!-- 跟进记录 -->
        <div class="records-section">
          <div class="section-title">跟进记录</div>
          <div v-if="recordsLoading" style="text-align:center;padding:16px;">
            <el-icon class="is-loading"><Loading /></el-icon>
          </div>
          <div v-else-if="approvalRecords.length === 0" class="records-empty">暂无记录</div>
          <div v-else class="records-list">
            <div v-for="rec in approvalRecords" :key="rec.id" class="record-item">
              <el-tag
                :type="rec.type === 'status' ? 'warning' : 'info'"
                size="small"
                style="margin-right:8px;flex-shrink:0;"
              >{{ rec.type === 'status' ? '状态' : '记录' }}</el-tag>
              <div class="record-body">
                <div class="record-content">{{ rec.content }}</div>
                <div class="record-time">{{ fmtDate(rec.createdAt) }}</div>
              </div>
            </div>
          </div>
        </div>

        <el-divider />

        <!-- 驳回原因 -->
        <div v-if="showRejectInput" class="reject-reason">
          <div class="section-title">驳回原因</div>
          <el-input
            v-model="rejectReason"
            type="textarea"
            :rows="3"
            placeholder="请填写驳回原因（可选）"
            maxlength="200"
            show-word-limit
          />
          <div class="reject-actions">
            <el-button @click="showRejectInput = false">取消</el-button>
            <el-button type="danger" :loading="rejecting" @click="confirmReject">确认驳回</el-button>
          </div>
        </div>

        <!-- 审批通过：佣金结算 -->
        <div v-else-if="showApproveStep" class="commission-step">
          <div class="section-title">佣金结算（可选）</div>
          <el-radio-group v-model="commissionMode" @change="() => { selectedRuleId = null; customCommissionAmount = '' }">
            <el-radio value="none">不结算佣金</el-radio>
            <el-radio value="rule">按规则结算</el-radio>
            <el-radio value="custom">自定义金额</el-radio>
          </el-radio-group>

          <!-- 按规则 -->
          <div v-if="commissionMode === 'rule'" style="margin-top:14px;">
            <el-select v-model="selectedRuleId" placeholder="选择佣金规则" style="width:100%;" size="default">
              <el-option
                v-for="rule in commissionRules"
                :key="rule.id"
                :value="rule.id"
                :label="ruleOptionLabel(rule)"
                :disabled="isRuleDisabled(rule)"
              >
                <div style="display:flex;justify-content:space-between;align-items:center;gap:16px;">
                  <span>{{ rule.name }}</span>
                  <span style="color:#909399;font-size:12px;">
                    <template v-if="Number(rule.rate) > 0">
                      {{ (Number(rule.rate) * 100).toFixed(2).replace(/\.?0+$/,'') }}%
                      → ¥{{ calcRuleAmount(rule) }}
                    </template>
                    <template v-else>
                      固定 ¥{{ Number(rule.fixedAmount).toFixed(2) }}
                      <span v-if="isRuleDisabled(rule)" style="color:#f56c6c;">（超出合作金额）</span>
                    </template>
                  </span>
                </div>
              </el-option>
            </el-select>
            <div v-if="selectedRuleId" style="margin-top:8px;font-size:13px;color:#17794a;">
              预计佣金：¥{{ calcRuleAmount(commissionRules.find(r => r.id === selectedRuleId)) }}
            </div>
          </div>

          <!-- 自定义 -->
          <div v-if="commissionMode === 'custom'" style="margin-top:14px;">
            <el-input v-model="customCommissionAmount" placeholder="输入佣金金额" style="width:220px;" @input="customAmountError = ''">
              <template #append>元</template>
            </el-input>
            <div v-if="customAmountError" style="color:#f56c6c;font-size:12px;margin-top:4px;">{{ customAmountError }}</div>
          </div>

          <div class="approve-actions">
            <el-button @click="showApproveStep = false">取消</el-button>
            <el-button type="success" :loading="approving" @click="confirmApprove">确认通过</el-button>
          </div>
        </div>

        <!-- 主操作按钮 -->
        <div v-else class="dialog-actions">
          <el-button type="danger" plain @click="showRejectInput = true">驳回申请</el-button>
          <el-button type="success" @click="showApproveStep = true">通过审批</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Loading } from '@element-plus/icons-vue'
import {
  getMerchantList, createMerchant, toggleMerchant, updateMerchant,
  getFollowList, getFollowDetail, getFollowRecords, approveFollow, rejectFollow,
  getCommissionRules, getMerchantFollowers,
  getPackageApplications, reviewPackageApplication, getAppPendingCount
} from '../../api'
import { BASE_URL } from '../../utils/request'
import { useBadgeStore } from '../../store/badges'

function toFullUrl(url) {
  if (!url) return ''
  return url.startsWith('http') ? url : BASE_URL + url
}

// ── 当前 tab ──────────────────────────────────────────────────
const badges = useBadgeStore()
const activeTab = ref('list')

function onTabChange(tab) {
  if (tab === 'pending')      loadPending(1)
  if (tab === 'follows')      loadFollows(1)
  if (tab === 'applications') loadApplications(1)
}

// ── 商家列表 ──────────────────────────────────────────────────
const loading = ref(false)
const list    = ref([])
const total   = ref(0)
const query   = reactive({ name: '', status: null, packageType: null, page: 1, size: 15 })

const showCreate  = ref(false)
const createSaving = ref(false)
const createForm  = reactive({ name: '', licenseNo: '', contactPerson: '', contactPhone: '', address: '', packageType: 1, packageExpireAt: '', password: '' })

function openCreate() {
  Object.assign(createForm, { name: '', licenseNo: '', contactPerson: '', contactPhone: '', address: '', packageType: 1, packageExpireAt: '', password: '' })
  showCreate.value = true
}

async function confirmCreate() {
  if (!createForm.name.trim())          { ElMessage.warning('请填写商家名称'); return }
  if (!createForm.contactPerson.trim()) { ElMessage.warning('请填写联系人'); return }
  if (!createForm.contactPhone.trim())  { ElMessage.warning('请填写联系电话'); return }
  if (createForm.packageType >= 2 && !createForm.packageExpireAt) { ElMessage.warning('请设置套餐有效期'); return }
  createSaving.value = true
  try {
    await createMerchant({
      name:            createForm.name.trim(),
      licenseNo:       createForm.licenseNo.trim(),
      contactPerson:   createForm.contactPerson,
      contactPhone:    createForm.contactPhone,
      address:         createForm.address,
      packageType:     createForm.packageType,
      packageExpireAt: createForm.packageType >= 2 ? createForm.packageExpireAt : null,
      password:        createForm.password || undefined,
    })
    ElMessage.success('商家已添加')
    showCreate.value = false
    load()
  } catch (e) {
    ElMessage.error(e?.response?.data?.message || '添加失败')
  } finally {
    createSaving.value = false
  }
}

const showPwd     = ref(false)
const pwdRow      = ref(null)
const newPassword = ref('')
const pwdSaving   = ref(false)

function openSetPwd(row) {
  pwdRow.value      = row
  newPassword.value = ''
  showPwd.value     = true
}

async function confirmSetPwd() {
  if (!newPassword.value) { ElMessage.warning('请输入新密码'); return }
  pwdSaving.value = true
  try {
    await updateMerchant(pwdRow.value.id, { password: newPassword.value })
    ElMessage.success('密码已设置')
    showPwd.value = false
  } catch (_) {
    ElMessage.error('操作失败')
  } finally {
    pwdSaving.value = false
  }
}

const showPkg     = ref(false)
const pkgRow      = ref(null)
const pkgTarget   = ref(1)
const pkgExpireAt = ref('')
const pkgSaving   = ref(false)

function statusTag(s) {
  return { 0: { type: 'warning', label: '待激活' }, 1: { type: 'success', label: '正常' }, 2: { type: 'danger', label: '禁用' } }[s] || { type: 'info', label: '未知' }
}

function pkgTag(p) {
  return { 1: { type: 'info', label: '普通版' }, 2: { type: 'primary', label: '中级版' }, 3: { type: 'warning', label: '高级版' } }[p] || { type: 'info', label: '普通版' }
}

function onExpireChange(val) {
  if (!val) return
  const today = new Date(new Date().setHours(0, 0, 0, 0))
  if (new Date(val) < today) {
    ElMessage.warning('有效期不能早于今天')
    pkgExpireAt.value = ''
  }
}

function openAssignPkg(row) {
  pkgRow.value      = row
  pkgTarget.value   = row.packageType || 1
  pkgExpireAt.value = row.packageExpireAt || ''
  showPkg.value     = true
}

async function confirmAssignPkg() {
  if (pkgTarget.value >= 2 && !pkgExpireAt.value) {
    ElMessage.warning('请设置套餐有效期')
    return
  }
  pkgSaving.value = true
  try {
    await updateMerchant(pkgRow.value.id, {
      packageType:     pkgTarget.value,
      packageExpireAt: pkgTarget.value >= 2 ? pkgExpireAt.value : null,
    })
    ElMessage.success('套餐已更新')
    showPkg.value = false
    load()
  } catch (_) {
    ElMessage.error('操作失败')
  } finally {
    pkgSaving.value = false
  }
}

async function load(page) {
  if (page) query.page = page
  loading.value = true
  try {
    const data = await getMerchantList(query)
    list.value  = data.list || []
    total.value = data.total || 0
  } catch (_) {
  } finally {
    loading.value = false
  }
}

function resetQuery() {
  Object.assign(query, { name: '', status: null, packageType: null, page: 1 })
  load()
}

async function toggleStatus(row) {
  const next  = row.status === 1 ? 2 : 1
  const label = next === 1 ? '启用' : '禁用'
  await ElMessageBox.confirm(`确定要${label}商家「${row.name}」吗？`, '提示', { type: 'warning' })
  await toggleMerchant(row.id, next)
  ElMessage.success(`已${label}`)
  load()
}

// ── 跟进商家列表 ──────────────────────────────────────────────
const followLoading = ref(false)
const followList    = ref([])
const followTotal   = ref(0)
const followQuery   = reactive({ merchantName: '', salesmanName: '', status: null, page: 1, size: 20 })

const followStatusTag = s => ({
  1: { type: 'primary', label: '接洽中'   },
  2: { type: 'success', label: '已合作'   },
  3: { type: 'info',    label: '已失效'   },
  4: { type: 'warning', label: '待审批'   },
  5: { type: 'danger',  label: '审批失败' }
}[s] || { type: 'info', label: '未知' })

function fmtDay(dt) {
  if (!dt) return '--'
  const d = new Date(dt)
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}/${pad(d.getMonth()+1)}/${pad(d.getDate())}`
}

async function loadFollows(page) {
  if (page) followQuery.page = page
  followLoading.value = true
  try {
    // 已合作(status=2)的商家不在跟进列表里展示
    const params = { ...followQuery }
    if (!params.status) delete params.status
    if (params.status === 2) { followList.value = []; followTotal.value = 0; followLoading.value = false; return }
    const data = await getFollowDetail(params)
    followList.value  = (data.list || []).filter(r => r.status !== 2)
    followTotal.value = data.total || 0
  } catch (_) {
  } finally {
    followLoading.value = false
  }
}

function resetFollowQuery() {
  Object.assign(followQuery, { merchantName: '', salesmanName: '', status: null, page: 1 })
  loadFollows(1)
}

// ── 待合作审批 ────────────────────────────────────────────────
const pendingLoading = ref(false)
const pendingList    = ref([])
const pendingTotal   = ref(0)
const pendingQuery   = reactive({ page: 1, size: 15 })

async function loadPending(page) {
  if (page) pendingQuery.page = page
  pendingLoading.value = true
  try {
    const data = await getFollowList({ status: 4, page: pendingQuery.page, size: pendingQuery.size })
    pendingList.value  = data.list  || []
    pendingTotal.value = data.total || 0
  } finally {
    pendingLoading.value = false
  }
}

// ── 合作审批弹窗 ──────────────────────────────────────────────
const approvalVisible       = ref(false)
const approvalRow           = ref(null)
const approvalRecords       = ref([])
const coFollowers           = ref([])
const recordsLoading        = ref(false)
const approving             = ref(false)
const rejecting             = ref(false)
const showRejectInput       = ref(false)
const rejectReason          = ref('')
const showApproveStep       = ref(false)
const commissionMode        = ref('none')   // 'none' | 'rule' | 'custom'
const selectedRuleId        = ref(null)
const customCommissionAmount = ref('')
const customAmountError     = ref('')
const commissionRules       = ref([])

function fmtDate(dt) {
  if (!dt) return '--'
  const d = new Date(dt)
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}/${pad(d.getMonth()+1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

async function openApproval(row) {
  approvalRow.value          = row
  approvalRecords.value      = []
  showRejectInput.value      = false
  rejectReason.value         = ''
  showApproveStep.value      = false
  commissionMode.value       = 'none'
  selectedRuleId.value       = null
  customCommissionAmount.value = ''
  customAmountError.value    = ''
  approvalVisible.value      = true

  coFollowers.value = []
  // Load rules, records and co-followers in parallel
  await Promise.allSettled([
    getCommissionRules().then(r => { commissionRules.value = r || [] }),
    (async () => {
      recordsLoading.value = true
      try { approvalRecords.value = await getFollowRecords(row.id) }
      catch (_) { approvalRecords.value = [] }
      finally { recordsLoading.value = false }
    })(),
    getMerchantFollowers(row.merchant_id)
      .then(r => { coFollowers.value = r || [] })
      .catch(() => {})
  ])
}

function resetApproval() {
  approvalRow.value          = null
  approvalRecords.value      = []
  coFollowers.value          = []
  showRejectInput.value      = false
  rejectReason.value         = ''
  showApproveStep.value      = false
  commissionMode.value       = 'none'
  selectedRuleId.value       = null
  customCommissionAmount.value = ''
  customAmountError.value    = ''
}

function calcRuleAmount(rule) {
  if (!rule) return '0.00'
  const cooperation = Number(approvalRow.value?.commission || 0)
  if (Number(rule.rate) > 0) {
    return (cooperation * Number(rule.rate)).toFixed(2)
  }
  return Number(rule.fixedAmount || 0).toFixed(2)
}

function isRuleDisabled(rule) {
  if (Number(rule.rate) > 0) return false
  const cooperation = Number(approvalRow.value?.commission || 0)
  return Number(rule.fixedAmount || 0) > cooperation
}

function ruleOptionLabel(rule) {
  if (Number(rule.rate) > 0) {
    const pct = (Number(rule.rate) * 100).toFixed(2).replace(/\.?0+$/, '')
    return `${rule.name}（${pct}% → ¥${calcRuleAmount(rule)}）`
  }
  return `${rule.name}（固定 ¥${Number(rule.fixedAmount).toFixed(2)}）`
}

async function confirmApprove() {
  const body = {}
  if (commissionMode.value === 'rule') {
    if (!selectedRuleId.value) { ElMessage.warning('请选择佣金规则'); return }
    body.ruleId = selectedRuleId.value
  } else if (commissionMode.value === 'custom') {
    const v = customCommissionAmount.value.trim()
    if (!v) { customAmountError.value = '请输入佣金金额'; return }
    if (!/^\d+(\.\d+)?$/.test(v)) { customAmountError.value = '请输入有效数字'; return }
    const n = Number(v)
    if (n <= 0) { customAmountError.value = '必须为正数'; return }
    const cooperation = Number(approvalRow.value?.commission || 0)
    if (n > cooperation) { customAmountError.value = `佣金不能超过合作金额 ¥${cooperation.toFixed(2)}`; return }
    customAmountError.value = ''
    body.commissionAmount = n
  }

  approving.value = true
  try {
    await approveFollow(approvalRow.value.id, body)
    ElMessage.success('审批已通过')
    approvalVisible.value = false
    loadPending(1)
  } finally {
    approving.value = false
  }
}

async function confirmReject() {
  rejecting.value = true
  try {
    await rejectFollow(approvalRow.value.id, rejectReason.value.trim() || undefined)
    ElMessage.success('已驳回')
    approvalVisible.value = false
    loadPending(1)
  } finally {
    rejecting.value = false
  }
}

// ── 套餐申请 ──────────────────────────────────────────────────
const appLoading      = ref(false)
const appList         = ref([])
const appTotal        = ref(0)
const appPendingCount = ref(0)
const appQuery        = reactive({ status: null, page: 1, size: 20 })

const appDetailVisible = ref(false)
const appDetailRow     = ref(null)

const appReviewVisible = ref(false)
const appReviewRow     = ref(null)
const appReviewAction  = ref(1)   // 1=通过 2=拒绝
const appExpireAt      = ref('')
const appAdminNote     = ref('')
const appReviewSaving  = ref(false)

function appStatusTag(s) {
  return [
    { type: 'warning', label: '待处理' },
    { type: 'success', label: '已通过' },
    { type: 'danger',  label: '已拒绝' },
  ][s ?? 0] || { type: 'info', label: '未知' }
}

async function loadApplications(page) {
  if (page) appQuery.page = page
  appLoading.value = true
  try {
    const data = await getPackageApplications(appQuery)
    appList.value  = data.list  || []
    appTotal.value = data.total || 0
  } catch (_) {
  } finally {
    appLoading.value = false
  }
}

async function fetchAppPendingCount() {
  try { appPendingCount.value = await getAppPendingCount() } catch (_) {}
}

function openAppDetail(row) {
  appDetailRow.value    = row
  appDetailVisible.value = true
}

function openAppReview(row, action) {
  appReviewRow.value    = row
  appReviewAction.value = action
  appExpireAt.value     = ''
  appAdminNote.value    = ''
  appReviewVisible.value = true
}

async function confirmAppReview() {
  if (appReviewAction.value === 1 && !appExpireAt.value) {
    ElMessage.warning('请设置套餐有效期'); return
  }
  appReviewSaving.value = true
  try {
    await reviewPackageApplication(appReviewRow.value.id, {
      status:          appReviewAction.value,
      adminNote:       appAdminNote.value || undefined,
      packageExpireAt: appReviewAction.value === 1 ? appExpireAt.value : undefined,
    })
    ElMessage.success(appReviewAction.value === 1 ? '已通过申请，套餐已升级' : '已拒绝申请')
    appReviewVisible.value = false
    loadApplications(1)
    fetchAppPendingCount()
    badges.refresh()
    if (appReviewAction.value === 1) load()  // 刷新商家列表中的套餐状态
  } catch (_) {
    ElMessage.error('操作失败')
  } finally {
    appReviewSaving.value = false
  }
}

onMounted(() => {
  load()
  loadPending()
  fetchAppPendingCount()
})
</script>

<style scoped>
.page-header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 16px;
  h2 { margin: 0; font-size: 20px; color: #1a1a2e; }
}

.section-title {
  font-size: 13px;
  font-weight: 600;
  color: #606266;
  margin-bottom: 10px;
}

.cooperation-section {
  background: #f8f9fa;
  border-radius: 6px;
  padding: 14px 16px;
  margin-bottom: 16px;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
  &:last-child { margin-bottom: 0; }
}

.info-label {
  font-size: 13px;
  color: #909399;
  width: 64px;
  flex-shrink: 0;
}

.info-val { font-size: 14px; color: #303133; }
.info-val.amount { font-size: 18px; font-weight: 700; color: #17794a; }

.voucher-thumb {
  width: 180px;
  height: 120px;
  border-radius: 6px;
  border: 1px solid #eee;
  cursor: pointer;
}

.records-section { margin-bottom: 8px; }

.records-empty {
  font-size: 13px;
  color: #c0c4cc;
  text-align: center;
  padding: 12px 0;
}

.records-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 220px;
  overflow-y: auto;
}

.record-item {
  display: flex;
  align-items: flex-start;
  background: #f8f9fa;
  border-radius: 6px;
  padding: 10px 12px;
  gap: 0;
}

.record-body { flex: 1; min-width: 0; }

.record-content {
  font-size: 13px;
  color: #303133;
  line-height: 1.6;
  white-space: pre-line;
}

.record-time {
  font-size: 12px;
  color: #c0c4cc;
  margin-top: 4px;
}

.reject-reason {
  .reject-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 12px;
  }
}

.commission-step {
  .approve-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 16px;
  }
  .el-radio-group {
    display: flex;
    gap: 16px;
    flex-wrap: wrap;
  }
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

:deep(.tag-joint) {
  background-color: #f3e5f5;
  border-color: #ce93d8;
  color: #6a1b9a;
}

</style>
