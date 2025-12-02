import { useEffect } from 'react'
import { TitleBar } from './components/TitleBar'
import { Sidebar } from './components/Sidebar'
import { CommandPalette } from './components/CommandPalette'
import { VimStatusBar } from './components/VimStatusBar'
import { Dashboard } from './views/Dashboard'
import { NotesView } from './views/NotesView'
import { ProblemsView } from './views/ProblemsView'
import { PracticeView } from './views/PracticeView'
import { SettingsView } from './views/SettingsView'
import { WorkspaceView } from './views/WorkspaceView'
import { useAppStore } from './store/appStore'
import { useVimNavigation } from './hooks/useVimNavigation'

function App() {
  const { currentView, loadFromStorage } = useAppStore()

  // Initialize Vim navigation at app level
  useVimNavigation()

  // Load data from storage on mount
  useEffect(() => {
    loadFromStorage()
  }, [loadFromStorage])

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />
      case 'workspace':
        return <WorkspaceView />
      case 'notes':
        return <NotesView />
      case 'problems':
        return <ProblemsView />
      case 'practice':
        return <PracticeView />
      case 'settings':
        return <SettingsView />
      default:
        return <Dashboard />
    }
  }

  return (
    <div className="h-screen flex flex-col bg-dark-950 text-dark-100 overflow-hidden">
      <TitleBar />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar />

        <main className="flex-1 overflow-hidden">
          {renderView()}
        </main>
      </div>

      <CommandPalette />
      <VimStatusBar />
    </div>
  )
}

export default App
