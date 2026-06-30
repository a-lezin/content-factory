import type { VideoExtraction } from '@/lib/types'
import { fmtViews } from '@/lib/format'

interface Props {
  extractions: VideoExtraction[]
}

const FORMAT_COLORS: Record<string, string> = {
  'warning-reveal':    '#f87171',
  'product-demo':      '#22d3ee',
  'tutorial-steps':    '#4ade80',
  'resource-list':     '#fbbf24',
  'talking-head-rant': '#a78bfa',
  'talking-head':      '#a78bfa',
}

const HOOK_LABELS: Record<string, string> = {
  pain_call_out: 'pain call-out',
  bold_claim: 'bold claim',
  question: 'question',
}

export default function VideoInsights({ extractions }: Props) {
  if (!extractions.length) {
    return (
      <div className="py-12 text-center text-[#444] text-sm">
        No extraction data — run <code className="text-[#666]">/discover-niche</code> to populate.
      </div>
    )
  }

  return (
    <div className="space-y-px">
      {extractions.map((ex, i) => {
        const fmtColor = FORMAT_COLORS[ex.format] ?? '#666'
        const replicability = Math.round(ex.template_replicability * 100)

        return (
          <div
            key={ex.video_url}
            className="border border-[#1e1e1e] rounded p-4 hover:border-[#2a2a2a] transition-colors"
            style={{ background: i === 0 ? '#121a14' : '#0e0e0e' }}
          >
            {/* Header row */}
            <div className="flex items-start justify-between gap-3 mb-2.5">
              <div className="flex items-center gap-2 flex-wrap">
                <a
                  href={ex.video_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#22d3ee] hover:text-cyan-300 font-mono text-[12px] font-semibold"
                >
                  @{ex.author} ↗
                </a>
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                  style={{ color: fmtColor, background: `${fmtColor}18`, border: `1px solid ${fmtColor}30` }}
                >
                  {ex.format}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded border border-[#252525] text-[#555]">
                  {HOOK_LABELS[ex.hook_type] ?? ex.hook_type}
                </span>
                <span className="text-[10px] text-[#444]">
                  {ex.pacing} · {ex.sound_role.replace(/-/g, ' ')}
                </span>
              </div>
              <div className="flex items-center gap-3 shrink-0 text-[11px]">
                <span className="text-[#666] font-mono">{fmtViews(ex.views)}<span className="text-[#333] ml-0.5">views</span></span>
                <span className="text-[#555] font-mono">{fmtViews(ex.saves)}<span className="text-[#333] ml-0.5">saves</span></span>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-[#444]">replicability</span>
                  <div className="w-14 h-1.5 bg-[#1e1e1e] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${replicability}%`, background: replicability >= 80 ? '#4ade80' : '#fbbf24' }}
                    />
                  </div>
                  <span
                    className="font-mono text-[10px]"
                    style={{ color: replicability >= 80 ? '#4ade80' : '#fbbf24' }}
                  >
                    {replicability}%
                  </span>
                </div>
              </div>
            </div>

            {/* Hook */}
            <div className="mb-2">
              <span className="text-[10px] text-[#444] uppercase tracking-wider mr-2">Hook</span>
              <span className="text-[13px] text-[#d0d0d0] font-medium">«{ex.hook}»</span>
            </div>

            {/* Why it works */}
            <div className="mb-2.5">
              <span className="text-[10px] text-[#444] uppercase tracking-wider block mb-1">Чому летить</span>
              <p className="text-[12px] text-[#888] leading-relaxed">{ex.novelty_element}</p>
            </div>

            {/* Pain points */}
            <div>
              <span className="text-[10px] text-[#444] uppercase tracking-wider block mb-1">Біль аудиторії</span>
              <div className="flex flex-wrap gap-1.5">
                {ex.pain_points.map((pain, j) => (
                  <span
                    key={j}
                    className="text-[11px] px-2 py-0.5 rounded-full border border-[#2a1a1a] text-[#c87878]"
                    style={{ background: 'rgba(248,113,113,0.05)' }}
                  >
                    {pain}
                  </span>
                ))}
              </div>
            </div>

            {/* CTA & structure chips */}
            {(ex.cta || ex.structure.length > 0) && (
              <div className="mt-2.5 pt-2 border-t border-[#1a1a1a] flex items-center gap-3 flex-wrap">
                {ex.structure.length > 0 && (
                  <div className="flex items-center gap-1 flex-wrap">
                    {ex.structure.map((step, j) => (
                      <span key={j} className="text-[9px] text-[#3a3a3a] font-mono">
                        {step}{j < ex.structure.length - 1 ? ' →' : ''}
                      </span>
                    ))}
                  </div>
                )}
                {ex.product_in_frame && (
                  <span className="text-[10px] text-[#555]">
                    <span className="text-[#333]">product:</span> {ex.product_in_frame}
                  </span>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
