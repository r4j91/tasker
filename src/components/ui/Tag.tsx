import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

type TagVariant = 'default' | 'primary' | 'today' | 'overdue' | 'done' | 'accent'

interface TagProps {
  children: ReactNode
  variant?: TagVariant
  dot?: boolean
  className?: string
}

const variants: Record<TagVariant, string> = {
  default: 'bg-surface text-ink-muted border border-line',
  primary: 'bg-primary-subtle text-primary',
  today:   'bg-today-bg text-today',
  overdue: 'bg-overdue-bg text-overdue',
  done:    'bg-done-bg text-done',
  accent:  'bg-accent/20 text-accent-fg dark:bg-accent/15 dark:text-accent',
}

const dots: Record<TagVariant, string> = {
  default: 'bg-ink-faint',
  primary: 'bg-primary',
  today:   'bg-today',
  overdue: 'bg-overdue',
  done:    'bg-done',
  accent:  'bg-accent',
}

export function Tag({ children, variant = 'default', dot, className }: TagProps) {
  return (
    <span
      className={cn(
        'inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 text-xs font-medium leading-none',
        variants[variant],
        className,
      )}
    >
      {dot && <span aria-hidden className={cn('size-1.5 rounded-full', dots[variant])} />}
      {children}
    </span>
  )
}
