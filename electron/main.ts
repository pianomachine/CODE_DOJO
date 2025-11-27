import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'path'
import { spawn, exec, execSync } from 'child_process'
import fs from 'fs'
import os from 'os'
import Store from 'electron-store'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const store = new Store()

// Find MinGW bin path dynamically
function findMinGWBinPath(): string | null {
  try {
    const gppPath = execSync('where g++', { encoding: 'utf8' }).trim().split('\n')[0]
    if (gppPath) {
      return path.dirname(gppPath)
    }
  } catch {
    // g++ not found
  }
  return null
}

const mingwBinPath = findMinGWBinPath()

let mainWindow: BrowserWindow | null = null

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    frame: false,
    titleBarStyle: 'hidden',
    backgroundColor: '#020617',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

// IPC Handlers for window controls
ipcMain.on('window-minimize', () => {
  mainWindow?.minimize()
})

ipcMain.on('window-maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize()
  } else {
    mainWindow?.maximize()
  }
})

ipcMain.on('window-close', () => {
  mainWindow?.close()
})

// IPC Handlers for data persistence
ipcMain.handle('store-get', (_event, key: string) => {
  return store.get(key)
})

ipcMain.handle('store-set', (_event, key: string, value: unknown) => {
  store.set(key, value)
  return true
})

ipcMain.handle('store-delete', (_event, key: string) => {
  store.delete(key)
  return true
})

ipcMain.handle('store-clear', () => {
  store.clear()
  return true
})

// OpenAI Problem Generation Handler
ipcMain.handle('generate-problem', async (_event, params: {
  prompt: string
  difficulty: string
  language: string
  category?: string
}) => {
  try {
    const { prompt, difficulty, language, category } = params

    const systemPrompt = `You are a coding problem generator. Generate a coding problem based on the user's request.
Return a JSON object with the following structure:
{
  "title": "Problem title",
  "description": "Detailed problem description explaining what needs to be done",
  "difficulty": "${difficulty}",
  "category": "${category || 'Algorithm'}",
  "tags": ["tag1", "tag2", "tag3"],
  "starterCode": "// Starter code template in ${language}",
  "testCases": [
    {
      "input": "Example input",
      "expectedOutput": "Expected output",
      "description": "Test case description"
    }
  ]
}

Make sure:
- The problem is appropriate for the ${difficulty} difficulty level
- The starter code is in ${language}
- Include at least 3 test cases
- The description is clear and complete
- Tags are relevant to the problem type`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    })

    const content = completion.choices[0]?.message?.content
    if (!content) {
      throw new Error('No response from OpenAI')
    }

    return { success: true, data: JSON.parse(content) }
  } catch (error) {
    console.error('OpenAI API error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate problem'
    }
  }
})

// Code Execution Handler
interface ExecuteCodeParams {
  code: string
  language: string
  input?: string
  timeout?: number
}

interface ExecuteCodeResult {
  success: boolean
  output?: string
  error?: string
  executionTime?: number
}

