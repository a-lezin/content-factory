import fs from 'fs'
import path from 'path'
import type { ScoredVideo, VideoExtraction, NicheDetail, NicheSummary, ProjectSummary, ScoreComponents } from './types'

// Works both locally (dashboard/ is cwd) and on Vercel (repo root accessible via ../)
function artifactsRoot() {
  return path.resolve(process.cwd(), '../artifacts/viral-factory')
}

function projectsRoot() {
  return path.resolve(process.cwd(), '../projects')
}

function readJson<T>(filePath: string): T | null {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as T
  } catch {
    return null
  }
}

function readText(filePath: string): string {
  try {
    return fs.readFileSync(filePath, 'utf-8')
  } catch {
    return ''
  }
}

function listDirs(dir: string): string[] {
  try {
    return fs.readdirSync(dir).filter(d => {
      try { return fs.statSync(path.join(dir, d)).isDirectory() } catch { return false }
    })
  } catch {
    return []
  }
}

function listFiles(dir: string, ext: string): string[] {
  try {
    return fs.readdirSync(dir).filter(f => f.endsWith(ext)).map(f => f.slice(0, -ext.length))
  } catch {
    return []
  }
}

function computeComponents(videos: ScoredVideo[]): ScoreComponents | null {
  if (!videos.length) return null
  // Use top video for component breakdown
  const top = [...videos].sort((a, b) => b.niche_score - a.niche_score)[0]
  const mon = (top.niche_score - 0.25 * top.outlier_score_norm - 0.20 * top.save_share_rate_norm - 0.10 * top.velocity_norm - 0.10 * top.pain_density) / 0.35
  return {
    monetization: Math.max(0, Math.min(1, mon)),
    outlier: top.outlier_score_norm,
    saveShare: top.save_share_rate_norm,
    velocity: top.velocity_norm,
    painDensity: top.pain_density,
  }
}

function median(nums: number[]): number | null {
  if (!nums.length) return null
  const sorted = [...nums].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid]
}

export function getAllProjects(): ProjectSummary[] {
  const projectDirs = listDirs(projectsRoot())
  return projectDirs.map(slug => ({
    slug,
    niches: getNichesForProject(slug),
  }))
}

export function getNichesForProject(project: string): NicheSummary[] {
  const nicheSlugs = listFiles(path.join(artifactsRoot(), project, 'niches'), '.md')
  return nicheSlugs.map(slug => {
    const videos = loadScoredVideos(project, slug)
    const scores = videos.map(v => v.niche_score)
    const outliers = videos.map(v => v.outlier_score)
    return {
      project,
      slug,
      topScore: scores.length ? Math.max(...scores) : null,
      videoCount: videos.length,
      topOutlier: outliers.length ? Math.max(...outliers) : null,
      hasData: videos.length > 0,
    }
  })
}

function loadScoredVideos(project: string, slug: string): ScoredVideo[] {
  const root = artifactsRoot()
  // Only use the full scored file ({slug}.json) — top15.json has a different schema
  const data = readJson<ScoredVideo[]>(path.join(root, project, 'scored', `${slug}.json`))
  return data ?? []
}

export function getNicheDetail(project: string, slug: string): NicheDetail {
  const videos = loadScoredVideos(project, slug)
  const extractions = readJson<VideoExtraction[]>(
    path.join(artifactsRoot(), project, 'extractions', `${slug}.json`)
  ) ?? []
  const report = readText(path.join(artifactsRoot(), project, 'niches', `${slug}.md`))
  const scores = videos.map(v => v.niche_score)
  const outliers = videos.map(v => v.outlier_score)
  // Sort extractions by template_replicability desc, then views desc
  const sortedExtractions = [...extractions].sort(
    (a, b) => b.template_replicability - a.template_replicability || b.views - a.views
  )
  return {
    project,
    slug,
    videos: [...videos].sort((a, b) => b.niche_score - a.niche_score),
    extractions: sortedExtractions,
    report,
    topScore: scores.length ? Math.max(...scores) : null,
    medianScore: median(scores),
    topOutlier: outliers.length ? Math.max(...outliers) : null,
    components: computeComponents(videos),
  }
}

export function getActiveProject(): string | null {
  try {
    const cfg = readText(path.resolve(process.cwd(), '../viral-factory.config.yaml'))
    const match = cfg.match(/active_project:\s*(\S+)/)
    return match?.[1] ?? null
  } catch {
    return null
  }
}
