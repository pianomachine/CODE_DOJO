import { motion } from 'framer-motion'
import {
  Keyboard,
  Palette,
  Type,
  Code2,
  Save,
  Monitor,
  Moon,
  Sun,
} from 'lucide-react'
import { useAppStore } from '../store/appStore'

export function SettingsView() {
  const { settings, updateSettings, vimModeEnabled, setVimModeEnabled } = useAppStore()

  const fontOptions = [
    'JetBrains Mono',
    'Fira Code',
    'Source Code Pro',
    'Cascadia Code',
    'Consolas',
  ]

  const fontSizeOptions = [12, 13, 14, 15, 16, 18, 20]
  const tabSizeOptions = [2, 4, 8]

  return (
    <div className="h-full overflow-y-auto p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl mx-auto"
      >
        <h1 className="text-2xl font-bold text-dark-100 mb-8">Settings</h1>

        {/* Vim Mode Section */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Keyboard className="w-5 h-5 text-primary-400" />
            <h2 className="text-lg font-semibold text-dark-200">Vim Mode</h2>
          </div>

          <div className="glass rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-dark-200 mb-1">Enable Vim Mode</h3>
                <p className="text-sm text-dark-500">
                  Use Vim keybindings throughout the application. Navigate with hjkl,
                  use : for commands, and more.
                </p>
              </div>
              <motion.button
                onClick={() => setVimModeEnabled(!vimModeEnabled)}
                className={`w-14 h-8 rounded-full p-1 transition-colors ${
                  vimModeEnabled ? 'bg-accent-green' : 'bg-dark-600'
                }`}
              >
                <motion.div
                  className="w-6 h-6 bg-white rounded-full shadow-md"
                  animate={{ x: vimModeEnabled ? 22 : 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              </motion.button>
            </div>

            {vimModeEnabled && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-6 pt-6 border-t border-dark-700/50"
              >
                <h4 className="text-sm font-medium text-dark-400 mb-4">Vim Keybindings Reference</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <h5 className="font-medium text-dark-300">Navigation</h5>
                    <div className="space-y-1 text-dark-400">
                      <div className="flex justify-between">
                        <code className="px-1.5 py-0.5 bg-dark-800 rounded text-xs">gd</code>
                        <span>Dashboard</span>
                      </div>
                      <div className="flex justify-between">
                        <code className="px-1.5 py-0.5 bg-dark-800 rounded text-xs">gn</code>
                        <span>Notes</span>
                      </div>
                      <div className="flex justify-between">
                        <code className="px-1.5 py-0.5 bg-dark-800 rounded text-xs">gp</code>
                        <span>Problems</span>
                      </div>
                      <div className="flex justify-between">
                        <code className="px-1.5 py-0.5 bg-dark-800 rounded text-xs">gr</code>
                        <span>Practice</span>
                      </div>
                      <div className="flex justify-between">
                        <code className="px-1.5 py-0.5 bg-dark-800 rounded text-xs">gs</code>
                        <span>Settings</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h5 className="font-medium text-dark-300">Actions</h5>
                    <div className="space-y-1 text-dark-400">
                      <div className="flex justify-between">
                        <code className="px-1.5 py-0.5 bg-dark-800 rounded text-xs">j/k</code>
                        <span>Up/Down</span>
                      </div>
                      <div className="flex justify-between">
                        <code className="px-1.5 py-0.5 bg-dark-800 rounded text-xs">h/l</code>
                        <span>Left/Right</span>
                      </div>
                      <div className="flex justify-between">
                        <code className="px-1.5 py-0.5 bg-dark-800 rounded text-xs">/</code>
                        <span>Search</span>
                      </div>
                      <div className="flex justify-between">
                        <code className="px-1.5 py-0.5 bg-dark-800 rounded text-xs">:</code>
                        <span>Command</span>
                      </div>
                      <div className="flex justify-between">
                        <code className="px-1.5 py-0.5 bg-dark-800 rounded text-xs">ESC</code>
                        <span>Normal mode</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </section>

        {/* Appearance Section */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Palette className="w-5 h-5 text-primary-400" />
            <h2 className="text-lg font-semibold text-dark-200">Appearance</h2>
          </div>

          <div className="glass rounded-xl p-6 space-y-6">
            {/* Theme */}
            <div>
              <h3 className="font-medium text-dark-200 mb-3">Theme</h3>
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => updateSettings({ theme: 'dark' })}
                  className={`flex-1 flex items-center gap-3 p-4 rounded-xl border transition-all ${
                    settings.theme === 'dark'
                      ? 'bg-primary-500/20 border-primary-500/50'
                      : 'bg-dark-800 border-dark-700 hover:border-dark-600'
                  }`}
                >
                  <Moon className="w-5 h-5" />
                  <span>Dark</span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => updateSettings({ theme: 'light' })}
                  className={`flex-1 flex items-center gap-3 p-4 rounded-xl border transition-all ${
                    settings.theme === 'light'
                      ? 'bg-primary-500/20 border-primary-500/50'
                      : 'bg-dark-800 border-dark-700 hover:border-dark-600'
                  }`}
                >
                  <Sun className="w-5 h-5" />
                  <span>Light</span>
                </motion.button>
              </div>
            </div>
          </div>
        </section>

        {/* Editor Section */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Code2 className="w-5 h-5 text-primary-400" />
            <h2 className="text-lg font-semibold text-dark-200">Editor</h2>
          </div>

          <div className="glass rounded-xl p-6 space-y-6">
            {/* Font Family */}
            <div>
              <h3 className="font-medium text-dark-200 mb-3 flex items-center gap-2">
                <Type className="w-4 h-4" />
                Font Family
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {fontOptions.map((font) => (
                  <motion.button
                    key={font}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => updateSettings({ fontFamily: font })}
                    className={`p-3 rounded-lg text-left transition-all ${
                      settings.fontFamily === font
                        ? 'bg-primary-500/20 border border-primary-500/50'
                        : 'bg-dark-800 border border-transparent hover:border-dark-600'
                    }`}
                    style={{ fontFamily: font }}
                  >
                    {font}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Font Size */}
            <div>
              <h3 className="font-medium text-dark-200 mb-3">Font Size</h3>
              <div className="flex gap-2">
                {fontSizeOptions.map((size) => (
                  <motion.button
                    key={size}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => updateSettings({ fontSize: size })}
                    className={`w-12 h-12 rounded-lg font-mono transition-all ${
                      settings.fontSize === size
                        ? 'bg-primary-500/20 border border-primary-500/50 text-primary-400'
                        : 'bg-dark-800 border border-transparent hover:border-dark-600 text-dark-300'
                    }`}
                  >
                    {size}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Tab Size */}
            <div>
              <h3 className="font-medium text-dark-200 mb-3">Tab Size</h3>
              <div className="flex gap-2">
                {tabSizeOptions.map((size) => (
                  <motion.button
                    key={size}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => updateSettings({ tabSize: size })}
                    className={`w-12 h-12 rounded-lg font-mono transition-all ${
                      settings.tabSize === size
                        ? 'bg-primary-500/20 border border-primary-500/50 text-primary-400'
                        : 'bg-dark-800 border border-transparent hover:border-dark-600 text-dark-300'
                    }`}
                  >
                    {size}
                  </motion.button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Auto Save Section */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Save className="w-5 h-5 text-primary-400" />
            <h2 className="text-lg font-semibold text-dark-200">Auto Save</h2>
          </div>

          <div className="glass rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-dark-200 mb-1">Enable Auto Save</h3>
                <p className="text-sm text-dark-500">
                  Automatically save your work at regular intervals
                </p>
              </div>
              <motion.button
                onClick={() => updateSettings({ autoSave: !settings.autoSave })}
                className={`w-14 h-8 rounded-full p-1 transition-colors ${
                  settings.autoSave ? 'bg-accent-green' : 'bg-dark-600'
                }`}
              >
                <motion.div
                  className="w-6 h-6 bg-white rounded-full shadow-md"
                  animate={{ x: settings.autoSave ? 22 : 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              </motion.button>
            </div>
          </div>
        </section>

        {/* System Info */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Monitor className="w-5 h-5 text-primary-400" />
            <h2 className="text-lg font-semibold text-dark-200">About</h2>
          </div>

          <div className="glass rounded-xl p-6">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-dark-500">Version</span>
                <span className="text-dark-300">1.0.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dark-500">Electron</span>
                <span className="text-dark-300">28.1.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dark-500">React</span>
                <span className="text-dark-300">18.2.0</span>
              </div>
            </div>
          </div>
        </section>
      </motion.div>
    </div>
  )
}
