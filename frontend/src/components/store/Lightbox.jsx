import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, LayoutGrid, Pause, Play, Search, X } from 'lucide-react'
import { cx } from './ui'

/*
 * Full-screen photo viewer: counter, zoom, slideshow, thumbnails, close; arrows / keyboard / swipe to move.
 * items: [{ src, video? }] — a video item plays inside the viewer.
 */
const SLIDE_MS = 3000

export default function Lightbox({ items, index, onIndex, onClose, alt = '' }) {
  const n = items.length
  const [zoom, setZoom] = useState(null) // { x, y } in % when zoomed in
  const [playing, setPlaying] = useState(false)
  const [thumbs, setThumbs] = useState(false)
  const drag = useRef(null)
  const swiped = useRef(false) // a swipe ends in a click; don't treat it as "click outside"
  const item = items[index]

  const go = useCallback((step) => { setZoom(null); onIndex((i) => (i + step + n) % n) }, [n, onIndex])

  // keyboard + no page scrolling behind the viewer
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowRight') go(1)
      else if (e.key === 'ArrowLeft') go(-1)
    }
    document.addEventListener('keydown', onKey)
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = overflow }
  }, [go, onClose])

  // slideshow
  useEffect(() => {
    if (!playing || n < 2) return
    const id = setTimeout(() => go(1), SLIDE_MS)
    return () => clearTimeout(id)
  }, [playing, index, n, go])

  const toggleZoom = (e) => {
    if (item?.video) return
    if (zoom) { setZoom(null); return }
    const r = e.currentTarget.getBoundingClientRect()
    setZoom({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 })
    setPlaying(false)
  }

  // swipe left / right (not while zoomed)
  const onPointerDown = (e) => { if (!zoom) drag.current = { x: e.clientX, moved: false } }
  const onPointerMove = (e) => { if (drag.current && Math.abs(e.clientX - drag.current.x) > 8) drag.current.moved = true }
  const onPointerUp = (e) => {
    const d = drag.current
    drag.current = null
    swiped.current = !!d?.moved
    if (!d?.moved) return
    const dx = e.clientX - d.x
    if (dx < -50) go(1)
    else if (dx > 50) go(-1)
  }

  const tool = 'grid size-10 place-items-center text-white/80 transition hover:bg-white/10 hover:text-white sm:size-11'
  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-[#1b1714]/95 text-white" role="dialog" aria-modal="true" aria-label="Product photos">
      {/* top bar: counter left, tools right */}
      <div className="flex h-12 shrink-0 items-center justify-between pl-4 sm:h-14">
        <span className="text-sm tabular-nums text-white/80">{index + 1} / {n}</span>
        <div className="flex items-center">
          {!item?.video && <button type="button" onClick={() => setZoom(zoom ? null : { x: 50, y: 50 })} aria-label={zoom ? 'Zoom out' : 'Zoom in'} aria-pressed={!!zoom} className={tool}><Search className="size-[18px]" /></button>}
          {n > 1 && <button type="button" onClick={() => setPlaying((p) => !p)} aria-label={playing ? 'Pause slideshow' : 'Play slideshow'} className={tool}>{playing ? <Pause className="size-[18px] fill-current" /> : <Play className="size-[18px] fill-current" />}</button>}
          {n > 1 && <button type="button" onClick={() => setThumbs((t) => !t)} aria-label="Show thumbnails" aria-pressed={thumbs} className={tool}><LayoutGrid className="size-[18px]" /></button>}
          <button type="button" onClick={onClose} aria-label="Close" className={tool}><X className="size-5" /></button>
        </div>
      </div>
      {playing && <div className="h-0.5 shrink-0 bg-white/10"><div key={index} className="h-full origin-left bg-tan" style={{ animation: `xq-lb-progress ${SLIDE_MS}ms linear forwards` }} /></div>}

      {/* stage */}
      <div className="relative flex min-h-0 flex-1 touch-pan-y items-center justify-center overflow-hidden px-2 sm:px-16"
        onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={() => { drag.current = null }}
        onClick={(e) => { if (e.target === e.currentTarget && !swiped.current) onClose(); swiped.current = false }}>
        {item?.video ? (
          <video key={item.src} src={item.src} controls autoPlay playsInline className="max-h-full max-w-full" />
        ) : (
          <img key={item?.src} src={item?.src} alt={alt} draggable={false} onClick={toggleZoom}
            className={cx('max-h-full max-w-full select-none object-contain transition-transform duration-300', zoom ? 'cursor-zoom-out' : 'cursor-zoom-in')}
            style={zoom ? { transform: 'scale(2.2)', transformOrigin: `${zoom.x}% ${zoom.y}%` } : undefined} />
        )}
        {n > 1 && <>
          <button type="button" onClick={() => go(-1)} aria-label="Previous photo" className="absolute left-0 top-1/2 grid h-11 w-10 -translate-y-1/2 place-items-center bg-black/40 text-white/90 transition hover:bg-black/70 sm:w-12"><ArrowLeft className="size-5" /></button>
          <button type="button" onClick={() => go(1)} aria-label="Next photo" className="absolute right-0 top-1/2 grid h-11 w-10 -translate-y-1/2 place-items-center bg-black/40 text-white/90 transition hover:bg-black/70 sm:w-12"><ArrowRight className="size-5" /></button>
        </>}
      </div>

      {/* thumbnails */}
      {thumbs && n > 1 && (
        <div className="no-scrollbar flex shrink-0 justify-center gap-2 overflow-x-auto px-4 py-3">
          {items.map((it, i) => (
            <button key={it.src + i} type="button" onClick={() => { setZoom(null); onIndex(i) }} aria-label={`Photo ${i + 1}`} aria-current={i === index}
              className={cx('relative size-14 shrink-0 overflow-hidden rounded border-2 transition sm:size-16', i === index ? 'border-tan' : 'border-transparent opacity-60 hover:opacity-100')}>
              {it.video
                ? <><video src={`${it.src}#t=0.1`} muted playsInline preload="metadata" className="pointer-events-none size-full object-cover" /><Play className="absolute inset-0 m-auto size-4 fill-white text-white" /></>
                : <img src={it.src} alt="" className="size-full object-cover" />}
            </button>
          ))}
        </div>
      )}
      <style>{'@keyframes xq-lb-progress { from { transform: scaleX(0) } to { transform: scaleX(1) } }'}</style>
    </div>
  )
}
