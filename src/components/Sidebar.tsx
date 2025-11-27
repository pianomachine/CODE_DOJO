import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  FileText,
  Code2,
  Play,
  Settings,
  Keyboard,
  PanelLeftClose,
  PanelLeft,
} from 'lucide-react'
import { useAppStore } from '../store/appStore'
import type { ViewType } from '../types'

interface NavItem {
  id: ViewType
  label: string
  icon: React.ReactNode
  shortcut: string
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" />, shortcut: 'gd' },
  { id: 'notes', label: 'Notes', icon: <FileText className="w-5 h-5" />, shortcut: 'gn' },
  { id: 'problems', label: 'Problems', icon: <Code2 className="w-5 h-5" />, shortcut: 'gp' },
  { id: 'practice', label: 'Practice', icon: <Play className="w-5 h-5" />, shortcut: 'gr' },
  { id: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5" />, shortcut: 'gs' },
]

export function Sidebar() {
  const { currentView, setCurrentView, vimModeEnabled, toggleVimMode } = useAppStore()
  const [collapsed, setCollapsed] = useState(true)

  return (
    <motion.div
      className="h-full bg-dark-900/50 border-r border-dark-700/50 flex flex-col"
      animate={{ width: collapsed ? 64 : 256 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
    >
      {/* Collapse Toggle */}
      <div className="p-2 border-b border-dark-700/50">
        <motion.button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center p-2 rounded-lg text-dark-400 hover:bg-dark-800 hover:text-dark-200 transition-colors"
          whileTap={{ scale: 0.95 }}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <PanelLeft className="w-5 h-5" />
          ) : (
            <PanelLeftClose className="w-5 h-5" />
          )}
        </motion.button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1">
        {navItems.map((item) => (
          <motion.button
            key={item.id}
            onClick={() => setCurrentView(item.id)}
            className={`w-full flex items-center gap-3 rounded-lg transition-all ${
              collapsed ? 'justify-center px-2 py-3' : 'px-4 py-3'
            } ${
              currentView === item.id
                ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                : 'text-dark-300 hover:bg-dark-800 hover:text-dark-100'
            }`}
            whileHover={{ x: collapsed ? 0 : 4 }}
            whileTap={{ scale: 0.98 }}
            title={collapsed ? item.label : undefined}
          >
            {item.icon}
            {!collapsed && (
              <>
                <span className="flex-1 text-left font-medium">{item.label}</span>
                {vimModeEnabled && (
                  <span className="text-xs font-mono text-dark-500">{item.shortcut}</span>
                )}
              </>
            )}
          </motion.button>
        ))}
      </nav>

      {/* Vim Mode Toggle */}
      <div className="p-2 border-t border-dark-700/50">
        <motion.button
          onClick={toggleVimMode}
          className={`w-full flex items-center gap-3 rounded-lg transition-all ${
            collapsed ? 'justify-center px-2 py-3' : 'px-4 py-3'
          } ${
            vimModeEnabled
              ? 'bg-accent-green/20 text-accent-green border border-accent-green/30'
              : 'bg-dark-800 text-dark-400 hover:text-dark-200'
          }`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          title={collapsed ? 'Vim Mode' : undefined}
        >
          <Keyboard className="w-5 h-5" />
          {!collapsed && (
            <>
              <span className="flex-1 text-left font-medium">Vim Mode</span>
              <div className={`w-10 h-6 rounded-full p-1 transition-colors ${
                vimModeEnabled ? 'bg-accent-green' : 'bg-dark-600'
              }`}>
                <motion.div
                  className="w-4 h-4 bg-white rounded-full shadow-md"
                  animate={{ x: vimModeEnabled ? 16 : 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              </div>
            </>
          )}
        </motion.button>

        <AnimatePresence>
          {vimModeEnabled && !collapsed && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 p-3 bg-dark-800/50 rounded-lg overflow-hidden"
            >
              <p className="text-xs text-dark-400 mb-2">Quick commands:</p>
              <div className="grid grid-cols-2 gap-1 text-xs font-mono">
                <span className="text-dark-500">j/k</span>
                <span className="text-dark-400">up/down</span>
                <span className="text-dark-500">h/l</span>
                <span className="text-dark-400">left/right</span>
                <span className="text-dark-500">/</span>
                <span className="text-dark-400">search</span>
                <span className="text-dark-500">:</span>
                <span className="text-dark-400">command</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
