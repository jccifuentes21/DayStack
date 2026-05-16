import { useEffect, useRef, useState } from 'react'
import { ArrowCounterClockwiseIcon, XIcon, CheckIcon } from '@phosphor-icons/react'
import type { Day } from '../types/api'
import { generateSchedule } from '../utils/schedule'
import DayTypePicker from './DayTypePicker'
import FocusInput from './FocusInput'
import PRBanner from './PRBanner'
import Schedule from './Schedule'
import TaskList from './TaskList'
import WakeTimeInput from './WakeTimeInput'

interface Props {
  day: Day
  today: string
  onDayUpdate: (dayId: number, payload: { day_type?: string; wake_time?: string; notes?: string; focus?: string }) => Promise<boolean>
  onDayReset: (dayId: number) => Promise<void>
  onTaskToggle: (taskId: number, completed: boolean) => Promise<void>
  onTaskCreate: (dayId: number, label: string) => Promise<void>
  onTaskDelete: (taskId: number) => void
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const DayPanel = ({ day, today, onDayUpdate, onDayReset, onTaskToggle, onTaskCreate, onTaskDelete }: Props) => {
  const isToday     = day.date === today
  const date        = new Date(day.date + 'T00:00:00')
  const dayName     = DAY_NAMES[date.getDay()]
  const dateStr     = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const isSet       = day.day_type !== 'unset'
  const showBanner  = isToday && (day.day_type === 'full' || day.day_type === 'half')

  const [wakeDraft, setWakeDraft] = useState<string | null>(null)
  const localWakeTime = wakeDraft ?? day.wake_time

  const [confirmingReset, setConfirmingReset] = useState(false)

  const [wakeSavedFlash, setWakeSavedFlash] = useState(false)
  const [typeSavedFlash, setTypeSavedFlash] = useState(false)

  const schedule = generateSchedule(localWakeTime, day.day_type)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [day.id])

  const handleTypeChange = async (type: string) => {
    const ok = await onDayUpdate(day.id, { day_type: type })
    if (ok) {
      setTypeSavedFlash(true)
      window.setTimeout(() => setTypeSavedFlash(false), 1600)
    }
  }

  const handleWakeTimeChange = (time: string) => {
    setWakeDraft(time)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      const ok = await onDayUpdate(day.id, { wake_time: time })
      if (ok) {
        setWakeDraft(null)
        setWakeSavedFlash(true)
        window.setTimeout(() => setWakeSavedFlash(false), 1600)
      }
    }, 500)
  }

  const handleReset = async () => {
    setConfirmingReset(false)
    await onDayReset(day.id)
  }

  const done  = day.tasks.filter(t => t.completed).length
  const total = day.tasks.length

  return (
    <div className="mx-auto flex w-full flex-col gap-6 px-4 md:max-w-lg md:px-6">

      {/* Header */}
      <div className="flex items-baseline justify-between">
        <div className="flex flex-col gap-0.5">
          <h2 style={{ fontFamily: 'var(--font-sans)', fontSize: 22, fontWeight: 600, color: 'var(--text-1)', margin: 0, letterSpacing: '-0.02em' }}>
            {dayName}
          </h2>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-2)' }}>
            {dateStr}{isToday ? ' · Today' : ''}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Completion badge */}
          {isSet && total > 0 && (
            <span style={{
              fontFamily:    'var(--font-mono)',
              fontSize:      12,
              color:         done === total ? 'var(--accent)' : 'var(--text-2)',
              letterSpacing: '0.04em',
            }}>
              {done}/{total}
            </span>
          )}

          {/* Reset — idle icon, then inline confirm */}
          {isSet && !confirmingReset && (
            <button
              type="button"
              onClick={() => setConfirmingReset(true)}
              aria-label="Reset day"
              title="Reset day"
              style={{
                display:        'flex',
                alignItems:     'center',
                gap:            6,
                padding:        '4px 8px',
                minHeight:      28,
                borderRadius:   6,
                border:         'none',
                background:     'transparent',
                color:          'var(--text-3)',
                cursor:         'pointer',
                transition:     'color 150ms var(--ease-out), background 150ms var(--ease-out)',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.color = 'var(--text-2)'
                e.currentTarget.style.background = 'var(--surface-2)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color = 'var(--text-3)'
                e.currentTarget.style.background = 'transparent'
              }}
            >
              <ArrowCounterClockwiseIcon size={14} weight="bold" aria-hidden />
              <span
                style={{
                  fontFamily:    'var(--font-sans)',
                  fontSize:      11,
                  fontWeight:    500,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color:         'inherit',
                }}
              >
                Reset
              </span>
            </button>
          )}

          {isSet && confirmingReset && (
            <div className="flex items-center gap-2">
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--text-2)', whiteSpace: 'nowrap' }}>
                Reset day?
              </span>
              <button
                type="button"
                onClick={() => setConfirmingReset(false)}
                aria-label="Cancel reset"
                style={{
                  display:        'flex',
                  alignItems:     'center',
                  justifyContent: 'center',
                  width:          26,
                  height:         26,
                  borderRadius:   6,
                  border:         'none',
                  background:     'var(--surface-2)',
                  color:          'var(--text-3)',
                  cursor:         'pointer',
                  transition:     'color 120ms var(--ease-out)',
                  flexShrink:     0,
                }}
                onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-2)' }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-3)' }}
              >
                <XIcon size={12} weight="bold" />
              </button>
              <button
                type="button"
                onClick={handleReset}
                aria-label="Confirm reset"
                style={{
                  display:        'flex',
                  alignItems:     'center',
                  justifyContent: 'center',
                  width:          26,
                  height:         26,
                  borderRadius:   6,
                  border:         'none',
                  background:     'var(--surface-2)',
                  color:          'var(--text-3)',
                  cursor:         'pointer',
                  transition:     'color 120ms var(--ease-out)',
                  flexShrink:     0,
                }}
                onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent)' }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-3)' }}
              >
                <CheckIcon size={12} weight="bold" />
              </button>
            </div>
          )}
        </div>
      </div>

      {showBanner && <PRBanner />}

      <div className="flex flex-wrap items-center gap-2">
        <DayTypePicker current={day.day_type} onChange={handleTypeChange} />
        {typeSavedFlash ? (
          <CheckIcon className="ds-saved-check" size={18} weight="bold" aria-hidden />
        ) : (
          <span style={{ width: 18, flexShrink: 0 }} aria-hidden />
        )}
      </div>

      {isSet && (
        <div className="flex flex-col gap-6">
          <FocusInput key={day.id} value={day.focus} onCommit={focus => onDayUpdate(day.id, { focus })} />
          <WakeTimeInput value={localWakeTime} onChange={handleWakeTimeChange} savedFlash={wakeSavedFlash} />
          {schedule.length > 0 && <Schedule blocks={schedule} isToday={isToday} />}
        </div>
      )}

      {isSet && (
        <TaskList
          tasks={day.tasks}
          dayId={day.id}
          onToggle={onTaskToggle}
          onCreate={onTaskCreate}
          onDelete={onTaskDelete}
        />
      )}

      {!isSet && (
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--text-3)', margin: 0 }}>
          Pick a day type to generate your schedule and tasks.
        </p>
      )}
    </div>
  )
}

export default DayPanel
