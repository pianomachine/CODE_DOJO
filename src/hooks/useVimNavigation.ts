import { useEffect, useCallback, useRef } from 'react'
import { useAppStore } from '../store/appStore'
import type { ViewType } from '../types'

interface VimNavigationOptions {
  onNavigate?: (direction: 'up' | 'down' | 'left' | 'right') => void
  onSelect?: () => void
  onBack?: () => void
  onSearch?: () => void
}

export function useVimNavigation(options: VimNavigationOptions = {}) {
  const { vimModeEnabled, vimMode, setVimMode, setCurrentView, setCommandPaletteOpen } = useAppStore()
  const commandBuffer = useRef('')
  const commandTimeout = useRef<NodeJS.Timeout>()

  const viewNavigation: Record<string, ViewType> = {
    'gd': 'dashboard',
    'gn': 'notes',
    'gp': 'problems',
    'gr': 'practice',
    'gs': 'settings',
  }

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!vimModeEnabled) return

    // Don't intercept if we're in an input field and vim mode is not enabled for it
    const target = e.target as HTMLElement
    const isEditable = target.tagName === 'INPUT' ||
                       target.tagName === 'TEXTAREA' ||
                       target.getAttribute('contenteditable') === 'true' ||
                       target.closest('.monaco-editor')

    // In insert mode, allow normal typing except for Escape
    if (vimMode === 'insert') {
      if (e.key === 'Escape') {
        e.preventDefault()
        setVimMode('normal')
      }
      return
    }

    // Command mode
    if (vimMode === 'command') {
      if (e.key === 'Escape') {
        e.preventDefault()
        setVimMode('normal')
        commandBuffer.current = ''
      }
      return
    }

    // Normal mode - only process if not in editable field (unless it's Monaco)
    if (isEditable && !target.closest('.monaco-editor')) {
      if (e.key === 'Escape') {
        e.preventDefault()
        ;(target as HTMLElement).blur()
        setVimMode('normal')
      }
      return
    }

    // Clear command buffer after timeout
    if (commandTimeout.current) {
      clearTimeout(commandTimeout.current)
    }
    commandTimeout.current = setTimeout(() => {
      commandBuffer.current = ''
    }, 1000)

    // Build command buffer for multi-key commands
    if (['g'].includes(e.key) || commandBuffer.current.startsWith('g')) {
      commandBuffer.current += e.key

      // Check for view navigation commands
      const viewCommand = viewNavigation[commandBuffer.current]
      if (viewCommand) {
        e.preventDefault()
        setCurrentView(viewCommand)
        commandBuffer.current = ''
        return
      }

      // If buffer is 'g' alone, wait for next key
      if (commandBuffer.current === 'g') {
        e.preventDefault()
        return
      }
    }

    // Single key commands in normal mode
    switch (e.key) {
      case 'j':
      case 'ArrowDown':
        e.preventDefault()
        options.onNavigate?.('down')
        break
      case 'k':
      case 'ArrowUp':
        e.preventDefault()
        options.onNavigate?.('up')
        break
      case 'h':
      case 'ArrowLeft':
        e.preventDefault()
        options.onNavigate?.('left')
        break
      case 'l':
      case 'ArrowRight':
        e.preventDefault()
        options.onNavigate?.('right')
        break
      case 'Enter':
      case 'o':
        e.preventDefault()
        options.onSelect?.()
        break
      case 'Escape':
      case 'q':
        e.preventDefault()
        options.onBack?.()
        break
      case '/':
        e.preventDefault()
        setCommandPaletteOpen(true)
        options.onSearch?.()
        break
      case ':':
        e.preventDefault()
        setVimMode('command')
        setCommandPaletteOpen(true)
        break
      case 'i':
        e.preventDefault()
        setVimMode('insert')
        break
      case 'v':
        e.preventDefault()
        setVimMode('visual')
        break
      case 'G':
        e.preventDefault()
        // Go to end - could be used for scrolling to bottom
        break
    }

    commandBuffer.current = ''
  }, [vimModeEnabled, vimMode, setVimMode, setCurrentView, setCommandPaletteOpen, options])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      if (commandTimeout.current) {
        clearTimeout(commandTimeout.current)
      }
    }
  }, [handleKeyDown])

  return {
    vimMode,
    vimModeEnabled,
  }
}
