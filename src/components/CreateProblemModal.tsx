import { useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Sparkles,
  PenTool,
  BookOpen,
  Wand2,
  ChevronRight,
  Loader2,
  Code2,
  Zap,
  Brain,
  Target,
  ListChecks,
} from 'lucide-react'
import { useAppStore } from '../store/appStore'
import type { Problem, TestCase } from '../types'
import { v4 as uuidv4 } from 'uuid'

type CreateMode = 'select' | 'manual' | 'ai-custom' | 'ai-template' | 'library'

interface Props {
  isOpen: boolean
  onClose: () => void
}

// Problem template library
const problemLibrary: Omit<Problem, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    title: 'Palindrome Check',
    description: 'Implement a function to check if a string is a palindrome (reads the same forwards and backwards).\n\nIgnore case and consider only alphanumeric characters.',
    difficulty: 'easy',
    category: 'String',
    language: 'typescript',
    tags: ['string', 'two-pointers'],
    starterCode: `function isPalindrome(s: string): boolean {
  // Write your code here

}`,
    testCases: [
      { id: 'tc-1', input: 's = "A man, a plan, a canal: Panama"', expectedOutput: 'true' },
      { id: 'tc-2', input: 's = "race a car"', expectedOutput: 'false' },
      { id: 'tc-3', input: 's = " "', expectedOutput: 'true' },
    ],
  },
  {
    title: 'FizzBuzz',
    description: 'Implement a function that outputs numbers from 1 to n.\n\n- For multiples of 3, output "Fizz"\n- For multiples of 5, output "Buzz"\n- For multiples of both 3 and 5, output "FizzBuzz"\n- Otherwise, output the number as a string',
    difficulty: 'easy',
    category: 'Basic',
    language: 'typescript',
    tags: ['math', 'string'],
    starterCode: `function fizzBuzz(n: number): string[] {
  // Write your code here

}`,
    testCases: [
      { id: 'tc-1', input: 'n = 3', expectedOutput: '["1", "2", "Fizz"]' },
      { id: 'tc-2', input: 'n = 5', expectedOutput: '["1", "2", "Fizz", "4", "Buzz"]' },
      { id: 'tc-3', input: 'n = 15', expectedOutput: '["1", "2", "Fizz", "4", "Buzz", "Fizz", "7", "8", "Fizz", "Buzz", "11", "Fizz", "13", "14", "FizzBuzz"]' },
    ],
  },
  {
    title: 'Binary Search',
    description: 'Implement a function to find the index of a target value in a sorted array using binary search.\n\nReturn -1 if the target is not found.',
    difficulty: 'easy',
    category: 'Array',
    language: 'typescript',
    tags: ['array', 'binary-search'],
    starterCode: `function binarySearch(nums: number[], target: number): number {
  // Write your code here

}`,
    testCases: [
      { id: 'tc-1', input: 'nums = [-1,0,3,5,9,12], target = 9', expectedOutput: '4' },
      { id: 'tc-2', input: 'nums = [-1,0,3,5,9,12], target = 2', expectedOutput: '-1' },
    ],
  },
  {
    title: 'Merge Two Sorted Lists',
    description: 'Merge two sorted linked lists into one sorted list.',
    difficulty: 'easy',
    category: 'Linked List',
    language: 'typescript',
    tags: ['linked-list', 'recursion'],
    starterCode: `interface ListNode {
  val: number;
  next: ListNode | null;
}

function mergeTwoLists(list1: ListNode | null, list2: ListNode | null): ListNode | null {
  // Write your code here

}`,
    testCases: [
      { id: 'tc-1', input: 'list1 = [1,2,4], list2 = [1,3,4]', expectedOutput: '[1,1,2,3,4,4]' },
      { id: 'tc-2', input: 'list1 = [], list2 = []', expectedOutput: '[]' },
      { id: 'tc-3', input: 'list1 = [], list2 = [0]', expectedOutput: '[0]' },
    ],
  },
  {
    title: 'Maximum Subarray',
    description: 'Given an integer array, find the contiguous subarray with the largest sum and return that sum.',
    difficulty: 'medium',
    category: 'Dynamic Programming',
    language: 'typescript',
    tags: ['array', 'dp', 'divide-conquer'],
    starterCode: `function maxSubArray(nums: number[]): number {
  // Write your code here

}`,
    testCases: [
      { id: 'tc-1', input: 'nums = [-2,1,-3,4,-1,2,1,-5,4]', expectedOutput: '6', description: 'Sum of [4,-1,2,1]' },
      { id: 'tc-2', input: 'nums = [1]', expectedOutput: '1' },
      { id: 'tc-3', input: 'nums = [5,4,-1,7,8]', expectedOutput: '23' },
    ],
  },
  {
    title: 'Longest Common Subsequence',
    description: 'Given two strings, return the length of their longest common subsequence.\n\nA subsequence is a sequence that can be derived by deleting some elements without changing the order of the remaining elements.',
    difficulty: 'medium',
    category: 'Dynamic Programming',
    language: 'typescript',
    tags: ['string', 'dp'],
    starterCode: `function longestCommonSubsequence(text1: string, text2: string): number {
  // Write your code here

}`,
    testCases: [
      { id: 'tc-1', input: 'text1 = "abcde", text2 = "ace"', expectedOutput: '3', description: 'LCS = "ace"' },
      { id: 'tc-2', input: 'text1 = "abc", text2 = "abc"', expectedOutput: '3' },
      { id: 'tc-3', input: 'text1 = "abc", text2 = "def"', expectedOutput: '0' },
    ],
  },
  {
    title: 'Coin Change',
    description: 'Given coins of different denominations and a total amount, return the minimum number of coins needed to make that amount.\n\nReturn -1 if the amount cannot be made.',
    difficulty: 'medium',
    category: 'Dynamic Programming',
    language: 'typescript',
    tags: ['array', 'dp', 'bfs'],
    starterCode: `function coinChange(coins: number[], amount: number): number {
  // Write your code here

}`,
    testCases: [
      { id: 'tc-1', input: 'coins = [1,2,5], amount = 11', expectedOutput: '3', description: '11 = 5 + 5 + 1' },
      { id: 'tc-2', input: 'coins = [2], amount = 3', expectedOutput: '-1' },
      { id: 'tc-3', input: 'coins = [1], amount = 0', expectedOutput: '0' },
    ],
  },
  {
    title: 'Trapping Rain Water',
    description: 'Given an array of non-negative integers representing heights, calculate how much water can be trapped after raining.',
    difficulty: 'hard',
    category: 'Array',
    language: 'typescript',
    tags: ['array', 'two-pointers', 'dp', 'stack'],
    starterCode: `function trap(height: number[]): number {
  // Write your code here

}`,
    testCases: [
      { id: 'tc-1', input: 'height = [0,1,0,2,1,0,1,3,2,1,2,1]', expectedOutput: '6' },
      { id: 'tc-2', input: 'height = [4,2,0,3,2,5]', expectedOutput: '9' },
    ],
  },
]

