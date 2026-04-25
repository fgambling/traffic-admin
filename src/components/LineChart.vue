<template>
  <div ref="containerRef" :style="`position:relative;width:100%;height:${height}`"
       @mouseleave="tooltip.visible = false">

    <svg v-if="points.length > 1" width="100%" height="100%"
         :viewBox="`0 0 ${W} ${H}`" preserveAspectRatio="none"
         style="overflow:visible;">

      <!-- 网格线 -->
      <line v-for="y in gridYs" :key="y"
            :x1="PAD_L" :y1="y" :x2="W - PAD_R" :y2="y"
            stroke="#f0f0f0" stroke-width="1" />

      <!-- Y轴刻度 -->
      <text v-for="(tick, i) in yTicks" :key="i"
            :x="PAD_L - 6" :y="gridYs[i] + 4"
            font-size="11" fill="#aaa" text-anchor="end">{{ tick }}</text>

      <!-- 面积填充 -->
      <defs>
        <linearGradient id="lc-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#4e7ef7" stop-opacity="0.4" />
          <stop offset="100%" stop-color="#4e7ef7" stop-opacity="0" />
        </linearGradient>
      </defs>
      <polygon :points="areaPoints" fill="url(#lc-grad)" />

      <!-- 折线 -->
      <polyline :points="polylinePoints" fill="none" stroke="#4e7ef7"
                stroke-width="2" stroke-linejoin="round" stroke-linecap="round" />

      <!-- X轴标签（首/尾对齐防溢出） -->
      <text v-for="(p, i) in labelPoints" :key="'l'+i"
            :x="p.x" :y="H - 4" font-size="10" fill="#aaa"
            :text-anchor="p.anchor">{{ p.label }}</text>

      <!-- 数据点（实心） -->
      <circle v-for="(p, i) in points" :key="i"
              :cx="p.x" :cy="p.y" r="3"
              fill="#4e7ef7" stroke="#fff" stroke-width="1.5"
              style="pointer-events:none;" />

      <!-- 高亮点（hover 时） -->
      <circle v-if="tooltip.visible && tooltip.ptIdx >= 0"
              :cx="points[tooltip.ptIdx].x" :cy="points[tooltip.ptIdx].y" r="5"
              fill="#fff" stroke="#4e7ef7" stroke-width="2"
              style="pointer-events:none;" />

      <!-- 透明热区（逐点悬停检测） -->
      <rect v-for="(seg, i) in hitSegs" :key="'h'+i"
            :x="seg.x" :y="PAD_T" :width="seg.w" :height="H - PAD_T - PAD_B"
            fill="transparent"
            @mouseenter="onEnter(i, $event)"
            @mousemove="onMove($event)"
            style="cursor:crosshair;" />
    </svg>

    <div v-else style="display:flex;align-items:center;justify-content:center;height:100%;color:#bbb;font-size:14px;">
      暂无数据
    </div>

    <!-- Tooltip -->
    <div v-if="tooltip.visible"
         class="lc-tooltip"
         :style="`left:${tooltip.x}px;top:${tooltip.y}px;`">
      <div class="lc-tt-label">{{ tooltip.label }}</div>
      <div class="lc-tt-val">{{ tooltip.value }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  data:   { type: Array, default: () => [] },
  height: { type: String, default: '220px' }
})

const containerRef = ref(null)

const W = 800, H = 220, PAD_L = 44, PAD_R = 8, PAD_T = 16, PAD_B = 28
const GRID_LINES = 4

const tooltip = ref({ visible: false, x: 0, y: 0, label: '', value: '', ptIdx: -1 })

const maxVal = computed(() => {
  const m = Math.max(...props.data.map(d => d.value), 1)
  return Math.ceil(m / 10) * 10
})

const gridYs = computed(() => {
  const result = []
  for (let i = 0; i <= GRID_LINES; i++) {
    result.push(PAD_T + ((H - PAD_T - PAD_B) / GRID_LINES) * i)
  }
  return result
})

