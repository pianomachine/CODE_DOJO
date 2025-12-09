import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Volume2, X, BookOpen, Lightbulb, HelpCircle, CheckCircle } from 'lucide-react'
import type { BilingualSentence, VocabularyItem, ComprehensionQuestion } from '../types'

interface Props {
  content: string
  sentenceTranslations?: BilingualSentence[]
  vocabularyList?: VocabularyItem[]
  comprehensionQuestions?: ComprehensionQuestion[]
  className?: string
}

// Word Popup Component showing vocabulary details
interface WordPopupProps {
  vocabulary: VocabularyItem
  position: { x: number; y: number }
  onClose: () => void
}

function VocabularyPopup({ vocabulary, position, onClose }: WordPopupProps) {
  const popupRef = useRef<HTMLDivElement>(null)

  // Calculate popup position
  const [popupStyle, setPopupStyle] = useState<React.CSSProperties>({})

  useEffect(() => {
    const popupWidth = 380
    const popupMaxHeight = 400
    const padding = 16

    let left = position.x
    let top = position.y + 10

    if (left + popupWidth > window.innerWidth - padding) {
      left = window.innerWidth - popupWidth - padding
    }
    if (left < padding) {
      left = padding
    }
    if (top + popupMaxHeight > window.innerHeight - padding) {
      top = position.y - popupMaxHeight - 10
    }

    setPopupStyle({
      position: 'fixed',
      left: `${left}px`,
      top: `${top}px`,
      width: `${popupWidth}px`,
      maxHeight: `${popupMaxHeight}px`,
      zIndex: 10000,
    })
  }, [position])

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  // Text-to-speech
  const speak = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'en-US'
    speechSynthesis.speak(utterance)
  }

  return createPortal(
    <div
      ref={popupRef}
      style={popupStyle}
      className="bg-dark-900 border border-dark-600 rounded-xl shadow-2xl overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-dark-800 border-b border-dark-700">
        <div className="flex items-center gap-3">
          <span className="font-bold text-lg text-dark-100">{vocabulary.word}</span>
          <span className="text-dark-400 text-sm">{vocabulary.pronunciation}</span>
          <button
            onClick={() => speak(vocabulary.word)}
            className="p-1 hover:bg-dark-700 rounded transition-colors"
            title="発音を聞く"
          >
            <Volume2 className="w-4 h-4 text-primary-400" />
          </button>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-dark-700 rounded transition-colors"
        >
          <X className="w-4 h-4 text-dark-400" />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 overflow-y-auto" style={{ maxHeight: '340px' }}>
        <div className="space-y-4">
          {/* Part of speech & Meaning */}
          <div>
            <span className="text-xs font-medium text-primary-400 uppercase">
              {vocabulary.partOfSpeech}
            </span>
            <div className="mt-1 text-lg text-dark-100">{vocabulary.meaning}</div>
            <div className="mt-1 text-sm text-dark-400">{vocabulary.definition}</div>
          </div>

          {/* Example */}
          {vocabulary.exampleSentence && (
            <div>
              <div className="text-xs font-medium text-dark-500 uppercase mb-2">例文</div>
              <div className="pl-3 border-l-2 border-dark-700">
                <div className="text-sm text-dark-200">{vocabulary.exampleSentence}</div>
                <div className="text-xs text-dark-500 mt-1">{vocabulary.exampleTranslation}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}

// Sentence Component with hover translation
interface SentenceProps {
  sentence: BilingualSentence
  vocabularyList?: VocabularyItem[]
}

function TranslatableSentence({ sentence, vocabularyList = [] }: SentenceProps) {
  const [showTranslation, setShowTranslation] = useState(false)
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({})
  const [selectedVocab, setSelectedVocab] = useState<{ vocab: VocabularyItem; position: { x: number; y: number } } | null>(null)
  const spanRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (showTranslation && spanRef.current) {
      const rect = spanRef.current.getBoundingClientRect()
      const tooltipWidth = 350
      const padding = 16

      let left = rect.left
      let top = rect.top - 8

      if (left + tooltipWidth > window.innerWidth - padding) {
        left = window.innerWidth - tooltipWidth - padding
      }
      if (left < padding) {
        left = padding
      }

      setTooltipStyle({
        position: 'fixed',
        left: `${left}px`,
        top: `${top}px`,
        transform: 'translateY(-100%)',
        maxWidth: `${tooltipWidth}px`,
        zIndex: 9999,
      })
    }
  }, [showTranslation])

  const handleWordClick = (e: React.MouseEvent, word: string) => {
    e.stopPropagation()
    const cleanWord = word.replace(/[.,!?;:'"()[\]{}]/g, '').toLowerCase()
    const vocab = vocabularyList.find(v => v.word.toLowerCase() === cleanWord)
    if (vocab) {
      setSelectedVocab({ vocab, position: { x: e.clientX, y: e.clientY } })
    }
  }

  // Check if a word is in vocabulary list
  const isVocabWord = (word: string): boolean => {
    const cleanWord = word.replace(/[.,!?;:'"()[\]{}]/g, '').toLowerCase()
    return vocabularyList.some(v => v.word.toLowerCase() === cleanWord)
  }

  // Split sentence into words
  const words = sentence.en.split(/(\s+)/)

  return (
    <>
      <span
        ref={spanRef}
        className="relative inline hover:bg-sky-500/20 rounded px-0.5 transition-colors cursor-help"
        onMouseEnter={() => setShowTranslation(true)}
        onMouseLeave={() => setShowTranslation(false)}
      >
        {words.map((word, idx) => {
          const isVocab = isVocabWord(word)
          return (
            <span
              key={idx}
              onClick={(e) => isVocab && handleWordClick(e, word)}
              className={isVocab
                ? 'text-sky-300 underline decoration-dotted cursor-pointer hover:text-sky-200'
                : ''
              }
            >
              {word}
            </span>
          )
        })}
      </span>

      {/* Translation Tooltip */}
      {showTranslation && createPortal(
        <div
          style={tooltipStyle}
          className="px-4 py-3 bg-dark-800 border border-sky-500/30 rounded-lg shadow-xl pointer-events-none"
        >
          <div className="flex items-center gap-2 text-sky-400 text-xs font-medium mb-2">
            <BookOpen className="w-3 h-3" />
            日本語訳
          </div>
          <div className="text-dark-200 text-sm">{sentence.ja}</div>
        </div>,
        document.body
      )}

      {/* Vocabulary Popup */}
      {selectedVocab && (
        <VocabularyPopup
          vocabulary={selectedVocab.vocab}
          position={selectedVocab.position}
          onClose={() => setSelectedVocab(null)}
        />
      )}
    </>
  )
}

// Comprehension Questions Section
interface QuestionsProps {
  questions: ComprehensionQuestion[]
}

function ComprehensionQuestionsSection({ questions }: QuestionsProps) {
  const [showAnswers, setShowAnswers] = useState<Record<number, boolean>>({})

  const toggleAnswer = (index: number) => {
    setShowAnswers(prev => ({ ...prev, [index]: !prev[index] }))
  }

  return (
    <div className="mt-8 pt-6 border-t border-dark-700">
      <h3 className="flex items-center gap-2 text-lg font-semibold text-dark-200 mb-4">
        <HelpCircle className="w-5 h-5 text-accent-yellow" />
        Comprehension Questions
      </h3>
      <div className="space-y-4">
        {questions.map((q, idx) => (
          <div key={idx} className="p-4 bg-dark-800/50 rounded-lg">
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-dark-700 flex items-center justify-center text-sm text-dark-300">
                {idx + 1}
              </span>
              <div className="flex-1">
                <p className="text-dark-200">{q.question}</p>
                <p className="text-sm text-dark-500 mt-1">{q.questionJa}</p>

                <button
                  onClick={() => toggleAnswer(idx)}
                  className="mt-3 text-sm text-primary-400 hover:text-primary-300 transition-colors"
                >
                  {showAnswers[idx] ? '答えを隠す' : '答えを見る'}
                </button>

                {showAnswers[idx] && (
                  <div className="mt-3 p-3 bg-accent-green/10 border border-accent-green/30 rounded-lg">
                    <div className="flex items-center gap-2 text-accent-green text-xs font-medium mb-2">
                      <CheckCircle className="w-3 h-3" />
                      Answer
                    </div>
                    <p className="text-dark-200 text-sm">{q.answer}</p>
                    <p className="text-dark-500 text-xs mt-1">{q.answerJa}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Vocabulary List Section
interface VocabListProps {
  vocabulary: VocabularyItem[]
}

function VocabularyListSection({ vocabulary }: VocabListProps) {
  const speak = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'en-US'
    speechSynthesis.speak(utterance)
  }

  return (
    <div className="mt-8 pt-6 border-t border-dark-700">
      <h3 className="flex items-center gap-2 text-lg font-semibold text-dark-200 mb-4">
        <Lightbulb className="w-5 h-5 text-accent-yellow" />
        Key Vocabulary
      </h3>
      <div className="grid gap-3">
        {vocabulary.map((vocab, idx) => (
          <div key={idx} className="p-3 bg-dark-800/50 rounded-lg">
            <div className="flex items-center gap-3 mb-2">
              <button
                onClick={() => speak(vocab.word)}
                className="p-1 hover:bg-dark-700 rounded transition-colors"
              >
                <Volume2 className="w-4 h-4 text-primary-400" />
              </button>
              <span className="font-semibold text-dark-100">{vocab.word}</span>
              <span className="text-dark-500 text-sm">{vocab.pronunciation}</span>
              <span className="text-xs px-2 py-0.5 bg-dark-700 rounded text-dark-400">
                {vocab.partOfSpeech}
              </span>
            </div>
            <div className="ml-8">
              <p className="text-dark-200">{vocab.meaning}</p>
              <p className="text-sm text-dark-500">{vocab.definition}</p>
              {vocab.exampleSentence && (
                <p className="text-sm text-dark-400 mt-2 italic">
                  "{vocab.exampleSentence}"
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function EnglishContentViewer({
  content,
  sentenceTranslations = [],
  vocabularyList = [],
  comprehensionQuestions = [],
  className = ''
}: Props) {
  // If we have sentence translations, use them; otherwise fall back to plain text
  const hasSentenceData = sentenceTranslations.length > 0

  return (
    <div className={`leading-relaxed text-dark-200 ${className}`}>
      {/* Tip */}
      <div className="mb-4 p-3 bg-sky-500/10 border border-sky-500/30 rounded-lg">
        <p className="text-xs text-sky-400">
          <span className="font-medium">Tip:</span>
          {hasSentenceData
            ? ' 文にカーソルを合わせると日本語訳が表示されます。下線付きの単語をクリックすると詳細な解説が見られます。'
            : ' この問題には翻訳データがありません。'
          }
        </p>
      </div>

      {/* Main Content */}
      <div className="text-base leading-8">
        {hasSentenceData ? (
          sentenceTranslations.map((sentence, index) => (
            <TranslatableSentence
              key={index}
              sentence={sentence}
              vocabularyList={vocabularyList}
            />
          ))
        ) : (
          <p className="whitespace-pre-wrap">{content}</p>
        )}
      </div>

      {/* Vocabulary Section */}
      {vocabularyList.length > 0 && (
        <VocabularyListSection vocabulary={vocabularyList} />
      )}

      {/* Comprehension Questions Section */}
      {comprehensionQuestions.length > 0 && (
        <ComprehensionQuestionsSection questions={comprehensionQuestions} />
      )}
    </div>
  )
}