// AI prompt templates
const aiTemplates = [
  {
    id: 'algorithm-basics',
    name: 'Basic Algorithms',
    icon: <Code2 className="w-5 h-5" />,
    description: 'Array operations, sorting, searching basics',
    prompt: 'Create a basic algorithm problem about array operations, sorting, or searching for beginners to intermediate level.',
  },
  {
    id: 'data-structures',
    name: 'Data Structures',
    icon: <ListChecks className="w-5 h-5" />,
    description: 'Stack, Queue, Linked List, Tree',
    prompt: 'Create a data structure problem using stack, queue, linked list, or binary tree.',
  },
  {
    id: 'dynamic-programming',
    name: 'Dynamic Programming',
    icon: <Brain className="w-5 h-5" />,
    description: 'Memoization and tabulation problems',
    prompt: 'Create a dynamic programming problem that teaches memoization or tabulation techniques.',
  },
  {
    id: 'string-manipulation',
    name: 'String Manipulation',
    icon: <PenTool className="w-5 h-5" />,
    description: 'String search, transformation, pattern matching',
    prompt: 'Create a string manipulation problem about searching, transformation, or pattern matching.',
  },
  {
    id: 'interview-prep',
    name: 'Interview Prep',
    icon: <Target className="w-5 h-5" />,
    description: 'Common interview questions',
    prompt: 'Create a commonly asked technical interview problem at FAANG level.',
  },
  {
    id: 'competitive',
    name: 'Competitive Programming',
    icon: <Zap className="w-5 h-5" />,
    description: 'AtCoder, Codeforces level problems',
    prompt: 'Create a competitive programming problem similar to AtCoder or Codeforces.',
  },
]

