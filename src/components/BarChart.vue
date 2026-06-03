<template>
  <div ref="containerRef" :style="`position:relative;width:100%;height:${height}`"
       @mouseleave="onLeave">

    <svg v-if="data.length" width="100%" height="100%"
         :viewBox="`0 0 ${W} ${H}`" preserveAspectRatio="none"
         style="overflow:visible;">

      <!-- 渐变定义 -->
      <defs>
        <linearGradient id="bcRevenueGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stop-color="#7aa3ff" stop-opacity="0.95"/>
          <stop offset="100%" stop-color="#4e7ef7" stop-opacity="0.85"/>
        </linearGradient>
        <linearGradient id="bcRevenueGradH" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stop-color="#a4c0ff"/>
          <stop offset="100%" stop-color="#3b6ee8"/>
        </linearGradient>
        <linearGradient id="bcCountGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stop-color="#86d96a" stop-opacity="0.95"/>
          <stop offset="100%" stop-color="#52c41a" stop-opacity="0.85"/>
        </linearGradient>
        <linearGradient id="bcCountGradH" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stop-color="#b1ec97"/>
          <stop offset="100%" stop-color="#3ea30f"/>
        </linearGradient>
      </defs>

      <!-- 网格虚线 -->
      <line v-for="(y, gi) in gridYs" :key="'g'+gi"
            :x1="PAD_L" :y1="y" :x2="W - PAD_R" :y2="y"
            stroke="#eef0f4" stroke-width="1"
            :stroke-dasharray="gi === GRID ? '0' : '3 3'"/>

      <!-- 左 Y 轴刻度（营收·蓝） -->
      <text v-for="(tick, ti) in leftTicks" :key="'lt'+ti"
            :x="PAD_L - 8" :y="gridYs[ti] + 4"
            font-size="10" fill="#8a9cc4" text-anchor="end">{{ tick }}</text>

      <!-- 右 Y 轴刻度（门店·绿） -->
      <text v-for="(tick, ti) in rightTicks" :key="'rt'+ti"
            :x="W - PAD_R + 8" :y="gridYs[ti] + 4"
            font-size="10" fill="#7ab86a" text-anchor="start">{{ tick }}</text>

      <!-- Y 轴单位 -->
      <text :x="PAD_L - 8" :y="PAD_T - 8" font-size="10" fill="#8a9cc4" text-anchor="end">¥</text>
      <text :x="W - PAD_R + 8" :y="PAD_T - 8" font-size="10" fill="#7ab86a" text-anchor="start">家</text>

      <!-- 悬停背景 -->
      <rect v-if="hoverIdx >= 0"
            :x="PAD_L + hoverIdx * slotW" :y="PAD_T"
            :width="slotW" :height="chartH"
            fill="#f5f7fb" opacity="0.7" rx="4"/>

      <!-- 柱体 + X 标签 + 悬停感应区 -->
      <g v-for="(d, i) in data" :key="'slot'+i">
        <!-- 营收柱（蓝） -->
        <rect v-if="d.revenue > 0"
              :x="bar0X(i)" :y="revenueY(d.revenue)"
              :width="barW" :height="revenueH(d.revenue) * animProgress"
              :fill="hoverIdx === i ? 'url(#bcRevenueGradH)' : 'url(#bcRevenueGrad)'"
              :rx="barRadius" style="transition:fill .15s;"/>
        <!-- 门店柱（绿） -->
        <rect v-if="d.merchantCount > 0"
              :x="bar1X(i)" :y="countBarY(d.merchantCount)"
              :width="barW" :height="countH(d.merchantCount) * animProgress"
              :fill="hoverIdx === i ? 'url(#bcCountGradH)' : 'url(#bcCountGrad)'"
              :rx="barRadius" style="transition:fill .15s;"/>

        <!-- 短序列时柱顶数值（≤14 个点才显示） -->
        <template v-if="data.length <= 14 && animProgress > 0.95">
          <text v-if="d.revenue > 0"
                :x="bar0X(i) + barW / 2" :y="revenueY(d.revenue) - 4"
                font-size="9.5" fill="#4e7ef7" text-anchor="middle"
                font-weight="600">{{ Number(d.revenue).toFixed(2) }}</text>
          <text v-if="d.merchantCount > 0"
                :x="bar1X(i) + barW / 2" :y="countBarY(d.merchantCount) - 4"
                font-size="9.5" fill="#52c41a" text-anchor="middle"
                font-weight="600">{{ d.merchantCount }}</text>
        </template>

        <!-- X 轴日期 -->
        <text v-if="i % labelStep === 0 || i === data.length - 1"
              :x="slotCenterX(i)" :y="H - 6"
              :font-size="hoverIdx === i ? 11 : 10"
              :fill="hoverIdx === i ? '#1a1a2e' : '#9aa3b2'"
              :font-weight="hoverIdx === i ? 700 : 400"
              text-anchor="middle"
              style="transition:fill .15s;">{{ d.date }}</text>

        <!-- 透明悬停感应 -->
        <rect :x="PAD_L + i * slotW" :y="PAD_T"
              :width="slotW" :height="chartH"
              fill="transparent"
              @mouseenter="onHover(i, $event)"
              @mousemove="onMove($event)"/>
      </g>
    </svg>

    <div v-else style="display:flex;align-items:center;justify-content:center;height:100%;color:#bbb;font-size:14px;">
      暂无数据
    </div>

    <!-- Tooltip -->
    <transition name="bc-fade">
      <div v-if="tooltip.visible" class="bc-tooltip"
           :style="`left:${tooltip.x}px;top:${tooltip.y}px`">
        <div class="bc-label">{{ tooltip.date }}</div>
        <div class="bc-row">
          <span class="bc-dot" style="background:#4e7ef7;"/>
          <span class="bc-key">营收</span>
          <span class="bc-val">¥{{ tooltip.revenue }}</span>
        </div>
        <div class="bc-row">
          <span class="bc-dot" style="background:#52c41a;"/>
          <span class="bc-key">门店</span>
          <span class="bc-val">{{ tooltip.count }} 家</span>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'

