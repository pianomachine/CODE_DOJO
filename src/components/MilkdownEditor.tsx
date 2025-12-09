import { useEffect, useRef, useCallback } from 'react'
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
  const onChangeRef = useRef(onChange)

  // Keep onChange ref up to date
  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  useEffect(() => {
    if (!containerRef.current) return

    const container = containerRef.current
    let destroyed = false

    const initEditor = async () => {
      try {
        const editor = await Editor.make()
          .config((ctx) => {
            ctx.set(rootCtx, container)
            ctx.set(defaultValueCtx, value)
            ctx.set(editorViewOptionsCtx, {
              attributes: {
                class: 'milkdown-editor prose prose-invert max-w-none focus:outline-none',
                spellcheck: 'false',
              },
            })
            ctx.get(listenerCtx).markdownUpdated((_ctx, markdown) => {
              onChangeRef.current(markdown)
            })
          })
          .use(commonmark)
          .use(gfm)
          .use(history)
          .use(listener)
          .create()

        // If cleanup was called while initializing, destroy immediately
        if (destroyed) {
          editor.destroy()
          return
        }

        editorRef.current = editor
      } catch (error) {
        console.error('Failed to initialize Milkdown editor:', error)
      }
    }

    initEditor()

    return () => {
      destroyed = true
      if (editorRef.current) {
        editorRef.current.destroy()
        editorRef.current = null
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Click anywhere in container to focus editor
  const handleContainerClick = useCallback(() => {
    const proseMirror = containerRef.current?.querySelector('.ProseMirror') as HTMLElement
    if (proseMirror) {
      proseMirror.focus()
    }
  }, [])

  return (
    <div
      ref={containerRef}
      onClick={handleContainerClick}
      className={`milkdown-container h-full overflow-auto ${className}`}
    />
  )
}
