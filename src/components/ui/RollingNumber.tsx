import { AnimatePresence, motion } from 'framer-motion'

/** Número que rola verticalmente ao mudar (contadores "1/4"). */
export function RollingNumber({ value }: { value: number }) {
  return (
    <span className="relative inline-flex overflow-hidden align-bottom">
      <AnimatePresence initial={false} mode="popLayout">
        <motion.span
          key={value}
          initial={{ y: '0.9em', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '-0.9em', opacity: 0 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          className="tabular-nums"
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  )
}
