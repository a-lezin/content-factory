'use client'

import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Label,
} from 'recharts'
import type { ScoredVideo } from '@/lib/types'
import { fmtViews, fmtOutlier, scoreColor } from '@/lib/format'

interface Props {
  videos: ScoredVideo[]
}

interface Dot {
  x: number
  y: number
  handle: string
  niche_score: number
  views: number
  outlier: number
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomDot(props: any) {
  const { cx, cy, payload } = props
  const color = scoreColor(payload.niche_score)
  return (
    <g>
      <circle cx={cx} cy={cy} r={5} fill={color} fillOpacity={0.8} stroke={color} strokeWidth={1} />
      <text x={cx + 8} y={cy + 4} fontSize={9} fill="#666">{`@${payload.handle}`}</text>
    </g>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const d: Dot = payload[0].payload
  return (
    <div className="bg-[#161616] border border-[#2a2a2a] rounded p-2 text-[11px]">
      <div className="text-[#ccc] font-mono">@{d.handle}</div>
      <div className="text-[#888] mt-1">Views: <span className="text-[#ccc]">{fmtViews(d.views)}</span></div>
      <div className="text-[#888]">Outlier: <span className="text-violet-400">{fmtOutlier(d.outlier)}</span></div>
      <div className="text-[#888]">Score: <span style={{ color: scoreColor(d.niche_score) }}>{d.niche_score.toFixed(3)}</span></div>
    </div>
  )
}

export default function OutlierScatterChart({ videos }: Props) {
  if (!videos.length) return <div className="py-12 text-center text-[#444] text-sm">No data to chart.</div>

  const data: Dot[] = videos.map(v => ({
    x: Math.log10(Math.max(v.outlier_score, 0.1)),
    y: v.views,
    handle: v.author_handle,
    niche_score: v.niche_score,
    views: v.views,
    outlier: v.outlier_score,
  }))

  // X axis ticks at log10 positions: 0→1×, 1→10×, 2→100×, 2.4→253×
  const xTicks = [0, 0.5, 1, 1.5, 2, 2.5]
  const xTickFormatter = (v: number) => `${Math.round(Math.pow(10, v))}×`

  return (
    <div>
      <p className="text-[11px] text-[#555] mb-3">
        X = OutlierScore (log scale) · Y = Views · Color = NicheScore
      </p>
      <ResponsiveContainer width="100%" height={280}>
        <ScatterChart margin={{ top: 10, right: 40, bottom: 20, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e1e1e" />
          <XAxis
            dataKey="x"
            type="number"
            domain={[-0.1, 2.6]}
            ticks={xTicks}
            tickFormatter={xTickFormatter}
            tick={{ fill: '#555', fontSize: 10 }}
            axisLine={{ stroke: '#2a2a2a' }}
            tickLine={false}
          >
            <Label value="OutlierScore" offset={-5} position="insideBottom" style={{ fill: '#444', fontSize: 10 }} />
          </XAxis>
          <YAxis
            dataKey="y"
            type="number"
            tickFormatter={fmtViews}
            tick={{ fill: '#555', fontSize: 10 }}
            axisLine={{ stroke: '#2a2a2a' }}
            tickLine={false}
          >
            <Label value="Views" angle={-90} position="insideLeft" style={{ fill: '#444', fontSize: 10 }} />
          </YAxis>
          <Tooltip content={<CustomTooltip />} />
          <Scatter data={data} shape={<CustomDot />} />
        </ScatterChart>
      </ResponsiveContainer>
      <div className="flex gap-4 mt-1 text-[10px] text-[#444]">
        <span><span className="inline-block w-2 h-2 rounded-full bg-emerald-400 mr-1" />Score ≥ 0.5</span>
        <span><span className="inline-block w-2 h-2 rounded-full bg-yellow-400 mr-1" />Score 0.35–0.5</span>
        <span><span className="inline-block w-2 h-2 rounded-full bg-red-400 mr-1" />Score &lt; 0.35</span>
      </div>
    </div>
  )
}
