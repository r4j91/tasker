import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '../../lib/cn'

interface CheckboxProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  className?: string
  disabled?: boolean
  /** Cor do círculo (ex.: prioridade da tarefa, estilo Todoist) */
  tint?: string
  /** Versão compacta (sub-tarefas) */
  small?: boolean
}

export function Checkbox({ checked, onChange, label, className, disabled, tint, small }: CheckboxProps) {
  const border = checked || tint ? (tint ?? 'var(--primary)') : 'var(--line-strong)'
  const fill = checked
    ? (tint ?? 'var(--primary)')
    : tint
      ? `color-mix(in oklab, ${tint} 14%, transparent)`
      : 'transparent'
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'flex w-full items-center gap-3 text-left cursor-pointer min-h-11 py-1.5',
        'rounded-lg focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2',
        'disabled:opacity-45 disabled:pointer-events-none',
        className,
      )}
    >
      {/* Círculo */}
      <motion.span
        aria-hidden
        className={cn(
          'relative shrink-0 rounded-full border-2 transition-colors duration-150',
          small ? 'size-[15px]' : 'size-[18px]',
        )}
        style={{ borderColor: border, backgroundColor: fill }}
        initial={false}
        whileTap={{ scale: 0.85 }}
        transition={{ duration: 0.16, ease: 'easeOut' }}
      >
        <AnimatePresence>
          {checked && (
            <motion.svg
              viewBox="0 0 12 10"
              fill="none"
              className="absolute inset-0 m-auto w-[11px] h-[9px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.1 }}
            >
              <motion.path
                d="M1 5.5L4 8.5L11 1.5"
                stroke={tint ? 'white' : 'var(--primary-fg)'}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
              />
            </motion.svg>
          )}
        </AnimatePresence>
      </motion.span>

      {/* Rótulo com risco animado */}
      {label && (
        <span className="relative text-sm leading-snug">
          <motion.span
            initial={false}
            animate={{ color: checked ? 'var(--ink-faint)' : 'var(--ink)' }}
            transition={{ duration: 0.18 }}
          >
            {label}
          </motion.span>
          <motion.span
            aria-hidden
            className="absolute left-0 top-1/2 h-px w-full bg-ink-faint origin-left"
            initial={false}
            animate={{ scaleX: checked ? 1 : 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
          />
        </span>
      )}
    </button>
  )
}
