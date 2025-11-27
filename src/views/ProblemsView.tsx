import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Search, Filter, Play, ChevronRight, ChevronDown, Code2, Trash2, Edit3, Folder, FolderPlus, FolderOpen, MoreVertical, X } from 'lucide-react'
import { useAppStore } from '../store/appStore'
import { useVimNavigation } from '../hooks/useVimNavigation'
import { CreateProblemModal } from '../components/CreateProblemModal'
import type { Problem, Folder as FolderType } from '../types'

export function ProblemsView() {
  const {
    problems,
    folders,
    selectedProblemId,
    selectedProblemFolderId,
    selectProblem,
    selectProblemFolder,
    deleteProblem,
    addFolder,
    updateFolder,
    deleteFolder,
    updateProblem,
    setCurrentView,
    exercises,
    addExercise,
    vimModeEnabled,
  } = useAppStore()

  const [searchQuery, setSearchQuery] = useState('')
  const [difficultyFilter, setDifficultyFilter] = useState<'all' | 'easy' | 'medium' | 'hard'>('all')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showNewFolderInput, setShowNewFolderInput] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null)
  const [editingFolderName, setEditingFolderName] = useState('')
  const [folderMenuId, setFolderMenuId] = useState<string | null>(null)
  const [foldersExpanded, setFoldersExpanded] = useState(true)

  const selectedProblem = problems.find((p) => p.id === selectedProblemId)
  const problemFolders = folders.filter((f) => f.type === 'problems')

  const filteredProblems = problems.filter((problem) => {
    const matchesSearch =
      problem.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      problem.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      problem.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesDifficulty = difficultyFilter === 'all' || problem.difficulty === difficultyFilter
    const matchesFolder = selectedProblemFolderId === null
      ? !problem.folderId // Show problems without folder when "All" is selected
      : problem.folderId === selectedProblemFolderId
    return matchesSearch && matchesDifficulty && (searchQuery ? true : matchesFolder)
  })

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      addFolder({ name: newFolderName.trim(), type: 'problems' })
      setNewFolderName('')
      setShowNewFolderInput(false)
    }
  }

  const handleRenameFolder = (id: string) => {
    if (editingFolderName.trim()) {
      updateFolder(id, { name: editingFolderName.trim() })
      setEditingFolderId(null)
      setEditingFolderName('')
    }
  }

  const handleDeleteFolder = (id: string) => {
    deleteFolder(id)
    setFolderMenuId(null)
  }

  const handleMoveToFolder = (problemId: string, folderId: string | undefined) => {
    updateProblem(problemId, { folderId })
  }

  useVimNavigation({
    onNavigate: (direction) => {
      if (direction === 'down') {
        setSelectedIndex((prev) => Math.min(prev + 1, filteredProblems.length - 1))
      } else if (direction === 'up') {
        setSelectedIndex((prev) => Math.max(prev - 1, 0))
      }
    },
    onSelect: () => {
      if (filteredProblems[selectedIndex]) {
        selectProblem(filteredProblems[selectedIndex].id)
      }
    },
  })

  const getDifficultyColor = (difficulty: Problem['difficulty']) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-accent-green/20 text-accent-green border-accent-green/30'
      case 'medium':
        return 'bg-accent-yellow/20 text-accent-yellow border-accent-yellow/30'
      case 'hard':
        return 'bg-accent-red/20 text-accent-red border-accent-red/30'
    }
  }

  const getExerciseStatus = (problemId: string) => {
    const exercise = exercises.find((e) => e.problemId === problemId)
    return exercise?.status || 'not_started'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-accent-green'
      case 'in_progress':
        return 'bg-accent-yellow'
      case 'failed':
        return 'bg-accent-red'
      default:
        return 'bg-dark-600'
    }
  }

  const handleStartPractice = (problem: Problem) => {
    const existingExercise = exercises.find((e) => e.problemId === problem.id)
    if (!existingExercise) {
      addExercise({
        problemId: problem.id,
        userCode: problem.starterCode,
        status: 'in_progress',
        attempts: 0,
      })
    }
    selectProblem(problem.id)
    setCurrentView('practice')
  }

  return (
    <div className="h-full flex">
      {/* Problems List */}
      <div className="w-96 h-full border-r border-dark-700/50 flex flex-col bg-dark-900/30">
        {/* Header */}
        <div className="p-4 border-b border-dark-700/50">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-dark-100">Problems</h2>
            <div className="flex items-center gap-2">
              <motion.button
                onClick={() => setShowNewFolderInput(true)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 bg-dark-800 hover:bg-dark-700 rounded-lg transition-colors"
                title="New Folder"
              >
                <FolderPlus className="w-5 h-5 text-dark-300" />
              </motion.button>
              <motion.button
                onClick={() => setShowCreateModal(true)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 bg-primary-500 hover:bg-primary-600 rounded-lg transition-colors"
              >
                <Plus className="w-5 h-5 text-white" />
              </motion.button>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search problems..."
              className="w-full bg-dark-800 border border-dark-700 rounded-lg pl-10 pr-4 py-2 text-sm text-dark-200 placeholder-dark-500 focus:outline-none focus:border-primary-500"
            />
          </div>

          {/* Difficulty Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-dark-500" />
            {(['all', 'easy', 'medium', 'hard'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setDifficultyFilter(filter)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  difficultyFilter === filter
                    ? filter === 'all'
                      ? 'bg-primary-500/20 text-primary-400'
                      : getDifficultyColor(filter as 'easy' | 'medium' | 'hard')
                    : 'bg-dark-800 text-dark-400 hover:text-dark-200'
                }`}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Folders Section */}
        <div className="border-b border-dark-700/50">
          {/* Folder Header - Collapsible */}
          <button
            onClick={() => setFoldersExpanded(!foldersExpanded)}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-dark-400 hover:text-dark-200 hover:bg-dark-800/50 transition-colors"
          >
            {foldersExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
            <span className="font-medium">Folders</span>
            <span className="ml-auto text-xs text-dark-500">{problemFolders.length}</span>
          </button>

          {/* Collapsible Content */}
          <AnimatePresence>
            {foldersExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="p-2 pt-0 max-h-48 overflow-y-auto">
                  {/* New Folder Input */}
                  {showNewFolderInput && (
                    <div className="flex items-center gap-2 p-2 mb-2">
                      <Folder className="w-4 h-4 text-dark-400" />
                      <input
                        type="text"
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleCreateFolder()
                          if (e.key === 'Escape') setShowNewFolderInput(false)
                        }}
                        placeholder="Folder name..."
                        className="flex-1 bg-dark-800 border border-dark-700 rounded px-2 py-1 text-sm text-dark-200 focus:outline-none focus:border-primary-500"
                        autoFocus
                      />
                      <button onClick={handleCreateFolder} className="text-accent-green hover:text-accent-green/80">
                        <Plus className="w-4 h-4" />
                      </button>
                      <button onClick={() => setShowNewFolderInput(false)} className="text-dark-500 hover:text-dark-300">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {/* All Problems */}
                  <button
                    onClick={() => selectProblemFolder(null)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                      selectedProblemFolderId === null
                        ? 'bg-primary-500/20 text-primary-400'
                        : 'text-dark-300 hover:bg-dark-800'
                    }`}
                  >
                    <Code2 className="w-4 h-4" />
                    <span>All Problems</span>
                    <span className="ml-auto text-xs text-dark-500">
                      {problems.filter((p) => !p.folderId).length}
                    </span>
                  </button>

                  {/* Folder List */}
                  {problemFolders.map((folder) => (
                    <div key={folder.id} className="relative">
                      {editingFolderId === folder.id ? (
                        <div className="flex items-center gap-2 px-3 py-2">
                          <Folder className="w-4 h-4 text-dark-400" />
                          <input
                            type="text"
                            value={editingFolderName}
                            onChange={(e) => setEditingFolderName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleRenameFolder(folder.id)
                              if (e.key === 'Escape') setEditingFolderId(null)
                            }}
                            onBlur={() => handleRenameFolder(folder.id)}
                            className="flex-1 bg-dark-800 border border-dark-700 rounded px-2 py-1 text-sm text-dark-200 focus:outline-none focus:border-primary-500"
                            autoFocus
                          />
                        </div>
                      ) : (
                        <div
                          onClick={() => selectProblemFolder(folder.id)}
                          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors group cursor-pointer ${
                            selectedProblemFolderId === folder.id
                              ? 'bg-primary-500/20 text-primary-400'
                              : 'text-dark-300 hover:bg-dark-800'
                          }`}
                        >
                          {selectedProblemFolderId === folder.id ? (
                            <FolderOpen className="w-4 h-4" />
                          ) : (
                            <Folder className="w-4 h-4" />
                          )}
                          <span className="truncate">{folder.name}</span>
                          <span className="ml-auto text-xs text-dark-500">
                            {problems.filter((p) => p.folderId === folder.id).length}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setFolderMenuId(folderMenuId === folder.id ? null : folder.id)
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-dark-700 rounded"
                          >
                            <MoreVertical className="w-3 h-3" />
                          </button>
                        </div>
                      )}

                      {/* Folder Menu */}
                      {folderMenuId === folder.id && (
                        <div className="absolute right-2 top-full mt-1 bg-dark-800 border border-dark-700 rounded-lg shadow-lg z-10 py-1">
                          <button
                            onClick={() => {
                              setEditingFolderId(folder.id)
                              setEditingFolderName(folder.name)
                              setFolderMenuId(null)
                            }}
                            className="w-full px-3 py-2 text-left text-sm text-dark-300 hover:bg-dark-700 flex items-center gap-2"
                          >
                            <Edit3 className="w-3 h-3" />
                            Rename
                          </button>
                          <button
                            onClick={() => handleDeleteFolder(folder.id)}
                            className="w-full px-3 py-2 text-left text-sm text-accent-red hover:bg-dark-700 flex items-center gap-2"
                          >
                            <Trash2 className="w-3 h-3" />
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Problems List */}
        <div className="flex-1 overflow-y-auto p-2">
          <AnimatePresence>
            {filteredProblems.map((problem, index) => (
              <motion.button
                key={problem.id}
                onClick={() => {
                  selectProblem(problem.id)
                  setSelectedIndex(index)
                }}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: index * 0.02 }}
                className={`w-full text-left p-4 rounded-lg mb-2 transition-all ${
                  problem.id === selectedProblemId
                    ? 'bg-primary-500/20 border border-primary-500/30'
                    : 'hover:bg-dark-800 border border-transparent'
                } ${vimModeEnabled && index === selectedIndex ? 'ring-2 ring-primary-500/50' : ''}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-2 ${getStatusColor(getExerciseStatus(problem.id))}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-dark-200 truncate">
                        {problem.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${getDifficultyColor(problem.difficulty)}`}>
                        {problem.difficulty}
                      </span>
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-primary-500/20 text-primary-400">
                        {problem.language || 'typescript'}
                      </span>
                      <span className="text-xs text-dark-500">{problem.category}</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {problem.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="px-1.5 py-0.5 bg-dark-700/50 rounded text-xs text-dark-500"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.button>
            ))}
          </AnimatePresence>

          {filteredProblems.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-dark-500">
              <p className="mb-2">No problems found</p>
            </div>
          )}
        </div>
      </div>

      {/* Problem Detail */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {selectedProblem ? (
          <>
            {/* Problem Header */}
            <div className="p-6 border-b border-dark-700/50">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-dark-100 mb-2">
                    {selectedProblem.title}
                  </h1>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getDifficultyColor(selectedProblem.difficulty)}`}>
                      {selectedProblem.difficulty}
                    </span>
                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-primary-500/20 text-primary-400 border border-primary-500/30">
                      {selectedProblem.language || 'typescript'}
                    </span>
                    <span className="text-dark-400">{selectedProblem.category}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* Move to Folder Dropdown */}
                  <div className="relative">
                    <select
                      value={selectedProblem.folderId || ''}
                      onChange={(e) => handleMoveToFolder(selectedProblem.id, e.target.value || undefined)}
                      className="appearance-none bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 pr-8 text-sm text-dark-300 focus:outline-none focus:border-primary-500 cursor-pointer"
                    >
                      <option value="">No Folder</option>
                      {problemFolders.map((folder) => (
                        <option key={folder.id} value={folder.id}>
                          {folder.name}
                        </option>
                      ))}
                    </select>
                    <Folder className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500 pointer-events-none" />
                  </div>
                  <motion.button
                    onClick={() => handleStartPractice(selectedProblem)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center gap-2 px-4 py-2 bg-accent-green hover:bg-accent-green/90 rounded-lg text-white font-medium transition-colors"
                  >
                    <Play className="w-4 h-4" />
                    Start Practice
                  </motion.button>
                  <button className="p-2 hover:bg-dark-800 rounded-lg transition-colors">
                    <Edit3 className="w-5 h-5 text-dark-400" />
                  </button>
                  <button
                    onClick={() => deleteProblem(selectedProblem.id)}
                    className="p-2 hover:bg-red-500/20 rounded-lg transition-colors group"
                  >
                    <Trash2 className="w-5 h-5 text-dark-400 group-hover:text-red-400" />
                  </button>
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2">
                {selectedProblem.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 bg-dark-800 rounded-lg text-sm text-dark-400"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Problem Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Description */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-dark-200 mb-4 flex items-center gap-2">
                  <ChevronRight className="w-5 h-5 text-primary-400" />
                  Description
                </h3>
                <div className="prose prose-invert max-w-none">
                  <p className="text-dark-300 whitespace-pre-wrap leading-relaxed">
                    {selectedProblem.description}
                  </p>
                </div>
              </div>

              {/* Test Cases */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-dark-200 mb-4 flex items-center gap-2">
                  <ChevronRight className="w-5 h-5 text-primary-400" />
                  Test Cases
                </h3>
                <div className="space-y-4">
                  {selectedProblem.testCases.map((testCase, index) => (
                    <div
                      key={testCase.id}
                      className="p-4 bg-dark-800/50 rounded-lg border border-dark-700/50"
                    >
                      <div className="text-sm font-medium text-dark-400 mb-2">
                        Example {index + 1}
                        {testCase.description && (
                          <span className="text-dark-500 ml-2">- {testCase.description}</span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-xs text-dark-500 mb-1">Input:</div>
                          <code className="block p-2 bg-dark-900 rounded text-sm font-mono text-dark-200">
                            {testCase.input}
                          </code>
                        </div>
                        <div>
                          <div className="text-xs text-dark-500 mb-1">Expected Output:</div>
                          <code className="block p-2 bg-dark-900 rounded text-sm font-mono text-accent-green">
                            {testCase.expectedOutput}
                          </code>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Starter Code Preview */}
              <div>
                <h3 className="text-lg font-semibold text-dark-200 mb-4 flex items-center gap-2">
                  <Code2 className="w-5 h-5 text-primary-400" />
                  Starter Code
                </h3>
                <pre className="p-4 bg-dark-800/50 rounded-lg border border-dark-700/50 overflow-x-auto">
                  <code className="text-sm font-mono text-dark-300">
                    {selectedProblem.starterCode}
                  </code>
                </pre>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-dark-500">
            <div className="text-center">
              <Code2 className="w-16 h-16 mx-auto mb-4 text-dark-700" />
              <p className="mb-2">Select a problem to view details</p>
              <p className="text-sm">or create a new one</p>
            </div>
          </div>
        )}
      </div>

      {/* Create Problem Modal */}
      <CreateProblemModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </div>
  )
}
