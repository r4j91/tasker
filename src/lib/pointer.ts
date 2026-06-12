/* Último ponto de toque/clique — usado para ancorar a origem de
   transformações (ex.: o modal de detalhe "nasce" da linha clicada). */

let last: { x: number; y: number; at: number } | null = null

if (typeof window !== 'undefined') {
  window.addEventListener(
    'pointerdown',
    e => { last = { x: e.clientX, y: e.clientY, at: Date.now() } },
    true,
  )
}

/** Retorna o último pointerdown se for recente (interação atual). */
export function recentPointer(maxAgeMs = 600): { x: number; y: number } | null {
  if (!last || Date.now() - last.at > maxAgeMs) return null
  return { x: last.x, y: last.y }
}
