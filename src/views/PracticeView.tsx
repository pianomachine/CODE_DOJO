import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Play,
  RotateCcw,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Code2,
  Clock,
  Zap,
  History,
  X,
} from 'lucide-react'
import Editor from '@monaco-editor/react'
import type { editor } from 'monaco-editor'
import { useAppStore } from '../store/appStore'
import type { Problem, Submission } from '../types'

// Format matrix input for display
// Detects patterns like "3 4 1 1 2 1 ..." where first two numbers are rows/cols
function formatMatrixInput(input: string): string {
  // Replace literal \n with actual newlines first
  const normalized = input.replace(/\\n/g, '\n')

  // If it already has newlines, just return as-is
  if (normalized.includes('\n')) {
    return normalized
  }

  // Try to detect matrix format: "rows cols data..."
  const parts = normalized.trim().split(/\s+/)
  if (parts.length < 3) {
    return normalized
  }

  const rows = parseInt(parts[0], 10)
  const cols = parseInt(parts[1], 10)

  // Validate that first two values are reasonable matrix dimensions
  if (isNaN(rows) || isNaN(cols) || rows <= 0 || cols <= 0 || rows > 100 || cols > 100) {
    return normalized
  }

  // Check if we have exactly the right amount of data for a matrix
  const expectedDataCount = rows * cols
  const remainingParts = parts.slice(2)

  if (remainingParts.length !== expectedDataCount) {
    return normalized
  }

  // Build the matrix display
  const lines: string[] = []
  lines.push(`${rows} ${cols}`)

  for (let r = 0; r < rows; r++) {
    const rowData = remainingParts.slice(r * cols, (r + 1) * cols).join(' ')
    lines.push(rowData)
  }

  return lines.join('\n')
}

// Detect language from code content
function detectLanguage(code: string): string {
  // Check for C++ patterns
  if (code.includes('#include') || code.includes('cout') || code.includes('cin') ||
      code.includes('std::') || code.includes('using namespace std')) {
    return 'cpp'
  }
  // Check for Python patterns
  if (code.includes('def ') || code.includes('print(') || code.includes('import ') ||
      (code.includes(':') && !code.includes('{') && code.includes('    '))) {
    return 'python'
  }
  // Check for Java patterns
  if (code.includes('public class') || code.includes('public static void main') ||
      code.includes('System.out.println')) {
    return 'java'
  }
  // Check for JavaScript/TypeScript patterns
  if (code.includes('function ') || code.includes('const ') || code.includes('let ') ||
      code.includes('=>') || code.includes('console.log')) {
    // Check if it's TypeScript specifically
    if (code.includes(': string') || code.includes(': number') || code.includes(': boolean') ||
        code.includes('interface ') || code.includes(': void') || code.includes('<T>')) {
      return 'typescript'
    }
    return 'javascript'
  }
  // Check for Rust patterns
  if (code.includes('fn ') || code.includes('let mut') || code.includes('println!')) {
    return 'rust'
  }
  // Check for Go patterns
  if (code.includes('package main') || code.includes('func ') || code.includes('fmt.')) {
    return 'go'
  }
  // Default to typescript
  return 'typescript'
}

