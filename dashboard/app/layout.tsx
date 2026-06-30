import type { Metadata } from 'next'
import './globals.css'
import Sidebar from '@/components/Sidebar'
import { getAllProjects, getActiveProject } from '@/lib/data'

export const metadata: Metadata = {
  title: 'Viral Factory Dashboard',
  description: 'Content-Market Fit analytics for viral niches',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const projects = getAllProjects()
  const activeProject = getActiveProject()

  return (
    <html lang="en">
      <body className="flex h-screen bg-[#0a0a0a] text-[#e8e8e8] overflow-hidden">
        <Sidebar projects={projects} activeProject={activeProject} />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </body>
    </html>
  )
}
