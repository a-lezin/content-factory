'use client'

import { useState } from 'react'
import type { ScoredVideo, VideoExtraction } from '@/lib/types'
import VideoTable from './VideoTable'
import ScoreBreakdownChart from './ScoreBreakdownChart'
import OutlierScatterChart from './OutlierScatterChart'
import NicheReport from './NicheReport'
import VideoInsights from './VideoInsights'

const TABS = ['Insights', 'Videos', 'Score Breakdown', 'Views × Outlier', 'Report'] as const
type Tab = typeof TABS[number]

interface Props {
  videos: ScoredVideo[]
  extractions: VideoExtraction[]
  report: string
}

export default function NicheTabs({ videos, extractions, report }: Props) {
  const [active, setActive] = useState<Tab>('Insights')

  return (
    <div>
      <div className="flex border-b border-[#222] mb-0">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActive(tab)}
            className={`px-4 py-2 text-[11px] font-medium transition-colors border-b-2 -mb-px ${
              active === tab
                ? 'border-[#22d3ee] text-[#22d3ee]'
                : 'border-transparent text-[#555] hover:text-[#888]'
            }`}
          >
            {tab}
            {tab === 'Insights' && extractions.length > 0 && (
              <span className="ml-1.5 text-[10px] bg-[#1e2b2f] text-[#22d3ee] px-1.5 py-0.5 rounded">
                {extractions.length}
              </span>
            )}
            {tab === 'Videos' && videos.length > 0 && (
              <span className="ml-1.5 text-[10px] bg-[#1e1e1e] text-[#555] px-1.5 py-0.5 rounded">
                {videos.length}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="p-4">
        {active === 'Insights' && <VideoInsights extractions={extractions} />}
        {active === 'Videos' && <VideoTable videos={videos} />}
        {active === 'Score Breakdown' && <ScoreBreakdownChart videos={videos} />}
        {active === 'Views × Outlier' && <OutlierScatterChart videos={videos} />}
        {active === 'Report' && <NicheReport markdown={report} />}
      </div>
    </div>
  )
}
