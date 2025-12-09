import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Plus, Check, Trash2, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Twitter, Instagram, Youtube, Video, MoreHorizontal, Clock } from 'lucide-react'
import { useAppStore } from '../store/appStore'
import type { SNSPlatform } from '../types'

const DAYS_JP = ['日', '月', '火', '水', '木', '金', '土']

// Time slots for SNS posting (common posting times)
const TIME_SLOTS = ['07:00', '09:00', '12:00', '15:00', '18:00', '21:00']

const PLATFORM_CONFIG: Record<SNSPlatform, { icon: React.ReactNode; color: string; label: string }> = {
  twitter: { icon: <Twitter className="w-3 h-3" />, color: 'bg-sky-500', label: 'X' },
  instagram: { icon: <Instagram className="w-3 h-3" />, color: 'bg-pink-500', label: 'IG' },
  youtube: { icon: <Youtube className="w-3 h-3" />, color: 'bg-red-500', label: 'YT' },
  tiktok: { icon: <Video className="w-3 h-3" />, color: 'bg-purple-500', label: 'TT' },
  other: { icon: <MoreHorizontal className="w-3 h-3" />, color: 'bg-gray-500', label: '他' },
}

function getWeekDates(baseDate: Date): Date[] {
  const dates: Date[] = []
  const day = baseDate.getDay()
  const monday = new Date(baseDate)
  monday.setDate(baseDate.getDate() - day + (day === 0 ? -6 : 1))

  for (let i = 0; i < 7; i++) {
    const date = new Date(monday)
    date.setDate(monday.getDate() + i)
    dates.push(date)
  }
  return dates
}

function formatDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatDateDisplay(date: Date): string {
  return `${date.getMonth() + 1}/${date.getDate()}`
}

