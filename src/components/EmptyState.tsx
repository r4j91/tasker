import type { LucideIcon } from 'lucide-react'
import { motion } from 'framer-motion'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  message: string
}

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
}

const item = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' as const } },
}

export function EmptyState({ icon: Icon, title, message }: EmptyStateProps) {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="flex flex-col items-center px-6 py-16 text-center"
    >
      <motion.div variants={item} className="relative mb-4">
        {/* Sol de pêssego espiando atrás do círculo — assinatura do TASKER */}
        <span aria-hidden className="absolute -right-1 -top-1 size-5 rounded-full bg-accent" />
        <div className="relative flex size-14 items-center justify-center rounded-full bg-primary-subtle text-primary-ink">
          <Icon size={24} strokeWidth={1.75} />
        </div>
      </motion.div>
      <motion.p variants={item} className="mb-1 text-balance text-[15px] font-semibold">
        {title}
      </motion.p>
      <motion.p variants={item} className="max-w-60 text-pretty text-sm text-ink-muted">
        {message}
      </motion.p>
    </motion.div>
  )
}
