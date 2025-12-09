import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import type { Note, Problem, Exercise, Submission, Folder, AppSettings, ViewType, VimMode, OpenFile, WorkspaceFile, PurposeGraph, PurposeNode, PurposeEdge, EdgeType, ScheduleTask } from '../types'

interface AppState {
  // View state
  currentView: ViewType
  setCurrentView: (view: ViewType) => void

  // Vim mode
  vimMode: VimMode
  setVimMode: (mode: VimMode) => void
  vimModeEnabled: boolean
  toggleVimMode: () => void
  setVimModeEnabled: (enabled: boolean) => void

  // Folders
  folders: Folder[]
  selectedNoteFolderId: string | null
  selectedProblemFolderId: string | null
  addFolder: (folder: Omit<Folder, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateFolder: (id: string, updates: Partial<Folder>) => void
  deleteFolder: (id: string) => void
  selectNoteFolder: (id: string | null) => void
  selectProblemFolder: (id: string | null) => void

  // Notes
  notes: Note[]
  selectedNoteId: string | null
  addNote: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateNote: (id: string, updates: Partial<Note>) => void
  deleteNote: (id: string) => void
  selectNote: (id: string | null) => void

  // Problems
  problems: Problem[]
  selectedProblemId: string | null
  addProblem: (problem: Omit<Problem, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateProblem: (id: string, updates: Partial<Problem>) => void
  deleteProblem: (id: string) => void
  selectProblem: (id: string | null) => void

  // Exercises
  exercises: Exercise[]
  selectedExerciseId: string | null
  addExercise: (exercise: Omit<Exercise, 'id'>) => void
  updateExercise: (id: string, updates: Partial<Exercise>) => void
  addSubmission: (problemId: string, submission: Omit<Submission, 'id' | 'submittedAt'>) => void
  deleteExercise: (id: string) => void
  selectExercise: (id: string | null) => void
  getExerciseForProblem: (problemId: string) => Exercise | undefined

  // Settings
  settings: AppSettings
  updateSettings: (updates: Partial<AppSettings>) => void

  // Command palette
  commandPaletteOpen: boolean
  setCommandPaletteOpen: (open: boolean) => void

  // Workspace
  workspacePath: string | null
  workspaceName: string
  workspaceFiles: WorkspaceFile[]
  workspaceExpandedFolders: Set<string>
  workspaceOpenFiles: OpenFile[]
  workspaceActiveFilePath: string | null
  setWorkspacePath: (path: string | null, name?: string) => void
  setWorkspaceFiles: (files: WorkspaceFile[]) => void
  toggleWorkspaceFolder: (path: string) => void
  openWorkspaceFile: (file: OpenFile) => void
  closeWorkspaceFile: (path: string) => void
  setWorkspaceActiveFile: (path: string | null) => void
  updateWorkspaceFileContent: (path: string, content: string) => void
  markWorkspaceFileSaved: (path: string) => void

  // Purpose Graph
  purposeGraphs: PurposeGraph[]
  selectedGraphId: string | null
  addPurposeGraph: (name: string) => void
  deletePurposeGraph: (id: string) => void
  selectPurposeGraph: (id: string | null) => void
  addPurposeNode: (graphId: string, label: string, position: { x: number; y: number }) => string
  updatePurposeNode: (graphId: string, nodeId: string, updates: Partial<PurposeNode>) => void
  deletePurposeNode: (graphId: string, nodeId: string) => void
  addPurposeEdge: (graphId: string, source: string, target: string, type: EdgeType) => void
  deletePurposeEdge: (graphId: string, edgeId: string) => void
  updateGraphName: (graphId: string, name: string) => void

  // Schedule
  scheduleTasks: ScheduleTask[]
  addScheduleTask: (content: string, date: string) => void
  updateScheduleTask: (id: string, updates: Partial<ScheduleTask>) => void
  deleteScheduleTask: (id: string) => void
  toggleScheduleTask: (id: string) => void

  // Persistence
  loadFromStorage: () => Promise<void>
  saveToStorage: () => Promise<void>
}

const defaultSettings: AppSettings = {
  vimModeEnabled: false,
  theme: 'dark',
  fontSize: 14,
  fontFamily: 'JetBrains Mono',
  tabSize: 2,
  autoSave: true,
  autoSaveInterval: 30000,
}

const sampleProblems: Problem[] = [
  {
    id: 'prob-1',
    title: 'Two Sum',
    description: '与えられた整数配列 nums と整数 target に対して、合計が target になる2つの数値のインデックスを返してください。\n\n各入力には正確に1つの解があり、同じ要素を2回使用することはできません。\n\n答えは任意の順序で返すことができます。',
    difficulty: 'easy',
    category: 'Array',
    language: 'typescript',
    tags: ['array', 'hash-table'],
    starterCode: `function twoSum(nums: number[], target: number): number[] {
  // ここにコードを書いてください

}`,
    testCases: [
      { id: 'tc-1', input: 'nums = [2,7,11,15], target = 9', expectedOutput: '[0,1]', description: '基本ケース' },
      { id: 'tc-2', input: 'nums = [3,2,4], target = 6', expectedOutput: '[1,2]', description: '重複なし' },
      { id: 'tc-3', input: 'nums = [3,3], target = 6', expectedOutput: '[0,1]', description: '同じ値' },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'prob-2',
    title: 'Reverse String',
    description: '文字列を反転する関数を書いてください。入力は文字の配列として与えられます。\n\nO(1) の追加メモリを使用して、配列をその場で変更してください。',
    difficulty: 'easy',
    category: 'String',
    language: 'typescript',
    tags: ['string', 'two-pointers'],
    starterCode: `function reverseString(s: string[]): void {
  // ここにコードを書いてください

}`,
    testCases: [
      { id: 'tc-4', input: 's = ["h","e","l","l","o"]', expectedOutput: '["o","l","l","e","h"]' },
      { id: 'tc-5', input: 's = ["H","a","n","n","a","h"]', expectedOutput: '["h","a","n","n","a","H"]' },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'prob-3',
    title: 'Valid Parentheses',
    description: '括弧 \'(\', \')\', \'{\', \'}\', \'[\', \']\' のみを含む文字列 s が与えられたとき、入力文字列が有効かどうかを判定してください。\n\n入力文字列は以下の場合に有効です：\n1. 開き括弧は同じ種類の括弧で閉じられる必要があります\n2. 開き括弧は正しい順序で閉じられる必要があります\n3. すべての閉じ括弧には、同じ種類の対応する開き括弧があります',
    difficulty: 'easy',
    category: 'Stack',
    language: 'typescript',
    tags: ['string', 'stack'],
    starterCode: `function isValid(s: string): boolean {
  // ここにコードを書いてください

}`,
    testCases: [
      { id: 'tc-6', input: 's = "()"', expectedOutput: 'true' },
      { id: 'tc-7', input: 's = "()[]{}"', expectedOutput: 'true' },
      { id: 'tc-8', input: 's = "(]"', expectedOutput: 'false' },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]

export const useAppStore = create<AppState>((set, get) => ({
  // View state
  currentView: 'dashboard',
  setCurrentView: (view) => set({ currentView: view }),

  // Vim mode
  vimMode: 'normal',
  setVimMode: (mode) => set({ vimMode: mode }),
  vimModeEnabled: false,
  toggleVimMode: () => set((state) => ({ vimModeEnabled: !state.vimModeEnabled })),
  setVimModeEnabled: (enabled) => set({ vimModeEnabled: enabled }),

  // Folders
  folders: [],
  selectedNoteFolderId: null,
  selectedProblemFolderId: null,
  addFolder: (folder) => {
    const newFolder: Folder = {
      ...folder,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    set((state) => ({ folders: [...state.folders, newFolder] }))
    get().saveToStorage()
  },
  updateFolder: (id, updates) => {
    set((state) => ({
      folders: state.folders.map((f) =>
        f.id === id ? { ...f, ...updates, updatedAt: new Date() } : f
      ),
    }))
    get().saveToStorage()
  },
  deleteFolder: (id) => {
    set((state) => {
      // Get the folder type to reset the correct selection
      const folder = state.folders.find((f) => f.id === id)
      const updates: Partial<AppState> = {
        folders: state.folders.filter((f) => f.id !== id),
        // Move items in this folder to root (no folder)
        notes: state.notes.map((n) => n.folderId === id ? { ...n, folderId: undefined } : n),
        problems: state.problems.map((p) => p.folderId === id ? { ...p, folderId: undefined } : p),
      }
      if (folder?.type === 'notes' && state.selectedNoteFolderId === id) {
        updates.selectedNoteFolderId = null
      }
      if (folder?.type === 'problems' && state.selectedProblemFolderId === id) {
        updates.selectedProblemFolderId = null
      }
      return updates
    })
    get().saveToStorage()
  },
  selectNoteFolder: (id) => set({ selectedNoteFolderId: id }),
  selectProblemFolder: (id) => set({ selectedProblemFolderId: id }),

  // Notes
  notes: [],
  selectedNoteId: null,
  addNote: (note) => {
    const newNote: Note = {
      ...note,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    set((state) => ({
      notes: [...state.notes, newNote],
      selectedNoteId: newNote.id,
    }))
    get().saveToStorage()
  },
  updateNote: (id, updates) => {
    set((state) => ({
      notes: state.notes.map((n) =>
        n.id === id ? { ...n, ...updates, updatedAt: new Date() } : n
      ),
    }))
    get().saveToStorage()
  },
  deleteNote: (id) => {
    set((state) => ({
      notes: state.notes.filter((n) => n.id !== id),
      selectedNoteId: state.selectedNoteId === id ? null : state.selectedNoteId,
    }))
    get().saveToStorage()
  },
  selectNote: (id) => set({ selectedNoteId: id }),

  // Problems
  problems: sampleProblems,
  selectedProblemId: null,
  addProblem: (problem) => {
    const newProblem: Problem = {
      ...problem,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    set((state) => ({ problems: [...state.problems, newProblem] }))
    get().saveToStorage()
  },
  updateProblem: (id, updates) => {
    set((state) => ({
      problems: state.problems.map((p) =>
        p.id === id ? { ...p, ...updates, updatedAt: new Date() } : p
      ),
    }))
    get().saveToStorage()
  },
  deleteProblem: (id) => {
    set((state) => ({
      problems: state.problems.filter((p) => p.id !== id),
      selectedProblemId: state.selectedProblemId === id ? null : state.selectedProblemId,
    }))
    get().saveToStorage()
  },
  selectProblem: (id) => set({ selectedProblemId: id }),

  // Exercises
  exercises: [],
  selectedExerciseId: null,
  addExercise: (exercise) => {
    const newExercise: Exercise = { ...exercise, id: uuidv4() }
    set((state) => ({ exercises: [...state.exercises, newExercise] }))
    get().saveToStorage()
  },
  updateExercise: (id, updates) => {
    set((state) => ({
      exercises: state.exercises.map((e) => (e.id === id ? { ...e, ...updates } : e)),
    }))
    get().saveToStorage()
  },
  addSubmission: (problemId, submission) => {
    const newSubmission: Submission = {
      ...submission,
      id: uuidv4(),
      submittedAt: new Date(),
    }

    set((state) => {
      const existingExercise = state.exercises.find((e) => e.problemId === problemId)

      if (existingExercise) {
        // Add submission to existing exercise (handle old data without submissions array)
        const existingSubmissions = existingExercise.submissions || []
        const updatedExercise: Exercise = {
          ...existingExercise,
          submissions: [...existingSubmissions, newSubmission],
          status: submission.status === 'passed' ? 'completed' : 'failed',
          bestSubmission: submission.status === 'passed'
            ? (existingExercise.bestSubmission || newSubmission.id)
            : existingExercise.bestSubmission,
        }
        return {
          exercises: state.exercises.map((e) =>
            e.id === existingExercise.id ? updatedExercise : e
          ),
        }
      } else {
        // Create new exercise with this submission
        const newExercise: Exercise = {
          id: uuidv4(),
          problemId,
          status: submission.status === 'passed' ? 'completed' : 'failed',
          submissions: [newSubmission],
          bestSubmission: submission.status === 'passed' ? newSubmission.id : undefined,
        }
        return {
          exercises: [...state.exercises, newExercise],
        }
      }
    })
    get().saveToStorage()
  },
  deleteExercise: (id) => {
    set((state) => ({
      exercises: state.exercises.filter((e) => e.id !== id),
      selectedExerciseId: state.selectedExerciseId === id ? null : state.selectedExerciseId,
    }))
    get().saveToStorage()
  },
  selectExercise: (id) => set({ selectedExerciseId: id }),
  getExerciseForProblem: (problemId) => {
    return get().exercises.find((e) => e.problemId === problemId)
  },

  // Settings
  settings: defaultSettings,
  updateSettings: (updates) => {
    set((state) => ({
      settings: { ...state.settings, ...updates },
      vimModeEnabled: updates.vimModeEnabled ?? state.vimModeEnabled,
    }))
    get().saveToStorage()
  },

  // Command palette
  commandPaletteOpen: false,
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),

  // Workspace
  workspacePath: null,
  workspaceName: '',
  workspaceFiles: [],
  workspaceExpandedFolders: new Set(),
  workspaceOpenFiles: [],
  workspaceActiveFilePath: null,
  setWorkspacePath: (path, name) => set({
    workspacePath: path,
    workspaceName: name || '',
    workspaceFiles: [],
    workspaceExpandedFolders: new Set(),
    workspaceOpenFiles: [],
    workspaceActiveFilePath: null,
  }),
  setWorkspaceFiles: (files) => set({ workspaceFiles: files }),
  toggleWorkspaceFolder: (path) => set((state) => {
    const next = new Set(state.workspaceExpandedFolders)
    if (next.has(path)) {
      next.delete(path)
    } else {
      next.add(path)
    }
    return { workspaceExpandedFolders: next }
  }),
  openWorkspaceFile: (file) => set((state) => {
    const existing = state.workspaceOpenFiles.find((f) => f.path === file.path)
    if (existing) {
      return { workspaceActiveFilePath: file.path }
    }
    return {
      workspaceOpenFiles: [...state.workspaceOpenFiles, file],
      workspaceActiveFilePath: file.path,
    }
  }),
  closeWorkspaceFile: (path) => set((state) => {
    const newOpenFiles = state.workspaceOpenFiles.filter((f) => f.path !== path)
    let newActivePath = state.workspaceActiveFilePath
    if (state.workspaceActiveFilePath === path) {
      newActivePath = newOpenFiles.length > 0 ? newOpenFiles[newOpenFiles.length - 1].path : null
    }
    return {
      workspaceOpenFiles: newOpenFiles,
      workspaceActiveFilePath: newActivePath,
    }
  }),
  setWorkspaceActiveFile: (path) => set({ workspaceActiveFilePath: path }),
  updateWorkspaceFileContent: (path, content) => set((state) => ({
    workspaceOpenFiles: state.workspaceOpenFiles.map((f) =>
      f.path === path ? { ...f, content, isDirty: true } : f
    ),
  })),
  markWorkspaceFileSaved: (path) => set((state) => ({
    workspaceOpenFiles: state.workspaceOpenFiles.map((f) =>
      f.path === path ? { ...f, isDirty: false } : f
    ),
  })),

  // Purpose Graph
  purposeGraphs: [],
  selectedGraphId: null,
  addPurposeGraph: (name) => {
    const newGraph: PurposeGraph = {
      id: uuidv4(),
      name,
      nodes: [],
      edges: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    set((state) => ({
      purposeGraphs: [...state.purposeGraphs, newGraph],
      selectedGraphId: newGraph.id,
    }))
    get().saveToStorage()
  },
  deletePurposeGraph: (id) => {
    set((state) => ({
      purposeGraphs: state.purposeGraphs.filter((g) => g.id !== id),
      selectedGraphId: state.selectedGraphId === id ? null : state.selectedGraphId,
    }))
    get().saveToStorage()
  },
  selectPurposeGraph: (id) => set({ selectedGraphId: id }),
  addPurposeNode: (graphId, label, position) => {
    const nodeId = uuidv4()
    const newNode: PurposeNode = {
      id: nodeId,
      label,
      position,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    set((state) => ({
      purposeGraphs: state.purposeGraphs.map((g) =>
        g.id === graphId
          ? { ...g, nodes: [...g.nodes, newNode], updatedAt: new Date() }
          : g
      ),
    }))
    get().saveToStorage()
    return nodeId
  },
  updatePurposeNode: (graphId, nodeId, updates) => {
    set((state) => ({
      purposeGraphs: state.purposeGraphs.map((g) =>
        g.id === graphId
          ? {
              ...g,
              nodes: g.nodes.map((n) =>
                n.id === nodeId ? { ...n, ...updates, updatedAt: new Date() } : n
              ),
              updatedAt: new Date(),
            }
          : g
      ),
    }))
    get().saveToStorage()
  },
  deletePurposeNode: (graphId, nodeId) => {
    set((state) => ({
      purposeGraphs: state.purposeGraphs.map((g) =>
        g.id === graphId
          ? {
              ...g,
              nodes: g.nodes.filter((n) => n.id !== nodeId),
              edges: g.edges.filter((e) => e.source !== nodeId && e.target !== nodeId),
              updatedAt: new Date(),
            }
          : g
      ),
    }))
    get().saveToStorage()
  },
  addPurposeEdge: (graphId, source, target, type) => {
    const newEdge: PurposeEdge = {
      id: uuidv4(),
      source,
      target,
      type,
      createdAt: new Date(),
    }
    set((state) => ({
      purposeGraphs: state.purposeGraphs.map((g) =>
        g.id === graphId
          ? { ...g, edges: [...g.edges, newEdge], updatedAt: new Date() }
          : g
      ),
    }))
    get().saveToStorage()
  },
  deletePurposeEdge: (graphId, edgeId) => {
    set((state) => ({
      purposeGraphs: state.purposeGraphs.map((g) =>
        g.id === graphId
          ? { ...g, edges: g.edges.filter((e) => e.id !== edgeId), updatedAt: new Date() }
          : g
      ),
    }))
    get().saveToStorage()
  },
  updateGraphName: (graphId, name) => {
    set((state) => ({
      purposeGraphs: state.purposeGraphs.map((g) =>
        g.id === graphId ? { ...g, name, updatedAt: new Date() } : g
      ),
    }))
    get().saveToStorage()
  },

  // Schedule
  scheduleTasks: [],
  addScheduleTask: (content, date) => {
    const newTask: ScheduleTask = {
      id: uuidv4(),
      content,
      completed: false,
      date,
      createdAt: new Date(),
    }
    set((state) => ({ scheduleTasks: [...state.scheduleTasks, newTask] }))
    get().saveToStorage()
  },
  updateScheduleTask: (id, updates) => {
    set((state) => ({
      scheduleTasks: state.scheduleTasks.map((t) =>
        t.id === id ? { ...t, ...updates } : t
      ),
    }))
    get().saveToStorage()
  },
  deleteScheduleTask: (id) => {
    set((state) => ({
      scheduleTasks: state.scheduleTasks.filter((t) => t.id !== id),
    }))
    get().saveToStorage()
  },
  toggleScheduleTask: (id) => {
    set((state) => ({
      scheduleTasks: state.scheduleTasks.map((t) =>
        t.id === id ? { ...t, completed: !t.completed } : t
      ),
    }))
    get().saveToStorage()
  },

  // Persistence
  loadFromStorage: async () => {
    try {
      if (window.electronAPI) {
        const data = await window.electronAPI.store.get('appData')
        if (data) {
          const parsed = data as {
            folders?: Folder[]
            notes?: Note[]
            problems?: Problem[]
            exercises?: Exercise[]
            settings?: AppSettings
            vimModeEnabled?: boolean
            purposeGraphs?: PurposeGraph[]
            scheduleTasks?: ScheduleTask[]
          }
          set({
            folders: parsed.folders || [],
            notes: parsed.notes || [],
            problems: parsed.problems || sampleProblems,
            exercises: parsed.exercises || [],
            settings: parsed.settings || defaultSettings,
            vimModeEnabled: parsed.vimModeEnabled || false,
            purposeGraphs: parsed.purposeGraphs || [],
            scheduleTasks: parsed.scheduleTasks || [],
          })
        }
      }
    } catch (error) {
      console.error('Failed to load from storage:', error)
    }
  },
  saveToStorage: async () => {
    try {
      if (window.electronAPI) {
        const state = get()
        await window.electronAPI.store.set('appData', {
          folders: state.folders,
          notes: state.notes,
          problems: state.problems,
          exercises: state.exercises,
          settings: state.settings,
          vimModeEnabled: state.vimModeEnabled,
          purposeGraphs: state.purposeGraphs,
          scheduleTasks: state.scheduleTasks,
        })
      }
    } catch (error) {
      console.error('Failed to save to storage:', error)
    }
  },
}))