export function ScheduleView() {
  const {
    scheduleTasks, addScheduleTask, toggleScheduleTask, deleteScheduleTask, updateScheduleTask, reorderScheduleTask,
    snsPosts, addSNSPost, toggleSNSPost, deleteSNSPost, updateSNSPost
  } = useAppStore()
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const now = new Date()
    const day = now.getDay()
    const monday = new Date(now)
    monday.setDate(now.getDate() - day + (day === 0 ? -6 : 1))
    return monday
  })
  const [newTaskInputs, setNewTaskInputs] = useState<Record<string, string>>({})
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [editingContent, setEditingContent] = useState('')
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null)
  const [dragOverDateKey, setDragOverDateKey] = useState<string | null>(null)

  // SNS Post modal state
  const [showSNSModal, setShowSNSModal] = useState(false)
  const [snsModalDate, setSNSModalDate] = useState('')
  const [snsModalTime, setSNSModalTime] = useState('12:00')
  const [snsModalPlatform, setSNSModalPlatform] = useState<SNSPlatform>('twitter')
  const [snsModalContent, setSNSModalContent] = useState('')
  const [editingSNSPost, setEditingSNSPost] = useState<string | null>(null)

  const weekDates = useMemo(() => getWeekDates(currentWeekStart), [currentWeekStart])

  const today = formatDateKey(new Date())

  const goToPreviousWeek = () => {
    const newStart = new Date(currentWeekStart)
    newStart.setDate(currentWeekStart.getDate() - 7)
    setCurrentWeekStart(newStart)
  }

  const goToNextWeek = () => {
    const newStart = new Date(currentWeekStart)
    newStart.setDate(currentWeekStart.getDate() + 7)
    setCurrentWeekStart(newStart)
  }

  const goToCurrentWeek = () => {
    const now = new Date()
    const day = now.getDay()
    const monday = new Date(now)
    monday.setDate(now.getDate() - day + (day === 0 ? -6 : 1))
    setCurrentWeekStart(monday)
  }

  const handleAddTask = (dateKey: string) => {
    const content = newTaskInputs[dateKey]?.trim()
    if (content) {
      addScheduleTask(content, dateKey)
      setNewTaskInputs((prev) => ({ ...prev, [dateKey]: '' }))
    }
  }

  const handleStartEdit = (taskId: string, content: string) => {
    setEditingTaskId(taskId)
    setEditingContent(content)
  }

  const handleSaveEdit = (taskId: string) => {
    if (editingContent.trim()) {
      updateScheduleTask(taskId, { content: editingContent.trim() })
    }
    setEditingTaskId(null)
    setEditingContent('')
  }

  const getTasksForDate = (dateKey: string) => {
    return scheduleTasks
      .filter((task) => task.date === dateKey)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  }

  const getSNSPostsForDate = (dateKey: string) => {
    return snsPosts
      .filter((post) => post.date === dateKey)
      .sort((a, b) => a.time.localeCompare(b.time))
  }

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', taskId)
  }

  const handleDragEnd = () => {
    setDraggedTaskId(null)
    setDragOverDateKey(null)
  }

  const handleDragOver = (e: React.DragEvent, dateKey: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverDateKey(dateKey)
  }

  const handleDragLeave = () => {
    setDragOverDateKey(null)
  }

  const handleDrop = (e: React.DragEvent, targetDateKey: string) => {
    e.preventDefault()
    const taskId = e.dataTransfer.getData('text/plain')

    if (taskId) {
      const task = scheduleTasks.find((t) => t.id === taskId)
      if (task && task.date !== targetDateKey) {
        updateScheduleTask(taskId, { date: targetDateKey })
      }
    }

    setDraggedTaskId(null)
    setDragOverDateKey(null)
  }

  const weekNumber = useMemo(() => {
    const startOfYear = new Date(currentWeekStart.getFullYear(), 0, 1)
    const days = Math.floor((currentWeekStart.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000))
    return Math.ceil((days + startOfYear.getDay() + 1) / 7)
  }, [currentWeekStart])

  // SNS Modal handlers
  const openSNSModal = (dateKey: string, time?: string) => {
    setSNSModalDate(dateKey)
    setSNSModalTime(time || '12:00')
    setSNSModalPlatform('twitter')
    setSNSModalContent('')
    setEditingSNSPost(null)
    setShowSNSModal(true)
  }

  const openEditSNSModal = (postId: string) => {
    const post = snsPosts.find(p => p.id === postId)
    if (post) {
      setSNSModalDate(post.date)
      setSNSModalTime(post.time)
      setSNSModalPlatform(post.platform)
      setSNSModalContent(post.content)
      setEditingSNSPost(postId)
      setShowSNSModal(true)
    }
  }

  const handleSNSSubmit = () => {
    if (!snsModalContent.trim()) return

    if (editingSNSPost) {
      updateSNSPost(editingSNSPost, {
        content: snsModalContent.trim(),
        platform: snsModalPlatform,
        time: snsModalTime,
      })
    } else {
      addSNSPost(snsModalContent.trim(), snsModalPlatform, snsModalDate, snsModalTime)
    }
    setShowSNSModal(false)
  }

  return (
    <div className="h-full flex flex-col p-6 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-dark-100">Schedule</h1>
          <p className="text-dark-500 text-sm mt-1">
            {currentWeekStart.getFullYear()}年 第{weekNumber}週
          </p>
        </div>
        <div className="flex items-center gap-2">
          <motion.button
            onClick={goToPreviousWeek}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 bg-dark-800 hover:bg-dark-700 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-dark-300" />
          </motion.button>
          <motion.button
            onClick={goToCurrentWeek}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-4 py-2 bg-dark-800 hover:bg-dark-700 rounded-lg text-sm text-dark-300 transition-colors"
          >
            Today
          </motion.button>
          <motion.button
            onClick={goToNextWeek}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 bg-dark-800 hover:bg-dark-700 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-dark-300" />
          </motion.button>
        </div>
      </div>

      {/* Main Content - Split into Tasks and SNS */}
      <div className="flex-1 flex flex-col gap-4 min-h-0 overflow-hidden">
        {/* Tasks Section */}
        <div className="flex-1 min-h-0">
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-sm font-medium text-dark-400">Tasks</h2>
          </div>
          <div className="h-[calc(100%-24px)] grid grid-cols-7 gap-2">
            {weekDates.map((date, index) => {
              const dateKey = formatDateKey(date)
              const tasks = getTasksForDate(dateKey)
              const isToday = dateKey === today
              const isWeekend = index >= 5
              const isDragOver = dragOverDateKey === dateKey

              return (
                <div
                  key={dateKey}
                  onDragOver={(e) => handleDragOver(e, dateKey)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, dateKey)}
                  className={`flex flex-col rounded-lg border transition-all ${
                    isDragOver
                      ? 'border-primary-500 bg-primary-500/10'
                      : isToday
                      ? 'border-primary-500/50 bg-primary-500/5'
                      : isWeekend
                      ? 'border-dark-700/30 bg-dark-900/30'
                      : 'border-dark-700/50 bg-dark-800/30'
                  }`}
                >
                  {/* Day Header */}
                  <div className={`px-2 py-1 border-b ${isToday ? 'border-primary-500/30' : 'border-dark-700/50'}`}>
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-medium ${
                        index === 0 ? 'text-red-400' : index === 6 ? 'text-blue-400' : isWeekend ? 'text-dark-500' : 'text-dark-400'
                      }`}>
                        {DAYS_JP[date.getDay()]}
                      </span>
                      <span className={`text-sm font-bold ${isToday ? 'text-primary-400' : 'text-dark-200'}`}>
                        {formatDateDisplay(date)}
                      </span>
                    </div>
                  </div>

                  {/* Tasks */}
                  <div className="flex-1 p-1 overflow-y-auto space-y-0.5">
                    {tasks.map((task, taskIndex) => (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        draggable={editingTaskId !== task.id}
                        onDragStart={(e) => handleDragStart(e as unknown as React.DragEvent, task.id)}
                        onDragEnd={handleDragEnd}
                        className={`group flex items-start gap-0.5 p-1 rounded cursor-grab active:cursor-grabbing ${
                          task.completed ? 'bg-dark-800/50' : 'bg-dark-700/50 hover:bg-dark-700'
                        } ${draggedTaskId === task.id ? 'opacity-50' : ''} transition-colors`}
                      >
                        <div className="flex-shrink-0 flex flex-col opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => reorderScheduleTask(task.id, 'up')}
                            disabled={taskIndex === 0}
                            className={`p-0.5 rounded hover:bg-dark-600 ${taskIndex === 0 ? 'opacity-30' : ''}`}
                          >
                            <ChevronUp className="w-2.5 h-2.5 text-dark-400" />
                          </button>
                          <button
                            onClick={() => reorderScheduleTask(task.id, 'down')}
                            disabled={taskIndex === tasks.length - 1}
                            className={`p-0.5 rounded hover:bg-dark-600 ${taskIndex === tasks.length - 1 ? 'opacity-30' : ''}`}
                          >
                            <ChevronDown className="w-2.5 h-2.5 text-dark-400" />
                          </button>
                        </div>

                        <button
                          onClick={() => toggleScheduleTask(task.id)}
                          className={`flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                            task.completed ? 'bg-accent-green border-accent-green' : 'border-dark-500 hover:border-primary-500'
                          }`}
                        >
                          {task.completed && <Check className="w-2.5 h-2.5 text-white" />}
                        </button>

                        {editingTaskId === task.id ? (
                          <input
                            type="text"
                            value={editingContent}
                            onChange={(e) => setEditingContent(e.target.value)}
                            onBlur={() => handleSaveEdit(task.id)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveEdit(task.id)
                              if (e.key === 'Escape') setEditingTaskId(null)
                            }}
                            className="flex-1 bg-dark-800 border border-dark-600 rounded px-1 py-0 text-xs text-dark-200 focus:outline-none focus:border-primary-500"
                            autoFocus
                          />
                        ) : (
                          <span
                            onClick={() => handleStartEdit(task.id, task.content)}
                            className={`flex-1 text-xs cursor-pointer truncate ${
                              task.completed ? 'text-dark-500 line-through' : 'text-dark-200'
                            }`}
                          >
                            {task.content}
                          </span>
                        )}

                        <button
                          onClick={() => deleteScheduleTask(task.id)}
                          className="flex-shrink-0 opacity-0 group-hover:opacity-100 p-0.5 hover:bg-red-500/20 rounded"
                        >
                          <Trash2 className="w-2.5 h-2.5 text-red-400" />
                        </button>
                      </motion.div>
                    ))}
                  </div>

                  {/* Add Task Input */}
                  <div className="p-1 border-t border-dark-700/30">
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        value={newTaskInputs[dateKey] || ''}
                        onChange={(e) => setNewTaskInputs((prev) => ({ ...prev, [dateKey]: e.target.value }))}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleAddTask(dateKey) }}
                        placeholder="+"
                        className="flex-1 min-w-0 bg-transparent text-xs text-dark-300 placeholder-dark-600 focus:outline-none"
                      />
                      <button onClick={() => handleAddTask(dateKey)} className="p-0.5 hover:bg-dark-700 rounded">
                        <Plus className="w-3 h-3 text-dark-500" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* SNS Posts Section - Time-based */}
        <div className="h-48 min-h-[180px] border-t border-dark-700 pt-3">
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-sm font-medium text-dark-400">SNS Posts</h2>
            <div className="flex gap-1">
              {Object.entries(PLATFORM_CONFIG).map(([key, config]) => (
                <span key={key} className={`${config.color} w-4 h-4 rounded flex items-center justify-center text-white`}>
                  {config.icon}
                </span>
              ))}
            </div>
          </div>

          {/* Time-based grid */}
          <div className="h-[calc(100%-32px)] flex">
            {/* Time labels */}
            <div className="w-12 flex flex-col pt-6">
              {TIME_SLOTS.map((time) => (
                <div key={time} className="flex-1 flex items-start">
                  <span className="text-xs text-dark-500">{time}</span>
                </div>
              ))}
            </div>

            {/* Days grid */}
            <div className="flex-1 grid grid-cols-7 gap-1">
              {weekDates.map((date, index) => {
                const dateKey = formatDateKey(date)
                const posts = getSNSPostsForDate(dateKey)
                const isToday = dateKey === today

                return (
                  <div
                    key={dateKey}
                    className={`flex flex-col rounded border ${
                      isToday ? 'border-primary-500/30 bg-primary-500/5' : 'border-dark-700/30 bg-dark-800/20'
                    }`}
                  >
                    {/* Day header */}
                    <div className="px-1 py-0.5 border-b border-dark-700/30 text-center">
                      <span className={`text-xs font-medium ${
                        index === 0 ? 'text-red-400' : index === 6 ? 'text-blue-400' : 'text-dark-400'
                      }`}>
                        {DAYS_JP[date.getDay()]}
                      </span>
                    </div>

                    {/* Time slots */}
                    <div className="flex-1 flex flex-col">
                      {TIME_SLOTS.map((time) => {
                        const postsAtTime = posts.filter(p => p.time === time)
                        return (
                          <div
                            key={time}
                            onClick={() => openSNSModal(dateKey, time)}
                            className="flex-1 border-b border-dark-700/20 last:border-b-0 p-0.5 cursor-pointer hover:bg-dark-700/30 transition-colors min-h-[20px]"
                          >
                            {postsAtTime.map((post) => (
                              <div
                                key={post.id}
                                onClick={(e) => { e.stopPropagation(); openEditSNSModal(post.id) }}
                                className={`group flex items-center gap-0.5 px-1 py-0.5 rounded text-xs ${
                                  post.completed ? 'opacity-50' : ''
                                } ${PLATFORM_CONFIG[post.platform].color} bg-opacity-20 hover:bg-opacity-40`}
                              >
                                <span className={`w-3 h-3 rounded flex items-center justify-center ${PLATFORM_CONFIG[post.platform].color} text-white`}>
                                  {PLATFORM_CONFIG[post.platform].icon}
                                </span>
                                <span className="flex-1 truncate text-dark-200">{post.content}</span>
                                <button
                                  onClick={(e) => { e.stopPropagation(); toggleSNSPost(post.id) }}
                                  className={`w-3 h-3 rounded border flex items-center justify-center ${
                                    post.completed ? 'bg-accent-green border-accent-green' : 'border-dark-400'
                                  }`}
                                >
                                  {post.completed && <Check className="w-2 h-2 text-white" />}
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); deleteSNSPost(post.id) }}
                                  className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-red-500/20 rounded"
                                >
                                  <Trash2 className="w-2.5 h-2.5 text-red-400" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* SNS Post Modal */}
      {showSNSModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowSNSModal(false)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-dark-800 rounded-xl p-4 w-96 border border-dark-700"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-medium text-dark-100 mb-4">
              {editingSNSPost ? 'Edit SNS Post' : 'New SNS Post'}
            </h3>

            {/* Platform selection */}
            <div className="mb-4">
              <label className="text-xs text-dark-400 mb-2 block">Platform</label>
              <div className="flex gap-2">
                {(Object.keys(PLATFORM_CONFIG) as SNSPlatform[]).map((platform) => (
                  <button
                    key={platform}
                    onClick={() => setSNSModalPlatform(platform)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border transition-all ${
                      snsModalPlatform === platform
                        ? `${PLATFORM_CONFIG[platform].color} border-transparent text-white`
                        : 'border-dark-600 text-dark-400 hover:border-dark-500'
                    }`}
                  >
                    {PLATFORM_CONFIG[platform].icon}
                    <span className="text-sm">{PLATFORM_CONFIG[platform].label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Time selection */}
            <div className="mb-4">
              <label className="text-xs text-dark-400 mb-2 block">Time</label>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-dark-500" />
                <input
                  type="time"
                  value={snsModalTime}
                  onChange={(e) => setSNSModalTime(e.target.value)}
                  className="bg-dark-700 border border-dark-600 rounded px-3 py-1.5 text-dark-200 focus:outline-none focus:border-primary-500"
                />
              </div>
            </div>

            {/* Content */}
            <div className="mb-4">
              <label className="text-xs text-dark-400 mb-2 block">Content</label>
              <textarea
                value={snsModalContent}
                onChange={(e) => setSNSModalContent(e.target.value)}
                placeholder="What to post..."
                rows={3}
                className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-dark-200 focus:outline-none focus:border-primary-500 resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowSNSModal(false)}
                className="px-4 py-2 text-dark-400 hover:text-dark-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSNSSubmit}
                disabled={!snsModalContent.trim()}
                className="px-4 py-2 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 rounded-lg text-white transition-colors"
              >
                {editingSNSPost ? 'Update' : 'Add'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
