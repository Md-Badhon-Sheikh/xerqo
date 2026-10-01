import { Children, useCallback, useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cx } from './ui'

const SPEED = 550 // slide transition, ms

// Breakpoint presets — { minWidth: { view: slides per view, gap: px } }, modelled on urbalandbd.com
export const BP = {
  one: { 0: { view: 1, gap: 0 } },
  categories: { 0: { view: 3, gap: 12 }, 640: { view: 5, gap: 16 }, 1024: { view: 6, gap: 20 }, 1280: { view: 8, gap: 24 } },
  products: { 0: { view: 2, gap: 12 }, 768: { view: 3, gap: 20 }, 1024: { view: 5, gap: 20 } },
}

const pickBp = (bp) => {
  const w = typeof window === 'undefined' ? 0 : window.innerWidth
  return Object.keys(bp).map(Number).sort((a, b) => a - b).reduce((cur, k) => (w >= k ? bp[k] : cur), bp[0])
}

function useBreakpoint(bp) {
  const [cfg, setCfg] = useState(() => pickBp(bp))
  useEffect(() => {
    const onResize = () => setCfg((prev) => { const next = pickBp(bp); return next === prev ? prev : next })
    onResize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [bp])
  return cfg
}

export const CarouselArrow = ({ dir, light, className, ...rest }) => (
  <button
    type="button"
    aria-label={dir === 'l' ? 'Previous' : 'Next'}
    className={cx('z-10 grid size-9 place-items-center rounded-full shadow-md transition', light ? 'bg-white/90 text-ink hover:bg-white' : 'bg-ink text-white hover:bg-tan', className)}
    {...rest}
  >
    {dir === 'l' ? <ChevronLeft className="size-4" /> : <ChevronRight className="size-4" />}
  </button>
)

/**
 * Infinite, auto-sliding carousel (Swiper-like).
 * - loops forever via cloned slides, autoplays, pauses on hover
 * - swipe / mouse-drag, prev/next arrows, clickable dots
 * arrows: false | 'inside' | 'outside' · dots: false | true | 'overlay' (light dots over an image)
 */
export function Carousel({ children, breakpoints = BP.one, delay = 4000, arrows = 'outside', arrowTop = 'top-1/2', dots = true, dotsClassName, className, label }) {
  const slides = Children.toArray(children)
  const n = slides.length
  const { view, gap } = useBreakpoint(breakpoints)
  const loop = n > 1
  const clones = loop ? view : 0

  const [pos, setPos] = useState(0)
  const [animate, setAnimate] = useState(true)
  const [dragX, setDragX] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [hover, setHover] = useState(false)
  const posRef = useRef(0)
  const busy = useRef(false)
  const settle = useRef()
  const drag = useRef(null)
  const suppressClick = useRef(false)

  const go = useCallback((to) => {
    if (!loop || busy.current) return
    busy.current = true
    posRef.current = to
    setAnimate(true)
    setPos(to)
    clearTimeout(settle.current)
    // once the slide lands on a clone, jump (without animation) to the real slide
    settle.current = setTimeout(() => {
      const real = ((to % n) + n) % n
      if (real !== to) { posRef.current = real; setAnimate(false); setPos(real) }
      busy.current = false
    }, SPEED)
  }, [loop, n])

  const next = useCallback(() => go(posRef.current + 1), [go])
  const prev = useCallback(() => go(posRef.current - 1), [go])

  useEffect(() => () => clearTimeout(settle.current), [])

  // Autoplay — restarts after every move, paused on hover / drag / reduced motion
  useEffect(() => {
    if (!loop || !delay || hover || dragging) return
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    const id = setTimeout(next, delay)
    return () => clearTimeout(id)
  }, [loop, delay, hover, dragging, pos, next])

  /* ---- swipe / drag ---- */
  const onPointerDown = (e) => {
    suppressClick.current = false
    if (!loop || (e.pointerType === 'mouse' && e.button !== 0)) return
    drag.current = { x: e.clientX, dx: 0, moved: false, id: e.pointerId }
  }
  const onPointerMove = (e) => {
    const d = drag.current
    if (!d) return
    d.dx = e.clientX - d.x
    if (!d.moved && Math.abs(d.dx) > 6) {
      d.moved = true
      setDragging(true)
      e.currentTarget.setPointerCapture?.(d.id)
    }
    if (d.moved) setDragX(d.dx)
  }
  const endDrag = () => {
    const d = drag.current
    drag.current = null
    if (!d?.moved) return
    suppressClick.current = true
    setDragging(false)
    setDragX(0)
    if (d.dx < -50) next()
    else if (d.dx > 50) prev()
  }
  const onClickCapture = (e) => {
    if (suppressClick.current) { e.preventDefault(); e.stopPropagation(); suppressClick.current = false }
  }

  const real = ((pos % n) + n) % n
  const at = (i) => slides[((i % n) + n) % n]
  const track = [
    ...Array.from({ length: clones }, (_, k) => ({ key: `b${k}`, el: at(n - clones + k), clone: true })),
    ...slides.map((el, i) => ({ key: `m${i}`, el, clone: false })),
    ...Array.from({ length: clones }, (_, k) => ({ key: `a${k}`, el: at(k), clone: true })),
  ]

  const arrowPos = arrows === 'inside' ? ['left-3', 'right-3'] : ['-left-[18px]', '-right-[18px]']

  return (
    <div
      className={cx('relative h-full', className)}
      role="region"
      aria-roledescription="carousel"
      aria-label={label}
      onPointerEnter={(e) => e.pointerType === 'mouse' && setHover(true)}
      onPointerLeave={(e) => e.pointerType === 'mouse' && setHover(false)}
    >
      <div
        className="h-full touch-pan-y select-none overflow-hidden"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onClickCapture={onClickCapture}
        onDragStart={(e) => e.preventDefault()}
      >
        <div
          className="flex h-full"
          style={{
            gap,
            transform: `translate3d(calc(${-(pos + clones)} * (100% + ${gap}px) / ${view} + ${dragX}px), 0, 0)`,
            transition: animate && !dragging ? `transform ${SPEED}ms cubic-bezier(.25,.8,.25,1)` : 'none',
          }}
        >
          {track.map(({ key, el, clone }) => (
            <div
              key={key}
              className="grid min-w-0 shrink-0 grid-cols-[minmax(0,1fr)]"
              style={{ flexBasis: `calc((100% - ${(view - 1) * gap}px) / ${view})` }}
              aria-hidden={clone || undefined}
              inert={clone || undefined}
            >
              {el}
            </div>
          ))}
        </div>
      </div>

      {arrows && loop && (
        <>
          <CarouselArrow dir="l" light={arrows === 'inside'} onClick={prev} className={cx('absolute hidden -translate-y-1/2 sm:grid', arrowTop, arrowPos[0])} />
          <CarouselArrow dir="r" light={arrows === 'inside'} onClick={next} className={cx('absolute hidden -translate-y-1/2 sm:grid', arrowTop, arrowPos[1])} />
        </>
      )}

      {dots && loop && (
        <div className={cx('flex items-center justify-center gap-1.5', dots === 'overlay' ? 'absolute inset-x-0 bottom-2.5 z-10 sm:bottom-3' : 'mt-4 sm:mt-6', dotsClassName)}>
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Go to slide ${i + 1}`}
              aria-current={i === real || undefined}
              onClick={() => i !== real && go(i)}
              className={cx('h-[7px] rounded-full transition-all duration-300', i === real ? 'w-5 bg-tan' : cx('w-[7px]', dots === 'overlay' ? 'bg-white/60 hover:bg-white' : 'bg-line hover:bg-mute'))}
            />
          ))}
        </div>
      )}
    </div>
  )
}
