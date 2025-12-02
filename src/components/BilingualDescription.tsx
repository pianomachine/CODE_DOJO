import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Loader2, Volume2, X } from 'lucide-react'
import type { BilingualSentence } from '../types'

interface Props {
  sentences: BilingualSentence[]
  className?: string
}

interface SentenceProps {
  sentence: BilingualSentence
}

// Dictionary API response types
interface DictionaryPhonetic {
  text?: string
  audio?: string
}

interface DictionaryDefinition {
  definition: string
  example?: string
}

interface DictionaryMeaning {
  partOfSpeech: string
  definitions: DictionaryDefinition[]
}

interface DictionaryEntry {
  word: string
  phonetic?: string
  phonetics?: DictionaryPhonetic[]
  meanings: DictionaryMeaning[]
}

// Word definition popup component
interface WordPopupProps {
  word: string
  position: { x: number; y: number }
  onClose: () => void
}

function WordDefinitionPopup({ word, position, onClose }: WordPopupProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [entry, setEntry] = useState<DictionaryEntry | null>(null)
  const popupRef = useRef<HTMLDivElement>(null)

  // Clean word (remove punctuation)
  const cleanWord = word.replace(/[.,!?;:'"()[\]{}]/g, '').toLowerCase()

  useEffect(() => {
    const fetchDefinition = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch(
          `https://api.dictionaryapi.dev/api/v2/entries/en/${cleanWord}`
        )

        if (!response.ok) {
          if (response.status === 404) {
            setError('Word not found')
          } else {
            setError('Failed to fetch definition')
          }
          return
        }

        const data = await response.json()
        if (data && data.length > 0) {
          setEntry(data[0])
        }
      } catch (err) {
        setError('Network error')
      } finally {
        setLoading(false)
      }
    }

    fetchDefinition()
  }, [cleanWord])

  // Calculate popup position
  const [popupStyle, setPopupStyle] = useState<React.CSSProperties>({})

  useEffect(() => {
    const popupWidth = 350
    const popupMaxHeight = 300
    const padding = 16

    let left = position.x
    let top = position.y + 10 // Below the click

    // Check right edge
    if (left + popupWidth > window.innerWidth - padding) {
      left = window.innerWidth - popupWidth - padding
    }

    // Check left edge
    if (left < padding) {
      left = padding
    }

    // Check bottom edge - if not enough space below, show above
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

  // Play pronunciation
  const playAudio = (audioUrl: string) => {
    const audio = new Audio(audioUrl)
    audio.play()
  }

  const audioUrl = entry?.phonetics?.find(p => p.audio)?.audio

  return createPortal(
    <div
      ref={popupRef}
      style={popupStyle}
      className="bg-dark-900 border border-dark-600 rounded-xl shadow-2xl overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-dark-800 border-b border-dark-700">
        <div className="flex items-center gap-2">
          <span className="font-bold text-dark-100">{cleanWord}</span>
          {entry?.phonetic && (
            <span className="text-dark-400 text-sm">{entry.phonetic}</span>
          )}
          {audioUrl && (
            <button
              onClick={() => playAudio(audioUrl)}
              className="p-1 hover:bg-dark-700 rounded transition-colors"
            >
              <Volume2 className="w-4 h-4 text-primary-400" />
            </button>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-dark-700 rounded transition-colors"
        >
          <X className="w-4 h-4 text-dark-400" />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 overflow-y-auto" style={{ maxHeight: '240px' }}>
        {loading && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-5 h-5 text-primary-400 animate-spin" />
            <span className="ml-2 text-dark-400">Looking up...</span>
          </div>
        )}

        {error && (
          <div className="text-center py-4 text-dark-400">
            {error}
          </div>
        )}

        {entry && !loading && (
          <div className="space-y-3">
            {entry.meanings.slice(0, 3).map((meaning, idx) => (
              <div key={idx}>
                <div className="text-xs font-medium text-primary-400 uppercase mb-1">
                  {meaning.partOfSpeech}
                </div>
                <ul className="space-y-1">
                  {meaning.definitions.slice(0, 2).map((def, defIdx) => (
                    <li key={defIdx} className="text-sm text-dark-200">
                      <span className="text-dark-500 mr-1">{defIdx + 1}.</span>
                      {def.definition}
                      {def.example && (
                        <div className="text-dark-400 text-xs mt-1 pl-3 border-l-2 border-dark-700">
                          "{def.example}"
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}

// Clickable word component
interface ClickableWordProps {
  word: string
}

function ClickableWord({ word }: ClickableWordProps) {
  const [showPopup, setShowPopup] = useState(false)
  const [clickPosition, setClickPosition] = useState({ x: 0, y: 0 })

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setClickPosition({ x: e.clientX, y: e.clientY })
    setShowPopup(true)
  }

  // Only make actual words clickable (not punctuation or numbers)
  const isWord = /[a-zA-Z]{2,}/.test(word)

  if (!isWord) {
    return <>{word}</>
  }

  return (
    <>
      <span
        onClick={handleClick}
        className="cursor-pointer hover:text-primary-300 hover:underline decoration-dotted underline-offset-2"
      >
        {word}
      </span>
      {showPopup && (
        <WordDefinitionPopup
          word={word}
          position={clickPosition}
          onClose={() => setShowPopup(false)}
        />
      )}
    </>
  )
}

function BilingualSentenceItem({ sentence }: SentenceProps) {
  const [showTranslation, setShowTranslation] = useState(false)
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({})
  const spanRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (showTranslation && spanRef.current) {
      const rect = spanRef.current.getBoundingClientRect()
      const tooltipWidth = 320 // max width of tooltip
      const padding = 16

      // Calculate position
      let left = rect.left
      let top = rect.top - 8 // 8px gap above the text

      // Check if tooltip would go off the right edge
      if (left + tooltipWidth > window.innerWidth - padding) {
        left = window.innerWidth - tooltipWidth - padding
      }

      // Check if tooltip would go off the left edge
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

  // Split sentence into words while preserving spaces and punctuation
  const words = sentence.en.split(/(\s+)/)

  return (
    <span
      ref={spanRef}
      className="relative inline hover:bg-primary-500/10 rounded px-0.5 transition-colors"
      onMouseEnter={() => setShowTranslation(true)}
      onMouseLeave={() => setShowTranslation(false)}
    >
      {words.map((word, idx) => (
        <ClickableWord key={idx} word={word} />
      ))}
      {showTranslation && createPortal(
        <div
          style={tooltipStyle}
          className="px-3 py-2 bg-dark-800 border border-dark-600 rounded-lg shadow-xl text-sm text-dark-200 pointer-events-none"
        >
          <div className="text-primary-400 font-medium text-xs mb-1">日本語</div>
          <div className="whitespace-pre-wrap break-words">{sentence.ja}</div>
        </div>,
        document.body
      )}
    </span>
  )
}

export function BilingualDescription({ sentences, className = '' }: Props) {
  return (
    <div className={`leading-relaxed ${className}`}>
      {sentences.map((sentence, index) => (
        <span key={index}>
          <BilingualSentenceItem sentence={sentence} />
          {index < sentences.length - 1 && ' '}
        </span>
      ))}
    </div>
  )
}

// Fallback component when no bilingual data is available
interface FallbackProps {
  description: string
  bilingualDescription?: BilingualSentence[]
  className?: string
}

export function DescriptionWithTranslation({ description, bilingualDescription, className = '' }: FallbackProps) {
  if (bilingualDescription && bilingualDescription.length > 0) {
    return <BilingualDescription sentences={bilingualDescription} className={className} />
  }

  // Fallback to plain description
  return (
    <p className={`whitespace-pre-wrap ${className}`}>
      {description}
    </p>
  )
}
