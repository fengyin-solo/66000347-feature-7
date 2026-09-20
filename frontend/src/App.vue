<template>
  <div class="min-h-screen bg-slate-900 text-slate-200">
    <header class="border-b border-slate-700 px-6 py-4">
      <h1 class="text-2xl font-bold text-cyan-400">语言词源图谱与多语系演化追踪</h1>
      <p class="text-sm text-slate-500 mt-1">D3.js力导向图 · 印欧语系演化 · 同源词对照 · 500+词根</p>
    </header>
    <div class="p-4 space-y-4">
      <div class="grid lg:grid-cols-3 gap-4">
        <div class="lg:col-span-2 bg-slate-800 rounded-lg p-4 border border-slate-700">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-sm font-bold text-slate-400">词源力导向网络</h3>
            <div class="flex gap-3 text-xs">
              <span v-for="f in LANGUAGE_FAMILIES" :key="f.id" class="flex items-center gap-1">
                <span class="w-3 h-3 rounded-full" :style="{backgroundColor: f.color}"></span>{{ f.name }}
              </span>
            </div>
          </div>
          <svg ref="svgRef" class="w-full bg-slate-900 rounded" style="height:460px"></svg>
        </div>
        <div class="space-y-4">
          <div class="bg-slate-800 rounded-lg p-4 border border-slate-700">
            <div class="flex items-center justify-between mb-3">
              <h3 class="text-sm font-bold text-slate-400">语系概览</h3>
              <span class="text-[10px] text-slate-600">点击查看覆盖度</span>
            </div>
            <div class="space-y-2">
              <button v-for="f in LANGUAGE_FAMILIES" :key="f.id" type="button"
                class="w-full flex items-start gap-2 text-sm text-left rounded p-1.5 -mx-1.5 transition-colors hover:bg-slate-700/60"
                :class="store.drilledFamilyId === f.id ? 'bg-slate-700' : ''"
                :style="store.drilledFamilyId === f.id ? { boxShadow: `inset 0 0 0 1px ${f.color}` } : {}"
                @click="store.toggleDrill(f.id)">
                <span class="w-3 h-3 rounded-full mt-0.5 flex-shrink-0" :style="{backgroundColor: f.color}"></span>
                <div class="min-w-0">
                  <div class="flex items-center gap-1.5">
                    <span class="font-bold">{{ f.name }}</span>
                    <svg class="w-3 h-3 text-slate-500 transition-transform" :class="store.drilledFamilyId === f.id ? 'rotate-90' : ''" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L10.94 10 7.23 6.29a.75.75 0 111.04-1.08l4.25 4.25a.75.75 0 010 1.08l-4.25 4.25a.75.75 0 01-1.06-.02z" clip-rule="evenodd"/></svg>
                  </div>
                  <div class="text-xs text-slate-500">{{ f.era }} · {{ f.languages.join('/') }}</div>
                </div>
              </button>
            </div>

            <!-- 覆盖度下钻视图 -->
            <div v-if="store.drilledFamily && store.drilledCoverage" class="mt-3 pt-3 border-t border-slate-700 space-y-3">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-1.5">
                  <span class="w-2.5 h-2.5 rounded-full" :style="{backgroundColor: store.drilledFamily.color}"></span>
                  <span class="text-sm font-bold text-slate-200">{{ store.drilledFamily.name }} · 覆盖度</span>
                </div>
                <button type="button" class="text-slate-500 hover:text-slate-300 text-xs" @click="store.toggleDrill(store.drilledFamily!.id)">收起 ✕</button>
              </div>

              <!-- 未收录：语料库中没有任何该语系词根 -->
              <div v-if="store.drilledDataState === 'empty'" class="rounded border border-dashed border-slate-600 bg-slate-900/60 p-3 text-center">
                <div class="text-2xl">🗂️</div>
                <div class="text-xs font-bold text-slate-400 mt-1">未收录</div>
                <div class="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                  该语系暂未收录任何词根<br />（声明语言 {{ store.drilledFamily.languages.length }} 种，词库条目 0）
                </div>
              </div>

              <template v-else>
                <!-- 统计卡片：同一口径，与明细、词表范围关联 -->
                <div class="grid grid-cols-3 gap-1.5">
                  <div class="rounded bg-slate-900 border border-slate-700 p-2">
                    <div class="text-lg font-bold text-cyan-300">{{ store.drilledCoverage.rootCount }}</div>
                    <div class="text-[10px] text-slate-500 leading-tight mt-0.5">已收录词根</div>
                  </div>
                  <div class="rounded bg-slate-900 border border-slate-700 p-2">
                    <div class="text-lg font-bold" :class="store.drilledCoverage.coverageRatio >= 1 ? 'text-green-400' : 'text-amber-400'">
                      {{ Math.round(store.drilledCoverage.coverageRatio * 100) }}%
                    </div>
                    <div class="text-[10px] text-slate-500 leading-tight mt-0.5">
                      语言覆盖<br /><span class="text-slate-600">{{ store.drilledCoverage.coveredLanguageCount }}/{{ store.drilledCoverage.languageCount }} 种语言</span>
                    </div>
                  </div>
                  <div class="rounded bg-slate-900 border border-slate-700 p-2">
                    <div class="text-[11px] font-bold text-slate-200 truncate" :title="store.drilledCoverage.recentUpdates[0]?.root">
                      {{ store.drilledCoverage.recentUpdates[0]?.root || '—' }}
                    </div>
                    <div class="text-[10px] text-slate-500 leading-tight mt-0.5">
                      最近更新<br /><span class="text-slate-600">{{ store.drilledCoverage.recentUpdates[0]?.updatedAt || '—' }}</span>
                    </div>
                  </div>
                </div>

                <!-- 暂无匹配：语系有收录，但当前搜索口径下词表范围内无匹配 -->
                <div v-if="store.drilledDataState === 'no-match'" class="rounded border border-amber-700/50 bg-amber-900/10 p-2.5 text-center">
                  <div class="text-xs font-bold text-amber-400">暂无匹配</div>
                  <div class="text-[11px] text-slate-400 mt-0.5">当前搜索条件下，该语系词表范围内没有匹配词根</div>
                  <button type="button"
                    class="mt-2 text-[11px] px-2 py-1 rounded bg-amber-700/30 text-amber-300 hover:bg-amber-700/50 border border-amber-700/50"
                    @click="store.clearSearchAndLocate()">清除搜索并定位</button>
                </div>

                <!-- 明细列表：语言覆盖缺口 -->
                <div>
                  <div class="flex items-center justify-between mb-1">
                    <span class="text-[11px] font-bold text-slate-400">语言覆盖缺口</span>
                    <span class="text-[10px] text-slate-600">
                      {{ store.drilledCoverage.gapLanguageCount > 0
                        ? store.drilledCoverage.gapLanguageCount + ' 种语言有缺口'
                        : '全部语言已覆盖' }}
                    </span>
                  </div>
                  <div class="space-y-1">
                    <div v-for="lc in store.drilledCoverage.languages" :key="lc.language"
                      class="rounded bg-slate-900/70 px-2 py-1.5">
                      <div class="flex items-center justify-between text-[11px]">
                        <span class="text-slate-300">{{ lc.language }}</span>
                        <span :class="lc.missing === 0 ? 'text-green-400' : 'text-amber-400'">
                          {{ lc.missing === 0 ? '已覆盖' : '缺 ' + lc.missing + ' 词' }}
                          <span class="text-slate-600">（{{ lc.covered }}/{{ store.drilledCoverage.rootCount }}）</span>
                        </span>
                      </div>
                      <div class="h-1 rounded-full bg-slate-700 mt-1 overflow-hidden">
                        <div class="h-full rounded-full transition-all"
                          :class="lc.missing === 0 ? 'bg-green-500' : 'bg-amber-500'"
                          :style="{ width: Math.round(lc.ratio * 100) + '%' }"></div>
                      </div>
                      <div v-if="lc.missing > 0" class="text-[10px] text-slate-600 mt-1 truncate"
                        :title="lc.missingRoots.join('、')">
                        缺口：{{ lc.missingRoots.join('、') }}
                      </div>
                    </div>
                  </div>
                </div>

                <!-- 明细列表：最近更新项，可定位到词表中的具体词根 -->
                <div>
                  <div class="text-[11px] font-bold text-slate-400 mb-1">最近更新项</div>
                  <div class="space-y-0.5">
                    <button v-for="u in store.drilledCoverage.recentUpdates" :key="u.root" type="button"
                      :disabled="store.drilledDataState !== 'ok'"
                      class="w-full flex items-center justify-between text-[11px] rounded px-1.5 py-1 text-left enabled:hover:bg-slate-700/70 disabled:opacity-50 disabled:cursor-not-allowed"
                      :title="store.drilledDataState === 'ok' ? '在词表中定位该词根' : '当前无匹配，无法定位'"
                      @click="store.locateRootRow(u.root)">
                      <span class="font-mono text-slate-300 truncate">{{ u.root }}</span>
                      <span class="text-slate-500 flex-shrink-0 ml-2">{{ u.updatedAt }}</span>
                    </button>
                  </div>
                </div>

                <!-- 定位到对应词表范围 -->
                <button type="button"
                  :disabled="store.drilledDataState !== 'ok'"
                  class="w-full text-[11px] py-1.5 rounded border transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  :class="store.drilledDataState === 'ok'
                    ? 'border-cyan-700/60 text-cyan-300 hover:bg-cyan-900/30'
                    : 'border-slate-700 text-slate-500'"
                  @click="store.locateFamilyRange()">
                  ↓ 定位到词表范围（{{ matchedRootCount }} 个匹配词根）
                </button>
              </template>
            </div>
          </div>
          <div v-if="store.selectedNode" class="bg-slate-800 rounded-lg p-4 border border-slate-700">
            <h3 class="text-sm font-bold text-slate-400 mb-2">选中节点</h3>
            <div class="text-lg font-bold text-cyan-400">{{ store.selectedNode.word }}</div>
            <div class="text-sm text-slate-400">{{ store.selectedNode.language }} — {{ store.selectedNode.meaning }}</div>
          </div>
          <div class="bg-slate-800 rounded-lg p-4 border border-slate-700 text-xs text-slate-400">
            <h3 class="text-sm font-bold text-slate-400 mb-2">Grimm定律</h3>
            <div class="space-y-1">
              <div class="bg-slate-900 rounded p-2"><span class="text-cyan-400">p→f: </span>pater → father</div>
              <div class="bg-slate-900 rounded p-2"><span class="text-green-400">t→θ: </span>tres → three</div>
              <div class="bg-slate-900 rounded p-2"><span class="text-orange-400">k→h: </span>cord → heart</div>
            </div>
          </div>
        </div>
      </div>
      <div ref="tableCardRef" class="bg-slate-800 rounded-lg p-4 border transition-colors"
        :class="tableFlash ? 'border-cyan-400 shadow-[0_0_0_1px_rgba(34,211,238,0.6)]' : 'border-slate-700'">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-sm font-bold text-slate-400">同源词对照表</h3>
          <span v-if="tableScopeLabel" class="text-[11px] text-cyan-400">{{ tableScopeLabel }}</span>
        </div>
        <div class="flex gap-2 mb-3">
          <input v-model="store.searchQuery" placeholder="搜索词根/含义..." class="flex-1 bg-slate-900 border border-slate-600 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-cyan-500" />
          <select :value="store.selectedFamily" @change="store.selectFamilyFromTable(($event.target as HTMLSelectElement).value)" class="bg-slate-900 border border-slate-600 rounded px-2 text-sm text-slate-300">
            <option value="all">全部语系</option>
            <option v-for="f in LANGUAGE_FAMILIES" :key="f.id" :value="f.id">{{ f.name }}</option>
          </select>
        </div>
        <div ref="tableScrollRef" class="overflow-x-auto max-h-64 overflow-y-auto">
          <table class="w-full text-xs">
            <thead class="sticky top-0 bg-slate-700">
              <tr>
                <th class="px-2 py-2 text-left text-slate-300">词根</th>
                <th class="px-2 py-2 text-left text-slate-300">含义</th>
                <th class="px-2 py-2 text-left text-cyan-400">英语</th>
                <th class="px-2 py-2 text-left text-blue-400">法语</th>
                <th class="px-2 py-2 text-left text-green-400">德语</th>
                <th class="px-2 py-2 text-left text-orange-400">西班牙语</th>
                <th class="px-2 py-2 text-left text-purple-400">俄语</th>
                <th class="px-2 py-2 text-left text-yellow-400">拉丁语</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="cs in store.filteredCognates" :key="cs.root" :data-root="cs.root"
                class="border-t border-slate-700 hover:bg-slate-700 transition-colors"
                :class="highlightedRoot === cs.root ? 'bg-cyan-900/40 outline outline-1 outline-cyan-500/70' : ''">
                <td class="px-2 py-1.5 font-mono text-slate-200 font-bold">{{ cs.root }}</td>
                <td class="px-2 py-1.5 text-slate-400">{{ cs.meaning }}</td>
                <td class="px-2 py-1.5 font-mono text-cyan-300">{{ cs.languages['英语'] || '—' }}</td>
                <td class="px-2 py-1.5 font-mono text-blue-300">{{ cs.languages['法语'] || '—' }}</td>
                <td class="px-2 py-1.5 font-mono text-green-300">{{ cs.languages['德语'] || '—' }}</td>
                <td class="px-2 py-1.5 font-mono text-orange-300">{{ cs.languages['西班牙语'] || '—' }}</td>
                <td class="px-2 py-1.5 font-mono text-purple-300">{{ cs.languages['俄语'] || '—' }}</td>
                <td class="px-2 py-1.5 font-mono text-yellow-300">{{ cs.languages['拉丁语'] || '—' }}</td>
              </tr>
              <tr v-if="store.filteredCognates.length === 0">
                <td colspan="8" class="px-2 py-8 text-center text-slate-500">
                  <template v-if="selectedFamilyIsEmpty">🗂️ 未收录：该语系词库中尚无词根条目</template>
                  <template v-else>🔍 暂无匹配：当前搜索/筛选条件下没有词根，可尝试清除搜索</template>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import * as d3 from 'd3'
