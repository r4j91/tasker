import { motion } from 'framer-motion'
import { CheckSquare } from 'lucide-react'

export default function App() {
  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="flex flex-col items-center gap-4"
      >
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-violet-500"
        >
          <CheckSquare size={48} strokeWidth={1.5} />
        </motion.div>

        <h1 className="text-7xl font-bold tracking-tighter text-white">
          TASKER
        </h1>

        <p className="text-neutral-500 text-sm tracking-widest uppercase">
          Premium Task Manager
        </p>
      </motion.div>
    </div>
  )
}
