declare module 'vim-monaco' {
  import type { editor } from 'monaco-editor'

  export interface StatusBar {
    setMode(mode: string): void
    setKeyBuffer(keyBuffer: string): void
    setError(error: string): void
    clear(): void
  }

  export class VimMode {
    constructor(editor: editor.IStandaloneCodeEditor, statusBar?: StatusBar)
    enable(): void
    disable(): void
    executeCommand(cmd: string): void
    setOption(option: string, value: unknown): void
    addEventListener(event: string, callback: (evt: unknown) => void): void
  }

  export function makeDomStatusBar(
    parentElement: HTMLElement,
    focusCallback?: () => void
  ): StatusBar
}