import { useEtymologyStore, LANGUAGE_FAMILIES, COGNATE_SETS } from './store/etymology'

const store = useEtymologyStore()
const svgRef = ref<SVGSVGElement | null>(null)
const tableScrollRef = ref<HTMLDivElement | null>(null)
const tableCardRef = ref<HTMLDivElement | null>(null)
const tableFlash = ref(false)
const highlightedRoot = ref<string | null>(null)
let flashTimer: ReturnType<typeof setTimeout> | undefined
let highlightTimer: ReturnType<typeof setTimeout> | undefined
const COLORS: Record<string, string> = { ie: '#3b82f6', st: '#22c55e', aa: '#f59e0b', ural: '#8b5cf6' }

/** 当前下钻语系在词表范围内的匹配词根数（与词表同口径） */
const matchedRootCount = computed(() => {
  if (!store.drilledFamilyId) return 0
  return store.filteredCognates.filter(cs => cs.family === store.drilledFamilyId).length
})

const tableScopeLabel = computed(() => {
  if (store.selectedFamily === 'all') return ''
  const f = LANGUAGE_FAMILIES.find(x => x.id === store.selectedFamily)
  return f ? `词表范围：${f.name} · ${store.filteredCognates.length} 个词根` : ''
})

/** 词表空状态：区分语系完全未收录与当前条件暂无匹配（同一口径） */
const selectedFamilyIsEmpty = computed(() => {
  if (store.selectedFamily === 'all') return COGNATE_SETS.length === 0
  return !COGNATE_SETS.some(cs => cs.family === store.selectedFamily)
})

