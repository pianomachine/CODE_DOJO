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
    problemStyle?: 'competitive' | 'software-design'
  }) => ipcRenderer.invoke('generate-problem', params),

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
