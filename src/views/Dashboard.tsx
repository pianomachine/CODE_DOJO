import { motion } from 'framer-motion'
import { BookOpen, Code2, Trophy, Clock, TrendingUp, Zap } from 'lucide-react'
import { useAppStore } from '../store/appStore'

export function Dashboard() {
  const { notes, problems, exercises, setCurrentView } = useAppStore()

  const completedExercises = exercises.filter((e) => e.status === 'completed').length
  const totalProblems = problems.length

  const stats = [
    {
      label: 'Notes',
      value: notes.length,
      icon: <BookOpen className="w-6 h-6" />,
      color: 'from-blue-500 to-cyan-500',
      onClick: () => setCurrentView('notes'),
    },
    {
      label: 'Problems',
      value: problems.length,
      icon: <Code2 className="w-6 h-6" />,
      color: 'from-purple-500 to-pink-500',
      onClick: () => setCurrentView('problems'),
    },
    {
      label: 'Completed',
      value: completedExercises,
      icon: <Trophy className="w-6 h-6" />,
      color: 'from-green-500 to-emerald-500',
      onClick: () => setCurrentView('practice'),
    },
    {
      label: 'In Progress',
      value: exercises.filter((e) => e.status === 'in_progress').length,
      icon: <Clock className="w-6 h-6" />,
      color: 'from-yellow-500 to-orange-500',
      onClick: () => setCurrentView('practice'),
    },
  ]

  const recentProblems = problems.slice(0, 3)

  return (
    <div className="h-full overflow-y-auto p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl mx-auto"
      >
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-dark-100 mb-2">
            Welcome to <span className="gradient-text">Code Dojo</span>
          </h1>
          <p className="text-dark-400">
            Your personal coding practice space. Master algorithms, take notes, and level up.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <motion.button
              key={stat.label}
              onClick={stat.onClick}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02, y: -4 }}
              className="glass rounded-xl p-6 text-left transition-all hover:border-dark-600"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-white mb-4`}>
                {stat.icon}
              </div>
              <div className="text-3xl font-bold text-dark-100 mb-1">{stat.value}</div>
              <div className="text-dark-400">{stat.label}</div>
            </motion.button>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Progress Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-2 glass rounded-xl p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-dark-100 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary-400" />
                Progress Overview
              </h2>
              <span className="text-sm text-dark-400">
                {completedExercises}/{totalProblems} completed
              </span>
            </div>

            {/* Progress Bar */}
            <div className="mb-6">
              <div className="h-4 bg-dark-800 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${totalProblems > 0 ? (completedExercises / totalProblems) * 100 : 0}%` }}
                  transition={{ delay: 0.5, duration: 1, ease: 'easeOut' }}
                  className="h-full bg-gradient-to-r from-primary-500 to-accent-purple rounded-full"
                />
              </div>
            </div>

            {/* Recent Problems */}
            <h3 className="text-sm font-medium text-dark-400 mb-3">Recent Problems</h3>
            <div className="space-y-3">
              {recentProblems.map((problem, index) => (
                <motion.button
                  key={problem.id}
                  onClick={() => {
                    setCurrentView('problems')
                  }}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                  className="w-full flex items-center gap-4 p-4 bg-dark-800/50 hover:bg-dark-800 rounded-lg transition-colors text-left"
                >
                  <div className={`w-2 h-2 rounded-full ${
                    problem.difficulty === 'easy' ? 'bg-accent-green' :
                    problem.difficulty === 'medium' ? 'bg-accent-yellow' :
                    'bg-accent-red'
                  }`} />
                  <div className="flex-1">
                    <div className="font-medium text-dark-200">{problem.title}</div>
                    <div className="text-xs text-dark-500">{problem.category}</div>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    problem.difficulty === 'easy' ? 'bg-accent-green/20 text-accent-green' :
                    problem.difficulty === 'medium' ? 'bg-accent-yellow/20 text-accent-yellow' :
                    'bg-accent-red/20 text-accent-red'
                  }`}>
                    {problem.difficulty}
                  </span>
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="glass rounded-xl p-6"
          >
            <h2 className="text-xl font-semibold text-dark-100 flex items-center gap-2 mb-6">
              <Zap className="w-5 h-5 text-accent-yellow" />
              Quick Actions
            </h2>

            <div className="space-y-3">
              <motion.button
                onClick={() => setCurrentView('notes')}
                whileHover={{ x: 4 }}
                className="w-full flex items-center gap-3 p-4 bg-dark-800/50 hover:bg-dark-800 rounded-lg transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-medium text-dark-200">New Note</div>
                  <div className="text-xs text-dark-500">Create a new note</div>
                </div>
              </motion.button>

              <motion.button
                onClick={() => setCurrentView('problems')}
                whileHover={{ x: 4 }}
                className="w-full flex items-center gap-3 p-4 bg-dark-800/50 hover:bg-dark-800 rounded-lg transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400">
                  <Code2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-medium text-dark-200">New Problem</div>
                  <div className="text-xs text-dark-500">Add a coding problem</div>
                </div>
              </motion.button>

              <motion.button
                onClick={() => setCurrentView('practice')}
                whileHover={{ x: 4 }}
                className="w-full flex items-center gap-3 p-4 bg-dark-800/50 hover:bg-dark-800 rounded-lg transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center text-green-400">
                  <Trophy className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-medium text-dark-200">Start Practice</div>
                  <div className="text-xs text-dark-500">Begin a coding session</div>
                </div>
              </motion.button>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}