/** 响应下钻视图的定位动作：切到对应词表范围后滚动并高亮 */
watch(() => store.locateTick, () => {
  nextTick(() => {
    const scrollBox = tableScrollRef.value
    const card = tableCardRef.value
    if (!scrollBox) return
    card?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    clearTimeout(flashTimer)
    tableFlash.value = true
    flashTimer = setTimeout(() => { tableFlash.value = false }, 1800)

    clearTimeout(highlightTimer)
    highlightedRoot.value = null
    requestAnimationFrame(() => {
      const targetRoot = store.locateRoot
      if (targetRoot) {
        const row = scrollBox.querySelector<HTMLElement>(`tr[data-root="${CSS.escape(targetRoot)}"]`)
        if (row) {
          row.scrollIntoView({ behavior: 'smooth', block: 'center' })
          highlightedRoot.value = targetRoot
          highlightTimer = setTimeout(() => { highlightedRoot.value = null }, 2600)
          return
        }
      }
      // 定位整个语系范围：滚到该语系第一段
      const firstFamilyRoot = store.filteredCognates.find(cs => cs.family === store.selectedFamily)?.root
      const row = firstFamilyRoot
        ? scrollBox.querySelector<HTMLElement>(`tr[data-root="${CSS.escape(firstFamilyRoot)}"]`)
        : null
      row?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  })
})

function drawGraph() {
  if (!svgRef.value) return
  const svg = d3.select(svgRef.value)
  svg.selectAll('*').remove()
  const W = svgRef.value.getBoundingClientRect().width || 700, H = 460
  const nodes = store.graph.nodes.map((n: any) => ({ ...n }))
  const links = store.graph.links.map((l: any) => ({ ...l }))
  const sim = d3.forceSimulation(nodes as any)
    .force('link', d3.forceLink(links as any).id((d: any) => d.id).distance(55))
    .force('charge', d3.forceManyBody().strength(-100))
    .force('center', d3.forceCenter(W / 2, H / 2))
    .force('collision', d3.forceCollide(22))
  const g = svg.append('g')
  svg.call(d3.zoom<SVGSVGElement, unknown>().scaleExtent([0.2, 3]).on('zoom', (e) => g.attr('transform', e.transform)) as any)
  const link = g.append('g').selectAll('line').data(links).join('line')
    .attr('stroke', '#475569').attr('stroke-width', 1).attr('opacity', 0.5)
  const node = g.append('g').selectAll('g').data(nodes).join('g')
    .call(d3.drag<any, any>()
      .on('start', (e, d: any) => { if (!e.active) sim.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y })
      .on('drag', (e, d: any) => { d.fx = e.x; d.fy = e.y })
      .on('end', (e, d: any) => { if (!e.active) sim.alphaTarget(0); d.fx = null; d.fy = null }))
    .on('click', (_: any, d: any) => { store.selectedNode = d })
  node.append('circle')
    .attr('r', (d: any) => d.language === 'Proto-IE' ? 12 : 7)
    .attr('fill', (d: any) => COLORS[d.family] || '#64748b')
    .attr('stroke', '#1e293b').attr('stroke-width', 1.5)
  node.append('text').attr('dy', -14).attr('text-anchor', 'middle').attr('font-size', 9).attr('fill', '#e2e8f0')
    .text((d: any) => d.word.length > 8 ? d.word.slice(0, 8) + '…' : d.word)
  node.append('title').text((d: any) => `${d.word} (${d.language}): ${d.meaning}`)
  sim.on('tick', () => {
    link.attr('x1', (d: any) => d.source.x).attr('y1', (d: any) => d.source.y)
      .attr('x2', (d: any) => d.target.x).attr('y2', (d: any) => d.target.y)
    node.attr('transform', (d: any) => `translate(${d.x},${d.y})`)
  })
}

onMounted(() => { setTimeout(drawGraph, 100) })
</script>
