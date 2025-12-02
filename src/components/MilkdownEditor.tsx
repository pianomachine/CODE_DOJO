import { useEffect, useRef } from 'react'
import { Editor, rootCtx, defaultValueCtx, editorViewOptionsCtx } from '@milkdown/kit/core'
import { commonmark } from '@milkdown/kit/preset/commonmark'
import { gfm } from '@milkdown/kit/preset/gfm'
import { history } from '@milkdown/kit/plugin/history'
import { listener, listenerCtx } from '@milkdown/kit/plugin/listener'

interface MilkdownEditorProps {
  value: string
  onChange: (value: string) => void
  className?: string
}

export function MilkdownEditor({ value, onChange, className = '' }: MilkdownEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const editorRef = useRef<Editor | null>(null)
  const isInitializedRef = useRef(false)
  const valueRef = useRef(value)

  // Keep valueRef up to date
  useEffect(() => {
    valueRef.current = value
  }, [value])

  useEffect(() => {
    if (!containerRef.current || isInitializedRef.current) return

    isInitializedRef.current = true

    const initEditor = async () => {
      try {
        const editor = await Editor.make()
          .config((ctx) => {
            ctx.set(rootCtx, containerRef.current!)
            ctx.set(defaultValueCtx, valueRef.current)
            ctx.set(editorViewOptionsCtx, {
              attributes: {
                class: 'milkdown-editor prose prose-invert max-w-none focus:outline-none',
                spellcheck: 'false',
              },
            })
            ctx.get(listenerCtx).markdownUpdated((_ctx, markdown) => {
              onChange(markdown)
            })
          })
          .use(commonmark)
          .use(gfm)
          .use(history)
          .use(listener)
          .create()

        editorRef.current = editor
      } catch (error) {
        console.error('Failed to initialize Milkdown editor:', error)
      }
    }

    initEditor()

    return () => {
      if (editorRef.current) {
        editorRef.current.destroy()
        editorRef.current = null
        isInitializedRef.current = false
      }
    }
  }, [onChange])

  return (
    <div
      ref={containerRef}
      className={`milkdown-container h-full overflow-auto ${className}`}
    />
  )
}