const props = defineProps({
  data:   { type: Array, default: () => [] }, // [{ date, revenue, merchantCount }]
  height: { type: String, default: '260px' }
})

const containerRef = ref(null)
const tooltip = ref({ visible: false, x: 0, y: 0, date: '', revenue: '0.00', count: 0 })
const hoverIdx = ref(-1)
const animProgress = ref(0)

const W = 800, H = 240
const PAD_L = 56, PAD_R = 48, PAD_T = 28, PAD_B = 32
const GRID = 4

const chartW = W - PAD_L - PAD_R
const chartH = H - PAD_T - PAD_B
const bottom = H - PAD_B

const slotW = computed(() => chartW / Math.max(props.data.length, 1))
const barW  = computed(() => Math.max(3, slotW.value * 0.32))
const barRadius = computed(() => Math.min(3, barW.value / 2.5))

const maxRevenue = computed(() => {
  const m = Math.max(...props.data.map(d => Number(d.revenue) || 0), 0.01)
  const magnitude = Math.pow(10, Math.floor(Math.log10(m)))
  return Math.ceil(m / magnitude) * magnitude
})

const maxCount = computed(() =>
  Math.max(...props.data.map(d => Number(d.merchantCount) || 0), 1)
)

const gridYs = computed(() => {
  const ys = []
  for (let i = 0; i <= GRID; i++) ys.push(PAD_T + (chartH / GRID) * i)
  return ys
})

const leftTicks = computed(() =>
  gridYs.value.map((_, i) => (maxRevenue.value * (1 - i / GRID)).toFixed(2))
)

const rightTicks = computed(() =>
  gridYs.value.map((_, i) => Math.round(maxCount.value * (1 - i / GRID)))
)

const labelStep = computed(() => {
  const n = props.data.length
  if (n <= 8)  return 1
  if (n <= 16) return 2
  if (n <= 32) return 3
  return 5
})

function slotCenterX(i) { return PAD_L + i * slotW.value + slotW.value / 2 }

function bar0X(i) {
  const gap = Math.max(2, slotW.value * 0.05)
  return PAD_L + i * slotW.value + (slotW.value - 2 * barW.value - gap) / 2
}
function bar1X(i) {
  const gap = Math.max(2, slotW.value * 0.05)
  return bar0X(i) + barW.value + gap
}

function revenueH(v) { return (Number(v) / maxRevenue.value) * chartH }
function revenueY(v) { return bottom - revenueH(v) * animProgress.value }
function countH(v)   { return (Number(v) / maxCount.value) * chartH }
function countBarY(v){ return bottom - countH(v) * animProgress.value }

function onHover(i, e) {
  hoverIdx.value = i
  const d = props.data[i]
  updatePos(e)
  tooltip.value = {
    visible: true,
    x: tooltip.value.x, y: tooltip.value.y,
    date: d.date,
    revenue: Number(d.revenue).toFixed(2),
    count: d.merchantCount
  }
}
function onMove(e) { if (tooltip.value.visible) updatePos(e) }
function onLeave() {
  tooltip.value.visible = false
  hoverIdx.value = -1
}

function updatePos(e) {
  const rect = containerRef.value.getBoundingClientRect()
  let x = e.clientX - rect.left + 14
  let y = e.clientY - rect.top  - 52
  if (x + 160 > rect.width) x = e.clientX - rect.left - 172
  if (y < 4) y = 4
  tooltip.value.x = x
  tooltip.value.y = y
}

// 入场/数据更新动画
function runAnim() {
  animProgress.value = 0
  const start = performance.now()
  const dur = 600
  const tick = now => {
    const t = Math.min(1, (now - start) / dur)
    animProgress.value = 1 - Math.pow(1 - t, 3) // ease-out cubic
    if (t < 1) requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
}
onMounted(runAnim)
watch(() => props.data, runAnim, { deep: false })
</script>

<style scoped>
.bc-tooltip {
  position: absolute;
  background: rgba(26, 35, 55, 0.94);
  color: #fff;
  border-radius: 8px;
  padding: 10px 14px;
  font-size: 12px;
  pointer-events: none;
  white-space: nowrap;
  box-shadow: 0 4px 16px rgba(0,0,0,.22);
  z-index: 10;
  min-width: 130px;
}
.bc-label {
  color: rgba(255,255,255,.65);
  margin-bottom: 6px;
  font-size: 11px;
  border-bottom: 1px solid rgba(255,255,255,.12);
  padding-bottom: 5px;
}
.bc-row   { display: flex; align-items: center; gap: 8px; margin-top: 4px; }
.bc-dot   { display: inline-block; width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.bc-key   { color: rgba(255,255,255,.7); margin-right: auto; }
.bc-val   { font-weight: 600; }

.bc-fade-enter-active, .bc-fade-leave-active { transition: opacity .15s; }
.bc-fade-enter-from, .bc-fade-leave-to { opacity: 0; }
</style>
