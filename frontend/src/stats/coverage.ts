import type { CognateSet } from '../types'

/** 某一门语言在该语系内的覆盖明细 */
export interface LanguageCoverage {
  language: string
  covered: number
  missing: number
  /** 覆盖率 = 已收录词根数 / 该语系已收录词根总数，口径与卡片一致 */
  ratio: number
  /** 该语言缺失的词根（按词根顺序） */
  missingRoots: string[]
}

/** 最近更新项 */
export interface RecentUpdate {
  root: string
  meaning: string
  updatedAt: string
}

/**
 * 一个语系的覆盖度统计。所有语系都用同一个口径计算：
 * - 已收录词根：family 一致的 CognateSet 条目数
 * - 语言覆盖：以语系声明的 languages 为全集，逐语言统计非空词条
 * - 最近更新：按 updatedAt 倒序取词根
 */
export interface FamilyCoverage {
  familyId: string
  /** 已收录词根数 */
  rootCount: number
  /** 该语系声明的语言总数 */
  languageCount: number
  /** 至少有一个已收录词根的语言数 */
  coveredLanguageCount: number
  /** 存在覆盖缺口（缺至少一个词根）的语言数 */
  gapLanguageCount: number
  /** 综合覆盖率：所有声明语言的已收录词条数 / (词根数 × 语言数) */
  coverageRatio: number
  languages: LanguageCoverage[]
  recentUpdates: RecentUpdate[]
}

/** 统一判空：空串、纯空白以及 '-'、'—' 均视为未收录 */
export function isRecorded(word: string | undefined | null): boolean {
  return !!word && word.trim() !== '' && word.trim() !== '-' && word.trim() !== '—'
}

/**
 * 统一口径计算单个语系的覆盖度。
 * 无论卡片、明细列表还是词表范围定位，都以本函数结果为准。
 */
export function computeFamilyCoverage(
  familyId: string,
  declaredLanguages: string[],
  sets: CognateSet[],
  recentLimit = 5
): FamilyCoverage {
  const familySets = sets.filter(cs => cs.family === familyId)
  const rootCount = familySets.length

  const languages: LanguageCoverage[] = declaredLanguages.map(language => {
    const missingRoots = familySets
      .filter(cs => !isRecorded(cs.languages[language]))
      .map(cs => cs.root)
    const covered = rootCount - missingRoots.length
    return {
      language,
      covered,
      missing: missingRoots.length,
      ratio: rootCount === 0 ? 0 : covered / rootCount,
      missingRoots,
    }
  })

  const totalEntries = languages.reduce((sum, l) => sum + l.covered, 0)
  const coverageRatio = rootCount === 0 || declaredLanguages.length === 0
    ? 0
    : totalEntries / (rootCount * declaredLanguages.length)

  const recentUpdates = familySets
    .map(cs => ({ root: cs.root, meaning: cs.meaning, updatedAt: cs.updatedAt }))
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : a.updatedAt > b.updatedAt ? -1 : 0))
    .slice(0, recentLimit)

  return {
    familyId,
    rootCount,
    languageCount: declaredLanguages.length,
    coveredLanguageCount: languages.filter(l => l.covered > 0).length,
    gapLanguageCount: languages.filter(l => l.missing > 0).length,
    coverageRatio,
    languages,
    recentUpdates,
  }
}