const yTicks = computed(() =>
  gridYs.value.map((_, i) => Math.round(maxVal.value * (1 - i / GRID_LINES)))
)

const points = computed(() => {
  const n = props.data.length
  if (n === 0) return []
  const chartW = W - PAD_L - PAD_R
  const chartH = H - PAD_T - PAD_B
  return props.data.map((d, i) => ({
    x: PAD_L + (i / Math.max(n - 1, 1)) * chartW,
    y: PAD_T + chartH * (1 - d.value / (maxVal.value || 1))
  }))
})

// 每个数据点左右各占一半区间作为悬停热区
const hitSegs = computed(() => {
  const n = points.value.length
  if (n === 0) return []
  return points.value.map((p, i) => {
    const prev = i > 0     ? points.value[i - 1].x : PAD_L
    const next = i < n - 1 ? points.value[i + 1].x : W - PAD_R
    const x = (p.x + prev) / 2
    const r = (next + p.x) / 2
    return { x, w: r - x }
  })
})

const labelPoints = computed(() => {
  const n = props.data.length
  if (n === 0) return []

  const chartW  = W - PAD_L - PAD_R
  const spacing = chartW / Math.max(n - 1, 1)
  // 首尾标签用 start/end 锚点，与相邻 middle 锚点标签需要 1.5× 标签宽度（≈84px）的间距
  const step    = Math.max(1, Math.ceil(84 / spacing))

  // 先按 step 生成索引
  const indices = []
  for (let i = 0; i < n; i += step) indices.push(i)

  // 处理末尾：若最后一个自然索引离 n-1 的距离 < step（即像素间距 < 56px），替换掉；否则追加
  const last = n - 1
  if (indices[indices.length - 1] !== last) {
    if (last - indices[indices.length - 1] < step) {
      indices[indices.length - 1] = last  // 替换，避免重叠
    } else {
      indices.push(last)
    }
  }

  return indices.map(i => {
    const anchor = i === 0 ? 'start' : i === last ? 'end' : 'middle'
    return { ...points.value[i], label: props.data[i].label, anchor }
  })
})

const polylinePoints = computed(() =>
  points.value.map(p => `${p.x},${p.y}`).join(' ')
)

const areaPoints = computed(() => {
  if (!points.value.length) return ''
  const bottom = H - PAD_B
  const first  = points.value[0]
  const last   = points.value[points.value.length - 1]
  return `${first.x},${bottom} ` + polylinePoints.value + ` ${last.x},${bottom}`
})

function onEnter(idx, e) {
  tooltip.value.ptIdx = idx
  updateTooltipPos(e, idx)
}

function onMove(e) {
  if (tooltip.value.ptIdx < 0) return
  updateTooltipPos(e, tooltip.value.ptIdx)
}

function updateTooltipPos(e, idx) {
  const rect = containerRef.value.getBoundingClientRect()
  const d = props.data[idx]
  let x = e.clientX - rect.left + 12
  let y = e.clientY - rect.top  - 36
  // 防止右溢出
  if (x + 110 > rect.width) x = e.clientX - rect.left - 120
  if (y < 4) y = 4
  tooltip.value = { visible: true, x, y, label: d.label, value: d.value, ptIdx: idx }
}
</script>

<style scoped>
.lc-tooltip {
  position: absolute;
  background: rgba(30, 40, 60, 0.88);
  color: #fff;
  border-radius: 6px;
  padding: 6px 10px;
  font-size: 12px;
  pointer-events: none;
  white-space: nowrap;
  box-shadow: 0 2px 8px rgba(0,0,0,.2);
  z-index: 10;
}
.lc-tt-label { color: rgba(255,255,255,.65); margin-bottom: 2px; }
.lc-tt-val   { font-weight: 700; font-size: 14px; }
</style>
