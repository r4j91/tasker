import { motion } from 'framer-motion'
import { CheckSquare } from 'lucide-react'

export function Home() {
  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="flex flex-col items-center gap-4"
      >
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-primary"
        >
          <CheckSquare size={48} strokeWidth={1.5} />
        </motion.div>

        <h1 className="text-7xl font-bold tracking-[-0.04em] text-ink">
          TASKER
        </h1>

        <p className="text-ink-muted text-sm tracking-widest uppercase">
          Premium Task Manager
        </p>

        <a
          href="/design-system"
          className="mt-4 text-xs text-ink-faint hover:text-ink-muted transition-colors"
        >
          ver design system →
        </a>
      </motion.div>
    </div>
  )
}
