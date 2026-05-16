import { useState } from 'react'
import { CheckIcon, PlusIcon, XIcon } from '@phosphor-icons/react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Task } from '../types/api'

interface Props {
  tasks: Task[]
  dayId: number
  onToggle: (taskId: number, completed: boolean) => void
  onCreate: (dayId: number, label: string) => Promise<void>
  onDelete: (taskId: number) => void
}

interface TaskRowProps {
  task: Task
  onToggle: (taskId: number, completed: boolean) => void
  onDelete: (taskId: number) => void
}

const TaskRow = ({ task, onToggle, onDelete }: TaskRowProps) => {
  const toggle = () => onToggle(task.id, !task.completed)
  const isCustom = task.source === 'custom'

  return (
    <div
      className="group flex w-full items-start gap-3"
      style={{ padding: '7px 0' }}
    >
      {/* Checkbox */}
      <button
        onClick={toggle}
        aria-label={task.completed ? `Mark "${task.label}" incomplete` : `Mark "${task.label}" complete`}
        style={{
          background:  'none',
          border:      'none',
          cursor:      'pointer',
          padding:     0,
          flexShrink:  0,
          marginTop:   2,
          borderRadius: 5,
          transition:  'transform 120ms var(--ease-out)',
        }}
        onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.92)' }}
        onMouseUp={e   => { e.currentTarget.style.transform = 'scale(1)' }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
      >
        <div
          style={{
            width:        18,
            height:       18,
            borderRadius: 5,
            border:       `1px solid ${task.completed ? 'var(--accent)' : 'var(--border)'}`,
            background:   task.completed ? 'var(--accent-bg)' : 'var(--surface)',
            display:      'flex',
            alignItems:   'center',
            justifyContent: 'center',
            transition:   'background 120ms var(--ease-out), border-color 120ms var(--ease-out)',
          }}
        >
          <AnimatePresence>
            {task.completed && (
              <motion.span
                key="check"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{    scale: 0, opacity: 0 }}
                transition={{ duration: 0.12, ease: [0.23, 1, 0.32, 1] }}
              >
                <CheckIcon size={10} weight="bold" style={{ color: 'var(--accent)', display: 'block' }} />
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </button>

      {/* Label */}
      <span
        onClick={toggle}
        style={{
          fontFamily:     'var(--font-sans)',
          fontSize:       14,
          color:          task.completed ? 'var(--text-3)' : 'var(--text-1)',
          textDecoration: task.completed ? 'line-through' : 'none',
          transition:     'color 150ms var(--ease-out)',
          lineHeight:     1.5,
          flex:           1,
          cursor:         'pointer',
        }}
      >
        {task.label}
      </span>

      {/* Delete — only for custom tasks, shown on hover */}
      {isCustom && (
        <button
          onClick={() => onDelete(task.id)}
          aria-label={`Remove "${task.label}"`}
          className="opacity-0 group-hover:opacity-100"
          style={{
            background:  'none',
            border:      'none',
            cursor:      'pointer',
            padding:     0,
            marginTop:   3,
            color:       'var(--text-3)',
            display:     'flex',
            transition:  'color 120ms var(--ease-out), opacity 120ms var(--ease-out)',
            flexShrink:  0,
          }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-2)' }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-3)' }}
        >
          <XIcon size={13} weight="bold" />
        </button>
      )}
    </div>
  )
}

const AddTaskInput = ({ dayId, onCreate }: { dayId: number; onCreate: (dayId: number, label: string) => Promise<void> }) => {
  const [value, setValue] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    const label = value.trim()
    if (!label || busy) return
    setBusy(true)
    try {
      await onCreate(dayId, label)
      setValue('')
    } finally {
      setBusy(false)
    }
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') submit()
    if (e.key === 'Escape') setValue('')
  }

  return (
    <div className="flex items-center gap-2" style={{ marginTop: 4 }}>
      <div style={{
        width:        18,
        height:       18,
        flexShrink:   0,
        display:      'flex',
        alignItems:   'center',
        justifyContent: 'center',
        color:        'var(--text-3)',
      }}>
        <PlusIcon size={13} weight="bold" />
      </div>
      <input
        type="text"
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={handleKey}
        placeholder="Add a task…"
        maxLength={120}
        style={{
          fontFamily:  'var(--font-sans)',
          fontSize:    14,
          color:       'var(--text-2)',
          background:  'transparent',
          border:      'none',
          outline:     'none',
          padding:     '7px 0',
          flex:        1,
          colorScheme: 'dark',
        }}
      />
      {value.trim() && (
        <button
          onClick={submit}
          disabled={busy}
          style={{
            fontFamily:    'var(--font-mono)',
            fontSize:      10,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color:         'var(--accent)',
            background:    'none',
            border:        'none',
            cursor:        busy ? 'default' : 'pointer',
            padding:       '2px 0',
            opacity:       busy ? 0.5 : 1,
          }}
        >
          Add
        </button>
      )}
    </div>
  )
}

const TaskList = ({ tasks, dayId, onToggle, onCreate, onDelete }: Props) => (
  <div className="flex flex-col gap-0">
    <p style={{ fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 500, color: 'var(--text-2)', letterSpacing: '0.06em', textTransform: 'uppercase', margin: '0 0 4px' }}>
      Tasks
    </p>
    <div style={{ borderTop: '1px solid var(--border)', paddingTop: 4 }}>
      {tasks.map(task => (
        <TaskRow key={task.id} task={task} onToggle={onToggle} onDelete={onDelete} />
      ))}
      <AddTaskInput dayId={dayId} onCreate={onCreate} />
    </div>
  </div>
)

export default TaskList
