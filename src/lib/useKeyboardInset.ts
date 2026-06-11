import { useEffect, useState } from 'react'

/**
 * Altura do teclado virtual (px) via visualViewport — para sheets fixos
 * no rodapé subirem junto com o teclado no iOS/Android.
 */
export function useKeyboardInset(): number {
  const [inset, setInset] = useState(0)

  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return
    const update = () => {
      const value = Math.max(0, window.innerHeight - vv.height - vv.offsetTop)
      setInset(Math.round(value))
    }
    update()
    vv.addEventListener('resize', update)
    vv.addEventListener('scroll', update)
    return () => {
      vv.removeEventListener('resize', update)
      vv.removeEventListener('scroll', update)
    }
  }, [])

  return inset
}
