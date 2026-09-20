import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { COGNATE_SETS, LANGUAGE_FAMILIES, buildGraph } from '../mock/data'
import type { CognateSet, FamilyStats, LanguageFamily } from '../types'
export { LANGUAGE_FAMILIES, COGNATE_SETS }

// 统一的语系统计口径：词根按 family 归集，语言覆盖以“词根 × 语系语言”为全集，
// 与图谱构建一致，空串和 '-' 均视为未覆盖
function hasWord(cs: CognateSet, lang: string) {
  const w = cs.languages[lang]
  return !!w && w !== '-'
}

export function computeFamilyStats(family: LanguageFamily): FamilyStats {
  const sets = COGNATE_SETS.filter(cs => cs.family === family.id)
  const languageStats = family.languages.map(lang => {
    const covered = sets.filter(cs => hasWord(cs, lang)).length
    return { language: lang, covered, missing: sets.length - covered }
  })
  const coveredCells = languageStats.reduce((n, s) => n + s.covered, 0)
  const totalCells = sets.length * family.languages.length
  const recent = [...sets]
    .filter(cs => cs.updatedAt)
    .sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''))
    .slice(0, 3)
  return {
    familyId: family.id,
    rootCount: sets.length,
    coveredCells,
    totalCells,
    gapCount: totalCells - coveredCells,
    coverageRate: totalCells ? coveredCells / totalCells : 0,
    languageStats,
    gapLanguages: languageStats.filter(s => s.missing > 0),
    recent,
    sets,
  }
}

export const useEtymologyStore = defineStore('etymology', () => {
  const graph = ref(buildGraph())
  const selectedNode = ref<any>(null)
  const searchQuery = ref('')
  const selectedFamily = ref('all')
  const overviewFamilyId = ref<string | null>(null)

  const filteredCognates = computed(() =>
    COGNATE_SETS.filter(cs => {
      const q = searchQuery.value.toLowerCase()
      const matchSearch = !q || cs.root.toLowerCase().includes(q) || cs.meaning.includes(q) || Object.values(cs.languages).some((w: string) => w.toLowerCase().includes(q))
      const matchFamily = selectedFamily.value === 'all' || cs.family === selectedFamily.value
      return matchSearch && matchFamily
    })
  )

  // 各语系统计按同一口径一次算好，卡片、明细和词表共用
  const familyStatsMap = computed(() => {
    const map: Record<string, FamilyStats> = {}
    for (const f of LANGUAGE_FAMILIES) map[f.id] = computeFamilyStats(f)
    return map
  })

  const overviewStats = computed(() =>
    overviewFamilyId.value ? familyStatsMap.value[overviewFamilyId.value] : null
  )

  function toggleOverviewFamily(id: string) {
    overviewFamilyId.value = overviewFamilyId.value === id ? null : id
  }

  function missingLanguages(cs: CognateSet): string[] {
    const family = LANGUAGE_FAMILIES.find(f => f.id === cs.family)
    return family ? family.languages.filter(lang => !hasWord(cs, lang)) : []
  }

  // 词表空态：区分语系未收录与筛选后暂无匹配
  const cognateEmptyText = computed(() => {
    if (selectedFamily.value !== 'all' && familyStatsMap.value[selectedFamily.value]?.rootCount === 0)
      return '该语系暂未收录词根（未收录）'
    return '暂无匹配的词根，请调整搜索或语系筛选'
  })

  return {
    graph, selectedNode, searchQuery, selectedFamily, filteredCognates,
    overviewFamilyId, familyStatsMap, overviewStats,
    toggleOverviewFamily, missingLanguages, cognateEmptyText,
  }
})
