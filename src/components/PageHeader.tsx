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
        <h1 className="text-2xl font-bold tracking-[-0.02em]">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-ink-muted">{subtitle}</p>}
      </div>
      {accessory}
    </div>
  )
}
