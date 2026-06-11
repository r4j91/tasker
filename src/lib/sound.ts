/* Som sutil de conclusão — gerado via WebAudio, sem assets. */
let ctx: AudioContext | null = null

export function playCompleteSound() {
  try {
    ctx ??= new AudioContext()
    const now = ctx.currentTime

    const note = (freq: number, start: number, dur: number, gain: number) => {
      const osc = ctx!.createOscillator()
      const g = ctx!.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq
      g.gain.setValueAtTime(0, now + start)
      g.gain.linearRampToValueAtTime(gain, now + start + 0.012)
      g.gain.exponentialRampToValueAtTime(0.0001, now + start + dur)
      osc.connect(g).connect(ctx!.destination)
      osc.start(now + start)
      osc.stop(now + start + dur + 0.05)
    }

    note(660, 0, 0.12, 0.06)
    note(990, 0.07, 0.16, 0.05)
  } catch {
    /* áudio indisponível — silêncio é aceitável */
  }
}
