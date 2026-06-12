import { useEffect, type RefObject } from 'react'

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * Prende o ciclo de Tab dentro do contêiner enquanto ativo e devolve o
 * foco ao elemento anterior ao desativar. Popovers em portal (fora do
 * contêiner) não são afetados — seus eventos não passam por aqui.
 */
export function useFocusTrap(ref: RefObject<HTMLElement | null>, active: boolean) {
  useEffect(() => {
    if (!active) return
    const el = ref.current
    if (!el) return

    const previous = document.activeElement as HTMLElement | null

    const focusables = () =>
      Array.from(el.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        f => f.offsetParent !== null || f === document.activeElement,
      )

    /* Foco inicial no primeiro campo útil */
    const list = focusables()
    const initial = list.find(f => f.tagName === 'INPUT' || f.tagName === 'TEXTAREA') ?? list[0]
    initial?.focus()

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return
      const items = focusables()
      if (items.length === 0) return
      const idx = items.indexOf(document.activeElement as HTMLElement)
      if (e.shiftKey && idx <= 0) {
        e.preventDefault()
        items[items.length - 1].focus()
      } else if (!e.shiftKey && (idx === items.length - 1 || idx === -1)) {
        e.preventDefault()
        items[0].focus()
      }
    }

    el.addEventListener('keydown', onKey)
    return () => {
      el.removeEventListener('keydown', onKey)
      previous?.focus?.()
    }
  }, [ref, active])
}
