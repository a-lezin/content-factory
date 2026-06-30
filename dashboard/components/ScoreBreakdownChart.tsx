'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, LabelList,
} from 'recharts'
import type { ScoredVideo } from '@/lib/types'

interface Props {
  videos: ScoredVideo[]
}

const COMPONENTS = [
  { key: 'monetization', label: 'Mon', weight: 0.35, color: '#22d3ee' },
  { key: 'outlier', label: 'Outlier', weight: 0.25, color: '#a78bfa' },
  { key: 'saveShare', label: 'Save+Share', weight: 0.20, color: '#4ade80' },
  { key: 'velocity', label: 'Velocity', weight: 0.10, color: '#fbbf24' },
  { key: 'painDensity', label: 'Pain', weight: 0.10, color: '#f87171' },
] as const

function computeComponents(v: ScoredVideo) {
  const mon = (v.niche_score - 0.25 * v.outlier_score_norm - 0.20 * v.save_share_rate_norm - 0.10 * v.velocity_norm - 0.10 * v.pain_density) / 0.35
  return {
    monetization: Math.max(0, Math.min(1, mon)),
    outlier: v.outlier_score_norm,
    saveShare: v.save_share_rate_norm,
    velocity: v.velocity_norm,
    painDensity: v.pain_density,
  }
}

export default function ScoreBreakdownChart({ videos }: Props) {
  if (!videos.length) return <EmptyState />

  const top5 = [...videos].sort((a, b) => b.niche_score - a.niche_score).slice(0, 5)

  // Build grouped data: one entry per component, bars per video
  const data = COMPONENTS.map(({ key, label, weight }) => {
    const entry: Record<string, string | number> = { name: label }
    top5.forEach(v => {
      const comps = computeComponents(v)
      entry[v.author_handle] = +(comps[key] * weight).toFixed(3)
    })
    return entry
  })

  const videoColors = ['#22d3ee', '#a78bfa', '#4ade80', '#fbbf24', '#f87171']

  return (
    <div>
      <p className="text-[11px] text-[#555] mb-3">
        Weighted contribution per component — top 5 videos. Bars stack to NicheScore.
      </p>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} barCategoryGap="30%" barGap={2}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e1e1e" vertical={false} />
          <XAxis dataKey="name" tick={{ fill: '#666', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#555', fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, 0.36]} />
          <Tooltip
            contentStyle={{ background: '#161616', border: '1px solid #2a2a2a', borderRadius: 4, fontSize: 11 }}
            labelStyle={{ color: '#888' }}
            itemStyle={{ color: '#ccc' }}
          />
          {top5.map((v, i) => (
            <Bar key={v.video_id} dataKey={v.author_handle} fill={videoColors[i % videoColors.length]} radius={[2, 2, 0, 0]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
      <div className="flex gap-4 mt-2 flex-wrap">
        {top5.map((v, i) => (
          <div key={v.video_id} className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-sm" style={{ background: videoColors[i % videoColors.length] }} />
            <span className="text-[10px] text-[#555]">@{v.author_handle}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function EmptyState() {
  return <div className="py-12 text-center text-[#444] text-sm">No data to chart.</div>
}
