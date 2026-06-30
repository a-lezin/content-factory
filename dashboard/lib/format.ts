export function fmtViews(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`
  return String(n)
}

export function fmtScore(n: number | null | undefined): string {
  if (n == null || isNaN(n)) return '—'
  return n.toFixed(2)
}

export function fmtOutlier(n: number | null | undefined): string {
  if (n == null || isNaN(n)) return '—'
  if (n >= 100) return `${Math.round(n)}×`
  if (n >= 10) return `${n.toFixed(1)}×`
  return `${n.toFixed(2)}×`
}

export function fmtPct(n: number): string {
  return `${(n * 100).toFixed(1)}%`
}

export function fmtVelocity(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M/d`
  if (n >= 1_000) return `${Math.round(n / 1_000)}K/d`
  return `${Math.round(n)}/d`
}

export function scoreColor(score: number): string {
  if (score >= 0.5) return '#4ade80'
  if (score >= 0.35) return '#fbbf24'
  return '#f87171'
}

export function scoreBg(score: number): string {
  if (score >= 0.5) return 'rgba(74,222,128,0.12)'
  if (score >= 0.35) return 'rgba(251,191,36,0.12)'
  return 'rgba(248,113,113,0.12)'
}
