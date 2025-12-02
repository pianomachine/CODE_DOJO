import { useState, useCallback, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import {
  FolderOpen,
  File,
  ChevronRight,
  ChevronDown,
  X,
  Save,
  Folder as FolderIcon,
} from 'lucide-react'
import Editor from '@monaco-editor/react'
import type { editor } from 'monaco-editor'
import { useAppStore } from '../store/appStore'
import type { WorkspaceFile, OpenFile } from '../types'

// File tree item component
interface FileTreeItemProps {
  item: WorkspaceFile
  level: number
  onFileClick: (file: WorkspaceFile) => void
  expandedFolders: Set<string>
  toggleFolder: (path: string) => void
}

function FileTreeItem({ item, level, onFileClick, expandedFolders, toggleFolder }: FileTreeItemProps) {
  const isExpanded = expandedFolders.has(item.path)
  const [children, setChildren] = useState<WorkspaceFile[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const loadChildren = useCallback(async () => {
    if (!item.isDirectory || children.length > 0) return
    setIsLoading(true)
    try {
      const result = await window.electronAPI.workspace.readDirectory(item.path)
      setChildren(result)
    } catch (error) {
      console.error('Error loading directory:', error)
    }
    setIsLoading(false)
  }, [item.path, item.isDirectory, children.length])

  useEffect(() => {
    if (isExpanded && item.isDirectory && children.length === 0) {
      loadChildren()
    }
  }, [isExpanded, loadChildren, item.isDirectory, children.length])

  const handleClick = () => {
    if (item.isDirectory) {
      toggleFolder(item.path)
    } else {
      onFileClick(item)
    }
  }

  // Get file icon color based on extension
  const getFileColor = (name: string) => {
    const ext = name.split('.').pop()?.toLowerCase()
    const colors: Record<string, string> = {
      ts: 'text-blue-400',
      tsx: 'text-blue-400',
      js: 'text-yellow-400',
      jsx: 'text-yellow-400',
      py: 'text-green-400',
      json: 'text-yellow-300',
      md: 'text-gray-400',
      css: 'text-pink-400',
      scss: 'text-pink-400',
      html: 'text-orange-400',
      cpp: 'text-blue-300',
      c: 'text-blue-300',
      java: 'text-red-400',
      go: 'text-cyan-400',
      rs: 'text-orange-300',
    }
    return colors[ext || ''] || 'text-dark-400'
  }

  return (
    <div>
      <div
        onClick={handleClick}
        className={`flex items-center gap-1 px-2 py-1 cursor-pointer hover:bg-dark-700/50 rounded text-sm ${
          item.isDirectory ? 'text-dark-200' : 'text-dark-300'
        }`}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
      >
        {item.isDirectory ? (
          <>
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-dark-500 flex-shrink-0" />
            ) : (
              <ChevronRight className="w-4 h-4 text-dark-500 flex-shrink-0" />
            )}
            <FolderIcon className={`w-4 h-4 flex-shrink-0 ${isExpanded ? 'text-yellow-400' : 'text-yellow-600'}`} />
          </>
        ) : (
          <>
            <span className="w-4" />
            <File className={`w-4 h-4 flex-shrink-0 ${getFileColor(item.name)}`} />
          </>
        )}
        <span className="truncate">{item.name}</span>
      </div>

      {item.isDirectory && isExpanded && (
        <div>
          {isLoading ? (
            <div className="text-xs text-dark-500 pl-8 py-1">Loading...</div>
          ) : (
            children.map((child) => (
              <FileTreeItem
                key={child.path}
                item={child}
                level={level + 1}
                onFileClick={onFileClick}
                expandedFolders={expandedFolders}
                toggleFolder={toggleFolder}
              />
            ))
          )}
        </div>
      )}
    </div>
  )
}

