import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Command, FileText, Code2, Settings, Play } from 'lucide-react'
import { useAppStore } from '../store/appStore'

interface CommandItem {
  id: string
  label: string
  description?: string
  icon: React.ReactNode
  action: () => void
  keywords: string[]
}

export function CommandPalette() {
  const {
    commandPaletteOpen,
    setCommandPaletteOpen,
    setCurrentView,
    vimMode,
    setVimMode,
    notes,
    problems,
    selectNote,
    selectProblem,
  } = useAppStore()

  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const baseCommands: CommandItem[] = [
    {
      id: 'dashboard',
      label: 'Go to Dashboard',
      icon: <Command className="w-4 h-4" />,
      action: () => setCurrentView('dashboard'),
      keywords: ['home', 'main', 'dashboard'],
    },
    {
      id: 'notes',
      label: 'Go to Notes',
      icon: <FileText className="w-4 h-4" />,
      action: () => setCurrentView('notes'),
      keywords: ['notes', 'memo', 'write'],
    },
    {
      id: 'problems',
      label: 'Go to Problems',
      icon: <Code2 className="w-4 h-4" />,
      action: () => setCurrentView('problems'),
      keywords: ['problems', 'exercises', 'challenges'],
    },
    {
      id: 'practice',
      label: 'Go to Practice',
      icon: <Play className="w-4 h-4" />,
      action: () => setCurrentView('practice'),
      keywords: ['practice', 'run', 'code'],
    },
    {
      id: 'settings',
      label: 'Go to Settings',
      icon: <Settings className="w-4 h-4" />,
      action: () => setCurrentView('settings'),
      keywords: ['settings', 'config', 'preferences'],
    },
  ]

  // Add notes as searchable items
  const noteCommands: CommandItem[] = notes.map((note) => ({
    id: `note-${note.id}`,
    label: note.title,
    description: 'Note',
    icon: <FileText className="w-4 h-4" />,
    action: () => {
      setCurrentView('notes')
      selectNote(note.id)
    },
    keywords: [note.title.toLowerCase(), ...note.tags],
  }))

  // Add problems as searchable items
  const problemCommands: CommandItem[] = problems.map((problem) => ({
    id: `problem-${problem.id}`,
    label: problem.title,
    description: `${problem.difficulty} - ${problem.category}`,
    icon: <Code2 className="w-4 h-4" />,
    action: () => {
      setCurrentView('problems')
      selectProblem(problem.id)
    },
    keywords: [problem.title.toLowerCase(), problem.difficulty, problem.category.toLowerCase()],
  }))

  const allCommands = [...baseCommands, ...noteCommands, ...problemCommands]

  const filteredCommands = query
    ? allCommands.filter(
        (cmd) =>
          cmd.label.toLowerCase().includes(query.toLowerCase()) ||
          cmd.keywords.some((k) => k.includes(query.toLowerCase()))
      )
    : allCommands

  useEffect(() => {
    if (commandPaletteOpen && inputRef.current) {
      inputRef.current.focus()
    }
    setQuery('')
    setSelectedIndex(0)
  }, [commandPaletteOpen])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setCommandPaletteOpen(!commandPaletteOpen)
      }
      if (e.key === 'Escape') {
        setCommandPaletteOpen(false)
        if (vimMode === 'command') {
          setVimMode('normal')
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [commandPaletteOpen, setCommandPaletteOpen, vimMode, setVimMode])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
      case 'Tab':
        e.preventDefault()
        setSelectedIndex((prev) =>
          prev < filteredCommands.length - 1 ? prev + 1 : 0
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredCommands.length - 1
        )
        break
      case 'Enter':
        e.preventDefault()
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action()
          setCommandPaletteOpen(false)
        }
        break
    }
  }

  return (
    <AnimatePresence>
      {commandPaletteOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={() => setCommandPaletteOpen(false)}
          />

          {/* Palette */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed top-[20%] left-1/2 -translate-x-1/2 w-[600px] max-w-[90vw] z-50"
          >
            <div className="glass rounded-xl shadow-2xl overflow-hidden">
              {/* Input */}
              <div className="flex items-center gap-3 p-4 border-b border-dark-700/50">
                <Search className="w-5 h-5 text-dark-400" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value)
                    setSelectedIndex(0)
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder={vimMode === 'command' ? ':' : 'Search commands, notes, problems...'}
                  className="flex-1 bg-transparent text-dark-100 placeholder-dark-500 outline-none text-lg"
                />
                <kbd className="px-2 py-1 bg-dark-800 rounded text-xs text-dark-400 font-mono">
                  ESC
                </kbd>
              </div>

              {/* Results */}
              <div className="max-h-[400px] overflow-y-auto p-2">
                {filteredCommands.length === 0 ? (
                  <div className="p-8 text-center text-dark-500">
                    No results found
                  </div>
                ) : (
                  filteredCommands.map((cmd, index) => (
                    <motion.button
                      key={cmd.id}
                      onClick={() => {
                        cmd.action()
                        setCommandPaletteOpen(false)
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                        index === selectedIndex
                          ? 'bg-primary-500/20 text-primary-400'
                          : 'text-dark-300 hover:bg-dark-800'
                      }`}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.02 }}
                    >
                      <div className={`p-2 rounded-lg ${
                        index === selectedIndex ? 'bg-primary-500/30' : 'bg-dark-800'
                      }`}>
                        {cmd.icon}
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-medium">{cmd.label}</div>
                        {cmd.description && (
                          <div className="text-xs text-dark-500">{cmd.description}</div>
                        )}
                      </div>
                      {index === selectedIndex && (
                        <kbd className="px-2 py-1 bg-dark-800 rounded text-xs text-dark-400">
                          Enter
                        </kbd>
                      )}
                    </motion.button>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between p-3 border-t border-dark-700/50 text-xs text-dark-500">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <kbd className="px-1 bg-dark-800 rounded">↑↓</kbd> navigate
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1 bg-dark-800 rounded">Enter</kbd> select
                  </span>
                </div>
                <span className="flex items-center gap-1">
                  <kbd className="px-1 bg-dark-800 rounded">Ctrl</kbd>+
                  <kbd className="px-1 bg-dark-800 rounded">K</kbd> toggle
                </span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
