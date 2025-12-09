import { app, BrowserWindow, ipcMain, dialog } from 'electron'
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
  problemStyle?: 'competitive' | 'software-design' | 'english'
}) => {
  try {
    const { prompt, difficulty, language, category, problemStyle = 'competitive' } = params

    // Detect English study problems
    const promptLower = prompt.toLowerCase()
    const isEnglishProblem = promptLower.includes('english') ||
      promptLower.includes('reading comprehension') ||
      promptLower.includes('listening comprehension') ||
      promptLower.includes('speaking practice') ||
      promptLower.includes('writing exercise') ||
      promptLower.includes('writing task') ||
      (problemStyle === 'english')

    // English study prompt - Generate content with pre-translated sentences
    const englishStudyPrompt = `You are an English language content creator for Japanese learners. Create engaging English study materials WITH Japanese translations.

REQUIREMENTS:
1. Generate a passage/dialogue of 150-300 words
2. Include SENTENCE-BY-SENTENCE Japanese translations
3. Include vocabulary explanations for 5-8 key words
4. Include comprehension questions
5. Difficulty: ${difficulty} (easy=simple vocabulary, medium=intermediate, hard=advanced)

Return a JSON object:
{
  "title": "Engaging title",
  "description": "The English passage only (no translations here)",
  "difficulty": "${difficulty}",
  "category": "English",
  "tags": ["english", "reading"],
  "starterCode": "",
  "testCases": [],
  "sentenceTranslations": [
    {"en": "First English sentence.", "ja": "最初の文の日本語訳。"},
    {"en": "Second English sentence.", "ja": "2番目の文の日本語訳。"}
  ],
  "vocabularyList": [
    {
      "word": "example",
      "pronunciation": "/ɪɡˈzæmpəl/",
      "partOfSpeech": "noun",
      "meaning": "例、見本",
      "definition": "a thing characteristic of its kind",
      "exampleSentence": "This is a good example.",
      "exampleTranslation": "これは良い例です。"
    }
  ],
  "comprehensionQuestions": [
    {"question": "What is the main idea?", "questionJa": "主な考えは何ですか？", "answer": "The answer", "answerJa": "答えの日本語訳"}
  ]
}

CRITICAL RULES:
1. "description" contains ONLY the English passage (no Japanese, no questions)
2. "sentenceTranslations" must have EVERY sentence from the passage with its Japanese translation
3. Split the passage into natural sentences - one array item per sentence
4. "vocabularyList" should have 5-8 important words with full details
5. "comprehensionQuestions" should have 4-5 questions

Example passage split:
"The sun rose slowly over the mountains. Birds began to sing their morning songs. A gentle breeze rustled through the trees."

Should become:
"sentenceTranslations": [
  {"en": "The sun rose slowly over the mountains.", "ja": "太陽がゆっくりと山々の上に昇りました。"},
  {"en": "Birds began to sing their morning songs.", "ja": "鳥たちが朝の歌を歌い始めました。"},
  {"en": "A gentle breeze rustled through the trees.", "ja": "穏やかな風が木々の間をさらさらと吹き抜けました。"}
]

QUALITY:
- Natural, authentic English appropriate for ${difficulty} level
- Accurate, natural Japanese translations
- Engaging educational content`

    // Software Design mode prompt
    const softwareDesignPrompt = `You are a software design problem generator. Create problems that teach:
- TDD (Test-Driven Development)
- SOLID principles (Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion)
- Design Patterns (Factory, Observer, Strategy, Repository, etc.)
- Clean Architecture
- Separation of Concerns
- High Cohesion, Low Coupling

PROBLEM FORMAT FOR SOFTWARE DESIGN:
1. Present a scenario or existing code that needs improvement
2. Clearly state what principle/pattern to apply
3. Provide starter code that the user needs to refactor or extend
4. Test cases should verify the design works correctly

BILINGUAL DESCRIPTION (IMPORTANT):
- The "description" field should be in English
- You MUST also provide "bilingualDescription" which is an array of sentence pairs
- Each sentence in English should have a corresponding Japanese translation

Return a JSON object with this structure:
{
  "title": "Descriptive title (e.g., 'Refactor to Single Responsibility Principle')",
  "description": "Complete problem description explaining the scenario, what's wrong with current code, and what to achieve",
  "bilingualDescription": [
    {"en": "Sentence in English.", "ja": "日本語訳。"}
  ],
  "difficulty": "${difficulty}",
  "category": "Software Design",
  "tags": ["tdd", "solid", "design-pattern", "refactoring"],
  "starterCode": "Code to refactor or extend - should be a complete, runnable file",
  "testCases": [
    {
      "input": "Test scenario description or function call",
      "expectedOutput": "Expected behavior or output",
      "description": "What this test verifies"
    }
  ]
}

STARTER CODE FORMAT FOR SOFTWARE DESIGN:
- Provide COMPLETE, runnable code (not stdin/stdout style)
- Include the problematic code that needs refactoring, OR
- Include interfaces/base classes that need implementation
- Add clear comments like "// TODO: Refactor this class" or "// Implement this method"

Example for ${language}:
\`\`\`
// Current code violates Single Responsibility Principle
// TODO: Refactor into separate classes

class UserService {
    // This class does too much - handles user data, validation, AND email sending

    saveUser(user) {
        // validate
        // save to db
        // send welcome email
    }
}

// Your task: Split this into UserValidator, UserRepository, and EmailService
\`\`\`

TEST CASES FOR SOFTWARE DESIGN:
- Test cases should describe behavior, not stdin/stdout
- Example: input: "UserService.saveUser(validUser)", expectedOutput: "User saved and email sent"
- Focus on verifying the design meets requirements

IMPORTANT:
- The problem should teach a specific software design concept
- Include "before" code that has issues
- Clearly explain what needs to be improved
- Test cases verify the refactored code works correctly`

    // Competitive Programming mode prompt
    const competitivePrompt = `You are a coding problem parser and generator. Your task is to either:
1. Parse an existing problem statement (from competitive programming sites like AtCoder, LeetCode, Codeforces, etc.)
2. Generate a new problem based on a description

IMPORTANT: The user may paste a raw problem statement directly. In that case:
- Extract the title from the problem (or create a concise one)
- Rewrite the description clearly in your own words
- Extract ALL test cases from the input/output examples
- Create appropriate starter code for the specified language

CRITICAL QUALITY REQUIREMENTS:
- NEVER use placeholder text like "This is a placeholder" or "The actual problem..."
- NEVER generate incomplete or vague descriptions
- The description MUST be a complete, specific problem statement
- You MUST include at least 2 test cases with concrete input/output values
- If the user's input is unclear, create a COMPLETE problem based on your best interpretation

CRITICAL - Test case input/output formatting:
- You MUST preserve the EXACT line structure from the original problem's input/output examples
- Look at the original "入力例" / "Input Example" / "Sample Input" sections carefully
- Each line in the original input = one line in your output, separated by \\n

EXAMPLE - If the original problem shows:
  入力例1
  3 4
  1 1 2 1
  2 1 1 2
  2 1 1 2
  出力例1
  6

Then your testCase MUST be: {"input": "3 4\\n1 1 2 1\\n2 1 1 2\\n2 1 1 2", "expectedOutput": "6"}

WRONG formats (DO NOT DO THIS):
- "3 4 1 1 2 1 2 1 1 2 2 1 1 2" (all on one line - WRONG)
- "3 4 1 1 2 1 2 1 1 2\\n2 1 1 2" (random line breaks - WRONG)
- Breaking lines at arbitrary positions based on display width - WRONG

The number of \\n in your input should match (number of lines in original input - 1)

BILINGUAL DESCRIPTION (IMPORTANT):
- The "description" field should be in English
- You MUST also provide "bilingualDescription" which is an array of sentence pairs
- Each sentence in English should have a corresponding Japanese translation
- Split the description into logical sentences/paragraphs for easier reading
- The bilingualDescription MUST have at least 5 sentence pairs for a complete problem

Return a JSON object with the following structure:
{
  "title": "Concise problem title (NOT 'Placeholder' or generic names)",
  "description": "Complete problem description in English. MUST include: 1) Problem statement 2) Input format 3) Output format 4) Constraints. Minimum 100 characters.",
  "bilingualDescription": [
    {"en": "Problem statement sentence.", "ja": "問題文の日本語訳。"},
    {"en": "More details about the problem.", "ja": "問題の詳細説明。"},
    {"en": "Input Format:", "ja": "入力形式:"},
    {"en": "The first line contains N.", "ja": "最初の行にNが含まれます。"},
    {"en": "Output Format:", "ja": "出力形式:"},
    {"en": "Print the answer.", "ja": "答えを出力してください。"}
  ],
  "difficulty": "${difficulty}",
  "category": "${category || 'Algorithm'}",
  "tags": ["relevant", "algorithm", "tags"],
  "starterCode": "Starter code template in ${language} with proper input parsing",
  "testCases": [
    {
      "input": "Line1\\nLine2\\nLine3",
      "expectedOutput": "Expected output (MUST be concrete value, not placeholder)",
      "description": "Brief description of this test case"
    }
  ]
}

EXAMPLES of correct test case formatting:
- Grid input: {"input": "3 4\\n1 1 2 1\\n2 1 1 2\\n2 1 1 2", "expectedOutput": "6"}
- Array input: {"input": "5\\n1 2 3 4 5", "expectedOutput": "15"}
- Single line: {"input": "hello world", "expectedOutput": "dlrow olleh"}

STARTER CODE FORMAT - USE STDIN/STDOUT STYLE FOR ALL LANGUAGES!

All starter code must use stdin/stdout format (competitive programming style).
This ensures consistency between test case input and code execution.

TEST CASE INPUT FORMAT:
- Always use raw stdin format with \\n for line breaks
- Example: "3\\n1 2 3\\n4 5 6\\n7 8 9" (3 rows of numbers)
- Example: "5\\n1 2 3 4 5" (N followed by array)
- Example: "hello world" (simple string input)

STARTER CODE BY LANGUAGE:

Python:
\`\`\`python
N = int(input())
A = list(map(int, input().split()))

# Write your solution here

print(ans)
\`\`\`

For 2D grid/matrix:
\`\`\`python
N = int(input())
grid = []
for _ in range(N):
    row = list(map(int, input().split()))
    grid.append(row)

# Write your solution here

print(ans)
\`\`\`

TypeScript:
\`\`\`typescript
import * as readline from 'readline';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const lines: string[] = [];
rl.on('line', (line) => lines.push(line));
rl.on('close', () => {
    const N = parseInt(lines[0]);
    const A = lines[1].split(' ').map(Number);

    // Write your solution here

    console.log(ans);
});
\`\`\`

C++:
\`\`\`cpp
#include <bits/stdc++.h>
using namespace std;

int main() {
    int N;
    cin >> N;
    vector<int> A(N);
    for (int i = 0; i < N; i++) cin >> A[i];

    // Write your solution here

    cout << ans << endl;
    return 0;
}
\`\`\`

Java:
\`\`\`java
import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int N = sc.nextInt();
        int[] A = new int[N];
        for (int i = 0; i < N; i++) A[i] = sc.nextInt();

        // Write your solution here

        System.out.println(ans);
    }
}
\`\`\`

IMPORTANT RULES:
1. Test case input MUST match what the starter code expects to read
2. Starter code must include ALL input parsing (reading N, arrays, grids, etc.)
3. Leave a clear "// Write your solution here" comment where user writes logic
4. Include the print/cout statement at the end
5. For complex inputs (grids, multiple arrays), parse ALL of them in starter code

VALIDATION CHECKLIST (your response MUST pass all):
✓ title is specific and descriptive (not "Placeholder" or "Problem")
✓ description is at least 100 characters with complete problem statement
✓ bilingualDescription has at least 5 sentence pairs
✓ testCases has at least 2 test cases with concrete values
✓ starterCode includes proper input parsing for the language
✓ No placeholder text anywhere in the response`

    // Select prompt based on problem style
    let systemPrompt: string
    if (isEnglishProblem) {
      systemPrompt = englishStudyPrompt
    } else if (problemStyle === 'software-design') {
      systemPrompt = softwareDesignPrompt
    } else {
      systemPrompt = competitivePrompt
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
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

// AI Translation Handler for English Study
ipcMain.handle('translate-sentence', async (_event, params: {
  sentence: string
  context?: string
}) => {
  try {
    const { sentence, context } = params

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a helpful English-Japanese translator for Japanese learners.
Translate the given English sentence to natural Japanese.
Also provide a brief grammar explanation if there's anything notable.

Return JSON: {"translation": "日本語訳", "grammar": "文法説明（任意）"}`
        },
        {
          role: 'user',
          content: context
            ? `Context: ${context}\n\nTranslate: "${sentence}"`
            : `Translate: "${sentence}"`
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    })

    const content = completion.choices[0]?.message?.content
    if (!content) {
      throw new Error('No response from OpenAI')
    }

    return { success: true, data: JSON.parse(content) }
  } catch (error) {
    console.error('Translation error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Translation failed'
    }
  }
})

// AI Word Explanation Handler for English Study
ipcMain.handle('explain-word', async (_event, params: {
  word: string
  sentence?: string
}) => {
  try {
    const { word, sentence } = params

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an English vocabulary teacher for Japanese learners.
Explain the given English word in detail for a Japanese learner.

Return JSON:
{
  "word": "the word",
  "pronunciation": "発音記号",
  "partOfSpeech": "品詞",
  "meaning": "日本語の意味",
  "definition": "English definition",
  "contextMeaning": "この文脈での意味（文が提供された場合）",
  "examples": [
    {"en": "Example sentence", "ja": "例文の日本語訳"}
  ],
  "synonyms": ["similar words"],
  "tips": "覚え方や使い方のコツ"
}`
        },
        {
          role: 'user',
          content: sentence
            ? `Word: "${word}"\nUsed in: "${sentence}"`
            : `Word: "${word}"`
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    })

    const content = completion.choices[0]?.message?.content
    if (!content) {
      throw new Error('No response from OpenAI')
    }

    return { success: true, data: JSON.parse(content) }
  } catch (error) {
    console.error('Word explanation error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Explanation failed'
    }
  }
})

// Process custom English text - generate translations and questions
ipcMain.handle('process-custom-english-text', async (_event, params: {
  text: string
  title: string
  difficulty: 'easy' | 'medium' | 'hard'
}) => {
  try {
    const { text, title, difficulty } = params

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an English language teacher for Japanese learners.
Given an English text, create comprehensive study materials including sentence-by-sentence translations, vocabulary, and comprehension questions.

Return a JSON object with this structure:
{
  "sentenceTranslations": [
    {"en": "First sentence from the text.", "ja": "最初の文の日本語訳。"},
    {"en": "Second sentence.", "ja": "2番目の文の訳。"}
  ],
  "vocabularyList": [
    {
      "word": "important word",
      "pronunciation": "/prəˌnʌnsiˈeɪʃən/",
      "partOfSpeech": "noun/verb/adjective/etc",
      "meaning": "日本語の意味",
      "definition": "English definition",
      "exampleSentence": "Example using the word.",
      "exampleTranslation": "例文の日本語訳"
    }
  ],
  "comprehensionQuestions": [
    {
      "question": "Question about the text?",
      "questionJa": "質問の日本語訳",
      "answer": "The answer",
      "answerJa": "答えの日本語訳"
    }
  ]
}

CRITICAL RULES:
1. Split the ENTIRE text into sentences - every sentence must be in sentenceTranslations
2. Include 5-8 important vocabulary words
3. Include 4-5 comprehension questions
4. Translations should be natural Japanese
5. Difficulty level: ${difficulty} (easy=simple explanations, medium=intermediate, hard=advanced)`
        },
        {
          role: 'user',
          content: `Process this English text:\n\n${text}`
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    })

    const content = completion.choices[0]?.message?.content
    if (!content) {
      throw new Error('No response from OpenAI')
    }

    return { success: true, data: JSON.parse(content) }
  } catch (error) {
    console.error('Custom text processing error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Processing failed'
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

// ============================================
// File System Handlers for Workspace
// ============================================

// Open folder dialog
ipcMain.handle('open-folder-dialog', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openDirectory']
  })

  if (result.canceled || result.filePaths.length === 0) {
    return { success: false, path: null }
  }

  return { success: true, path: result.filePaths[0] }
})

// Read directory contents
interface FileEntry {
  path: string
  name: string
  isDirectory: boolean
  children?: FileEntry[]
}

ipcMain.handle('read-directory', async (_event, dirPath: string): Promise<FileEntry[]> => {
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true })

    // Filter out hidden files and common ignored directories
    const ignoredNames = ['.git', 'node_modules', '.DS_Store', 'Thumbs.db', '.idea', '.vscode', '__pycache__', '.next', 'dist', 'build']

    const result: FileEntry[] = entries
      .filter(entry => !entry.name.startsWith('.') || entry.name === '.env.example')
      .filter(entry => !ignoredNames.includes(entry.name))
      .map(entry => ({
        path: path.join(dirPath, entry.name),
        name: entry.name,
        isDirectory: entry.isDirectory(),
      }))
      .sort((a, b) => {
        // Directories first, then files
        if (a.isDirectory && !b.isDirectory) return -1
        if (!a.isDirectory && b.isDirectory) return 1
        return a.name.localeCompare(b.name)
      })

    return result
  } catch (error) {
    console.error('Error reading directory:', error)
    return []
  }
})

// Read file contents
ipcMain.handle('read-file', async (_event, filePath: string): Promise<{ success: boolean; content?: string; error?: string }> => {
  try {
    const content = fs.readFileSync(filePath, 'utf-8')
    return { success: true, content }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to read file' }
  }
})

// Write file contents
ipcMain.handle('write-file', async (_event, filePath: string, content: string): Promise<{ success: boolean; error?: string }> => {
  try {
    fs.writeFileSync(filePath, content, 'utf-8')
    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to write file' }
  }
})

// Get file language based on extension
function getLanguageFromPath(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase()
  const langMap: Record<string, string> = {
    '.js': 'javascript',
    '.jsx': 'javascript',
    '.ts': 'typescript',
    '.tsx': 'typescript',
    '.py': 'python',
    '.cpp': 'cpp',
    '.c': 'c',
    '.h': 'cpp',
    '.hpp': 'cpp',
    '.java': 'java',
    '.go': 'go',
    '.rs': 'rust',
    '.json': 'json',
    '.html': 'html',
    '.css': 'css',
    '.scss': 'scss',
    '.md': 'markdown',
    '.yaml': 'yaml',
    '.yml': 'yaml',
    '.xml': 'xml',
    '.sql': 'sql',
    '.sh': 'shell',
    '.bash': 'shell',
    '.zsh': 'shell',
    '.ps1': 'powershell',
    '.rb': 'ruby',
    '.php': 'php',
    '.swift': 'swift',
    '.kt': 'kotlin',
    '.dart': 'dart',
    '.vue': 'vue',
    '.svelte': 'svelte',
  }
  return langMap[ext] || 'plaintext'
}

ipcMain.handle('get-file-language', async (_event, filePath: string): Promise<string> => {
  return getLanguageFromPath(filePath)
})