export function PracticeView() {
  const {
    problems,
    exercises,
    selectedProblemId,
    selectProblem,
    addSubmission,
    vimModeEnabled,
    setCurrentView,
  } = useAppStore()

  const [code, setCode] = useState('')
  const [output, setOutput] = useState<string[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [showDescription, setShowDescription] = useState(true)
  const [showHistory, setShowHistory] = useState(false)
  const [testResults, setTestResults] = useState<{ passed: boolean; output: string }[]>([])
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)
  const vimModeRef = useRef<ReturnType<typeof import('monaco-vim').initVimMode> | null>(null)

  const selectedProblem = problems.find((p) => p.id === selectedProblemId)
  const currentExercise = exercises.find((e) => e.problemId === selectedProblemId)

  // Detect language from starter code or problem language
  const editorLanguage = useMemo(() => {
    if (selectedProblem) {
      // Use problem's language if available, otherwise detect from code
      if (selectedProblem.language) {
        return selectedProblem.language
      }
      return detectLanguage(selectedProblem.starterCode)
    }
    return 'typescript'
  }, [selectedProblem])

  // Always start with starter code
  useEffect(() => {
    if (selectedProblem) {
      setCode(selectedProblem.starterCode)
      setOutput([])
      setTestResults([])
    }
  }, [selectedProblem])

  const handleEditorMount = useCallback(
    (editor: editor.IStandaloneCodeEditor, monaco: typeof import('monaco-editor')) => {
      editorRef.current = editor

      // Disable TypeScript diagnostics for practice mode (no type errors for incomplete code)
      monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
        noSemanticValidation: true,
        noSyntaxValidation: false,
      })
      monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
        noSemanticValidation: true,
        noSyntaxValidation: false,
      })

      // Configure editor for TypeScript
      editor.updateOptions({
        fontSize: 14,
        fontFamily: 'JetBrains Mono, monospace',
        minimap: { enabled: false },
        lineNumbers: 'on',
        renderLineHighlight: 'line',
        scrollBeyondLastLine: false,
        automaticLayout: true,
        tabSize: 2,
        insertSpaces: true,
        cursorBlinking: 'smooth',
        cursorSmoothCaretAnimation: 'on',
      })

      // Initialize Vim mode if enabled
      if (vimModeEnabled) {
        import('monaco-vim').then((MonacoVim) => {
          const statusNode = document.getElementById('vim-status-practice')
          if (statusNode && !vimModeRef.current) {
            vimModeRef.current = MonacoVim.initVimMode(editor, statusNode)
          }
        })
      }
    },
    [vimModeEnabled]
  )

  useEffect(() => {
    if (editorRef.current && vimModeEnabled && !vimModeRef.current) {
      import('monaco-vim').then((MonacoVim) => {
        const statusNode = document.getElementById('vim-status-practice')
        if (statusNode && editorRef.current) {
          vimModeRef.current = MonacoVim.initVimMode(editorRef.current, statusNode)
        }
      })
    } else if (!vimModeEnabled && vimModeRef.current) {
      vimModeRef.current.dispose()
      vimModeRef.current = null
    }
  }, [vimModeEnabled])

  const handleCodeChange = (value: string | undefined) => {
    if (value !== undefined) {
      setCode(value)
    }
  }

  const handleRun = async () => {
    if (!selectedProblem) return

    setIsRunning(true)
    setOutput([])
    setTestResults([])

    const outputLines: string[] = []
    const results: { passed: boolean; output: string }[] = []
    let totalTime = 0

    try {
      // Run each test case individually
      for (let index = 0; index < selectedProblem.testCases.length; index++) {
        const testCase = selectedProblem.testCases[index]

        // Execute the code with test case input
        const result = await window.electronAPI.executeCode({
          code,
          language: editorLanguage,
          input: testCase.input,
          timeout: 10000,
        })

        if (!result.success) {
          // Compilation or runtime error
          results.push({
            passed: false,
            output: `Test ${index + 1}: Failed ✗\n  Error: ${result.error || 'Unknown error'}`,
          })
          continue
        }

        if (result.executionTime) {
          totalTime += result.executionTime
        }

        const actualOutput = result.output?.trim() || ''
        const expected = testCase.expectedOutput.trim()

        // Compare output with expected result
        const passed = actualOutput === expected

        results.push({
          passed,
          output: passed
            ? `Test ${index + 1}: Passed ✓`
            : `Test ${index + 1}: Failed ✗\n  Input: ${testCase.input}\n  Expected: ${expected}\n  Got: ${actualOutput || '(no output)'}`,
        })
      }

      // Show total execution time
      if (totalTime > 0) {
        outputLines.push(`Total execution time: ${totalTime}ms`)
        outputLines.push('')
      }

      setOutput([...outputLines, ...results.map(r => r.output)])
      setTestResults(results)

      // Save submission to history
      const passedCount = results.filter((r) => r.passed).length
      const allPassed = passedCount === results.length

      addSubmission(selectedProblem.id, {
        code,
        status: allPassed ? 'passed' : 'failed',
        testsPassed: passedCount,
        testsTotal: results.length,
        executionTime: totalTime,
      })
    } catch (error) {
      console.error('Execution error:', error)
      setOutput([`Error: ${error instanceof Error ? error.message : 'Unknown error'}`])
      setTestResults([{ passed: false, output: 'Execution failed' }])
    }

    setIsRunning(false)
  }

  const handleReset = () => {
    if (selectedProblem) {
      setCode(selectedProblem.starterCode)
      setOutput([])
      setTestResults([])
    }
  }

  const getDifficultyColor = (difficulty: Problem['difficulty']) => {
    switch (difficulty) {
      case 'easy':
        return 'text-accent-green'
      case 'medium':
        return 'text-accent-yellow'
      case 'hard':
        return 'text-accent-red'
    }
  }

  if (!selectedProblem) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Code2 className="w-20 h-20 mx-auto mb-4 text-dark-700" />
          <h2 className="text-xl font-semibold text-dark-300 mb-2">No Problem Selected</h2>
          <p className="text-dark-500 mb-4">Select a problem from the Problems view to start practicing</p>
          <motion.button
            onClick={() => setCurrentView('problems')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-6 py-3 bg-primary-500 hover:bg-primary-600 rounded-lg text-white font-medium transition-colors"
          >
            Browse Problems
          </motion.button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="h-14 px-4 border-b border-dark-700/50 flex items-center justify-between bg-dark-900/50">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setCurrentView('problems')}
            className="p-2 hover:bg-dark-800 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-dark-400" />
          </button>
          <div>
            <h1 className="font-semibold text-dark-100">{selectedProblem.title}</h1>
            <div className="flex items-center gap-2 text-xs">
              <span className={getDifficultyColor(selectedProblem.difficulty)}>
                {selectedProblem.difficulty}
              </span>
              <span className="text-dark-500">•</span>
              <span className="text-dark-500">{selectedProblem.category}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {currentExercise && currentExercise.submissions && currentExercise.submissions.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-dark-400 mr-2">
              <Clock className="w-4 h-4" />
              <span>{currentExercise.submissions.length} submissions</span>
            </div>
          )}
          <motion.button
            onClick={() => setShowHistory(true)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-3 py-2 bg-dark-800 hover:bg-dark-700 rounded-lg text-dark-300 transition-colors"
          >
            <History className="w-4 h-4" />
            History
          </motion.button>
          <motion.button
            onClick={handleReset}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-3 py-2 bg-dark-800 hover:bg-dark-700 rounded-lg text-dark-300 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </motion.button>
          <motion.button
            onClick={handleRun}
            disabled={isRunning}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-4 py-2 bg-accent-green hover:bg-accent-green/90 disabled:opacity-50 rounded-lg text-white font-medium transition-colors"
          >
            {isRunning ? (
              <>
                <Zap className="w-4 h-4 animate-pulse" />
                Running...
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Run Code
              </>
            )}
          </motion.button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Description Panel */}
        <motion.div
          initial={false}
          animate={{ width: showDescription ? 400 : 0 }}
          className="h-full border-r border-dark-700/50 overflow-hidden"
        >
          <div className="w-[400px] h-full overflow-y-auto p-6">
            <h2 className="text-lg font-semibold text-dark-200 mb-4">Description</h2>
            <p className="text-dark-300 whitespace-pre-wrap leading-relaxed mb-6">
              {selectedProblem.description}
            </p>

            <h3 className="text-sm font-semibold text-dark-400 mb-3">Examples</h3>
            {selectedProblem.testCases.map((testCase, index) => (
              <div key={testCase.id} className="mb-4 p-3 bg-dark-800/50 rounded-lg">
                <div className="text-xs text-dark-500 mb-2">Example {index + 1}{testCase.description ? ` - ${testCase.description}` : ''}</div>
                <div className="text-sm font-mono">
                  <div className="text-dark-400 mb-2">
                    <div className="mb-1">Input:</div>
                    <pre className="text-dark-200 bg-dark-900/50 p-2 rounded whitespace-pre-wrap break-all">{formatMatrixInput(testCase.input)}</pre>
                  </div>
                  <div className="text-dark-400">
                    <div className="mb-1">Expected Output:</div>
                    <pre className="text-accent-green bg-dark-900/50 p-2 rounded whitespace-pre-wrap break-all">{testCase.expectedOutput.replace(/\\n/g, '\n')}</pre>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Toggle Button */}
        <button
          onClick={() => setShowDescription(!showDescription)}
          className="w-6 h-full flex items-center justify-center bg-dark-800/50 hover:bg-dark-700/50 transition-colors"
        >
          {showDescription ? (
            <ChevronLeft className="w-4 h-4 text-dark-500" />
          ) : (
            <ChevronRight className="w-4 h-4 text-dark-500" />
          )}
        </button>

        {/* Editor */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 relative">
            <Editor
              key={`${selectedProblemId}-${editorLanguage}`}
              height="100%"
              language={editorLanguage}
              theme="vs-dark"
              value={code}
              onChange={handleCodeChange}
              onMount={handleEditorMount}
              options={{
                fontSize: 14,
                fontFamily: 'JetBrains Mono, monospace',
                minimap: { enabled: false },
                lineNumbers: 'on',
                padding: { top: 16 },
                scrollBeyondLastLine: false,
              }}
            />
            <div
              id="vim-status-practice"
              className="absolute bottom-2 left-4 text-xs font-mono text-dark-500"
            />
          </div>

          {/* Output Panel */}
          <div className="h-48 border-t border-dark-700/50 bg-dark-900/50">
            <div className="h-8 px-4 border-b border-dark-700/50 flex items-center">
              <span className="text-sm font-medium text-dark-400">Output</span>
              {testResults.length > 0 && (
                <span className="ml-auto text-xs">
                  {testResults.filter((r) => r.passed).length}/{testResults.length} tests passed
                </span>
              )}
            </div>
            <div className="h-[calc(100%-2rem)] overflow-y-auto p-4 font-mono text-sm">
              {output.length === 0 ? (
                <span className="text-dark-600">Run your code to see output...</span>
              ) : (
                output.map((line, index) => {
                  // Check if this line is a test result line
                  const isTestLine = line.includes('Test ') && (line.includes('Passed') || line.includes('Failed'))
                  const isPassed = line.includes('Passed ✓')
                  const isFailed = line.includes('Failed ✗')

                  if (isTestLine) {
                    return (
                      <div
                        key={index}
                        className={`flex items-start gap-2 mb-2 ${
                          isPassed ? 'text-accent-green' : 'text-accent-red'
                        }`}
                      >
                        {isPassed ? (
                          <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        ) : (
                          <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        )}
                        <pre className="whitespace-pre-wrap">{line}</pre>
                      </div>
                    )
                  }

                  // Non-test lines (like execution time, etc.)
                  return (
                    <div key={index} className="mb-2 text-dark-300">
                      <pre className="whitespace-pre-wrap">{line}</pre>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* History Modal */}
      <AnimatePresence>
        {showHistory && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={() => setShowHistory(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{
                position: 'fixed',
                top: '0',
                left: '0',
                right: '0',
                bottom: '0',
                margin: 'auto',
                width: '90%',
                maxWidth: '800px',
                height: 'fit-content',
                maxHeight: '80vh',
                zIndex: 50,
              }}
              className="bg-dark-900 rounded-2xl shadow-2xl border border-dark-700 flex flex-col"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-dark-700">
                <div>
                  <h2 className="text-xl font-bold text-dark-100">Submission History</h2>
                  <p className="text-sm text-dark-500 mt-1">{selectedProblem?.title}</p>
                </div>
                <button
                  onClick={() => setShowHistory(false)}
                  className="p-2 hover:bg-dark-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-dark-400" />
                </button>
              </div>

              {/* Submissions List */}
              <div className="flex-1 overflow-y-auto p-6">
                {!currentExercise || !currentExercise.submissions || currentExercise.submissions.length === 0 ? (
                  <div className="text-center text-dark-500 py-12">
                    <History className="w-12 h-12 mx-auto mb-4 text-dark-700" />
                    <p>No submissions yet</p>
                    <p className="text-sm mt-1">Run your code to see submission history</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {[...currentExercise.submissions].reverse().map((submission, index) => (
                      <div
                        key={submission.id}
                        className={`p-4 rounded-lg border ${
                          submission.status === 'passed'
                            ? 'bg-accent-green/10 border-accent-green/30'
                            : 'bg-accent-red/10 border-accent-red/30'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            {submission.status === 'passed' ? (
                              <CheckCircle className="w-5 h-5 text-accent-green" />
                            ) : (
                              <XCircle className="w-5 h-5 text-accent-red" />
                            )}
                            <span className={`font-medium ${
                              submission.status === 'passed' ? 'text-accent-green' : 'text-accent-red'
                            }`}>
                              {submission.status === 'passed' ? 'Passed' : 'Failed'}
                            </span>
                            <span className="text-dark-500 text-sm">
                              {submission.testsPassed}/{submission.testsTotal} tests
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-dark-500">
                            {submission.executionTime && (
                              <span>{submission.executionTime}ms</span>
                            )}
                            <span>
                              {new Date(submission.submittedAt).toLocaleString('ja-JP', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                        </div>

                        {/* Code Preview */}
                        <details className="group">
                          <summary className="cursor-pointer text-sm text-dark-400 hover:text-dark-200 transition-colors">
                            View Code
                          </summary>
                          <pre className="mt-3 p-3 bg-dark-950 rounded-lg text-sm font-mono text-dark-300 overflow-x-auto max-h-64 overflow-y-auto">
                            {submission.code}
                          </pre>
                          <button
                            onClick={() => {
                              setCode(submission.code)
                              setShowHistory(false)
                            }}
                            className="mt-2 text-sm text-primary-400 hover:text-primary-300 transition-colors"
                          >
                            Load this code
                          </button>
                        </details>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
