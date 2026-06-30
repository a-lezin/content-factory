'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ProjectSummary } from '@/lib/types'
import { fmtScore, scoreColor } from '@/lib/format'

interface Props {
  projects: ProjectSummary[]
  activeProject: string | null
}

export default function Sidebar({ projects, activeProject }: Props) {
  const pathname = usePathname()

  return (
    <aside className="w-52 shrink-0 border-r border-[#222] bg-[#111] flex flex-col h-screen sticky top-0 overflow-y-auto">
      <div className="px-4 py-3 border-b border-[#222]">
        <span className="text-[10px] font-bold tracking-widest text-[#555] uppercase">Viral Factory</span>
      </div>

      <div className="px-3 pt-3 pb-1">
        <span className="text-[10px] tracking-widest text-[#444] uppercase font-semibold">Projects</span>
      </div>

      <nav className="flex-1 px-2 pb-4">
        {projects.map(proj => (
          <div key={proj.slug} className="mb-1">
            <div className="flex items-center gap-1.5 px-2 py-1">
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: proj.slug === activeProject ? '#22d3ee' : '#333' }}
              />
              <span className="text-[11px] font-semibold text-[#888] uppercase tracking-wide">
                {proj.slug}
              </span>
            </div>

            {proj.niches.map(niche => {
              const href = `/niche/${niche.project}/${niche.slug}`
              const active = pathname === href
              return (
                <Link
                  key={niche.slug}
                  href={href}
                  className={`flex items-center justify-between px-3 py-1 rounded text-[12px] transition-colors ${
                    active
                      ? 'bg-[#1e2b2f] text-[#e8e8e8]'
                      : 'text-[#666] hover:text-[#aaa] hover:bg-[#1a1a1a]'
                  }`}
                >
                  <span className="truncate">{niche.slug}</span>
                  {niche.topScore !== null ? (
                    <span
                      className="font-mono text-[11px] shrink-0 ml-1"
                      style={{ color: scoreColor(niche.topScore) }}
                    >
                      {fmtScore(niche.topScore)}
                    </span>
                  ) : (
                    <span className="text-[#333] text-[11px]">—</span>
                  )}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      <div className="px-4 py-2 border-t border-[#1a1a1a]">
        <a
          href="https://github.com"
          className="text-[10px] text-[#333] hover:text-[#555] transition-colors"
        >
          viral-factory v0.1
        </a>
      </div>
    </aside>
  )
}
