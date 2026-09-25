import { useEffect, useRef } from 'react'

// Single ambient pulse clock for one page context. Writes --pulse-t (0 to 1)
// onto the host element each animation frame. Never touches React state.
// Under prefers-reduced-motion the clock freezes at a calm fixed value.
export default function usePulseClock(bpm = 62) {
  const hostRef = useRef(null)

  useEffect(() => {
    const node = hostRef.current
    if (!node) return undefined
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const duration = 60000 / bpm
    node.style.setProperty('--pulse-bpm', String(bpm))
    node.style.setProperty('--pulse-duration', `${Math.round(duration)}ms`)
    if (reduce) {
      node.style.setProperty('--pulse-t', '0.5')
      return undefined
    }

    let frame = 0
    const tick = (now) => {
      const phase = (now % duration) / duration
      let t
      if (phase < 0.35) {
        const p = phase / 0.35
        t = 1 - Math.pow(1 - p, 3)
      } else {
        t = 1 - (phase - 0.35) / 0.65
      }
      node.style.setProperty('--pulse-t', t.toFixed(4))
      frame = window.requestAnimationFrame(tick)
    }
    frame = window.requestAnimationFrame(tick)
    return () => window.cancelAnimationFrame(frame)
  }, [bpm])

  return hostRef
}