export function WorkspaceView() {
  const {
    vimModeEnabled,
    workspacePath,
    workspaceName,
    workspaceFiles,
    workspaceExpandedFolders,
    workspaceOpenFiles,
    workspaceActiveFilePath,
    setWorkspacePath,
    setWorkspaceFiles,
    toggleWorkspaceFolder,
    openWorkspaceFile,
    closeWorkspaceFile,
    setWorkspaceActiveFile,
    updateWorkspaceFileContent,
    markWorkspaceFileSaved,
  } = useAppStore()

  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)
  const vimModeRef = useRef<import('vim-monaco').VimMode | null>(null)

  const activeFile = workspaceOpenFiles.find((f) => f.path === workspaceActiveFilePath)

  const handleOpenFolder = async () => {
    const result = await window.electronAPI.workspace.openFolderDialog()
    if (result.success && result.path) {
      const name = result.path.split(/[\\/]/).pop() || 'Workspace'
      setWorkspacePath(result.path, name)
      const files = await window.electronAPI.workspace.readDirectory(result.path)
      setWorkspaceFiles(files)
    }
  }

  const handleFileClick = async (file: WorkspaceFile) => {
    if (file.isDirectory) return

    // Check if already open
    const existing = workspaceOpenFiles.find((f) => f.path === file.path)
    if (existing) {
      setWorkspaceActiveFile(file.path)
      return
    }

    // Read file content
    const result = await window.electronAPI.workspace.readFile(file.path)
    if (!result.success) {
      console.error('Error reading file:', result.error)
      return
    }

    const language = await window.electronAPI.workspace.getFileLanguage(file.path)

    const newFile: OpenFile = {
      path: file.path,
      name: file.name,
      content: result.content || '',
      language,
      isDirty: false,
    }

    openWorkspaceFile(newFile)
  }

  const handleCloseFile = (path: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    const file = workspaceOpenFiles.find((f) => f.path === path)
    if (file?.isDirty) {
      if (!confirm('Unsaved changes will be lost. Close anyway?')) {
        return
      }
    }
    closeWorkspaceFile(path)
  }

  const handleEditorChange = (value: string | undefined) => {
    if (!workspaceActiveFilePath || value === undefined) return
    updateWorkspaceFileContent(workspaceActiveFilePath, value)
  }

  const handleSave = async () => {
    if (!activeFile || !activeFile.isDirty) return

    const result = await window.electronAPI.workspace.writeFile(activeFile.path, activeFile.content)
    if (result.success) {
      markWorkspaceFileSaved(activeFile.path)
    } else {
      console.error('Error saving file:', result.error)
    }
  }

  const handleEditorMount = useCallback(
    (editor: editor.IStandaloneCodeEditor, monaco: typeof import('monaco-editor')) => {
      // Dispose previous vim mode before setting new editor ref
      if (vimModeRef.current) {
        vimModeRef.current.disable()
        vimModeRef.current = null
      }

      editorRef.current = editor

      // Configure editor
      editor.updateOptions({
        fontSize: 14,
        fontFamily: 'JetBrains Mono, monospace',
        minimap: { enabled: true },
        lineNumbers: 'on',
        renderLineHighlight: 'line',
        scrollBeyondLastLine: false,
        automaticLayout: true,
        tabSize: 2,
        insertSpaces: true,
        cursorBlinking: 'smooth',
        cursorSmoothCaretAnimation: 'on',
      })

      // Add save keybinding
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
        handleSave()
      })

      // Initialize Vim mode if enabled
      if (vimModeEnabled) {
        import('vim-monaco').then(({ VimMode, makeDomStatusBar }) => {
          const statusNode = document.getElementById('vim-status-workspace')
          if (statusNode && editorRef.current === editor) {
            statusNode.innerHTML = ''
            const statusBar = makeDomStatusBar(statusNode, () => editor.focus())
            vimModeRef.current = new VimMode(editor, statusBar)
            vimModeRef.current.enable()
          }
        })
      }

      // Focus the editor after mount
      setTimeout(() => {
        editor.focus()
      }, 50)
    },
    [vimModeEnabled]
  )

  // Handle vim mode toggle
  useEffect(() => {
    if (!editorRef.current) return

    if (vimModeEnabled && !vimModeRef.current) {
      import('vim-monaco').then(({ VimMode, makeDomStatusBar }) => {
        const statusNode = document.getElementById('vim-status-workspace')
        if (statusNode && editorRef.current) {
          statusNode.innerHTML = ''
          const statusBar = makeDomStatusBar(statusNode, () => editorRef.current?.focus())
          vimModeRef.current = new VimMode(editorRef.current, statusBar)
          vimModeRef.current.enable()
        }
      })
    } else if (!vimModeEnabled && vimModeRef.current) {
      vimModeRef.current.disable()
      vimModeRef.current = null
    }
  }, [vimModeEnabled])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (vimModeRef.current) {
        vimModeRef.current.disable()
        vimModeRef.current = null
      }
    }
  }, [])

  // No workspace open
  if (!workspacePath) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <FolderOpen className="w-20 h-20 mx-auto mb-4 text-dark-700" />
          <h2 className="text-xl font-semibold text-dark-300 mb-2">No Folder Open</h2>
          <p className="text-dark-500 mb-6">Open a folder to start editing files</p>
          <motion.button
            onClick={handleOpenFolder}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-6 py-3 bg-primary-500 hover:bg-primary-600 rounded-lg text-white font-medium transition-colors"
          >
            Open Folder
          </motion.button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex">
      {/* File Tree Sidebar */}
      <div className="w-64 h-full border-r border-dark-700/50 bg-dark-900/50 flex flex-col">
        {/* Workspace Header */}
        <div className="h-10 px-3 border-b border-dark-700/50 flex items-center justify-between">
          <span className="text-sm font-medium text-dark-200 truncate">{workspaceName}</span>
          <button
            onClick={handleOpenFolder}
            className="p-1 hover:bg-dark-700 rounded transition-colors"
            title="Open different folder"
          >
            <FolderOpen className="w-4 h-4 text-dark-400" />
          </button>
        </div>

        {/* File Tree */}
        <div className="flex-1 overflow-y-auto py-2">
          {workspaceFiles.map((item) => (
            <FileTreeItem
              key={item.path}
              item={item}
              level={0}
              onFileClick={handleFileClick}
              expandedFolders={workspaceExpandedFolders}
              toggleFolder={toggleWorkspaceFolder}
            />
          ))}
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex-1 flex flex-col">
        {/* Tabs */}
        {workspaceOpenFiles.length > 0 && (
          <div className="h-10 border-b border-dark-700/50 flex items-center bg-dark-900/50 overflow-x-auto">
            {workspaceOpenFiles.map((file) => (
              <div
                key={file.path}
                onClick={() => setWorkspaceActiveFile(file.path)}
                className={`h-full px-4 flex items-center gap-2 border-r border-dark-700/30 cursor-pointer min-w-0 ${
                  workspaceActiveFilePath === file.path
                    ? 'bg-dark-800 text-dark-100'
                    : 'text-dark-400 hover:bg-dark-800/50'
                }`}
              >
                <span className="text-sm truncate max-w-[150px]">
                  {file.isDirty && <span className="text-primary-400 mr-1">*</span>}
                  {file.name}
                </span>
                <button
                  onClick={(e) => handleCloseFile(file.path, e)}
                  className="p-0.5 hover:bg-dark-600 rounded"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Editor */}
        <div className="flex-1 relative">
          {activeFile ? (
            <>
              <Editor
                key={activeFile.path}
                height="100%"
                language={activeFile.language}
                theme="vs-dark"
                value={activeFile.content}
                onChange={handleEditorChange}
                onMount={handleEditorMount}
                options={{
                  fontSize: 14,
                  fontFamily: 'JetBrains Mono, monospace',
                  minimap: { enabled: true },
                  lineNumbers: 'on',
                  padding: { top: 16 },
                  scrollBeyondLastLine: false,
                }}
              />
              <div
                id="vim-status-workspace"
                className="absolute bottom-2 left-4 text-xs font-mono text-dark-500"
              />
              {/* Save button */}
              {activeFile.isDirty && (
                <motion.button
                  onClick={handleSave}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute bottom-4 right-4 flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 rounded-lg text-white text-sm font-medium shadow-lg"
                >
                  <Save className="w-4 h-4" />
                  Save (Ctrl+S)
                </motion.button>
              )}
            </>
          ) : (
            <div className="h-full flex items-center justify-center text-dark-500">
              <div className="text-center">
                <File className="w-16 h-16 mx-auto mb-4 text-dark-700" />
                <p>Select a file to edit</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
