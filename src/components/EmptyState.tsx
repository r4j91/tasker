import type { LucideIcon } from 'lucide-react'
import { motion } from 'framer-motion'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  message: string
}

export function EmptyState({ icon: Icon, title, message }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="flex flex-col items-center px-6 py-16 text-center"
    >
      <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-primary-subtle text-primary-ink">
        <Icon size={24} strokeWidth={1.75} />
      </div>
      <p className="mb-1 text-[15px] font-semibold">{title}</p>
      <p className="max-w-60 text-sm text-ink-muted">{message}</p>
    </motion.div>
  )
}
