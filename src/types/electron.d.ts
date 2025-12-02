export interface GenerateProblemParams {
  prompt: string
  difficulty: string
  language: string
  category?: string
  problemStyle?: 'competitive' | 'software-design'
}

export interface GenerateProblemResult {
  success: boolean
  data?: {
    title: string
    description: string
    difficulty: string
    category: string
    tags: string[]
    starterCode: string
    testCases: Array<{
      input: string
      expectedOutput: string
      description?: string
    }>
  }
  error?: string
}

export interface ExecuteCodeParams {
  code: string
  language: string
  input?: string
  timeout?: number
}

export interface ExecuteCodeResult {
  success: boolean
  output?: string
  error?: string
  executionTime?: number
}

export interface WorkspaceResult {
  success: boolean
  error?: string
}

export interface FolderDialogResult extends WorkspaceResult {
  path?: string
}

export interface ReadFileResult extends WorkspaceResult {
  content?: string
}

export interface WorkspaceFile {
  path: string
  name: string
  isDirectory: boolean
}

export interface ElectronAPI {
  minimize: () => void
  maximize: () => void
  close: () => void
  store: {
    get: (key: string) => Promise<unknown>
    set: (key: string, value: unknown) => Promise<boolean>
    delete: (key: string) => Promise<boolean>
    clear: () => Promise<boolean>
  }
  generateProblem: (params: GenerateProblemParams) => Promise<GenerateProblemResult>
  executeCode: (params: ExecuteCodeParams) => Promise<ExecuteCodeResult>
  workspace: {
    openFolderDialog: () => Promise<FolderDialogResult>
    readDirectory: (dirPath: string) => Promise<WorkspaceFile[]>
    readFile: (filePath: string) => Promise<ReadFileResult>
    writeFile: (filePath: string, content: string) => Promise<WorkspaceResult>
    getFileLanguage: (filePath: string) => Promise<string>
  }
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
