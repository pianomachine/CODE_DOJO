import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Search, Star, Trash2, Tag, Clock, Folder, FolderPlus, FolderOpen, MoreVertical, X, Edit3, FileText, ChevronDown, ChevronRight } from 'lucide-react'
import { useAppStore } from '../store/appStore'
import { useVimNavigation } from '../hooks/useVimNavigation'
import Editor from '@monaco-editor/react'
import type { editor } from 'monaco-editor'
import type { Folder as FolderType } from '../types'

export function NotesView() {
  const {
    notes,
    folders,
    selectedNoteId,
    selectedNoteFolderId,
    selectNote,
    selectNoteFolder,
    addNote,
    updateNote,
    deleteNote,
    addFolder,
    updateFolder,
    deleteFolder,
    vimModeEnabled,
  } = useAppStore()

  const [searchQuery, setSearchQuery] = useState('')
  const [editorContent, setEditorContent] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastSelectedIdRef = useRef<string | null>(null)
  const [showNewFolderInput, setShowNewFolderInput] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null)
  const [editingFolderName, setEditingFolderName] = useState('')
  const [folderMenuId, setFolderMenuId] = useState<string | null>(null)
  const [foldersExpanded, setFoldersExpanded] = useState(true)

  const selectedNote = notes.find((n) => n.id === selectedNoteId)
  const noteFolders = folders.filter((f) => f.type === 'notes')

  const filteredNotes = notes.filter((note) => {
    const matchesSearch =
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesFolder = selectedNoteFolderId === null
      ? !note.folderId // Show notes without folder when "All" is selected
      : note.folderId === selectedNoteFolderId
    return matchesSearch && (searchQuery ? true : matchesFolder)
  })

  // ソートは updatedAt ではなく createdAt でソートして安定性を保つ
  const sortedNotes = [...filteredNotes].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  useVimNavigation({
    onNavigate: (direction) => {
      if (direction === 'down') {
        setSelectedIndex((prev) => {
          const next = Math.min(prev + 1, sortedNotes.length - 1)
          if (sortedNotes[next]) {
            selectNote(sortedNotes[next].id)
          }
          return next
        })
      } else if (direction === 'up') {
        setSelectedIndex((prev) => {
          const next = Math.max(prev - 1, 0)
          if (sortedNotes[next]) {
            selectNote(sortedNotes[next].id)
          }
          return next
        })
      }
    },
    onSelect: () => {
      if (sortedNotes[selectedIndex]) {
        selectNote(sortedNotes[selectedIndex].id)
      }
    },
  })

  // 選択されたノートが変わった時のみエディタコンテンツを更新
  useEffect(() => {
    if (selectedNote && selectedNote.id !== lastSelectedIdRef.current) {
      setEditorContent(selectedNote.content)
      lastSelectedIdRef.current = selectedNote.id
    }
  }, [selectedNote])

  const handleCreateNote = () => {
    const newNote = {
      title: 'Untitled Note',
      content: '',
      tags: [],
      isFavorite: false,
      folderId: selectedNoteFolderId || undefined,
    }
    addNote(newNote)
  }

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      addFolder({ name: newFolderName.trim(), type: 'notes' })
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

  const handleMoveToFolder = (noteId: string, folderId: string | undefined) => {
    updateNote(noteId, { folderId })
  }

  const handleEditorMount = useCallback((editor: editor.IStandaloneCodeEditor) => {
    if (vimModeEnabled) {
      import('monaco-vim').then((MonacoVim) => {
        const statusNode = document.getElementById('vim-status-note')
        if (statusNode) {
          MonacoVim.initVimMode(editor, statusNode)
        }
      }).catch(console.error)
    }
  }, [vimModeEnabled])

  // デバウンスして保存
  const handleContentChange = useCallback((value: string | undefined) => {
    if (value === undefined) return

    setEditorContent(value)

    // 既存のタイムアウトをクリア
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    // 500ms後に保存
    saveTimeoutRef.current = setTimeout(() => {
      if (selectedNoteId) {
        updateNote(selectedNoteId, { content: value })
      }
    }, 500)
  }, [selectedNoteId, updateNote])

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (selectedNote) {
      updateNote(selectedNote.id, { title: e.target.value })
    }
  }

  const handleToggleFavorite = () => {
    if (selectedNote) {
      updateNote(selectedNote.id, { isFavorite: !selectedNote.isFavorite })
    }
  }

  const handleDelete = () => {
    if (selectedNote) {
      lastSelectedIdRef.current = null
      deleteNote(selectedNote.id)
    }
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('ja-JP', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="h-full flex">
      {/* Notes List */}
      <div className="w-80 h-full border-r border-dark-700/50 flex flex-col bg-dark-900/30">
        {/* Header */}
        <div className="p-4 border-b border-dark-700/50">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-dark-100">Notes</h2>
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
                onClick={handleCreateNote}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 bg-primary-500 hover:bg-primary-600 rounded-lg transition-colors"
              >
                <Plus className="w-5 h-5 text-white" />
              </motion.button>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notes..."
              className="w-full bg-dark-800 border border-dark-700 rounded-lg pl-10 pr-4 py-2 text-sm text-dark-200 placeholder-dark-500 focus:outline-none focus:border-primary-500"
            />
          </div>
        </div>

        {/* Folders Section */}
        <div className="border-b border-dark-700/50">
          {/* Collapsible Header */}
          <button
            onClick={() => setFoldersExpanded(!foldersExpanded)}
            className="w-full flex items-center gap-2 px-4 py-2 text-xs font-medium text-dark-500 uppercase tracking-wider hover:bg-dark-800/50 transition-colors"
          >
            {foldersExpanded ? (
              <ChevronDown className="w-3 h-3" />
            ) : (
              <ChevronRight className="w-3 h-3" />
            )}
            <span>Folders</span>
            <span className="ml-auto text-dark-600">{noteFolders.length}</span>
          </button>

          <AnimatePresence initial={false}>
            {foldersExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="p-2 max-h-48 overflow-y-auto">
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

                  {/* All Notes */}
                  <button
                    onClick={() => selectNoteFolder(null)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                      selectedNoteFolderId === null
                        ? 'bg-primary-500/20 text-primary-400'
                        : 'text-dark-300 hover:bg-dark-800'
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    <span>All Notes</span>
                    <span className="ml-auto text-xs text-dark-500">
                      {notes.filter((n) => !n.folderId).length}
                    </span>
                  </button>

                  {/* Folder List */}
                  {noteFolders.map((folder) => (
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
                          onClick={() => selectNoteFolder(folder.id)}
                          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors group cursor-pointer ${
                            selectedNoteFolderId === folder.id
                              ? 'bg-primary-500/20 text-primary-400'
                              : 'text-dark-300 hover:bg-dark-800'
                          }`}
                        >
                          {selectedNoteFolderId === folder.id ? (
                            <FolderOpen className="w-4 h-4" />
                          ) : (
                            <Folder className="w-4 h-4" />
                          )}
                          <span className="truncate">{folder.name}</span>
                          <span className="ml-auto text-xs text-dark-500">
                            {notes.filter((n) => n.folderId === folder.id).length}
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

        {/* Notes List */}
        <div className="flex-1 overflow-y-auto p-2">
          <AnimatePresence mode="popLayout">
            {sortedNotes.map((note, index) => (
              <motion.button
                key={note.id}
                layout
                onClick={() => {
                  selectNote(note.id)
                  setSelectedIndex(index)
                }}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className={`w-full text-left p-3 rounded-lg mb-2 transition-colors ${
                  note.id === selectedNoteId
                    ? 'bg-primary-500/20 border border-primary-500/30'
                    : 'hover:bg-dark-800 border border-transparent'
                } ${vimModeEnabled && index === selectedIndex ? 'ring-2 ring-primary-500/50' : ''}`}
              >
                <div className="flex items-start justify-between mb-1">
                  <span className="font-medium text-dark-200 truncate flex-1">
                    {note.title}
                  </span>
                  {note.isFavorite && (
                    <Star className="w-4 h-4 text-accent-yellow fill-accent-yellow flex-shrink-0" />
                  )}
                </div>
                <p className="text-xs text-dark-500 line-clamp-2 mb-2">
                  {note.content || 'Empty note'}
                </p>
                <div className="flex items-center gap-2 text-xs text-dark-600">
                  <Clock className="w-3 h-3" />
                  {formatDate(note.updatedAt)}
                </div>
              </motion.button>
            ))}
          </AnimatePresence>

          {sortedNotes.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-dark-500">
              <p className="mb-2">No notes yet</p>
              <button
                onClick={handleCreateNote}
                className="text-primary-400 hover:text-primary-300 text-sm"
              >
                Create your first note
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Note Editor */}
      <div className="flex-1 flex flex-col h-full">
        {selectedNote ? (
          <>
            {/* Editor Header */}
            <div className="p-4 border-b border-dark-700/50 flex items-center gap-4">
              <input
                type="text"
                value={selectedNote.title}
                onChange={handleTitleChange}
                className="flex-1 bg-transparent text-xl font-semibold text-dark-100 focus:outline-none"
                placeholder="Note title..."
              />
              {/* Move to Folder Dropdown */}
              <div className="relative">
                <select
                  value={selectedNote.folderId || ''}
                  onChange={(e) => handleMoveToFolder(selectedNote.id, e.target.value || undefined)}
                  className="appearance-none bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 pr-8 text-sm text-dark-300 focus:outline-none focus:border-primary-500 cursor-pointer"
                >
                  <option value="">No Folder</option>
                  {noteFolders.map((folder) => (
                    <option key={folder.id} value={folder.id}>
                      {folder.name}
                    </option>
                  ))}
                </select>
                <Folder className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500 pointer-events-none" />
              </div>
              <motion.button
                onClick={handleToggleFavorite}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="p-2 hover:bg-dark-800 rounded-lg transition-colors"
              >
                <Star
                  className={`w-5 h-5 ${
                    selectedNote.isFavorite
                      ? 'text-accent-yellow fill-accent-yellow'
                      : 'text-dark-500'
                  }`}
                />
              </motion.button>
              <motion.button
                onClick={handleDelete}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="p-2 hover:bg-red-500/20 rounded-lg transition-colors group"
              >
                <Trash2 className="w-5 h-5 text-dark-500 group-hover:text-red-400" />
              </motion.button>
            </div>

            {/* Monaco Editor */}
            <div className="flex-1 relative">
              <Editor
                key={selectedNote.id}
                height="100%"
                defaultLanguage="markdown"
                theme="vs-dark"
                value={editorContent}
                onChange={handleContentChange}
                onMount={handleEditorMount}
                loading={<div className="flex items-center justify-center h-full text-dark-500">Loading editor...</div>}
                options={{
                  fontSize: 14,
                  fontFamily: 'JetBrains Mono, monospace',
                  minimap: { enabled: false },
                  wordWrap: 'on',
                  lineNumbers: 'off',
                  padding: { top: 16, bottom: 16 },
                  scrollBeyondLastLine: false,
                  renderLineHighlight: 'none',
                  overviewRulerLanes: 0,
                  hideCursorInOverviewRuler: true,
                  scrollbar: {
                    vertical: 'auto',
                    horizontal: 'hidden',
                  },
                }}
              />
              <div id="vim-status-note" className="absolute bottom-2 left-4 text-xs font-mono text-dark-500" />
            </div>

            {/* Tags */}
            <div className="p-4 border-t border-dark-700/50 flex items-center gap-2">
              <Tag className="w-4 h-4 text-dark-500" />
              {selectedNote.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 bg-dark-800 rounded text-xs text-dark-400"
                >
                  {tag}
                </span>
              ))}
              <input
                type="text"
                placeholder="Add tag..."
                className="bg-transparent text-xs text-dark-400 placeholder-dark-600 focus:outline-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.currentTarget.value) {
                    updateNote(selectedNote.id, {
                      tags: [...selectedNote.tags, e.currentTarget.value],
                    })
                    e.currentTarget.value = ''
                  }
                }}
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-dark-500">
            <div className="text-center">
              <p className="mb-2">Select a note or create a new one</p>
              <button
                onClick={handleCreateNote}
                className="text-primary-400 hover:text-primary-300"
              >
                Create new note
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
