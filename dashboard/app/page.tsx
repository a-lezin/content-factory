import { getAllProjects } from '@/lib/data'
import Link from 'next/link'
import { fmtScore, fmtOutlier, fmtViews, scoreColor, scoreBg } from '@/lib/format'

export default function HomePage() {
  const projects = getAllProjects()
  const allNiches = projects.flatMap(p => p.niches)

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-[15px] font-semibold text-[#e8e8e8]">Viral Factory</h1>
        <p className="text-[12px] text-[#555] mt-0.5">Content-Market Fit pipeline · {allNiches.length} niches across {projects.length} projects</p>
      </div>

      <div className="border border-[#222] rounded-lg overflow-hidden">
        <div className="px-4 py-2 border-b border-[#222] bg-[#111]">
          <span className="text-[11px] text-[#555] uppercase tracking-wider font-semibold">Niches</span>
        </div>
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-[#1e1e1e] text-[11px] text-[#444] uppercase tracking-wider">
              <th className="py-2 px-4 text-left">Project / Slug</th>
              <th className="py-2 px-4 text-right">Top Score</th>
              <th className="py-2 px-4 text-right">Videos</th>
              <th className="py-2 px-4 text-right">Top Outlier</th>
              <th className="py-2 px-4 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {allNiches
              .sort((a, b) => (b.topScore ?? -1) - (a.topScore ?? -1))
              .map(niche => (
                <tr key={`${niche.project}-${niche.slug}`} className="border-b border-[#161616] hover:bg-[#131313] transition-colors">
                  <td className="py-2 px-4">
                    <Link
                      href={`/niche/${niche.project}/${niche.slug}`}
                      className="text-[#22d3ee] hover:text-cyan-300"
                    >
                      {niche.slug}
                    </Link>
                    <span className="ml-2 text-[10px] text-[#3a3a3a]">{niche.project}</span>
                  </td>
                  <td className="py-2 px-4 text-right font-mono">
                    {niche.topScore !== null ? (
                      <span
                        className="px-2 py-0.5 rounded text-[11px]"
                        style={{ color: scoreColor(niche.topScore), background: scoreBg(niche.topScore) }}
                      >
                        {fmtScore(niche.topScore)}
                      </span>
                    ) : (
                      <span className="text-[#333]">—</span>
                    )}
                  </td>
                  <td className="py-2 px-4 text-right font-mono text-[#666]">
                    {niche.videoCount || <span className="text-[#333]">—</span>}
                  </td>
                  <td className="py-2 px-4 text-right font-mono text-violet-400">
                    {niche.topOutlier !== null ? fmtOutlier(niche.topOutlier) : <span className="text-[#333]">—</span>}
                  </td>
                  <td className="py-2 px-4">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded border ${
                        niche.hasData
                          ? 'border-emerald-900 text-emerald-600 bg-emerald-950/50'
                          : 'border-[#2a2a2a] text-[#444]'
                      }`}
                    >
                      {niche.hasData ? 'scored' : 'no data'}
                    </span>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
