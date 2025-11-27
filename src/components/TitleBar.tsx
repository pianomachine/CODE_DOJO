import { Minus, Square, X } from 'lucide-react'
import { useAppStore } from '../store/appStore'

export function TitleBar() {
  const { vimModeEnabled, vimMode } = useAppStore()

  const handleMinimize = () => window.electronAPI?.minimize()
  const handleMaximize = () => window.electronAPI?.maximize()
  const handleClose = () => window.electronAPI?.close()

  const getModeColor = () => {
    switch (vimMode) {
      case 'normal': return 'bg-primary-500'
      case 'insert': return 'bg-accent-green'
      case 'visual': return 'bg-accent-purple'
      case 'command': return 'bg-accent-yellow'
      default: return 'bg-primary-500'
    }
  }

  return (
    <div className="h-10 bg-dark-900/90 border-b border-dark-700/50 flex items-center justify-between px-4 drag-region">
      <div className="flex items-center gap-3 no-drag">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 animate-pulse" />
          <span className="text-sm font-semibold gradient-text">Code Dojo</span>
        </div>

        {vimModeEnabled && (
          <div className={`vim-mode-indicator px-2 py-0.5 rounded text-xs ${getModeColor()} text-white`}>
            {vimMode}
          </div>
        )}
      </div>

      <div className="flex items-center gap-1 no-drag">
        <button
          onClick={handleMinimize}
          className="p-2 hover:bg-dark-700 rounded transition-colors"
          aria-label="Minimize"
        >
          <Minus className="w-4 h-4 text-dark-400" />
        </button>
        <button
          onClick={handleMaximize}
          className="p-2 hover:bg-dark-700 rounded transition-colors"
          aria-label="Maximize"
        >
          <Square className="w-3.5 h-3.5 text-dark-400" />
        </button>
        <button
          onClick={handleClose}
          className="p-2 hover:bg-red-500/20 rounded transition-colors group"
          aria-label="Close"
        >
          <X className="w-4 h-4 text-dark-400 group-hover:text-red-400" />
        </button>
      </div>
    </div>
  )
}
