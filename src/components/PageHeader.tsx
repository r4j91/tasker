import type { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  subtitle?: string
  accessory?: ReactNode
}

export function PageHeader({ title, subtitle, accessory }: PageHeaderProps) {
  return (
    <div className="mb-6 flex items-end justify-between">
      <div>
        <h1 className="display-title text-[32px] md:text-[28px] text-ink">{title}</h1>
        {subtitle && <p className="data-mono mt-1.5 text-[11px] uppercase tracking-[0.06em] text-ink-faint">{subtitle}</p>}
      </div>
      {accessory}
    </div>
  )
}
