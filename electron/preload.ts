import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  // Window controls
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),

  // Data persistence
  store: {
    get: (key: string) => ipcRenderer.invoke('store-get', key),
    set: (key: string, value: unknown) => ipcRenderer.invoke('store-set', key, value),
    delete: (key: string) => ipcRenderer.invoke('store-delete', key),
    clear: () => ipcRenderer.invoke('store-clear'),
  },

  // OpenAI Problem Generation
  generateProblem: (params: {
    prompt: string
    difficulty: string
    language: string
    category?: string
    problemStyle?: 'competitive' | 'software-design' | 'english'
  }) => ipcRenderer.invoke('generate-problem', params),

  // AI Translation for English Study
  translateSentence: (params: {
    sentence: string
    context?: string
  }) => ipcRenderer.invoke('translate-sentence', params),

  // AI Word Explanation for English Study
  explainWord: (params: {
    word: string
    sentence?: string
  }) => ipcRenderer.invoke('explain-word', params),

  // Process custom English text (user-provided)
  processCustomEnglishText: (params: {
    text: string
    title: string
    difficulty: 'easy' | 'medium' | 'hard'
  }) => ipcRenderer.invoke('process-custom-english-text', params),

  // Code Execution
  executeCode: (params: {
    code: string
    language: string
    input?: string
    timeout?: number
  }) => ipcRenderer.invoke('execute-code', params),

  // File System (Workspace)
  workspace: {
    openFolderDialog: () => ipcRenderer.invoke('open-folder-dialog'),
    readDirectory: (dirPath: string) => ipcRenderer.invoke('read-directory', dirPath),
    readFile: (filePath: string) => ipcRenderer.invoke('read-file', filePath),
    writeFile: (filePath: string, content: string) => ipcRenderer.invoke('write-file', filePath, content),
    getFileLanguage: (filePath: string) => ipcRenderer.invoke('get-file-language', filePath),
  },
})
