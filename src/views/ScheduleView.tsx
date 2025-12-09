import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Plus, Check, Trash2, ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from 'lucide-react'
import { useAppStore } from '../store/appStore'

const DAYS_JP = ['日', '月', '火', '水', '木', '金', '土']

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
  const { scheduleTasks, addScheduleTask, toggleScheduleTask, deleteScheduleTask, updateScheduleTask, reorderScheduleTask } = useAppStore()
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

  return (
    <div className="h-full flex flex-col p-6 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
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

      {/* Week Grid */}
      <div className="flex-1 grid grid-cols-7 gap-3 min-h-0">
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
              className={`flex flex-col rounded-xl border transition-all ${
                isDragOver
                  ? 'border-primary-500 bg-primary-500/10 scale-[1.02]'
                  : isToday
                  ? 'border-primary-500/50 bg-primary-500/5'
                  : isWeekend
                  ? 'border-dark-700/30 bg-dark-900/30'
                  : 'border-dark-700/50 bg-dark-800/30'
              }`}
            >
              {/* Day Header */}
              <div
                className={`px-3 py-2 border-b ${
                  isToday ? 'border-primary-500/30' : 'border-dark-700/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-medium ${
                      isWeekend ? 'text-dark-500' : 'text-dark-400'
                    } ${index === 0 ? 'text-red-400' : ''} ${index === 6 ? 'text-blue-400' : ''}`}
                  >
                    {DAYS_JP[date.getDay()]}
                  </span>
                  <span
                    className={`text-lg font-bold ${
                      isToday ? 'text-primary-400' : 'text-dark-200'
                    }`}
                  >
                    {formatDateDisplay(date)}
                  </span>
                </div>
              </div>

              {/* Tasks */}
              <div className="flex-1 p-2 overflow-y-auto space-y-1">
                {tasks.map((task, taskIndex) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    draggable={editingTaskId !== task.id}
                    onDragStart={(e) => handleDragStart(e as unknown as React.DragEvent, task.id)}
                    onDragEnd={handleDragEnd}
                    className={`group flex items-start gap-1 p-2 rounded-lg cursor-grab active:cursor-grabbing ${
                      task.completed
                        ? 'bg-dark-800/50'
                        : 'bg-dark-700/50 hover:bg-dark-700'
                    } ${
                      draggedTaskId === task.id ? 'opacity-50' : ''
                    } transition-colors`}
                  >
                    {/* Reorder buttons */}
                    <div className="flex-shrink-0 flex flex-col opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => reorderScheduleTask(task.id, 'up')}
                        disabled={taskIndex === 0}
                        className={`p-0.5 rounded hover:bg-dark-600 transition-colors ${taskIndex === 0 ? 'opacity-30 cursor-not-allowed' : ''}`}
                      >
                        <ChevronUp className="w-3 h-3 text-dark-400" />
                      </button>
                      <button
                        onClick={() => reorderScheduleTask(task.id, 'down')}
                        disabled={taskIndex === tasks.length - 1}
                        className={`p-0.5 rounded hover:bg-dark-600 transition-colors ${taskIndex === tasks.length - 1 ? 'opacity-30 cursor-not-allowed' : ''}`}
                      >
                        <ChevronDown className="w-3 h-3 text-dark-400" />
                      </button>
                    </div>

                    <button
                      onClick={() => toggleScheduleTask(task.id)}
                      className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                        task.completed
                          ? 'bg-accent-green border-accent-green'
                          : 'border-dark-500 hover:border-primary-500'
                      }`}
                    >
                      {task.completed && <Check className="w-3 h-3 text-white" />}
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
                        className="flex-1 bg-dark-800 border border-dark-600 rounded px-2 py-0.5 text-sm text-dark-200 focus:outline-none focus:border-primary-500"
                        autoFocus
                      />
                    ) : (
                      <span
                        onClick={() => handleStartEdit(task.id, task.content)}
                        className={`flex-1 text-sm cursor-pointer ${
                          task.completed
                            ? 'text-dark-500 line-through'
                            : 'text-dark-200'
                        }`}
                      >
                        {task.content}
                      </span>
                    )}

                    <button
                      onClick={() => deleteScheduleTask(task.id)}
                      className="flex-shrink-0 opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded transition-all"
                    >
                      <Trash2 className="w-3 h-3 text-red-400" />
                    </button>
                  </motion.div>
                ))}
              </div>

              {/* Add Task Input */}
              <div className="p-2 border-t border-dark-700/30">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newTaskInputs[dateKey] || ''}
                    onChange={(e) =>
                      setNewTaskInputs((prev) => ({
                        ...prev,
                        [dateKey]: e.target.value,
                      }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddTask(dateKey)
                    }}
                    placeholder="Add task..."
                    className="flex-1 min-w-0 bg-transparent border-none text-sm text-dark-300 placeholder-dark-600 focus:outline-none"
                  />
                  <motion.button
                    onClick={() => handleAddTask(dateKey)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="flex-shrink-0 p-1 hover:bg-dark-700 rounded transition-colors"
                  >
                    <Plus className="w-4 h-4 text-dark-500" />
                  </motion.button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
