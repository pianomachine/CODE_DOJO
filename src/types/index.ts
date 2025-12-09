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

// English study vocabulary item
export interface VocabularyItem {
  word: string
  pronunciation: string
  partOfSpeech: string
  meaning: string
  definition: string
  exampleSentence: string
  exampleTranslation: string
}

// English study comprehension question
export interface ComprehensionQuestion {
  question: string
  questionJa: string
  answer: string
  answerJa: string
}

export interface Problem {
  id: string
  title: string
  description: string
  // Bilingual description: array of sentence pairs (English + Japanese)
  bilingualDescription?: BilingualSentence[]
  // English study: sentence-by-sentence translations
  sentenceTranslations?: BilingualSentence[]
  // English study: vocabulary list
  vocabularyList?: VocabularyItem[]
  // English study: comprehension questions
  comprehensionQuestions?: ComprehensionQuestion[]
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

export type ViewType = 'dashboard' | 'notes' | 'problems' | 'practice' | 'settings' | 'workspace' | 'purpose-graph' | 'schedule'

// Schedule types
export interface ScheduleTask {
  id: string
  content: string
  completed: boolean
  date: string // YYYY-MM-DD format
  order: number // Order within the same date
  createdAt: Date
}

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

// Purpose-Means Graph types
export interface PurposeNode {
  id: string
  label: string
  description?: string
  position: { x: number; y: number }
  createdAt: Date
  updatedAt: Date
}

export type EdgeType = 'purpose' | 'means' | 'related'

export interface PurposeEdge {
  id: string
  source: string // node id
  target: string // node id
  type: EdgeType // 'purpose' = target is purpose of source, 'means' = target is means of source, 'related' = lateral relation
  label?: string
  createdAt: Date
}

export interface PurposeGraph {
  id: string
  name: string
  nodes: PurposeNode[]
  edges: PurposeEdge[]
  createdAt: Date
  updatedAt: Date
}