// Wrap code with test runner for JS/TS
function wrapCodeWithTestRunner(code: string, input: string, language: string): string {
  // For JS/TS, we need to call the function with the input
  // Input format: "s = \"()\", target = 9" or "nums = [1,2,3], target = 6"

  // Extract function name from code
  const funcMatch = code.match(/function\s+(\w+)\s*\(/)
  if (!funcMatch) {
    // No function found, just add console.log for any expression
    return code
  }

  const funcName = funcMatch[1]

  // Parse input to extract variable assignments
  // Convert input like 's = "()"' to actual JS values
  const parsedArgs: string[] = []

  // Split by comma, but not commas inside brackets or quotes
  const parts = input.split(/,\s*(?=\w+\s*=)/)

  for (const part of parts) {
    const match = part.match(/^\s*\w+\s*=\s*(.+)$/)
    if (match) {
      parsedArgs.push(match[1].trim())
    }
  }

  if (parsedArgs.length === 0 && input.trim()) {
    // If no variable assignment format, use input directly
    parsedArgs.push(input.trim())
  }

  const argsStr = parsedArgs.join(', ')

  // Add function call and output
  const wrapper = `
${code}

// Auto-generated test runner
const __result__ = ${funcName}(${argsStr});
console.log(typeof __result__ === 'object' ? JSON.stringify(__result__) : String(__result__));
`
  return wrapper
}

async function executeCode(params: ExecuteCodeParams): Promise<ExecuteCodeResult> {
  const { code, language, input = '', timeout = 10000 } = params
  const tempDir = os.tmpdir()
  const timestamp = Date.now()

  return new Promise((resolve) => {
    let fileName: string
    let command: string
    let args: string[] = []
    let compileCommand: string | null = null

    // Wrap code for JS/TS to auto-run with input
    let processedCode = code
    if ((language === 'javascript' || language === 'typescript') && input) {
      processedCode = wrapCodeWithTestRunner(code, input, language)
    }

    try {
      switch (language) {
        case 'javascript':
          fileName = path.join(tempDir, `code_${timestamp}.js`)
          fs.writeFileSync(fileName, processedCode)
          command = 'node'
          args = [fileName]
          break

        case 'typescript':
          // For TypeScript, use tsx for fast execution
          fileName = path.join(tempDir, `code_${timestamp}.ts`)
          fs.writeFileSync(fileName, processedCode)
          // Use tsx directly from node_modules to avoid npx issues
          command = 'node'
          args = [path.join(__dirname, '../node_modules/tsx/dist/cli.mjs'), fileName]
          break

        case 'python':
          fileName = path.join(tempDir, `code_${timestamp}.py`)
          fs.writeFileSync(fileName, code)
          command = 'python'
          args = [fileName]
          break

        case 'cpp':
          const cppFile = path.join(tempDir, `code_${timestamp}.cpp`)
          const exeFile = path.join(tempDir, `code_${timestamp}${process.platform === 'win32' ? '.exe' : ''}`)
          fs.writeFileSync(cppFile, code)
          fileName = cppFile

          // Compile first
          compileCommand = `g++ "${cppFile}" -o "${exeFile}" -std=c++17 -static-libgcc -static-libstdc++ -Wl,-Bstatic -lstdc++ -lpthread -Wl,-Bdynamic`
          command = exeFile
          args = []
          break

        case 'java':
          // Extract class name from code
          const classMatch = code.match(/public\s+class\s+(\w+)/)
          const className = classMatch ? classMatch[1] : 'Main'
          const javaDir = path.join(tempDir, `java_${timestamp}`)
          fs.mkdirSync(javaDir, { recursive: true })
          fileName = path.join(javaDir, `${className}.java`)
          fs.writeFileSync(fileName, code)

          compileCommand = `javac "${fileName}"`
          command = 'java'
          args = ['-cp', javaDir, className]
          break

        case 'go':
          fileName = path.join(tempDir, `code_${timestamp}.go`)
          fs.writeFileSync(fileName, code)
          command = 'go'
          args = ['run', fileName]
          break

        case 'rust':
          const rsFile = path.join(tempDir, `code_${timestamp}.rs`)
          const rsExe = path.join(tempDir, `code_${timestamp}${process.platform === 'win32' ? '.exe' : ''}`)
          fs.writeFileSync(rsFile, code)
          fileName = rsFile

          compileCommand = `rustc "${rsFile}" -o "${rsExe}"`
          command = rsExe
          args = []
          break

        default:
          resolve({
            success: false,
            error: `Unsupported language: ${language}`
          })
          return
      }

      const startTime = Date.now()

      // Compile if needed
      if (compileCommand) {
        // Ensure MinGW bin is in PATH for compilation
        const envPath = process.env.PATH || ''
        const enhancedPath = mingwBinPath ? `${mingwBinPath};${envPath}` : envPath
        const execEnv = { ...process.env, PATH: enhancedPath }

        exec(compileCommand, { timeout: 30000, env: execEnv }, (compileError, _stdout, compileStderr) => {
          if (compileError) {
            // Cleanup
            try { fs.unlinkSync(fileName) } catch {}
            resolve({
              success: false,
              error: `Compilation error:\n${compileStderr || compileError.message}`
            })
            return
          }

          // Run the compiled program
          runProgram(command, args, input, timeout, startTime, fileName, resolve)
        })
      } else {
        runProgram(command, args, input, timeout, startTime, fileName, resolve)
      }
    } catch (error) {
      resolve({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  })
}

function runProgram(
  command: string,
  args: string[],
  input: string,
  timeout: number,
  startTime: number,
  fileName: string,
  resolve: (result: ExecuteCodeResult) => void
) {
  // Build full command string for shell execution
  const fullCommand = args.length > 0 ? `"${command}" ${args.map(a => `"${a}"`).join(' ')}` : `"${command}"`

  // Ensure MinGW bin is in PATH for C++ executables
  const envPath = process.env.PATH || ''
  const enhancedPath = mingwBinPath ? `${mingwBinPath};${envPath}` : envPath

  const childProcess = spawn(fullCommand, [], {
    timeout,
    shell: true,
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env, PATH: enhancedPath },
  })

  let stdout = ''
  let stderr = ''

  childProcess.stdout?.on('data', (data) => {
    stdout += data.toString()
  })

  childProcess.stderr?.on('data', (data) => {
    stderr += data.toString()
  })

  // Send input if provided
  if (input) {
    childProcess.stdin?.write(input)
    childProcess.stdin?.end()
  } else {
    childProcess.stdin?.end()
  }

  const timeoutId = setTimeout(() => {
    childProcess.kill('SIGTERM')
    resolve({
      success: false,
      error: 'Execution timed out'
    })
  }, timeout)

  childProcess.on('close', (code) => {
    clearTimeout(timeoutId)
    const executionTime = Date.now() - startTime

    // Cleanup temp file
    try { fs.unlinkSync(fileName) } catch {}

    if (code === 0) {
      resolve({
        success: true,
        output: stdout.trim(),
        executionTime
      })
    } else {
      resolve({
        success: false,
        output: stdout.trim(),
        error: stderr || `Process exited with code ${code}`,
        executionTime
      })
    }
  })

  childProcess.on('error', (error) => {
    clearTimeout(timeoutId)
    try { fs.unlinkSync(fileName) } catch {}
    resolve({
      success: false,
      error: `Failed to execute: ${error.message}`
    })
  })
}

ipcMain.handle('execute-code', async (_event, params: ExecuteCodeParams) => {
  return executeCode(params)
})
