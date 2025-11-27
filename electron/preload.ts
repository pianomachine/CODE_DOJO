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
  }) => ipcRenderer.invoke('generate-problem', params),

  // Code Execution
  executeCode: (params: {
    code: string
    language: string
    input?: string
    timeout?: number
  }) => ipcRenderer.invoke('execute-code', params),
})
