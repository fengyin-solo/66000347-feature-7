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
            <h3 class="text-sm font-bold text-slate-400 mb-3">语系概览</h3>
            <div class="space-y-2">
              <div v-for="f in LANGUAGE_FAMILIES" :key="f.id"
                class="flex items-start gap-2 text-sm rounded p-1 -m-1 cursor-pointer transition"
                :class="store.overviewFamilyId === f.id ? 'bg-slate-700 ring-1 ring-cyan-500' : 'hover:bg-slate-700/60'"
                @click="store.toggleOverviewFamily(f.id)">
                <span class="w-3 h-3 rounded-full mt-0.5 flex-shrink-0" :style="{backgroundColor: f.color}"></span>
                <div class="flex-1"><div class="font-bold">{{ f.name }}</div><div class="text-xs text-slate-500">{{ f.era }} · {{ f.languages.join('/') }}</div></div>
                <span class="text-xs text-slate-500 flex-shrink-0">{{ store.familyStatsMap[f.id].rootCount }} 词根</span>
              </div>
            </div>
          </div>
          <div v-if="store.overviewStats" class="bg-slate-800 rounded-lg p-4 border border-slate-700">
            <div class="flex items-center justify-between mb-3">
              <h3 class="text-sm font-bold text-slate-400">覆盖度详情 · {{ overviewFamily?.name }}</h3>
              <button class="text-xs text-cyan-400 hover:text-cyan-300 border border-cyan-800 rounded px-2 py-0.5" @click="locateFamily">定位词表</button>
            </div>
            <template v-if="store.overviewStats.rootCount > 0">
              <div class="grid grid-cols-3 gap-2 mb-3">
                <div class="bg-slate-900 rounded p-2">
                  <div class="text-xs text-slate-500">已收录词根</div>
                  <div class="text-lg font-bold text-cyan-400">{{ store.overviewStats.rootCount }}</div>
                </div>
                <div class="bg-slate-900 rounded p-2">
                  <div class="text-xs text-slate-500">语言覆盖缺口</div>
                  <div class="text-lg font-bold text-orange-400">{{ store.overviewStats.gapCount }}</div>
                  <div class="text-xs text-slate-500">覆盖率 {{ (store.overviewStats.coverageRate * 100).toFixed(0) }}%</div>
                </div>
                <div class="bg-slate-900 rounded p-2">
                  <div class="text-xs text-slate-500 mb-1">最近更新</div>
                  <div v-for="r in store.overviewStats.recent" :key="r.root" class="text-xs flex justify-between gap-1">
                    <span class="font-mono text-slate-300 truncate">{{ r.root }}</span>
                    <span class="text-slate-500 flex-shrink-0">{{ r.updatedAt?.slice(5) }}</span>
                  </div>
                </div>
              </div>
              <div v-if="store.overviewStats.gapLanguages.length" class="text-xs text-slate-500 mb-2">
                缺口语言：<span v-for="g in store.overviewStats.gapLanguages" :key="g.language" class="text-orange-300 mr-2">{{ g.language }} 缺 {{ g.missing }}</span>
              </div>
              <div class="max-h-48 overflow-y-auto space-y-1">
                <div v-for="cs in store.overviewStats.sets" :key="cs.root"
                  class="flex items-center gap-2 text-xs bg-slate-900 rounded px-2 py-1.5 cursor-pointer hover:bg-slate-700"
                  @click="locateRoot(cs.root)">
                  <span class="font-mono font-bold text-slate-200">{{ cs.root }}</span>
                  <span class="text-slate-500">{{ cs.meaning }}</span>
                  <span class="ml-auto flex-shrink-0 text-slate-400">{{ coveredCount(cs) }}/{{ overviewFamily?.languages.length }}</span>
                  <span v-if="store.missingLanguages(cs).length" class="flex-shrink-0 text-orange-400">缺 {{ store.missingLanguages(cs).join('/') }}</span>
                  <span v-else class="flex-shrink-0 text-green-500">覆盖完整</span>
                  <span class="flex-shrink-0 text-slate-600">{{ cs.updatedAt }}</span>
                </div>
              </div>
            </template>
            <div v-else class="text-xs text-slate-500 bg-slate-900 rounded p-3">
              <span class="text-orange-400 font-bold">未收录</span> — 该语系暂未收录词根数据，语言列表仅供参考。
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
      <div ref="cognateSectionRef" class="bg-slate-800 rounded-lg p-4 border border-slate-700 scroll-mt-4">
        <h3 class="text-sm font-bold text-slate-400 mb-3">同源词对照表</h3>
        <div class="flex gap-2 mb-3">
          <input v-model="store.searchQuery" placeholder="搜索词根/含义..." class="flex-1 bg-slate-900 border border-slate-600 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-cyan-500" />
          <select v-model="store.selectedFamily" class="bg-slate-900 border border-slate-600 rounded px-2 text-sm text-slate-300">
            <option value="all">全部语系</option>
            <option v-for="f in LANGUAGE_FAMILIES" :key="f.id" :value="f.id">{{ f.name }}</option>
          </select>
        </div>
        <div class="overflow-x-auto max-h-64 overflow-y-auto">
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
              <tr v-if="!store.filteredCognates.length">
                <td colspan="8" class="px-2 py-6 text-center text-slate-500">{{ store.cognateEmptyText }}</td>
              </tr>
              <tr v-for="cs in store.filteredCognates" :key="cs.root" class="border-t border-slate-700 hover:bg-slate-700">
                <td class="px-2 py-1.5 font-mono text-slate-200 font-bold">{{ cs.root }}</td>
                <td class="px-2 py-1.5 text-slate-400">{{ cs.meaning }}</td>
                <td class="px-2 py-1.5 font-mono text-cyan-300">{{ cs.languages['英语'] || '—' }}</td>
                <td class="px-2 py-1.5 font-mono text-blue-300">{{ cs.languages['法语'] || '—' }}</td>
                <td class="px-2 py-1.5 font-mono text-green-300">{{ cs.languages['德语'] || '—' }}</td>
                <td class="px-2 py-1.5 font-mono text-orange-300">{{ cs.languages['西班牙语'] || '—' }}</td>
                <td class="px-2 py-1.5 font-mono text-purple-300">{{ cs.languages['俄语'] || '—' }}</td>
                <td class="px-2 py-1.5 font-mono text-yellow-300">{{ cs.languages['拉丁语'] || '—' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import * as d3 from 'd3'
import { useEtymologyStore, LANGUAGE_FAMILIES } from './store/etymology'

const store = useEtymologyStore()
const svgRef = ref<SVGSVGElement | null>(null)
const cognateSectionRef = ref<HTMLElement | null>(null)
const COLORS: Record<string, string> = { ie: '#3b82f6', st: '#22c55e', aa: '#f59e0b', ural: '#8b5cf6' }

const overviewFamily = computed(() =>
  LANGUAGE_FAMILIES.find(f => f.id === store.overviewFamilyId) || null
)

function coveredCount(cs: any) {
  const langs = overviewFamily.value?.languages || []
  return langs.filter(l => cs.languages[l] && cs.languages[l] !== '-').length
}

function scrollToCognates() {
  cognateSectionRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

// 定位到该语系对应的词表范围：与明细列表同口径（语系全量词根）
function locateFamily() {
  if (!store.overviewFamilyId) return
  store.selectedFamily = store.overviewFamilyId
  store.searchQuery = ''
  scrollToCognates()
}

// 定位到单个词根在词表中的位置
function locateRoot(root: string) {
  if (store.overviewFamilyId) store.selectedFamily = store.overviewFamilyId
  store.searchQuery = root
  scrollToCognates()
}

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
