export interface GenerateProblemParams {
  prompt: string
  difficulty: string
  language: string
  category?: string
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
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
