interface Props {
  markdown: string
}

export default function NicheReport({ markdown }: Props) {
  if (!markdown) {
    return <div className="py-12 text-center text-[#444] text-sm">No report found.</div>
  }

  // Minimal markdown → HTML transform (no lib dependency)
  const lines = markdown.split('\n')
  let html = ''
  let inTable = false

  for (const raw of lines) {
    const line = raw

    if (line.startsWith('# ')) {
      html += `<h1 class="text-lg font-semibold text-[#e8e8e8] mt-4 mb-2">${esc(line.slice(2))}</h1>`
    } else if (line.startsWith('## ')) {
      html += `<h2 class="text-[13px] font-semibold text-[#ccc] mt-5 mb-1.5 pb-1 border-b border-[#222]">${esc(line.slice(3))}</h2>`
    } else if (line.startsWith('### ')) {
      html += `<h3 class="text-[12px] font-semibold text-[#aaa] mt-3 mb-1">${esc(line.slice(4))}</h3>`
    } else if (line.startsWith('> ')) {
      html += `<blockquote class="border-l-2 border-[#333] pl-3 text-[#666] text-[11px] my-1">${inlineFormat(line.slice(2))}</blockquote>`
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      html += `<li class="text-[12px] text-[#888] ml-3 my-0.5 list-disc list-inside">${inlineFormat(line.slice(2))}</li>`
    } else if (line.startsWith('|')) {
      if (!inTable) {
        html += '<div class="overflow-x-auto my-2"><table class="text-[11px] w-full border-collapse">'
        inTable = true
      }
      if (line.replace(/\|/g, '').replace(/-/g, '').trim() === '') continue // separator row
      const cells = line.split('|').filter((_, i, a) => i > 0 && i < a.length - 1)
      const isHeader = !html.includes('<td')
      const tag = isHeader ? 'th' : 'td'
      const cls = isHeader
        ? 'class="py-1 px-2 text-left text-[10px] uppercase tracking-wide text-[#555] border-b border-[#222]"'
        : 'class="py-1 px-2 text-[#777] border-b border-[#1a1a1a]"'
      html += `<tr>${cells.map(c => `<${tag} ${cls}>${inlineFormat(c.trim())}</${tag}>`).join('')}</tr>`
    } else {
      if (inTable) { html += '</table></div>'; inTable = false }
      if (line.trim() === '' || line.startsWith('---')) {
        html += '<div class="my-1" />'
      } else {
        html += `<p class="text-[12px] text-[#888] my-0.5 leading-relaxed">${inlineFormat(line)}</p>`
      }
    }
  }
  if (inTable) html += '</table></div>'

  return (
    <div
      className="prose-sm max-w-none"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

function esc(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function inlineFormat(s: string): string {
  return esc(s)
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-[#ccc]">$1</strong>')
    .replace(/`(.+?)`/g, '<code class="text-[#22d3ee] bg-[#1a2a2d] px-1 rounded text-[10px]">$1</code>')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" class="text-[#22d3ee] underline underline-offset-2">$1</a>')
}
