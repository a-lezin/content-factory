import type { ScoredVideo } from '@/lib/types'
import { fmtViews, fmtScore, fmtOutlier, fmtPct, fmtVelocity, scoreColor } from '@/lib/format'

interface Props {
  videos: ScoredVideo[]
}

export default function VideoTable({ videos }: Props) {
  if (!videos.length) {
    return (
      <div className="py-12 text-center text-[#444] text-sm">
        No scored data yet — run <code className="text-[#666]">/discover-niche</code> to populate.
      </div>
    )
  }

  const maxScore = Math.max(...videos.map(v => v.niche_score))

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[12px]">
        <thead>
          <tr className="border-b border-[#222] text-[#444] text-[11px] uppercase tracking-wider">
            <th className="py-2 px-3 text-left w-6">#</th>
            <th className="py-2 px-3 text-left">Handle</th>
            <th className="py-2 px-3 text-left w-36">NicheScore</th>
            <th className="py-2 px-3 text-right">Views</th>
            <th className="py-2 px-3 text-right">Outlier</th>
            <th className="py-2 px-3 text-right">Save+Share</th>
            <th className="py-2 px-3 text-right">Velocity</th>
            <th className="py-2 px-3 text-left">Platform</th>
          </tr>
        </thead>
        <tbody>
          {videos.map((v, i) => {
            const barWidth = `${(v.niche_score / maxScore) * 100}%`
            const color = scoreColor(v.niche_score)
            return (
              <tr
                key={v.video_id}
                className="border-b border-[#1a1a1a] hover:bg-[#161616] transition-colors"
              >
                <td className="py-1.5 px-3 text-[#444] font-mono">{i + 1}</td>
                <td className="py-1.5 px-3">
                  <a
                    href={v.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#22d3ee] hover:text-cyan-300 font-mono"
                  >
                    @{v.author_handle}
                  </a>
                  {v.caption && (
                    <span className="block text-[10px] text-[#444] truncate max-w-[220px]" title={v.caption}>
                      {v.caption}
                    </span>
                  )}
                </td>
                <td className="py-1.5 px-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono w-8 shrink-0" style={{ color }}>
                      {fmtScore(v.niche_score)}
                    </span>
                    <div className="flex-1 h-1 bg-[#222] rounded-full overflow-hidden min-w-[40px]">
                      <div
                        className="h-full rounded-full"
                        style={{ width: barWidth, background: color, opacity: 0.8 }}
                      />
                    </div>
                  </div>
                </td>
                <td className="py-1.5 px-3 text-right font-mono text-[#ccc]">
                  {fmtViews(v.views)}
                </td>
                <td className="py-1.5 px-3 text-right font-mono text-violet-400">
                  {fmtOutlier(v.outlier_score)}
                </td>
                <td className="py-1.5 px-3 text-right font-mono text-[#888]">
                  {fmtPct(v.save_share_rate)}
                </td>
                <td className="py-1.5 px-3 text-right font-mono text-[#666]">
                  {fmtVelocity(v.velocity)}
                </td>
                <td className="py-1.5 px-3">
                  <span className="text-[10px] px-1.5 py-0.5 rounded border border-[#2a2a2a] text-[#555]">
                    {v.platform}
                  </span>
                  <span className="ml-1 text-[10px] text-[#3a3a3a]">{v.geo}</span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
