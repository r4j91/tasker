import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import {
  useFloating, autoUpdate, offset, flip, shift,
  useDismiss, useInteractions, FloatingPortal,
} from '@floating-ui/react'
import { motion, AnimatePresence } from 'framer-motion'
import { useMediaQuery } from '../../lib/useMediaQuery'
import { cn } from '../../lib/cn'

interface PopoverProps {
  open: boolean
  onClose: () => void
  /** Gatilho — recebe a ref de ancoragem */
  trigger: (ref: (node: HTMLElement | null) => void) => ReactNode
  children: ReactNode
  /** Largura do painel no desktop */
  width?: number
}

/**
 * Popover ancorado em portal (nunca cortado por overflow), com flip
 * automático, scroll interno único e desmontagem limpa.
 * No mobile vira um bottom sheet compacto.
 */
export function Popover({ open, onClose, trigger, children, width = 224 }: PopoverProps) {
  const isDesktop = useMediaQuery('(min-width: 768px)')

  const { refs, floatingStyles, context } = useFloating({
    open,
    onOpenChange: (o) => { if (!o) onClose() },
    placement: 'bottom-start',
    whileElementsMounted: autoUpdate,
    middleware: [offset(6), flip({ padding: 12 }), shift({ padding: 12 })],
  })

  const dismiss = useDismiss(context, { outsidePress: true, escapeKey: true })
  const { getFloatingProps } = useInteractions([dismiss])

  /* Esc no mobile (sheet) */
  useEffect(() => {
    if (!open || isDesktop) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.stopPropagation(); onClose() }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [open, isDesktop, onClose])

  if (isDesktop) {
    return (
      <>
        {trigger(refs.setReference)}
        <FloatingPortal>
          <AnimatePresence>
            {open && (
              <div ref={refs.setFloating} style={{ ...floatingStyles, zIndex: 70 }} {...getFloatingProps()}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                  style={{ width }}
                  className={cn(
                    'max-h-80 overflow-y-auto overscroll-contain rounded-xl border border-line',
                    'bg-surface-elevated py-1 shadow-[var(--shadow-lg)]',
                  )}
                >
                  {children}
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </FloatingPortal>
      </>
    )
  }

  /* Mobile: bottom sheet compacto */
  return (
    <>
      {trigger(refs.setReference)}
      {createPortal(
        <AnimatePresence>
          {open && (
            <div className="fixed inset-0 z-[70] flex flex-col justify-end">
              <motion.div
                className="absolute inset-0 bg-black/40"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                onClick={onClose}
              />
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', stiffness: 420, damping: 40 }}
                className="relative max-h-[60dvh] overflow-y-auto overscroll-contain rounded-t-2xl bg-surface-elevated px-2 pt-3 shadow-[var(--shadow-lg)]"
                style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 12px)' }}
              >
                <div className="mx-auto mb-2 h-1 w-9 rounded-full bg-line-strong" />
                {children}
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  )
}
