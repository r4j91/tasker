import { useState, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '../../lib/cn'

interface TooltipProps {
  content: string
  children: ReactNode
  side?: 'top' | 'bottom' | 'left' | 'right'
}

const position = {
  top:    'bottom-full left-1/2 -translate-x-1/2 mb-1.5',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-1.5',
  left:   'right-full top-1/2 -translate-y-1/2 mr-1.5',
  right:  'left-full top-1/2 -translate-y-1/2 ml-1.5',
}

const offset = {
  top:    { y: 3 },
  bottom: { y: -3 },
  left:   { x: 3 },
  right:  { x: -3 },
}

export function Tooltip({ content, children, side = 'top' }: TooltipProps) {
  const [show, setShow] = useState(false)

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onFocus={() => setShow(true)}
      onBlur={() => setShow(false)}
    >
      {children}
      <AnimatePresence>
        {show && (
          <motion.span
            role="tooltip"
            className={cn(
              'absolute z-50 whitespace-nowrap pointer-events-none',
              'rounded-md px-2 py-1 text-xs font-medium',
              'bg-ink text-canvas shadow-[var(--shadow-md)]',
              position[side],
            )}
            initial={{ opacity: 0, ...offset[side] }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, ...offset[side] }}
            transition={{ duration: 0.12, ease: 'easeOut' }}
          >
            {content}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  )
}
