import { notFound } from 'next/navigation'
import { getNicheDetail, getAllProjects } from '@/lib/data'
import { fmtScore, fmtOutlier, fmtViews, scoreColor, scoreBg } from '@/lib/format'
import NicheTabs from '@/components/NicheTabs'

interface Props {
  params: { project: string; slug: string }
}

export async function generateStaticParams() {
  const projects = getAllProjects()
  return projects.flatMap(p => p.niches.map(n => ({ project: n.project, slug: n.slug })))
}

export default function NichePage({ params }: Props) {
  const { project, slug } = params
  const niche = getNicheDetail(project, slug)

  if (!niche.report && !niche.videos.length) notFound()

  const kpis = [
    { label: 'Top Score', value: niche.topScore !== null ? fmtScore(niche.topScore) : '—', color: niche.topScore !== null ? scoreColor(niche.topScore) : '#444', bg: niche.topScore !== null ? scoreBg(niche.topScore) : undefined },
    { label: 'Median Score', value: niche.medianScore !== null ? fmtScore(niche.medianScore) : '—', color: niche.medianScore !== null ? scoreColor(niche.medianScore) : '#444', bg: niche.medianScore !== null ? scoreBg(niche.medianScore) : undefined },
    { label: 'Top Outlier', value: niche.topOutlier !== null ? fmtOutlier(niche.topOutlier) : '—', color: '#a78bfa', bg: 'rgba(167,139,250,0.08)' },
    { label: 'Videos', value: String(niche.videos.length || '—'), color: '#888', bg: undefined },
  ]

  const components = niche.components
    ? [
        { label: 'Mon', value: niche.components.monetization, weight: 0.35, color: '#22d3ee' },
        { label: 'Outlier', value: niche.components.outlier, weight: 0.25, color: '#a78bfa' },
        { label: 'Save+Share', value: niche.components.saveShare, weight: 0.20, color: '#4ade80' },
        { label: 'Velocity', value: niche.components.velocity, weight: 0.10, color: '#fbbf24' },
        { label: 'Pain', value: niche.components.painDensity, weight: 0.10, color: '#f87171' },
      ]
    : []

  return (
    <div className="min-h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-[#1e1e1e] bg-[#0d0d0d]">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-[11px] text-[#444] mb-0.5">
              {project} / niche
            </div>
            <h1 className="text-[16px] font-semibold text-[#e8e8e8]">{slug}</h1>
          </div>
          {niche.topScore !== null && (
            <div
              className="text-right px-3 py-2 rounded"
              style={{ background: scoreBg(niche.topScore) }}
            >
              <div className="text-[10px] text-[#555] uppercase tracking-wider">NicheScore</div>
              <div className="text-[20px] font-mono font-semibold" style={{ color: scoreColor(niche.topScore) }}>
                {fmtScore(niche.topScore)}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* KPI row */}
      <div className="px-6 py-3 border-b border-[#1a1a1a] flex gap-4 flex-wrap">
        {kpis.map(kpi => (
          <div key={kpi.label} className="flex items-center gap-2">
            <span className="text-[10px] text-[#444] uppercase tracking-wide">{kpi.label}</span>
            <span
              className="font-mono text-[13px] px-1.5 py-0.5 rounded"
              style={{ color: kpi.color, background: kpi.bg }}
            >
              {kpi.value}
            </span>
          </div>
        ))}

        {components.length > 0 && (
          <>
            <div className="w-px bg-[#222] self-stretch mx-2" />
            {components.map(c => (
              <div key={c.label} className="flex items-center gap-1.5">
                <span className="text-[10px] text-[#444]">{c.label}</span>
                <div className="flex items-center gap-1">
                  <div className="w-12 h-1.5 bg-[#1e1e1e] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${c.value * 100}%`, background: c.color, opacity: 0.8 }}
                    />
                  </div>
                  <span className="font-mono text-[10px]" style={{ color: c.color }}>
                    {(c.value ?? 0).toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Tabs content */}
      <NicheTabs videos={niche.videos} extractions={niche.extractions} report={niche.report} />
    </div>
  )
}
