import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '../store/appStore'

export function VimStatusBar() {
  const { vimModeEnabled, vimMode } = useAppStore()

  const getModeConfig = () => {
    switch (vimMode) {
      case 'normal':
        return { label: 'NORMAL', color: 'bg-primary-500', textColor: 'text-white' }
      case 'insert':
        return { label: 'INSERT', color: 'bg-accent-green', textColor: 'text-white' }
      case 'visual':
        return { label: 'VISUAL', color: 'bg-accent-purple', textColor: 'text-white' }
      case 'command':
        return { label: 'COMMAND', color: 'bg-accent-yellow', textColor: 'text-dark-900' }
      default:
        return { label: 'NORMAL', color: 'bg-primary-500', textColor: 'text-white' }
    }
  }

  const config = getModeConfig()

  return (
    <AnimatePresence>
      {vimModeEnabled && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40"
        >
          <div className="glass rounded-lg px-4 py-2 flex items-center gap-4">
            <motion.div
              key={vimMode}
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className={`vim-mode-indicator px-3 py-1 rounded ${config.color} ${config.textColor}`}
            >
              -- {config.label} --
            </motion.div>

            <div className="flex items-center gap-3 text-xs text-dark-400">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-dark-800 rounded font-mono">i</kbd>
                insert
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-dark-800 rounded font-mono">v</kbd>
                visual
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-dark-800 rounded font-mono">:</kbd>
                command
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-dark-800 rounded font-mono">ESC</kbd>
                normal
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