export function CreateProblemModal({ isOpen, onClose }: Props) {
  const { addProblem } = useAppStore()
  const [mode, setMode] = useState<CreateMode>('select')
  const [isLoading, setIsLoading] = useState(false)

  // Manual creation form
  const [manualForm, setManualForm] = useState({
    title: '',
    description: '',
    difficulty: 'easy' as 'easy' | 'medium' | 'hard',
    category: '',
    language: 'typescript' as 'javascript' | 'typescript' | 'python' | 'cpp' | 'java' | 'go' | 'rust',
    tags: '',
    starterCode: '',
    testCases: [{ input: '', expectedOutput: '', description: '' }],
  })

  // AI custom creation
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiDifficulty, setAiDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium')
  const [aiLanguage, setAiLanguage] = useState('TypeScript')
  const [aiProblemStyle, setAiProblemStyle] = useState<'competitive' | 'software-design'>('competitive')

  // Library selection
  const [selectedLibraryProblems, setSelectedLibraryProblems] = useState<number[]>([])

  const handleClose = () => {
    setMode('select')
    setManualForm({
      title: '',
      description: '',
      difficulty: 'easy',
      category: '',
      language: 'typescript',
      tags: '',
      starterCode: '',
      testCases: [{ input: '', expectedOutput: '', description: '' }],
    })
    setAiPrompt('')
    setSelectedLibraryProblems([])
    onClose()
  }

  const handleManualSubmit = () => {
    if (!manualForm.title || !manualForm.description) return

    const testCases: TestCase[] = manualForm.testCases
      .filter((tc) => tc.input && tc.expectedOutput)
      .map((tc) => ({
        id: uuidv4(),
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        description: tc.description || undefined,
      }))

    addProblem({
      title: manualForm.title,
      description: manualForm.description,
      difficulty: manualForm.difficulty,
      category: manualForm.category || 'General',
      language: manualForm.language,
      tags: manualForm.tags.split(',').map((t) => t.trim()).filter(Boolean),
      starterCode: manualForm.starterCode || `function solution() {\n  // Write your code here\n  \n}`,
      testCases,
    })

    handleClose()
  }

  const [aiError, setAiError] = useState<string | null>(null)

  const handleAIGenerate = async (prompt: string) => {
    setIsLoading(true)
    setAiError(null)

    try {
      // Call OpenAI API via Electron IPC
      const result = await window.electronAPI.generateProblem({
        prompt,
        difficulty: aiDifficulty,
        language: aiLanguage,
        category: mode === 'ai-template' ? 'Algorithm' : undefined,
        problemStyle: aiProblemStyle,
      })

      if (!result.success) {
        throw new Error(result.error || 'Failed to generate problem')
      }

      const data = result.data as {
        title?: string
        description?: string
        bilingualDescription?: { en: string; ja: string }[]
        difficulty?: 'easy' | 'medium' | 'hard'
        category?: string
        tags?: string[]
        starterCode?: string
        testCases?: { input: string; expectedOutput: string; description?: string }[]
      }

      if (!data) {
        throw new Error('No data returned from AI')
      }

      // Validate the generated problem quality
      const invalidPatterns = [
        'placeholder',
        'actual problem',
        'should provide',
        'clear instructions',
        'to be determined',
        'tbd',
        'todo',
        'implement your solution',
      ]

      const descLower = (data.description || '').toLowerCase()
      const titleLower = (data.title || '').toLowerCase()

      // Check for placeholder text
      for (const pattern of invalidPatterns) {
        if (descLower.includes(pattern) || titleLower.includes(pattern)) {
          throw new Error('AIが不完全な問題を生成しました。もう一度お試しください。')
        }
      }

      // Check minimum description length
      if (!data.description || data.description.length < 50) {
        throw new Error('生成された問題の説明が短すぎます。もう一度お試しください。')
      }

      // Check for test cases
      if (!data.testCases || data.testCases.length < 1) {
        throw new Error('テストケースが生成されませんでした。もう一度お試しください。')
      }

      // Add unique IDs to test cases
      const testCases = (data.testCases || []).map((tc) => ({
        id: uuidv4(),
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        description: tc.description,
      }))

      // Convert aiLanguage to Problem language type
      const languageMap: Record<string, 'javascript' | 'typescript' | 'python' | 'cpp' | 'java' | 'go' | 'rust'> = {
        'TypeScript': 'typescript',
        'JavaScript': 'javascript',
        'Python': 'python',
        'Java': 'java',
        'C++': 'cpp',
        'Go': 'go',
        'Rust': 'rust',
      }

      const generatedProblem = {
        title: data.title || 'AI Generated Problem',
        description: data.description || prompt,
        bilingualDescription: data.bilingualDescription,
        difficulty: data.difficulty || aiDifficulty,
        category: data.category || 'Algorithm',
        language: languageMap[aiLanguage] || 'typescript',
        tags: [...(data.tags || []), 'ai-generated'],
        starterCode: data.starterCode || `function solution() {\n  // Write your code here\n}`,
        testCases,
      }

      addProblem(generatedProblem)
      handleClose()
    } catch (error) {
      console.error('AI generation error:', error)
      setAiError(error instanceof Error ? error.message : 'Failed to generate problem. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddLibraryProblems = () => {
    selectedLibraryProblems.forEach((index) => {
      addProblem(problemLibrary[index])
    })
    handleClose()
  }

  const addTestCase = () => {
    setManualForm((prev) => ({
      ...prev,
      testCases: [...prev.testCases, { input: '', expectedOutput: '', description: '' }],
    }))
  }

  const removeTestCase = (index: number) => {
    setManualForm((prev) => ({
      ...prev,
      testCases: prev.testCases.filter((_, i) => i !== index),
    }))
  }

  const updateTestCase = (index: number, field: string, value: string) => {
    setManualForm((prev) => ({
      ...prev,
      testCases: prev.testCases.map((tc, i) =>
        i === index ? { ...tc, [field]: value } : tc
      ),
    }))
  }

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            style={{ zIndex: 9999 }}
            onClick={handleClose}
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
              maxHeight: '85vh',
              zIndex: 10000,
            }}
            className="bg-dark-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-dark-700"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-dark-700">
              <h2 className="text-xl font-bold text-dark-100">
                {mode === 'select' && 'Create Problem'}
                {mode === 'manual' && 'Manual Creation'}
                {mode === 'ai-custom' && 'AI Custom Creation'}
                {mode === 'ai-template' && 'AI Template Creation'}
                {mode === 'library' && 'Add from Library'}
              </h2>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-dark-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-dark-400" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Mode selection */}
              {mode === 'select' && (
                <div className="grid grid-cols-2 gap-4">
                  <motion.button
                    onClick={() => setMode('manual')}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="p-6 bg-dark-800/50 hover:bg-dark-800 rounded-xl border border-dark-700 hover:border-dark-600 text-left transition-all"
                  >
                    <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 mb-4">
                      <PenTool className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-semibold text-dark-100 mb-2">Manual Creation</h3>
                    <p className="text-sm text-dark-400">
                      Create by entering problem description, test cases, and starter code yourself
                    </p>
                  </motion.button>

                  <motion.button
                    onClick={() => setMode('ai-custom')}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="p-6 bg-dark-800/50 hover:bg-dark-800 rounded-xl border border-dark-700 hover:border-primary-500/50 text-left transition-all"
                  >
                    <div className="w-12 h-12 rounded-xl bg-primary-500/20 flex items-center justify-center text-primary-400 mb-4">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-semibold text-dark-100 mb-2">AI Custom Creation</h3>
                    <p className="text-sm text-dark-400">
                      Describe what you want and let AI create an original problem
                    </p>
                  </motion.button>

                  <motion.button
                    onClick={() => setMode('ai-template')}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="p-6 bg-dark-800/50 hover:bg-dark-800 rounded-xl border border-dark-700 hover:border-accent-purple/50 text-left transition-all"
                  >
                    <div className="w-12 h-12 rounded-xl bg-accent-purple/20 flex items-center justify-center text-accent-purple mb-4">
                      <Wand2 className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-semibold text-dark-100 mb-2">AI Templates</h3>
                    <p className="text-sm text-dark-400">
                      Select a category and let AI auto-generate a problem
                    </p>
                  </motion.button>

                  <motion.button
                    onClick={() => setMode('library')}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="p-6 bg-dark-800/50 hover:bg-dark-800 rounded-xl border border-dark-700 hover:border-accent-green/50 text-left transition-all"
                  >
                    <div className="w-12 h-12 rounded-xl bg-accent-green/20 flex items-center justify-center text-accent-green mb-4">
                      <BookOpen className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-semibold text-dark-100 mb-2">Add from Library</h3>
                    <p className="text-sm text-dark-400">
                      Select from pre-made classic problems
                    </p>
                  </motion.button>
                </div>
              )}

              {/* Manual creation form */}
              {mode === 'manual' && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-dark-300 mb-2">Title *</label>
                    <input
                      type="text"
                      value={manualForm.title}
                      onChange={(e) => setManualForm((prev) => ({ ...prev, title: e.target.value }))}
                      className="w-full bg-dark-800 border border-dark-700 rounded-lg px-4 py-3 text-dark-100 focus:outline-none focus:border-primary-500"
                      placeholder="Two Sum"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-dark-300 mb-2">Description *</label>
                    <textarea
                      value={manualForm.description}
                      onChange={(e) => setManualForm((prev) => ({ ...prev, description: e.target.value }))}
                      rows={4}
                      className="w-full bg-dark-800 border border-dark-700 rounded-lg px-4 py-3 text-dark-100 focus:outline-none focus:border-primary-500 resize-none"
                      placeholder="Enter problem description..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-dark-300 mb-2">Difficulty</label>
                      <select
                        value={manualForm.difficulty}
                        onChange={(e) => setManualForm((prev) => ({ ...prev, difficulty: e.target.value as 'easy' | 'medium' | 'hard' }))}
                        className="w-full bg-dark-800 border border-dark-700 rounded-lg px-4 py-3 text-dark-100 focus:outline-none focus:border-primary-500"
                      >
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-dark-300 mb-2">Language</label>
                      <select
                        value={manualForm.language}
                        onChange={(e) => setManualForm((prev) => ({ ...prev, language: e.target.value as 'javascript' | 'typescript' | 'python' | 'cpp' | 'java' | 'go' | 'rust' }))}
                        className="w-full bg-dark-800 border border-dark-700 rounded-lg px-4 py-3 text-dark-100 focus:outline-none focus:border-primary-500"
                      >
                        <option value="typescript">TypeScript</option>
                        <option value="javascript">JavaScript</option>
                        <option value="python">Python</option>
                        <option value="cpp">C++</option>
                        <option value="java">Java</option>
                        <option value="go">Go</option>
                        <option value="rust">Rust</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-dark-300 mb-2">Category</label>
                      <input
                        type="text"
                        value={manualForm.category}
                        onChange={(e) => setManualForm((prev) => ({ ...prev, category: e.target.value }))}
                        className="w-full bg-dark-800 border border-dark-700 rounded-lg px-4 py-3 text-dark-100 focus:outline-none focus:border-primary-500"
                        placeholder="Array"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-dark-300 mb-2">Tags (comma separated)</label>
                      <input
                        type="text"
                        value={manualForm.tags}
                        onChange={(e) => setManualForm((prev) => ({ ...prev, tags: e.target.value }))}
                        className="w-full bg-dark-800 border border-dark-700 rounded-lg px-4 py-3 text-dark-100 focus:outline-none focus:border-primary-500"
                        placeholder="array, hash-table"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-dark-300 mb-2">Starter Code</label>
                    <textarea
                      value={manualForm.starterCode}
                      onChange={(e) => setManualForm((prev) => ({ ...prev, starterCode: e.target.value }))}
                      rows={6}
                      className="w-full bg-dark-800 border border-dark-700 rounded-lg px-4 py-3 text-dark-100 font-mono text-sm focus:outline-none focus:border-primary-500 resize-none"
                      placeholder="function solution() {&#10;  // Code here&#10;}"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-dark-300">Test Cases</label>
                      <button
                        onClick={addTestCase}
                        className="text-sm text-primary-400 hover:text-primary-300"
                      >
                        + Add
                      </button>
                    </div>
                    <div className="space-y-3">
                      {manualForm.testCases.map((tc, index) => (
                        <div key={index} className="p-4 bg-dark-800/50 rounded-lg border border-dark-700">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-sm text-dark-400">Test Case {index + 1}</span>
                            {manualForm.testCases.length > 1 && (
                              <button
                                onClick={() => removeTestCase(index)}
                                className="text-xs text-red-400 hover:text-red-300"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <input
                              type="text"
                              value={tc.input}
                              onChange={(e) => updateTestCase(index, 'input', e.target.value)}
                              className="bg-dark-900 border border-dark-600 rounded px-3 py-2 text-sm text-dark-100 focus:outline-none focus:border-primary-500"
                              placeholder="Input: nums = [1,2,3]"
                            />
                            <input
                              type="text"
                              value={tc.expectedOutput}
                              onChange={(e) => updateTestCase(index, 'expectedOutput', e.target.value)}
                              className="bg-dark-900 border border-dark-600 rounded px-3 py-2 text-sm text-dark-100 focus:outline-none focus:border-primary-500"
                              placeholder="Expected: [3,2,1]"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* AI custom creation */}
              {mode === 'ai-custom' && (
                <div className="space-y-6">
                  {/* Problem Style Toggle */}
                  <div>
                    <label className="block text-sm font-medium text-dark-300 mb-3">Problem Style</label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setAiProblemStyle('competitive')}
                        className={`flex-1 p-3 rounded-lg border text-left transition-all ${
                          aiProblemStyle === 'competitive'
                            ? 'bg-primary-500/20 border-primary-500/50 text-primary-300'
                            : 'bg-dark-800/50 border-dark-700 text-dark-400 hover:border-dark-600'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Zap className="w-4 h-4" />
                          <span className="font-medium text-sm">Competitive Programming</span>
                        </div>
                        <p className="text-xs opacity-70">Algorithm, Data Structure, AtCoder/LeetCode style</p>
                      </button>
                      <button
                        onClick={() => setAiProblemStyle('software-design')}
                        className={`flex-1 p-3 rounded-lg border text-left transition-all ${
                          aiProblemStyle === 'software-design'
                            ? 'bg-accent-purple/20 border-accent-purple/50 text-accent-purple'
                            : 'bg-dark-800/50 border-dark-700 text-dark-400 hover:border-dark-600'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Code2 className="w-4 h-4" />
                          <span className="font-medium text-sm">Software Design</span>
                        </div>
                        <p className="text-xs opacity-70">TDD, SOLID, Clean Architecture, Design Patterns</p>
                      </button>
                    </div>
                  </div>

                  <div className="p-4 bg-primary-500/10 border border-primary-500/30 rounded-lg">
                    <div className="flex items-start gap-3">
                      <Sparkles className="w-5 h-5 text-primary-400 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-dark-100 mb-1">
                          {aiProblemStyle === 'competitive'
                            ? 'AI Problem Creation / Import'
                            : 'AI Software Design Problem'}
                        </h4>
                        <p className="text-sm text-dark-400">
                          {aiProblemStyle === 'competitive'
                            ? 'Describe a problem or paste from AtCoder, LeetCode, Codeforces, etc.'
                            : 'Describe a design challenge: refactoring, implementing patterns, TDD exercises, etc.'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-dark-300 mb-2">
                      {aiProblemStyle === 'competitive' ? 'Problem Description / Raw Problem Text' : 'Design Challenge Description'}
                    </label>
                    <textarea
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      rows={10}
                      className="w-full bg-dark-800 border border-dark-700 rounded-lg px-4 py-3 text-dark-100 focus:outline-none focus:border-primary-500 resize-none font-mono text-sm"
                      placeholder={aiProblemStyle === 'competitive'
                        ? "Option 1 - Describe what you want:\n- Create a problem using binary search\n- I want a problem to learn recursion\n\nOption 2 - Paste a problem directly:\nあなたは、板を倒すゲームを考えました...\n入力例1\n3 4\n..."
                        : "Examples:\n- Create a TDD exercise for a shopping cart\n- Refactor this code to follow Single Responsibility Principle\n- Implement the Observer pattern for a notification system\n- Design a REST API with proper separation of concerns"}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-dark-300 mb-2">Difficulty</label>
                      <select
                        value={aiDifficulty}
                        onChange={(e) => setAiDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
                        className="w-full bg-dark-800 border border-dark-700 rounded-lg px-4 py-3 text-dark-100 focus:outline-none focus:border-primary-500"
                      >
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-dark-300 mb-2">Language</label>
                      <select
                        value={aiLanguage}
                        onChange={(e) => setAiLanguage(e.target.value)}
                        className="w-full bg-dark-800 border border-dark-700 rounded-lg px-4 py-3 text-dark-100 focus:outline-none focus:border-primary-500"
                      >
                        <option value="TypeScript">TypeScript</option>
                        <option value="JavaScript">JavaScript</option>
                        <option value="Python">Python</option>
                        <option value="Java">Java</option>
                        <option value="C++">C++</option>
                      </select>
                    </div>
                  </div>

                  {aiError && (
                    <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                      <p className="text-sm text-red-400">{aiError}</p>
                    </div>
                  )}
                </div>
              )}

              {/* AI template selection */}
              {mode === 'ai-template' && (
                <div className="space-y-4">
                  <p className="text-dark-400 mb-4">
                    Select a category and AI will auto-generate a problem based on that theme.
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {aiTemplates.map((template) => (
                      <motion.button
                        key={template.id}
                        onClick={() => handleAIGenerate(template.prompt)}
                        disabled={isLoading}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="p-4 bg-dark-800/50 hover:bg-dark-800 rounded-xl border border-dark-700 hover:border-primary-500/50 text-left transition-all disabled:opacity-50"
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <div className="p-2 bg-primary-500/20 rounded-lg text-primary-400">
                            {template.icon}
                          </div>
                          <h4 className="font-medium text-dark-100">{template.name}</h4>
                        </div>
                        <p className="text-xs text-dark-500">{template.description}</p>
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {/* Library selection */}
              {mode === 'library' && (
                <div className="space-y-3">
                  <p className="text-dark-400 mb-4">
                    Select problems to add (multiple selection allowed)
                  </p>
                  {problemLibrary.map((problem, index) => (
                    <motion.button
                      key={index}
                      onClick={() => {
                        setSelectedLibraryProblems((prev) =>
                          prev.includes(index)
                            ? prev.filter((i) => i !== index)
                            : [...prev, index]
                        )
                      }}
                      whileTap={{ scale: 0.98 }}
                      className={`w-full p-4 rounded-xl border text-left transition-all ${
                        selectedLibraryProblems.includes(index)
                          ? 'bg-primary-500/20 border-primary-500/50'
                          : 'bg-dark-800/50 border-dark-700 hover:border-dark-600'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-dark-100">{problem.title}</h4>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          problem.difficulty === 'easy' ? 'bg-accent-green/20 text-accent-green' :
                          problem.difficulty === 'medium' ? 'bg-accent-yellow/20 text-accent-yellow' :
                          'bg-accent-red/20 text-accent-red'
                        }`}>
                          {problem.difficulty}
                        </span>
                      </div>
                      <p className="text-sm text-dark-500 line-clamp-2">{problem.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-dark-600">{problem.category}</span>
                        {problem.tags.slice(0, 2).map((tag) => (
                          <span key={tag} className="px-1.5 py-0.5 bg-dark-700/50 rounded text-xs text-dark-500">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </motion.button>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-dark-700 flex items-center justify-between">
              {mode !== 'select' && (
                <button
                  onClick={() => setMode('select')}
                  className="text-dark-400 hover:text-dark-200 transition-colors"
                >
                  Back
                </button>
              )}
              <div className="flex-1" />

              {mode === 'manual' && (
                <motion.button
                  onClick={handleManualSubmit}
                  disabled={!manualForm.title || !manualForm.description}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center gap-2 px-6 py-3 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white font-medium transition-colors"
                >
                  Create
                  <ChevronRight className="w-4 h-4" />
                </motion.button>
              )}

              {mode === 'ai-custom' && (
                <motion.button
                  onClick={() => handleAIGenerate(aiPrompt)}
                  disabled={!aiPrompt || isLoading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center gap-2 px-6 py-3 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white font-medium transition-colors"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Generate with AI
                    </>
                  )}
                </motion.button>
              )}

              {mode === 'library' && (
                <motion.button
                  onClick={handleAddLibraryProblems}
                  disabled={selectedLibraryProblems.length === 0}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center gap-2 px-6 py-3 bg-accent-green hover:bg-accent-green/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white font-medium transition-colors"
                >
                  Add {selectedLibraryProblems.length} problem(s)
                  <ChevronRight className="w-4 h-4" />
                </motion.button>
              )}
            </div>

            {/* Loading overlay */}
            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 bg-dark-900/80 backdrop-blur-sm flex items-center justify-center"
              >
                <div className="text-center">
                  <Loader2 className="w-12 h-12 text-primary-400 animate-spin mx-auto mb-4" />
                  <p className="text-dark-200 font-medium">AI is generating problem...</p>
                  <p className="text-sm text-dark-500 mt-1">Please wait</p>
                </div>
              </motion.div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )

  return createPortal(modalContent, document.body)
}
