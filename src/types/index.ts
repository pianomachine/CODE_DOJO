export interface Folder {
  id: string
  name: string
  type: 'notes' | 'problems'
  parentId?: string // for nested folders
  createdAt: Date
  updatedAt: Date
}

export interface Note {
  id: string
  title: string
  content: string
  folderId?: string
  createdAt: Date
  updatedAt: Date
  tags: string[]
  isFavorite: boolean
}

// Bilingual sentence with English and Japanese translation
export interface BilingualSentence {
  en: string
  ja: string
}

export interface Problem {
  id: string
  title: string
  description: string
  // Bilingual description: array of sentence pairs (English + Japanese)
  bilingualDescription?: BilingualSentence[]
  difficulty: 'easy' | 'medium' | 'hard'
  category: string
  language: 'javascript' | 'typescript' | 'python' | 'cpp' | 'java' | 'go' | 'rust'
  folderId?: string
  tags: string[]
  starterCode: string
  solution?: string
  testCases: TestCase[]
  createdAt: Date
  updatedAt: Date
}

export interface TestCase {
  id: string
  input: string
  expectedOutput: string
  description?: string
}

export interface Submission {
  id: string
  code: string
  status: 'passed' | 'failed'
  testsPassed: number
  testsTotal: number
  executionTime?: number
  submittedAt: Date
}

export interface Exercise {
  id: string
  problemId: string
  status: 'not_started' | 'in_progress' | 'completed' | 'failed'
  submissions: Submission[]
  bestSubmission?: string // id of best submission
  notes?: string
}

export type VimMode = 'normal' | 'insert' | 'visual' | 'command'

export interface AppSettings {
  vimModeEnabled: boolean
  theme: 'dark' | 'light'
  fontSize: number
  fontFamily: string
  tabSize: number
  autoSave: boolean
  autoSaveInterval: number
}

export type ViewType = 'dashboard' | 'notes' | 'problems' | 'practice' | 'settings' | 'workspace'

// Workspace types for file editing
export interface WorkspaceFile {
  path: string
  name: string
  isDirectory: boolean
  children?: WorkspaceFile[]
}

export interface OpenFile {
  path: string
  name: string
  content: string
  language: string
  isDirty: boolean
}
