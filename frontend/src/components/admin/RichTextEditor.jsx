import { useEffect, useRef } from 'react'
import { Bold, Heading2, Heading3, Italic, Link2, List, ListOrdered, Minus, Pilcrow, Quote, RemoveFormatting, Underline, Unlink } from 'lucide-react'
import { cx } from './ui'
import { promptAndRun } from '../../lib/alert'

/*
 * Simple rich-text editor for page content (headings, paragraphs, bold/italic/underline, lists, quotes, links).
 * Produces HTML; the server cleans it again before saving.
 * <RichTextEditor value={html} onChange={setHtml} />
 */
const TOOLS = [
  ['formatBlock', '<p>', Pilcrow, 'Paragraph'],
  ['formatBlock', '<h2>', Heading2, 'Heading'],
  ['formatBlock', '<h3>', Heading3, 'Sub-heading'],
  null,
  ['bold', null, Bold, 'Bold'],
  ['italic', null, Italic, 'Italic'],
  ['underline', null, Underline, 'Underline'],
  null,
  ['insertUnorderedList', null, List, 'Bullet list'],
  ['insertOrderedList', null, ListOrdered, 'Numbered list'],
  ['formatBlock', '<blockquote>', Quote, 'Quote'],
  ['insertHorizontalRule', null, Minus, 'Divider line'],
  null,
  ['link', null, Link2, 'Add link'],
  ['unlink', null, Unlink, 'Remove link'],
  ['removeFormat', null, RemoveFormatting, 'Clear formatting'],
]

export default function RichTextEditor({ value, onChange, disabled, invalid, minHeight = 320 }) {
  const box = useRef(null)
  const last = useRef(value)

  // only push outside changes into the box (typing would otherwise move the cursor)
  useEffect(() => {
    if (box.current && value !== last.current) {
      box.current.innerHTML = value || ''
      last.current = value
    }
  }, [value])
  useEffect(() => { if (box.current) box.current.innerHTML = value || '' }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const emit = () => {
    const html = box.current?.innerHTML ?? ''
    last.current = html
    onChange(html)
  }

  const run = async (cmd, arg) => {
    box.current?.focus()
    if (cmd === 'link') {
      const sel = window.getSelection()
      const range = sel?.rangeCount ? sel.getRangeAt(0).cloneRange() : null
      await promptAndRun({ title: 'Add link', input: 'text', inputLabel: 'Link address', placeholder: '/shop or https://…', confirmText: 'Add link' }, async (url) => {
        const href = (url || '').trim()
        if (!href) throw new Error('Enter a link address.')
        box.current?.focus()
        if (range) { sel.removeAllRanges(); sel.addRange(range) }
        document.execCommand('createLink', false, href)
        emit()
      })
      return
    }
    document.execCommand(cmd, false, arg)
    emit()
  }

  return (
    <div className={cx('overflow-hidden rounded-lg border bg-white', invalid ? 'border-bad' : 'border-aline', disabled && 'opacity-70')}>
      {!disabled && (
        <div className="flex flex-wrap items-center gap-0.5 border-b border-aline bg-asoft/60 p-1.5" role="toolbar" aria-label="Formatting">
          {TOOLS.map((t, i) => {
            if (t === null) return <span key={i} className="mx-1 h-5 w-px bg-aline" />
            const [cmd, arg, Icon, label] = t
            return (
              <button key={i} type="button" title={label} aria-label={label} onMouseDown={(e) => e.preventDefault()} onClick={() => run(cmd, arg)}
                className="grid size-8 place-items-center rounded-md text-amute transition hover:bg-white hover:text-ink">
                <Icon className="size-4" />
              </button>
            )
          })}
        </div>
      )}
      <div
        ref={box}
        contentEditable={!disabled}
        suppressContentEditableWarning
        onInput={emit}
        onBlur={emit}
        onPaste={(e) => {
          // paste as plain text so styles from Word / websites don't come along
          e.preventDefault()
          document.execCommand('insertText', false, e.clipboardData.getData('text/plain'))
        }}
        className="page-content max-w-none overflow-y-auto px-4 py-3 text-[14px] outline-none"
        style={{ minHeight }}
        role="textbox"
        aria-multiline="true"
      />
    </div>
  )
}
