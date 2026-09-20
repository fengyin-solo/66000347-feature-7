import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { COGNATE_SETS, LANGUAGE_FAMILIES, buildGraph } from '../mock/data'
import { computeFamilyCoverage, isRecorded } from '../stats/coverage'
import type { FamilyCoverage } from '../stats/coverage'
export { LANGUAGE_FAMILIES, COGNATE_SETS }
export { computeFamilyCoverage, isRecorded }
export type { FamilyCoverage }

export type FamilyDataState = 'empty' | 'no-match' | 'ok'

export const useEtymologyStore = defineStore('etymology', () => {
  const graph = ref(buildGraph())
  const selectedNode = ref<any>(null)
  const searchQuery = ref('')
  const selectedFamily = ref('all')
  /** 当前下钻的语系 id；null 表示未展开覆盖度下钻视图 */
  const drilledFamilyId = ref<string | null>(null)
  /** 定位信号：组件 watch 后滚动并高亮，随后复位 */
  const locateTick = ref(0)
  const locateRoot = ref<string | null>(null)

  const familyById = (id: string) => LANGUAGE_FAMILIES.find(f => f.id === id) || null

  /** 搜索匹配口径：词表与下钻视图共用，保证明细与词表范围关联一致 */
  const matchesSearch = (cs: typeof COGNATE_SETS[number]) => {
    const q = searchQuery.value.trim().toLowerCase()
    if (!q) return true
    return cs.root.toLowerCase().includes(q)
      || cs.meaning.toLowerCase().includes(q)
      || Object.entries(cs.languages).some(([lang, w]) =>
        isRecorded(w) && (lang.toLowerCase().includes(q) || w.toLowerCase().includes(q)))
  }

  const filteredCognates = computed(() =>
    COGNATE_SETS.filter(cs =>
      (selectedFamily.value === 'all' || cs.family === selectedFamily.value)
      && matchesSearch(cs)
    )
  )

  const drilledFamily = computed(() =>
    drilledFamilyId.value ? familyById(drilledFamilyId.value) : null
  )

  /** 卡片与明细：按语系全量已收录数据、统一口径计算，不受当前搜索影响 */
  const drilledCoverage = computed<FamilyCoverage | null>(() => {
    if (!drilledFamily.value) return null
    return computeFamilyCoverage(drilledFamily.value.id, drilledFamily.value.languages, COGNATE_SETS)
  })

  /**
   * 数据状态（统一口径）：
   * - empty：该语系在语料库中完全未收录任何词根
   * - no-match：语系有收录，但当前搜索条件下词表范围内无匹配
   * - ok：有收录且当前条件下有匹配，可定位到词表范围
   */
  const drilledDataState = computed<FamilyDataState>(() => {
    if (!drilledCoverage.value) return 'empty'
    if (drilledCoverage.value.rootCount === 0) return 'empty'
    const hasMatch = COGNATE_SETS.some(cs =>
      cs.family === drilledFamilyId.value && matchesSearch(cs))
    return hasMatch ? 'ok' : 'no-match'
  })

  function toggleDrill(familyId: string) {
    drilledFamilyId.value = drilledFamilyId.value === familyId ? null : familyId
  }

  /** 词表下拉切换语系时同步展开下钻视图，保持两者关联 */
  function selectFamilyFromTable(familyId: string) {
    selectedFamily.value = familyId
    drilledFamilyId.value = familyId === 'all' ? null : familyId
  }

  /** 定位到该语系在词表中的范围（沿用当前搜索口径） */
  function locateFamilyRange() {
    if (drilledDataState.value !== 'ok') return
    selectedFamily.value = drilledFamilyId.value as string
    locateRoot.value = null
    locateTick.value++
  }

  /** 从最近更新项定位到具体词根所在行 */
  function locateRootRow(root: string) {
    if (drilledDataState.value !== 'ok') return
    selectedFamily.value = drilledFamilyId.value as string
    locateRoot.value = root
    locateTick.value++
  }

  function clearSearch() {
    searchQuery.value = ''
  }

  /** 暂无匹配时：清除搜索并直接定位到该语系词表范围 */
  function clearSearchAndLocate() {
    if (!drilledFamilyId.value) return
    searchQuery.value = ''
    selectedFamily.value = drilledFamilyId.value
    locateRoot.value = null
    locateTick.value++
  }

  return {
    graph, selectedNode, searchQuery, selectedFamily,
    drilledFamilyId, drilledFamily, drilledCoverage, drilledDataState,
    filteredCognates, locateTick, locateRoot,
    toggleDrill, selectFamilyFromTable, locateFamilyRange, locateRootRow, clearSearch, clearSearchAndLocate,
  }
})
